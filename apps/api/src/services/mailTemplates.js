function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function firstNameFrom(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'oi';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  }).format(new Date(value));
}

function paragraph(text) {
  return `<p style="margin:0 0 16px;color:#51466f;font-size:16px;line-height:1.7;">${text}</p>`;
}

function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0e7ff;color:#7b6b99;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e7ff;color:#34294f;font-size:15px;text-align:right;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function renderMimiEmail({ eyebrow, title, preview, body, details = '', message = '', footer = 'Com carinho, Equipe Mimi' }) {
  const escapedPreview = escapeHtml(preview);
  const escapedFooter = escapeHtml(footer).replaceAll('\n', '<br />');

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#fbf7ff;font-family:Inter,Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapedPreview}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#fff7fb 0%,#f4edff 48%,#eef9ff 100%);padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #eadfff;border-radius:28px;overflow:hidden;box-shadow:0 18px 50px rgba(126,90,180,.18);">
                <tr>
                  <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#fff8fc 0%,#f4edff 62%,#edf8ff 100%);">
                    <div style="display:inline-block;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(151,112,214,.22);color:#8a5cf6;font-size:13px;font-weight:800;letter-spacing:.03em;">Mimi</div>
                    <div style="margin-top:18px;color:#a34d80;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(eyebrow)}</div>
                    <h1 style="margin:8px 0 0;color:#30244b;font-size:30px;line-height:1.16;font-weight:900;letter-spacing:0;">${escapeHtml(title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px;">
                    ${body}
                    ${
                      details
                        ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;padding:0;border-collapse:collapse;">${details}</table>`
                        : ''
                    }
                    ${
                      message
                        ? `<div style="margin:22px 0 0;padding:18px 20px;background:#fff8fb;border:1px solid #f4d8e8;border-radius:20px;color:#47395f;font-size:15px;line-height:1.7;">${message}</div>`
                        : ''
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 28px 28px;background:#fbf8ff;border-top:1px solid #f0e7ff;">
                    <p style="margin:0;color:#7b6b99;font-size:14px;line-height:1.7;">${escapedFooter}</p>
                  </td>
                </tr>
              </table>
              <p style="max-width:560px;margin:18px auto 0;color:#9a8ab8;font-size:12px;line-height:1.6;">Este e-mail foi enviado automaticamente pelo Mimi. Se não foi você, pode ignorar com tranquilidade.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function buildContactNotificationEmail(contact, to) {
  return {
    to,
    replyTo: contact.email,
    subject: `[Mimi] Novo contato: ${contact.subject}`,
    text: [
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
    ].join('\n'),
    html: renderMimiEmail({
      eyebrow: 'Novo contato',
      title: 'Chegou uma mensagem pelo site',
      preview: `${contact.name} enviou um contato sobre ${contact.subject}.`,
      body: [
        paragraph('Alguém falou com o Mimi pelo formulário de contato. Os detalhes estão organizados aqui para facilitar sua resposta.'),
        paragraph('Se a mensagem pedir retorno, use o e-mail abaixo como destinatário ou responda diretamente por este e-mail.')
      ].join(''),
      details: [
        detailRow('Nome', contact.name),
        detailRow('E-mail', contact.email),
        detailRow('Assunto', contact.subject),
        detailRow('Origem', contact.source || 'contact_page'),
        detailRow('Recebido em', formatDate(contact.createdAt))
      ].join(''),
      message: escapeHtml(contact.message).replaceAll('\n', '<br />'),
      footer: 'Painel interno do Mimi'
    })
  };
}

export function buildContactConfirmationEmail(contact) {
  const firstName = firstNameFrom(contact.name);

  return {
    to: contact.email,
    subject: 'Recebemos sua mensagem no Mimi',
    text: [
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
    ].join('\n'),
    html: renderMimiEmail({
      eyebrow: 'Contato recebido',
      title: `Oi, ${firstName}. Sua mensagem chegou.`,
      preview: 'Recebemos seu contato no Mimi e registramos tudo por aqui.',
      body: [
        paragraph(`Recebemos sua mensagem sobre <strong style="color:#34294f;">${escapeHtml(contact.subject)}</strong>. Obrigado por falar com o Mimi.`),
        paragraph('A gente está construindo um espaço mais leve, contextual e respeitoso. Cada mensagem ajuda a cuidar melhor dessa experiência.'),
        paragraph('Se seu contato precisar de retorno, vamos responder assim que possível. Enquanto isso, fica tranquilo: sua mensagem ficou salva por aqui.')
      ].join(''),
      footer: 'Com presença,\nEquipe Mimi'
    })
  };
}

export function buildWaitlistConfirmationEmail(lead) {
  const firstName = firstNameFrom(lead.name);

  return {
    to: lead.email,
    subject: 'Você entrou na fila do beta do Mimi',
    text: [
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
    ].join('\n'),
    html: renderMimiEmail({
      eyebrow: 'Fila do beta',
      title: `Oi, ${firstName}. Você entrou na fila.`,
      preview: 'Sua inscrição na fila do beta do Mimi foi recebida.',
      body: [
        paragraph('Sua inscrição na fila do beta do Mimi foi recebida. Que bom ter você por perto nesse comecinho.'),
        paragraph('O Mimi nasce para uma descoberta social com mais posts, comunidades e afinidade, sem pressão e sem swipe infinito. A ideia é que as conexões tenham mais contexto desde o começo.'),
        paragraph('O beta ainda é fechado e os convites serão liberados aos poucos. Quando chegar sua vez, a gente te chama por este e-mail.')
      ].join(''),
      details: detailRow('Status', 'Inscrição recebida') + detailRow('Próximo passo', 'Aguardar convite do beta'),
      footer: 'Com carinho,\nEquipe Mimi'
    })
  };
}
