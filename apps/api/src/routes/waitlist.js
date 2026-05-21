import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeString).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function validateLead(body) {
  const missingField = requiredFields.find((field) => {
    const value = body[field];
    return Array.isArray(value) ? value.length === 0 : !value;
  });

  if (missingField) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Preencha todos os campos obrigatórios.'
    };
  }

  const email = normalizeString(body.email).toLowerCase();

  if (!emailRegex.test(email)) {
    return {
      code: 'INVALID_EMAIL',
      message: 'Informe um e-mail válido.'
    };
  }

  const age = Number(body.age);

  if (!Number.isInteger(age)) {
    return {
      code: 'AGE_INVALID',
      message: 'Informe uma idade válida.'
    };
  }

  if (age < 18) {
    return {
      code: 'AGE_INVALID',
      message: 'Por segurança, o Mimi será uma comunidade 18+ no beta inicial.'
    };
  }

  if (normalizeList(body.lookingFor).length === 0 || normalizeList(body.wantsToMeet).length === 0) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Escolha pelo menos uma opção nos campos de interesse.'
    };
  }

  return null;
}

router.post('/', async (request, response, next) => {
  try {
    const validationError = validateLead(request.body || {});

    if (validationError) {
      response.status(400).json(validationError);
      return;
    }

    const body = request.body;
    const lead = await prisma.waitlistLead.create({
      data: {
        name: normalizeString(body.name),
        email: normalizeString(body.email).toLowerCase(),
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
        createdAt: true
      }
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
