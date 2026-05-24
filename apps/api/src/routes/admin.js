import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { prisma } from '../prisma.js';
import {
  createSessionToken,
  getSessionExpiry,
  hashPassword,
  hashToken,
  sanitizeAdminUser,
  verifyPassword
} from '../services/adminAuth.js';
import { emailRegex, normalizeEmail, normalizeString } from '../utils/input.js';

const router = Router();

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
      user: sanitizeAdminUser(user)
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

    const token = createSessionToken();
    const expiresAt = getSessionExpiry();

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
      user: sanitizeAdminUser(user)
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
  response.json({ user: sanitizeAdminUser(request.adminUser) });
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
