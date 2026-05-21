const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

function getFriendlyMessage(status, data) {
  const messagesByCode = {
    EMAIL_EXISTS: 'Esse e-mail já está na lista.',
    AGE_INVALID: 'Por segurança, o Mimi será uma comunidade 18+ no beta inicial.',
    INVALID_EMAIL: 'Informe um e-mail válido.',
    VALIDATION_ERROR: 'Revise os campos obrigatórios e tente novamente.',
    DB_UNAVAILABLE: 'A API está no ar, mas não conseguiu acessar o banco de dados agora.',
    DB_NOT_MIGRATED: 'O banco ainda não está migrado. Rode as migrations do Prisma e tente novamente.',
    CORS_FORBIDDEN: 'A API bloqueou esta origem. Confira FRONTEND_URL no backend.',
    PROXY_ERROR: 'Não conseguimos conectar à API do Mimi. Verifique se o servidor está rodando e tente novamente.'
  };

  if (data?.code && messagesByCode[data.code]) {
    return messagesByCode[data.code];
  }

  if (data?.message) {
    return data.message;
  }

  if (status === 409) {
    return 'Esse e-mail já está na lista.';
  }

  if (status === 400) {
    return 'Revise os campos do formulário e tente novamente.';
  }

  if (status === 503) {
    return 'A API está no ar, mas não conseguiu acessar o banco de dados agora.';
  }

  if (status >= 500) {
    return 'Erro interno ao salvar sua inscrição. Tente novamente em instantes.';
  }

  return 'Não foi possível entrar na lista agora.';
}

export async function submitWaitlistLead(payload) {
  let response;

  try {
    response = await fetch(`${API_URL}/api/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw new ApiError(
      'Não conseguimos conectar à API do Mimi. Verifique se o servidor está rodando e tente novamente.',
      'CONNECTION_ERROR'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!isJson) {
    throw new ApiError(
      'A API respondeu em um formato inesperado. Verifique se VITE_API_URL aponta para o backend correto.',
      'INVALID_API_RESPONSE',
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiError(getFriendlyMessage(response.status, data), data?.code || 'HTTP_ERROR', response.status);
  }

  return data;
}
