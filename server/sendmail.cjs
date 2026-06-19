const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'mail.mineazy.co.zw';
    const port = parseInt(process.env.SMTP_PORT || '465');
    const secure = port === 465;
    const user = process.env.SMTP_USER || 'notifications@mineazy.co.zw';
    const pass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME || 'FleetCommand Notifications';
    const fromEmail = process.env.SMTP_FROM_EMAIL || user;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return transporter;
}

function sendNotification({ to, subject, body }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'notifications@mineazy.co.zw';
  const fromName = process.env.SMTP_FROM_NAME || 'FleetCommand Notifications';
  const t = getTransporter();
  return t.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html: body
  });
}

module.exports = { sendNotification };
