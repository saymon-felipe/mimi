# Mimi

Landing page de validacao do Mimi, uma rede social desktop-first para descoberta social por posts, comunidades, afinidade e convites de conversa.

## Stack

- Frontend: Vue 3, Vite, Tailwind CSS e CSS nativo
- Backend: Node.js, Express e Prisma
- Banco: MySQL
- Tracking: PostHog opcional via variaveis de ambiente

## Instalar

```bash
npm install
```

## Configurar ambiente

Crie os arquivos de ambiente a partir dos exemplos:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

No Windows PowerShell, voce tambem pode criar os arquivos manualmente copiando o conteudo dos exemplos.

O frontend le variaveis `VITE_*` do `.env` da raiz. A API le `apps/api/.env`.

Variaveis principais:

- `DATABASE_URL`: conexao MySQL usada pelo Prisma.
- `FRONTEND_URL`: origem liberada no CORS da API.
- `PORT`: porta da API, padrao `3333`.
- `VITE_API_URL`: URL base da API usada pelo frontend.
- `VITE_POSTHOG_KEY`: chave opcional do PostHog. Se ficar vazia, o site funciona normalmente sem analytics.
- `VITE_POSTHOG_HOST`: host do PostHog, padrao `https://app.posthog.com`.

## Banco e Prisma

Com o MySQL rodando e `DATABASE_URL` configurada:

```bash
npm run prisma:generate
npm run prisma:migrate
```

O migrate cria a tabela `WaitlistLead` com e-mail unico para evitar duplicidade na lista de espera.

## Rodar localmente

Frontend e API juntos:

```bash
npm run dev
```

Ou separados:

```bash
npm run dev:web
npm run dev:api
```

URLs padrao:

- Frontend: `http://localhost:5173`
- API health check: `http://localhost:3333/api/health`

## Build

```bash
npm run build
```

## API

### `GET /api/health`

Retorna:

```json
{ "status": "ok" }
```

### `POST /api/waitlist`

Salva um lead da lista de espera no MySQL.

Campos coletados:

- `name`
- `email`
- `age`
- `cityState`
- `identity`
- `customIdentity`
- `lookingFor`
- `wantsToMeet`
- `betaInterest`
- `contactHandle`
- `biggestPain`
- `comment`
- `source`
- `utmSource`
- `utmMedium`
- `utmCampaign`
- `referrer`
- `userAgent`

Validacoes principais:

- e-mail válido
- idade minima de 18 anos
- campos obrigatórios preenchidos
- e-mail único, com resposta amigável: `Esse e-mail já está na lista.`

## Tracking

O frontend captura UTMs da URL:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `referrer`

Eventos enviados ao PostHog quando `VITE_POSTHOG_KEY` estiver configurada:

- `landing_viewed`
- `cta_waitlist_clicked`
- `form_started`
- `waitlist_submitted`
- `waitlist_submit_failed`
- `safety_section_viewed`
- `mockup_section_viewed`

O evento `waitlist_submitted` envia apenas propriedades de produto e atribuicao:

- `identity`
- `lookingFor`
- `wantsToMeet`
- `betaInterest`
- `utmSource`
- `utmMedium`
- `utmCampaign`

Dados livres como comentário e dor principal não são enviados para analytics.
