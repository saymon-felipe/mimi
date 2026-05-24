import { prisma } from '../prisma.js';
import { hashToken } from '../services/adminAuth.js';

function authError(message = 'Faça login como admin para acessar esta área.') {
  const error = new Error(message);
  error.statusCode = 401;
  error.code = 'ADMIN_AUTH_REQUIRED';
  error.publicMessage = message;
  return error;
}

export async function requireAdmin(request, _response, next) {
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
