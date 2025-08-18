const db = require('../models');
const SendEmail = db.SendEmail;
const UserVariable = db.UserVariable;
const Quote = db.Quote;
const Lead = db.Lead;
const Status = db.Status;
const { sendMail } = require('../utils/mail');

function convertUrlsToLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

exports.storeSendEmailQuote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quoteId, recipientEmail, emailSubject, emailBody, emailTemplateId } = req.body;

    if (!quoteId || !recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const userVariables = await UserVariable.findAll({ where: { userId } });

    const variablesMap = {};
    userVariables.forEach(({ variableName, variableValue }) => {
      variablesMap[variableName] = variableValue;
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    variablesMap.offer_link = `${frontendUrl}/offer/${quoteId}`;

    const replacedEmailBody = emailBody.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
      variablesMap[varName] !== undefined ? variablesMap[varName] : match
    );

    const replacedEmailSubject = emailSubject.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
      variablesMap[varName] !== undefined ? variablesMap[varName] : match
    );

    const sendEmailRecord = await SendEmail.create({
      userId,
      quoteId,
      recipientEmail,
      emailSubject: replacedEmailSubject,
      emailBody: replacedEmailBody,
      emailTemplateId,
    });

    const htmlBody = convertUrlsToLinks(replacedEmailBody).replace(/\n/g, '<br>');

    await sendMail({
      to: recipientEmail,
      subject: replacedEmailSubject,
      text: replacedEmailBody,
      html: htmlBody,
    });

    // --- NEW: Update Lead status to "Offer Sent" ---
    // 1. Find the quote to get the leadId
    const quote = await Quote.findByPk(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found for updating Lead status' });
    }

    // 2. Find the "Offer Sent" status for Lead
    const offerSentStatus = await Status.findOne({
      where: { name: 'Offer Sent', statusFor: 'Lead' },
    });

    if (offerSentStatus) {
      // 3. Update the Lead's statusId
      await Lead.update(
        { statusId: offerSentStatus.id },
        { where: { id: quote.leadId } }
      );
    }

    res.status(201).json(sendEmailRecord);
  } catch (error) {
    console.error('Error storing and sending email quote:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
