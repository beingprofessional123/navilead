const db = require('../models');
const SmsTemplate = db.SmsTemplate;
const SendSms = db.SendSms;
const UserVariable = db.UserVariable;
const Quote = db.Quote;
const Lead = db.Lead;
const Status = db.Status;
const User = db.User;
const Settings = db.Settings;
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
      // Changed message to i18n key
      return res.status(400).json({ message: 'api.smsQuotes.missingFields' });
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
    let finalMessage = smsMessage && smsMessage.trim() !== "" ? smsMessage : null;

    if (!finalMessage && smsTemplateId) {
      const template = await SmsTemplate.findOne({ where: { id: smsTemplateId, userId } });
      if (!template) {
        // Changed message to i18n key
        return res.status(404).json({ message: 'api.smsTemplates.notFound' });
      }
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
      // Fetch user first
      const user = await User.findByPk(userId, { transaction: t });

      // Check SMS balance before sending
      if (!user || user.smsBalance <= 0) {
        console.warn(`User ${userId} has 0 SMS balance. SMS not sent to ${recipientPhone}.`);
        await smsRecord.update({ status: 'pending' }, { transaction: t });
        return; // exit the try block
      }

       const smsSetting = await Settings.findOne({
          where: { userId: user.id, key: 'smsNotifications' },
        });


      if (smsSetting.value === 'true') {
        await sendSms({
          to: recipientPhone,
          message: replacedMessage,
          from: (senderName || 'NaviLead').substring(0, 10),
        });

         // ✅ Deduct 1 SMS from user balance
        user.smsBalance -= 1;
        await user.save({ transaction: t });
        console.log(`💰 Deducted 1 SMS from user ${userId}. New balance: ${user.smsBalance}`);
      } else {
        console.log(`📵 SMS notifications are disabled for user ${user.id}. Skipping SMS.`);
      }

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
    // Changed message to i18n key
    res.status(201).json({ message: 'api.smsQuotes.storeSuccess', smsRecord });
  } catch (error) {
    await t.rollback();
    console.error('Error storing SMS quote:', error);
    // Changed message to i18n key
    res.status(500).json({ message: 'api.smsQuotes.serverError', error: error.message });
  }
};
