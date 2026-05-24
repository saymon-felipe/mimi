import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { sendContactConfirmation, sendContactNotification } from '../mail.js';
import { emailRegex, normalizeEmail, normalizeString } from '../utils/input.js';
import { validationError } from '../utils/responses.js';

const router = Router();

function validateContact(body) {
  const name = normalizeString(body.name);
  const email = normalizeEmail(body.email);
  const subject = normalizeString(body.subject);
  const message = normalizeString(body.message);

  if (!name || !email || !subject || !message) {
    return validationError('Preencha todos os campos obrigatórios.');
  }

  if (!emailRegex.test(email)) {
    return validationError('Informe um e-mail válido.', 'INVALID_EMAIL');
  }

  return null;
}

router.post('/', async (request, response, next) => {
  try {
    const validation = validateContact(request.body || {});

    if (validation) {
      response.status(400).json(validation);
      return;
    }

    const body = request.body;
    const contact = await prisma.contactMessage.create({
      data: {
        name: normalizeString(body.name),
        email: normalizeEmail(body.email),
        subject: normalizeString(body.subject),
        message: normalizeString(body.message),
        source: normalizeString(body.source) || 'contact_page',
        userAgent: request.get('user-agent') || normalizeString(body.userAgent) || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        message: true,
        source: true,
        createdAt: true
      }
    });

    const mailResults = await Promise.allSettled([sendContactNotification(contact), sendContactConfirmation(contact)]);
    mailResults
      .filter((result) => result.status === 'rejected')
      .forEach((result) => {
        console.error(
          JSON.stringify({
            level: 'error',
            code: 'CONTACT_EMAIL_FAILED',
            contactId: contact.id,
            message: result.reason?.message || 'Falha ao enviar e-mail de contato.'
          })
        );
      });

    response.status(201).json({
      message: 'Mensagem recebida pelo Mimi.',
      contact
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      error.statusCode = 500;
      error.prismaCode = error.code;
      error.code = 'DB_NOT_MIGRATED';
      error.publicMessage = 'O banco ainda não está migrado. Rode as migrations do Prisma e tente novamente.';
      next(error);
      return;
    }

    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && ['P1000', 'P1001', 'P1002'].includes(error.code))
    ) {
      error.statusCode = 503;
      error.prismaCode = error.code;
      error.code = 'DB_UNAVAILABLE';
      error.publicMessage = 'Não conseguimos conectar ao banco de dados agora. Verifique o MySQL e tente novamente.';
      next(error);
      return;
    }

    next(error);
  }
});

export default router;
