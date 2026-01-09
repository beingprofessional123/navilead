const db = require('../models');
const SmsTemplate = db.SmsTemplate;
const SendSms = db.SendSms;
const UserVariable = db.UserVariable;
const Quote = db.Quote;
const Lead = db.Lead;
const Status = db.Status;
const User = db.User;
const Settings = db.Settings;
const { sendSms } = require('../utils/sms');
const sequelize = db.sequelize;

// --------------------------------------------------
// VARIABLE REPLACEMENT HELPER
// --------------------------------------------------
function replaceVariables(text, variablesMap) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    variablesMap[key] !== undefined ? variablesMap[key] : match
  );
}

exports.storeSendSmsQuote = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const {
      quoteId,
      recipientPhone,
      smsMessage,
      smsTemplateId,
      senderName
    } = req.body;

    // --------------------------------------------------
    // 1. BASIC VALIDATION
    // --------------------------------------------------
    if (!quoteId || !recipientPhone || (!smsMessage && !smsTemplateId)) {
      return res.status(400).json({ message: 'api.smsQuotes.missingFields' });
    }

    // --------------------------------------------------
    // 2. FETCH QUOTE + LEAD
    // --------------------------------------------------
    const quote = await Quote.findByPk(quoteId, {
      include: [{ model: Lead, as: 'lead' }],
      transaction: t
    });

    if (!quote || !quote.lead) {
      await t.rollback();
      return res.status(404).json({ message: 'api.smsQuotes.leadNotFound' });
    }

    const lead = quote.lead;

    // --------------------------------------------------
    // 3. FETCH USER VARIABLES
    // --------------------------------------------------
    const userVariables = await UserVariable.findAll({
      where: { userId },
      transaction: t
    });

    const userVariablesMap = {};
    userVariables.forEach(({ variableName, variableValue }) => {
      userVariablesMap[variableName] = variableValue;
    });

    // --------------------------------------------------
    // 4. LEAD VARIABLES MAP
    // --------------------------------------------------
    const leadVariablesMap = {
      lead_full_name: lead.fullName || '',
      lead_phone: lead.phone || '',
      lead_email: lead.email || '',
      lead_company_name: lead.companyName || '',
      lead_cvr_number: lead.cvrNumber || ''
    };

    // --------------------------------------------------
    // 5. SYSTEM VARIABLES (OFFER LINK)
    // --------------------------------------------------
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const systemVariablesMap = {
      offer_link: `${frontendUrl}/offer/${quoteId}`
    };

    // --------------------------------------------------
    // 6. MERGE ALL VARIABLES
    // --------------------------------------------------
    const finalVariablesMap = {
      ...userVariablesMap,
      ...leadVariablesMap,
      ...systemVariablesMap
    };

    // --------------------------------------------------
    // 7. DETERMINE FINAL SMS MESSAGE
    // --------------------------------------------------
    let finalMessage = smsMessage && smsMessage.trim() !== ''
      ? smsMessage
      : null;

    if (!finalMessage && smsTemplateId) {
      const template = await SmsTemplate.findOne({
        where: { id: smsTemplateId, userId },
        transaction: t
      });

      if (!template) {
        await t.rollback();
        return res.status(404).json({ message: 'api.smsTemplates.notFound' });
      }

      finalMessage = template.smsContent;
    }

    // --------------------------------------------------
    // 8. REPLACE VARIABLES
    // --------------------------------------------------
    const replacedMessage = replaceVariables(finalMessage, finalVariablesMap);

    // --------------------------------------------------
    // 9. STORE SMS RECORD
    // --------------------------------------------------
    const smsRecord = await SendSms.create(
      {
        userId,
        quoteId,
        recipientPhone,
        smsMessage: replacedMessage,
        smsTemplateId: smsTemplateId || null,
        senderName
      },
      { transaction: t }
    );

    // --------------------------------------------------
    // 10. FETCH USER & CHECK BALANCE
    // --------------------------------------------------
    const user = await User.findByPk(userId, { transaction: t });

    if (!user || user.smsBalance <= 0) {
      await smsRecord.update({ status: 'pending' }, { transaction: t });
      await t.commit();

      return res.status(400).json({
        message: 'api.smsQuotes.insufficientBalance',
        smsRecord
      });
    }

    // --------------------------------------------------
    // 11. CHECK SMS SETTINGS
    // --------------------------------------------------
    const smsSetting = await Settings.findOne({
      where: { userId, key: 'smsNotifications' },
      transaction: t
    });

    if (smsSetting && smsSetting.value === 'true') {
      try {
        // --------------------------------------------------
        // 12. SEND SMS
        // --------------------------------------------------
        const smsResponse = await sendSms({
          to: recipientPhone,
          message: replacedMessage,
          from: (senderName || 'NaviLead').substring(0, 10)
        });

        // Save gateway response
        if (smsResponse) {
          await smsRecord.update(
            { spendCredits: smsResponse },
            { transaction: t }
          );
        }

        // --------------------------------------------------
        // 13. DYNAMIC SEGMENT DEDUCTION
        // --------------------------------------------------
        let segmentsUsed = 1;

        if (
          smsResponse &&
          smsResponse.usage &&
          smsResponse.usage.countries
        ) {
          segmentsUsed = Object.values(
            smsResponse.usage.countries
          ).reduce((sum, val) => sum + val, 0);
        }

        user.smsBalance -= segmentsUsed;
        await user.save({ transaction: t });

      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        await smsRecord.update({ status: 'Failed' }, { transaction: t });
      }
    }

    // --------------------------------------------------
    // 14. UPDATE LEAD STATUS → OFFER SENT
    // --------------------------------------------------
    const offerSentStatus = await Status.findOne({
      where: { name: 'Offer Sent', statusFor: 'Lead' },
      transaction: t
    });

    if (offerSentStatus) {
      await Lead.update(
        { statusId: offerSentStatus.id },
        { where: { id: quote.leadId }, transaction: t }
      );
    }

    // --------------------------------------------------
    // 15. COMMIT TRANSACTION
    // --------------------------------------------------
    await t.commit();

    res.status(201).json({
      message: 'api.smsQuotes.storeSuccess',
      smsRecord
    });

  } catch (error) {
    await t.rollback();
    console.error('Error storing SMS quote:', error);
    res.status(500).json({
      message: 'api.smsQuotes.serverError',
      error: error.message
    });
  }
};
