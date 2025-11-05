const db = require('../models');
const SendEmail = db.SendEmail;
const UserVariable = db.UserVariable;
const Quote = db.Quote;
const Lead = db.Lead;
const Status = db.Status;
const Settings = db.Settings;
const { sendMail } = require('../utils/mail');

function convertUrlsToLinks(text) {
  const urlRegex = /(?<!href=")(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}



exports.storeSendEmailQuote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quoteId, recipientEmail, emailSubject, emailBody, emailTemplateId } = req.body;

    // ✅ Basic validation
    if (!quoteId || !recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ message: 'api.emailQuotes.missingFields' });
    }

    // ✅ Fetch user-defined variables
    const userVariables = await UserVariable.findAll({ where: { userId } });

    const variablesMap = {};
    userVariables.forEach(({ variableName, variableValue }) => {
      variablesMap[variableName] = variableValue;
    });

    // ✅ Define the offer link cleanly
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const offerUrl = `${frontendUrl}/offer/${quoteId}`;

    // ✅ Make the offer link a proper HTML link
    variablesMap.offer_link = `<a href="${offerUrl}" target="_blank" rel="noopener noreferrer">${offerUrl}</a>`;

    // ✅ Replace variables in body and subject
    const replacedEmailBody = emailBody.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
      variablesMap[varName] !== undefined ? variablesMap[varName] : match
    );

    const replacedEmailSubject = emailSubject.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
      variablesMap[varName] !== undefined ? variablesMap[varName] : match
    );

    // ✅ Store the record in DB
    const sendEmailRecord = await SendEmail.create({
      userId,
      quoteId,
      recipientEmail,
      emailSubject: replacedEmailSubject,
      emailBody: replacedEmailBody,
      emailTemplateId,
    });

    // ✅ Prepare HTML safely (no extra </p> issues)
    const htmlBody = replacedEmailBody.replace(/\n/g, '<br>');

    // ✅ Check if email sending is enabled
    const emailSetting = await Settings.findOne({
      where: { userId, key: 'emailNotifications' },
    });

    if (emailSetting && emailSetting.value === 'true') {
      await sendMail({
        to: recipientEmail,
        subject: replacedEmailSubject,
        text: replacedEmailBody,
        html: htmlBody,
      });
      console.log(`📧 Email sent to user ${recipientEmail}.`);
    } else {
      console.log(`📵 Email notifications are disabled for user ${userId}. Skipping email.`);
    }

    // ✅ Update Lead status to "Offer Sent"
    const quote = await Quote.findByPk(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'api.emailQuotes.quoteNotFoundForLeadUpdate' });
    }

    const offerSentStatus = await Status.findOne({
      where: { name: 'Offer Sent', statusFor: 'Lead' },
    });

    if (offerSentStatus) {
      await Lead.update(
        { statusId: offerSentStatus.id },
        { where: { id: quote.leadId } }
      );
    }

    // ✅ Success
    res.status(201).json(sendEmailRecord);

  } catch (error) {
    console.error('Error storing and sending email quote:', error);
    res.status(500).json({ message: 'api.emailQuotes.serverError', error: error.message });
  }
};

