// controllers/sendSmsQuoteController.js
const db = require('../models');
const SmsTemplate = db.SmsTemplate;
const SendSms = db.SendSms;
const UserVariable = db.UserVariable;
const Quote = db.Quote;
const Lead = db.Lead;
const Status = db.Status;
const { sendSms } = require('../utils/sms'); // using GatewayAPI
const sequelize = db.sequelize;

function replaceVariables(text, variablesMap) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
    variablesMap[varName] !== undefined ? variablesMap[varName] : match
  );
}

exports.storeSendSmsQuote = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { quoteId, recipientPhone, smsMessage, smsTemplateId, senderName } = req.body;

    if (!quoteId || !recipientPhone || (!smsMessage && !smsTemplateId)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Fetch user variables
    const userVariables = await UserVariable.findAll({ where: { userId } });
    const variablesMap = {};
    userVariables.forEach(({ variableName, variableValue }) => {
      variablesMap[variableName] = variableValue;
    });

    // Add dynamic offer link
    const frontendUrl = process.env.FRONTEND_URL;
    variablesMap.offer_link = `${frontendUrl}/offer/${quoteId}`;

    // Determine final message
    let finalMessage = smsMessage;
    if (smsTemplateId) {
      const template = await SmsTemplate.findOne({ where: { id: smsTemplateId, userId } });
      if (!template) return res.status(404).json({ message: 'SMS template not found' });
      finalMessage = template.smsContent;
    }

    // Replace variables in the message
    const replacedMessage = replaceVariables(finalMessage, variablesMap);

    // Store SMS in SendSms table
    const smsRecord = await SendSms.create(
      {
        userId,
        quoteId,
        recipientPhone,
        smsMessage: replacedMessage,
        smsTemplateId: smsTemplateId || null,
        senderName: senderName,
      },
      { transaction: t }
    );

    // Optionally send SMS via GatewayAPI (uncomment if needed)
    try {
      await sendSms({
        to: recipientPhone,
        message: replacedMessage,
        from: (senderName || 'NaviLead').substring(0, 11), // max 11 chars
      });

    } catch (smsError) {
      console.error('Error sending SMS:', smsError);
      await smsRecord.update({ status: 'Failed' }, { transaction: t });
    }

    // Update Lead status to "Offer Sent"
    const quote = await Quote.findByPk(quoteId);
    if (quote) {
      const offerSentStatus = await Status.findOne({
        where: { name: 'Offer Sent', statusFor: 'Lead' },
      });
      if (offerSentStatus) {
        await Lead.update({ statusId: offerSentStatus.id }, { where: { id: quote.leadId }, transaction: t });
      }
    }

    await t.commit();
    res.status(201).json({ message: 'SMS stored successfully', smsRecord });
  } catch (error) {
    await t.rollback();
    console.error('Error storing SMS quote:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
