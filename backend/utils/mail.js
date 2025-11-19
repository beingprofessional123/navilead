const nodemailer = require('nodemailer');
const { SmtpSetting } = require('../models');
require('dotenv').config();

/**
 * Create transporter dynamically
 * - If user's SMTP (smtpActive = true) → use user's SMTP
 * - Else → use default .env SMTP
 */
async function createTransporter(userId) {
  let smtp = await SmtpSetting.findOne({ where: { userId } });

  if (smtp && smtp.smtpActive) {
    // USER SMTP ACTIVE
    const secure = smtp.smtpEncryption.toLowerCase() === 'ssl'; // SSL = port 465

    return nodemailer.createTransport({
      host: smtp.smtpHost,
      port: smtp.smtpPort,
      secure,
      auth: {
        user: smtp.smtpUser,
        pass: smtp.smtpPass,
      },
      tls: { rejectUnauthorized: false },
      fromName: smtp.fromName,
      fromEmail: smtp.fromEmail,
      isUserSMTP: true
    });
  }

  // DEFAULT SMTP FALLBACK
  const secure = process.env.MAIL_ENCRYPTION.toLowerCase() === 'ssl';

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });

  transporter.fromName = process.env.MAIL_FROM_NAME;
  transporter.fromEmail = process.env.MAIL_FROM_ADDRESS;
  transporter.isUserSMTP = false;

  return transporter;
}

/**
 * Send an email dynamically
 * @param {number} userId - User ID who triggers sending mail
 * @param {Object} options
 */
async function sendMail(userId, { to, subject, text, html }) {
  try {
    const transporter = await createTransporter(userId);

    const info = await transporter.sendMail({
      from: `"${transporter.fromName}" <${transporter.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `Email sent (${transporter.isUserSMTP ? "User SMTP" : "Default SMTP"}):`,
      info.messageId
    );

    return info;

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendMail };
