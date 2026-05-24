import nodemailer from 'nodemailer';

const contactRecipient = process.env.CONTACT_NOTIFICATION_EMAIL || 'linnubr@gmail.com';

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
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

export async function sendContactNotification(contact) {
  if (!hasSmtpConfig()) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        code: 'SMTP_NOT_CONFIGURED',
        message: 'Contato salvo, mas SMTP não está configurado para enviar e-mail.',
        contactId: contact.id,
        recipient: contactRecipient
      })
    );
    return { skipped: true };
  }

  const transport = createTransport();
  const subject = `[Mimi] Novo contato: ${contact.subject}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
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

  await transport.sendMail({
    from,
    to: contactRecipient,
    replyTo,
    subject,
    text,
    html
  });

  return { sent: true };
}
