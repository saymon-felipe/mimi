import nodemailer from 'nodemailer';

const contactRecipient = process.env.CONTACT_NOTIFICATION_EMAIL || 'linnubr@gmail.com';
const defaultGmailUser = 'sayuuzin@gmail.com';

function hasGmailConfig() {
  return Boolean(process.env.GMAIL_APP_PASSWORD);
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function hasMailConfig() {
  return hasGmailConfig() || hasSmtpConfig();
}

function createTransport() {
  if (hasGmailConfig()) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || defaultGmailUser,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSender() {
  return process.env.SMTP_FROM || (hasGmailConfig() ? process.env.GMAIL_USER || defaultGmailUser : process.env.SMTP_USER);
}

async function sendMailIfConfigured({ code, logContext, ...message }) {
  if (!hasMailConfig()) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        code: 'MAIL_NOT_CONFIGURED',
        message: 'Registro salvo, mas Gmail/SMTP não está configurado para enviar e-mail.',
        ...logContext
      })
    );
    return { skipped: true };
  }

  const transport = createTransport();

  await transport.sendMail({
    from: getSender(),
    ...message
  });

  return { sent: true, code };
}

export async function sendContactNotification(contact) {
  const subject = `[Mimi] Novo contato: ${contact.subject}`;
  const replyTo = contact.email;
  const text = [
    `Novo contato recebido no site do Mimi`,
    ``,
    `Nome: ${contact.name}`,
    `E-mail: ${contact.email}`,
    `Assunto: ${contact.subject}`,
    `Origem: ${contact.source || 'contact_page'}`,
    `Data: ${contact.createdAt.toISOString()}`,
    ``,
    `Mensagem:`,
    contact.message
  ].join('\n');
  const html = `
    <h2>Novo contato recebido no site do Mimi</h2>
    <p><strong>Nome:</strong> ${escapeHtml(contact.name)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(contact.email)}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(contact.subject)}</p>
    <p><strong>Origem:</strong> ${escapeHtml(contact.source || 'contact_page')}</p>
    <p><strong>Data:</strong> ${escapeHtml(contact.createdAt.toISOString())}</p>
    <hr />
    <p>${escapeHtml(contact.message).replaceAll('\n', '<br />')}</p>
  `;

  return sendMailIfConfigured({
    code: 'CONTACT_NOTIFICATION_SENT',
    logContext: {
      contactId: contact.id,
      recipient: contactRecipient
    },
    to: contactRecipient,
    replyTo,
    subject,
    text,
    html
  });
}

export async function sendContactConfirmation(contact) {
  const firstName = contact.name.split(' ')[0] || contact.name;
  const subject = 'Recebemos sua mensagem no Mimi';
  const text = [
    `Oi, ${firstName}!`,
    ``,
    `Recebemos sua mensagem sobre "${contact.subject}". Obrigado por falar com o Mimi.`,
    ``,
    `A gente leu seu contato como parte do cuidado de construir uma plataforma mais leve, contextual e respeitosa. Se sua mensagem precisar de retorno, vamos responder assim que possível.`,
    ``,
    `Enquanto isso, fica tranquilo: seu contato foi registrado com carinho por aqui.`,
    ``,
    `Com presença,`,
    `Equipe Mimi`
  ].join('\n');
  const html = `
    <p>Oi, ${escapeHtml(firstName)}!</p>
    <p>Recebemos sua mensagem sobre <strong>${escapeHtml(contact.subject)}</strong>. Obrigado por falar com o Mimi.</p>
    <p>A gente leu seu contato como parte do cuidado de construir uma plataforma mais leve, contextual e respeitosa. Se sua mensagem precisar de retorno, vamos responder assim que possível.</p>
    <p>Enquanto isso, fica tranquilo: seu contato foi registrado com carinho por aqui.</p>
    <p>Com presença,<br />Equipe Mimi</p>
  `;

  return sendMailIfConfigured({
    code: 'CONTACT_CONFIRMATION_SENT',
    logContext: {
      contactId: contact.id,
      recipient: contact.email
    },
    to: contact.email,
    subject,
    text,
    html
  });
}

export async function sendWaitlistConfirmation(lead) {
  const firstName = lead.name.split(' ')[0] || lead.name;
  const subject = 'Você entrou na fila do beta do Mimi';
  const text = [
    `Oi, ${firstName}!`,
    ``,
    `Sua inscrição na fila do beta do Mimi foi recebida.`,
    ``,
    `Obrigado por querer testar uma rede social onde descoberta começa por posts, comunidades e afinidade, não por pressão ou swipe infinito.`,
    ``,
    `O beta ainda é fechado e os convites serão liberados aos poucos. Quando chegar sua vez, a gente te chama por aqui.`,
    ``,
    `Até lá, valeu por ajudar o Mimi a nascer com mais presença, contexto e cuidado.`,
    ``,
    `Com carinho,`,
    `Equipe Mimi`
  ].join('\n');
  const html = `
    <p>Oi, ${escapeHtml(firstName)}!</p>
    <p>Sua inscrição na fila do beta do Mimi foi recebida.</p>
    <p>Obrigado por querer testar uma rede social onde descoberta começa por posts, comunidades e afinidade, não por pressão ou swipe infinito.</p>
    <p>O beta ainda é fechado e os convites serão liberados aos poucos. Quando chegar sua vez, a gente te chama por aqui.</p>
    <p>Até lá, valeu por ajudar o Mimi a nascer com mais presença, contexto e cuidado.</p>
    <p>Com carinho,<br />Equipe Mimi</p>
  `;

  return sendMailIfConfigured({
    code: 'WAITLIST_CONFIRMATION_SENT',
    logContext: {
      leadId: lead.id,
      recipient: lead.email
    },
    to: lead.email,
    subject,
    text,
    html
  });
}
