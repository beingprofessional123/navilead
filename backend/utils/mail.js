const nodemailer = require('nodemailer');
require('dotenv').config();

// Use TLS (STARTTLS) on port 587 for cloud compatibility
const secure = process.env.MAIL_ENCRYPTION.toLowerCase() === 'ssl'; // true only if using 465
const port = Number(process.env.MAIL_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: port,          // 587 for TLS
  secure: secure,      // false for STARTTLS
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // allows self-signed certs
  },
});

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} [options.html] - HTML email body (optional)
 */
async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendMail };
