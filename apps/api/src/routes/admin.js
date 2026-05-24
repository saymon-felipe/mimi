import { Router } from 'express';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

const router = Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sessionDurationMs = 1000 * 60 * 60 * 24 * 7;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, hash] = String(storedHash || '').split(':');

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const candidate = Buffer.from(hashPassword(password, salt).split(':')[2], 'hex');
  const expected = Buffer.from(hash, 'hex');

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    admin: user.admin,
    createdAt: user.createdAt
  };
}

function authError(message = 'Faça login como admin para acessar esta área.') {
  const error = new Error(message);
  error.statusCode = 401;
  error.code = 'ADMIN_AUTH_REQUIRED';
  error.publicMessage = message;
  return error;
}

async function requireAdmin(request, _response, next) {
  try {
    const authHeader = request.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
      next(authError());
      return;
    }

    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true }
    });

    if (!session || session.expiresAt <= new Date()) {
      next(authError('Sessão expirada. Faça login novamente.'));
      return;
    }

    if (!session.user.admin) {
      next(authError('Seu usuário ainda não tem permissão de admin.'));
      return;
    }

    request.adminUser = session.user;
    request.adminTokenHash = session.tokenHash;
    next();
  } catch (error) {
    next(error);
  }
}

router.post('/register', async (request, response, next) => {
  try {
    const name = normalizeString(request.body?.name);
    const email = normalizeEmail(request.body?.email);
    const password = normalizeString(request.body?.password);

    if (!name || !email || !password) {
      response.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Preencha nome, e-mail e senha.'
      });
      return;
    }

    if (!emailRegex.test(email)) {
      response.status(400).json({
        code: 'INVALID_EMAIL',
        message: 'Informe um e-mail válido.'
      });
      return;
    }

    if (password.length < 8) {
      response.status(400).json({
        code: 'WEAK_PASSWORD',
        message: 'Use uma senha com pelo menos 8 caracteres.'
      });
      return;
    }

    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        admin: false
      }
    });

    response.status(201).json({
      message: 'Usuário criado. Ative admin = 1 no banco para liberar acesso.',
      user: sanitizeUser(user)
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      response.status(409).json({
        code: 'EMAIL_EXISTS',
        message: 'Já existe um usuário com esse e-mail.'
      });
      return;
    }

    next(error);
  }
});

router.post('/login', async (request, response, next) => {
  try {
    const email = normalizeEmail(request.body?.email);
    const password = normalizeString(request.body?.password);

    if (!email || !password) {
      response.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Informe e-mail e senha.'
      });
      return;
    }

    const user = await prisma.adminUser.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      response.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'E-mail ou senha inválidos.'
      });
      return;
    }

    if (!user.admin) {
      response.status(403).json({
        code: 'ADMIN_NOT_APPROVED',
        message: 'Usuário criado, mas ainda não tem permissão de admin.'
      });
      return;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + sessionDurationMs);

    await prisma.adminSession.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt
      }
    });

    response.json({
      message: 'Login realizado.',
      token,
      expiresAt,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAdmin, async (request, response, next) => {
  try {
    await prisma.adminSession.delete({ where: { tokenHash: request.adminTokenHash } });
    response.json({ message: 'Logout realizado.' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAdmin, (request, response) => {
  response.json({ user: sanitizeUser(request.adminUser) });
});

router.get('/dashboard', requireAdmin, async (_request, response, next) => {
  try {
    const [contactCount, waitlistCount, contacts, waitlist] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.waitlistLead.count(),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.waitlistLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    response.json({
      stats: {
        contactCount,
        waitlistCount
      },
      contacts,
      waitlist
    });
  } catch (error) {
    next(error);
  }
});

export default router;
