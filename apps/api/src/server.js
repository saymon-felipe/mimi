import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import waitlistRouter from './routes/waitlist.js';

const app = express();
const port = Number(process.env.PORT || 3333);
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...configuredOrigins, 'http://127.0.0.1:5173']);
const localDevOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use((request, response, next) => {
  request.requestId = randomUUID();
  response.setHeader('X-Request-Id', request.requestId);
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || (process.env.NODE_ENV !== 'production' && localDevOriginRegex.test(origin))) {
        callback(null, true);
        return;
      }

      const error = new Error('Origem não permitida pelo CORS.');
      error.statusCode = 403;
      error.code = 'CORS_FORBIDDEN';
      error.publicMessage = 'Esta origem não está autorizada a chamar a API do Mimi.';
      callback(error);
    }
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/waitlist', waitlistRouter);

app.use((request, response) => {
  response.status(404).json({
    code: 'NOT_FOUND',
    message: `Rota não encontrada: ${request.method} ${request.originalUrl}`
  });
});

app.use((error, request, response, _next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  console.error(
    JSON.stringify(
      {
        level: 'error',
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        code,
        prismaCode: error.prismaCode,
        message: error.message,
        stack: error.stack
      },
      null,
      2
    )
  );

  response.status(statusCode).json({
    code,
    requestId: request.requestId,
    message: error.publicMessage || 'Algo deu errado. Tente novamente em alguns instantes.'
  });
});

app.listen(port, () => {
  console.log(`Mimi API rodando em http://localhost:${port}`);
});
