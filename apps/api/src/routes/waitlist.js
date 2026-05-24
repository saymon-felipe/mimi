import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { sendWaitlistConfirmation } from '../mail.js';
import { emailRegex, normalizeEmail, normalizeList, normalizeString } from '../utils/input.js';
import { validationError } from '../utils/responses.js';

const router = Router();

const requiredFields = [
  'name',
  'email',
  'age',
  'cityState',
  'identity',
  'lookingFor',
  'wantsToMeet',
  'betaInterest'
];

function validateLead(body) {
  const missingField = requiredFields.find((field) => {
    const value = body[field];
    return Array.isArray(value) ? value.length === 0 : !value;
  });

  if (missingField) {
    return validationError('Preencha todos os campos obrigatórios.');
  }

  const email = normalizeEmail(body.email);

  if (!emailRegex.test(email)) {
    return validationError('Informe um e-mail válido.', 'INVALID_EMAIL');
  }

  const age = Number(body.age);

  if (!Number.isInteger(age)) {
    return validationError('Informe uma idade válida.', 'AGE_INVALID');
  }

  if (age < 18) {
    return validationError('Por segurança, o Mimi será uma comunidade 18+ no beta inicial.', 'AGE_INVALID');
  }

  if (normalizeList(body.lookingFor).length === 0 || normalizeList(body.wantsToMeet).length === 0) {
    return validationError('Escolha pelo menos uma opção nos campos de interesse.');
  }

  return null;
}

router.post('/', async (request, response, next) => {
  try {
    const validation = validateLead(request.body || {});

    if (validation) {
      response.status(400).json(validation);
      return;
    }

    const body = request.body;
    const lead = await prisma.waitlistLead.create({
      data: {
        name: normalizeString(body.name),
        email: normalizeEmail(body.email),
        age: Number(body.age),
        cityState: normalizeString(body.cityState),
        identity: normalizeString(body.identity),
        customIdentity: normalizeString(body.customIdentity) || null,
        lookingFor: normalizeList(body.lookingFor),
        wantsToMeet: normalizeList(body.wantsToMeet),
        betaInterest: normalizeString(body.betaInterest),
        contactHandle: normalizeString(body.contactHandle) || null,
        biggestPain: normalizeString(body.biggestPain) || null,
        comment: normalizeString(body.comment) || null,
        source: normalizeString(body.source) || 'landing',
        utmSource: normalizeString(body.utmSource) || null,
        utmMedium: normalizeString(body.utmMedium) || null,
        utmCampaign: normalizeString(body.utmCampaign) || null,
        referrer: normalizeString(body.referrer) || null,
        userAgent: request.get('user-agent') || normalizeString(body.userAgent) || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    const mailResult = await Promise.allSettled([sendWaitlistConfirmation(lead)]);
    mailResult
      .filter((result) => result.status === 'rejected')
      .forEach((result) => {
        console.error(
          JSON.stringify({
            level: 'error',
            code: 'WAITLIST_EMAIL_FAILED',
            leadId: lead.id,
            message: result.reason?.message || 'Falha ao enviar e-mail da lista beta.'
          })
        );
      });

    response.status(201).json({
      message: 'Você entrou na lista do Mimi.',
      lead
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({
        code: 'EMAIL_EXISTS',
        message: 'Esse e-mail já está na lista.'
      });
      return;
    }

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
