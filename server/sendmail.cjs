const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.mineazy.co.zw',
  port: 465,
  secure: true,
  auth: {
    user: 'notifications@mineazy.co.zw',
    pass: 'M1n3@zy2026'
  }
});

function sendNotification({ to, subject, body }) {
  return transporter.sendMail({
    from: '"FleetCommand Notifications" <notifications@mineazy.co.zw>',
    to,
    subject,
    html: body
  });
}

module.exports = { sendNotification };
