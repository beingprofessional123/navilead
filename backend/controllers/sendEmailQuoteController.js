const db = require('../models');
const SendEmail = db.SendEmail;
const UserVariable = db.UserVariable;
const Quote = db.Quote;
const Lead = db.Lead;
const Status = db.Status;
const Settings = db.Settings;

const { sendMail } = require('../utils/mail');
const QuoteSendTemplate = require('../EmailTemplate/QuoteSendTemplate');

exports.storeSendEmailQuote = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;

    const {
      quoteId,
      recipientEmail,
      emailSubject,
      emailBody,
      emailTemplateId,
      attachments
    } = req.body;

    // --------------------------------------------------
    // 1. BASIC VALIDATION
    // --------------------------------------------------
    if (!quoteId || !recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ message: 'api.emailQuotes.missingFields' });
    }

    // --------------------------------------------------
    // 2. FETCH QUOTE + LEAD
    // --------------------------------------------------
    const quote = await Quote.findByPk(quoteId, {
      include: [{
        model: Lead,
        as: 'lead'
      }]
    });

    if (!quote || !quote.lead) {
      return res.status(404).json({ message: 'api.emailQuotes.leadNotFound' });
    }

    const lead = quote.lead;

    // --------------------------------------------------
    // 3. FETCH USER VARIABLES
    // --------------------------------------------------
    const userVariables = await UserVariable.findAll({ where: { userId } });

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
      lead_cvr_number: lead.cvrNumber || '',
      lead_address: lead.address || ''
    };

    // --------------------------------------------------
    // 5. SYSTEM VARIABLES (OFFER LINK)
    // --------------------------------------------------
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const offerUrl = `${frontendUrl}/offer/${quoteId}`;

    const systemVariablesMap = {
      offer_link: `<a href="${offerUrl}" target="_blank" rel="noopener noreferrer">${offerUrl}</a>`
    };

    // --------------------------------------------------
    // 6. FINAL VARIABLES MAP (MERGED)
    // --------------------------------------------------
    const finalVariablesMap = {
      ...userVariablesMap,
      ...leadVariablesMap,
      ...systemVariablesMap
    };

    // --------------------------------------------------
    // 7. VARIABLE REPLACEMENT FUNCTION
    // --------------------------------------------------
    const replaceVariables = (content, variables) => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
      });
    };

    const replacedEmailBody = replaceVariables(emailBody, finalVariablesMap);
    const replacedEmailSubject = replaceVariables(emailSubject, finalVariablesMap);

    // --------------------------------------------------
    // 8. FORMAT ATTACHMENTS
    // --------------------------------------------------
    let formattedAttachments = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      formattedAttachments = attachments.map(att => ({
        filename: att.originalName || att.filename,
        path: att.url || att.path
      }));
    }

    // --------------------------------------------------
    // 9. STORE EMAIL RECORD
    // --------------------------------------------------
    const sendEmailRecord = await SendEmail.create({
      userId,
      quoteId,
      recipientEmail,
      emailSubject: replacedEmailSubject,
      emailBody: replacedEmailBody,
      emailTemplateId,
      attachments: formattedAttachments
    });

    // --------------------------------------------------
    // 10. PREPARE EMAIL CONTENT
    // --------------------------------------------------
    const userSignature = user.emailSignature || '';

    const textBody = `${replacedEmailBody}\n\n${userSignature}`;

    const htmlBody = QuoteSendTemplate({
      emailSubject: replacedEmailSubject,
      emailBody: replacedEmailBody,
      signature: userSignature,
      attachments: formattedAttachments
    });

    // --------------------------------------------------
    // 11. CHECK EMAIL SETTINGS
    // --------------------------------------------------
    const emailSetting = await Settings.findOne({
      where: { userId, key: 'emailNotifications' }
    });

    if (emailSetting && emailSetting.value === 'true') {
      await sendMail(userId, {
        to: recipientEmail,
        subject: replacedEmailSubject,
        text: textBody,
        html: htmlBody,
        attachments: formattedAttachments
      });

      console.log(`Email sent to ${recipientEmail}`);
    } else {
      console.log(`Email notifications disabled for user ${userId}`);
    }

    // --------------------------------------------------
    // 12. UPDATE LEAD STATUS → OFFER SENT
    // --------------------------------------------------
    const offerSentStatus = await Status.findOne({
      where: { name: 'Offer Sent', statusFor: 'Lead' }
    });

    if (offerSentStatus) {
      await Lead.update(
        { statusId: offerSentStatus.id },
        { where: { id: quote.leadId } }
      );
    }

    // --------------------------------------------------
    // 13. SUCCESS RESPONSE
    // --------------------------------------------------
    res.status(201).json(sendEmailRecord);

  } catch (error) {
    console.error('Error storing and sending email quote:', error);
    res.status(500).json({
      message: 'api.emailQuotes.serverError',
      error: error.message
    });
  }
};
