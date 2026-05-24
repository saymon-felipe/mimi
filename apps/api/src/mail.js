import nodemailer from 'nodemailer';
import {
  buildContactConfirmationEmail,
  buildContactNotificationEmail,
  buildWaitlistConfirmationEmail
} from './services/mailTemplates.js';
import {
  getContactRecipient,
  getGmailAppPassword,
  getGmailUser,
  getSender,
  hasGmailConfig,
  hasMailConfig
} from './services/mailConfig.js';

function createTransport() {
  if (hasGmailConfig()) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: getGmailUser(),
        pass: getGmailAppPassword()
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
  const contactRecipient = getContactRecipient();

  return sendMailIfConfigured({
    code: 'CONTACT_NOTIFICATION_SENT',
    logContext: {
      contactId: contact.id,
      recipient: contactRecipient
    },
    ...buildContactNotificationEmail(contact, contactRecipient)
  });
}

export async function sendContactConfirmation(contact) {
  return sendMailIfConfigured({
    code: 'CONTACT_CONFIRMATION_SENT',
    logContext: {
      contactId: contact.id,
      recipient: contact.email
    },
    ...buildContactConfirmationEmail(contact)
  });
}

export async function sendWaitlistConfirmation(lead) {
  return sendMailIfConfigured({
    code: 'WAITLIST_CONFIRMATION_SENT',
    logContext: {
      leadId: lead.id,
      recipient: lead.email
    },
    ...buildWaitlistConfirmationEmail(lead)
  });
}
