const db = require('../models');
const { sendMail } = require('../utils/mail');
const AskQuestionsTemplate = require('../EmailTemplate/AskQuestionsTemplate');
const AcceptOfferTemplate = require('../EmailTemplate/AcceptOfferTemplate');

const { runWorkflows } = require('../utils/runWorkflows');
const user = require('../models/user');

const Quote = db.Quote;
const QuoteService = db.QuoteService;
const UserVariable = db.UserVariable;
const PricingTemplate = db.PricingTemplate;
const PricingTemplateService = db.PricingTemplateService;
const Currency = db.Currency;
const AcceptedOffer = db.AcceptedOffer;
const Status = db.Status;
const Lead = db.Lead;
const AskQuestion = db.AskQuestion;
const User = db.User;
const StatusUpdateLog = db.StatusUpdateLog;
const OfferTemplate = db.OfferTemplate;
const Settings = db.Settings;

exports.getOfferByQuoteId = async (req, res) => {
  try {
    const { quoteId } = req.params;

    if (!quoteId) {
      return res.status(400).json({ message: 'Quote ID is required' });
    }

    // Fetch quote with services, pricing template, status
    const offer = await Quote.findOne({
      where: { id: quoteId },
      include: [
        {
          model: QuoteService,
          as: 'services',
          attributes: ['id', 'name', 'description', 'price', 'quantity', 'discount'],
        },
        {
          model: PricingTemplate,
          as: 'pricingTemplate',
          attributes: ['id', 'name', 'title', 'description', 'choiceType', 'terms'],
          include: [
            {
              model: PricingTemplateService,
              as: 'services',
              attributes: ['id', 'name', 'description', 'price', 'quantity', 'isRequired'],
            },
            {
              model: Currency,
              as: 'currency',
              attributes: ['id', 'name', 'code', 'symbol'],
            }
          ]
        },
        {
          model: Status,
          as: 'status',
          attributes: ['id', 'name', 'statusFor'],
        },
        {
          model: Currency,     // ✅ Include the quote's own currency
          as: 'currency',
          attributes: ['id', 'name', 'code', 'symbol'],
        }
      ],
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Calculate expiration
    const createdAtDate = new Date(offer.createdAt);
    const validUntilDate = new Date(createdAtDate);
    validUntilDate.setDate(createdAtDate.getDate() + offer.validDays);
    const currentDate = new Date();

    if (currentDate > validUntilDate) {
      console.log('Offer has expired:', offer.id);

      // Update lead status to "Lost"
      const lostStatus = await Status.findOne({
        where: { name: 'Lost', statusFor: 'Lead' },
      });

      if (lostStatus && offer.leadId) {
        const lead = await Lead.findByPk(offer.leadId);
        const user = await User.findByPk(offer.userId);
        await runWorkflows("leadMarkedAsLost", { lead, user });
        await db.Lead.update(
          { statusId: lostStatus.id },
          { where: { id: offer.leadId } }
        );
        await StatusUpdateLog.create({
          leadId: lead.id,
          statusId: lostStatus.id,
        });
      }



      return res.status(400).json({ message: 'This offer has expired.' });
    }

    // Update quote status to "Viewed by customer" if first time viewing
    const viewedStatus = await Status.findOne({
      where: { name: 'Viewed by customer', statusFor: 'Quote' },
    });

    if (
      viewedStatus &&
      offer.status &&
      offer.status.name !== 'Accepted' &&
      offer.status.name !== 'Viewed by customer'
    ) {
      await Quote.update(
        { statusId: viewedStatus.id },
        { where: { id: quoteId } }
      );

      // Update local offer status for response
      offer.status.id = viewedStatus.id;
      offer.status.name = viewedStatus.name;
      offer.status.statusFor = viewedStatus.statusFor;
    }

    // Fetch user variables for replacements
    const userVariables = await UserVariable.findAll({
      where: { userId: offer.userId },
    });

    const variablesMap = {};
    userVariables.forEach(({ variableName, variableValue }) => {
      variablesMap[variableName] = variableValue;
    });

    const replaceVars = (text) =>
      text
        ? text.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
          variablesMap[varName] !== undefined ? variablesMap[varName] : match
        )
        : '';

    const replacedDescription = replaceVars(offer.description);
    const replacedTerms = replaceVars(offer.terms);
    const offerTemplate = await OfferTemplate.findOne({ where: { userId: offer.userId ,status: 'active' } });
    const acceptedOffers = await AcceptedOffer.findOne({ where: { quoteId } });
    const users = await User.findOne({ where: { id: offer.userId } });
    

    res.json({
      id: offer.id,
      userId: offer.userId,
      users,
      leadId: offer.leadId,
      title: offer.title,
      description: replacedDescription,
      terms: replacedTerms,
      validDays: offer.validDays,
      overallDiscount: offer.overallDiscount,
      total: offer.total,
      createdAt: offer.createdAt,
      services: offer.services,
      offerTemplate: offerTemplate,
      acceptedOffers,
      pricingTemplate: offer.pricingTemplate
        ? {
          id: offer.pricingTemplate.id,
          name: offer.pricingTemplate.name,
          title: offer.pricingTemplate.title,
          description: offer.pricingTemplate.description,
          choiceType: offer.pricingTemplate.choiceType,
          terms: offer.pricingTemplate.terms,
          services: offer.pricingTemplate.services,
          currency: offer.pricingTemplate.currency,
        }
        : null,
      status: offer.status
        ? {
          id: offer.status.id,
          name: offer.status.name,
          statusFor: offer.status.statusFor,
        }
        : null,
         currency: offer.currency
    ? {
        id: offer.currency.id,
        code: offer.currency.code,
        name: offer.currency.name,
        symbol: offer.currency.symbol,
      }
    : null,
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Accept offer handler
exports.acceptOffer = async (req, res) => {
  const { quoteId, chosenServices, totalPrice, rememberNotes } = req.body;

  try {
    // 1. Validation
    if (!quoteId || !chosenServices || totalPrice === undefined) {
      return res.status(400).json({ message: 'Missing required fields for accepting offer.' });
    }

    // 2. Status Fetching
    const acceptedStatus = await Status.findOne({ where: { name: 'Accepted', statusFor: 'Quote' } });
    const wonStatus = await Status.findOne({ where: { name: 'Won', statusFor: 'Lead' } });

    // 3. Update Quote Status
    await Quote.update(
      { statusId: acceptedStatus.id },
      { where: { id: quoteId } }
    );

    // 4. Fetch Quote with Lead details
    const quote = await Quote.findByPk(quoteId, {
      include: [{ model: Lead, as: 'lead' },  {
          model: Currency,     // ✅ Include the quote's own currency
          as: 'currency',
          attributes: ['id', 'name', 'code', 'symbol'],
        }]
    });

    // 5. Create AcceptedOffer Record
    const acceptedOffer = await AcceptedOffer.create({
      quoteId,
      chosenServices,
      totalPrice,
      rememberNotes: rememberNotes || null,
      userId: quote.userId,
    });

    // ============================================================
    //   SEND EMAIL ON ACCEPT (UPDATED FOR NEW TEMPLATE)
    // ============================================================

    const salesUser = await User.findByPk(quote.userId);
    const lead = await Lead.findByPk(quote.leadId);

    const emailSetting = await Settings.findOne({
      where: { userId: salesUser.id, key: 'emailNotifications' },
    });

    // Check if Email Notification is ON
    if (emailSetting?.value === 'true') {

      const offerLink = `${process.env.FRONTEND_URL}/offer/${quote.id}`;

      // YAHAN CHANGE KIYA HAI: Naye Template ke hisaab se parameters map kiye hain
      const emailHtml = AcceptOfferTemplate({
        salesRepName: salesUser.name,   // Pehle ye salesUserName tha
        customerName: lead.fullName,    // Lead ka pura naam
        offerId: quoteId,
        offerLink: offerLink,
        totalPrice: totalPrice,
        chosenServices: chosenServices,
        notes: rememberNotes || '',     // Agar note nahi hai to empty string
        signature: salesUser.emailSignature || null, // (Optional) Agar user ke paas signature hai
        currency:quote.currency,
      });

      await sendMail(
        salesUser.id,
        {
          to: salesUser.email,
          subject: `🚀 Offer #${quoteId} Accepted by ${lead.fullName}`, // Subject me thoda emoji daal diya
          html: emailHtml,
        }
      );

      await sendMail(
        lead.userId,
        {
          to: lead.email,
          subject: `🚀 Offer #${quoteId} Accepted by ${lead.fullName}`, // Subject me thoda emoji daal diya
          html: emailHtml,
        }
      );

      console.log(`📧 Email sent to ${salesUser.email} — Offer accepted`);
    } else {
      console.log(`📵 Email notifications OFF for user ${salesUser.id}`);
    }

    // ============================================================

    // 6. Update Lead Status -> WON
    if (quote && quote.leadId) {
      await db.Lead.update(
        { statusId: wonStatus.id },
        { where: { id: quote.leadId } }
      );

      await StatusUpdateLog.create({
        leadId: lead.id,
        statusId: wonStatus.id,
      });
    }

    res.status(200).json({
      message: 'Offer accepted successfully! Email sent.',
      acceptedOfferId: acceptedOffer.id,
    });

  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.askedQuestion = async (req, res) => {
  try {
    const { quoteId, question } = req.body;

    if (!quoteId || !question) {
      return res.status(400).json({ message: "Quote ID and question are required" });
    }

    // Find the quote
    const quote = await Quote.findByPk(quoteId);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    // Get lead with user (sales rep) and optionally customer
    const lead = await Lead.findByPk(quote.leadId, {
      include: [
        { model: User, as: "user" } // sales rep
      ]
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Save question
    const askQuestion = await AskQuestion.create({
      quoteId: quote.id,
      leadId: lead.id,
      question,
      userId: quote.userId, // include this
    });

    // Update status
    const inDialogueStatus = await Status.findOne({
      where: { name: "In Dialogue", statusFor: "Lead" }
    });
    if (inDialogueStatus) {
      await lead.update({ statusId: inDialogueStatus.id });
      await StatusUpdateLog.create({
        leadId: lead.id,
        statusId: inDialogueStatus.id,
      });
    }

    // Send email to assigned sales rep
    if (lead.user?.email) {
      const emailHtml =
        AskQuestionsTemplate({
          firstName: lead.user.name || "",
          customerFullName: lead.fullName || "",
          offerLink: `${process.env.FRONTEND_URL}/offer/${quote.id}`,
          question,
          customerEmail: lead.email
        });

      const emailSetting = await Settings.findOne({
        where: { userId: lead.user.id, key: 'emailNotifications' },
      });

      if (emailSetting.value === 'true') {
        await sendMail(
        lead.user.id,
        {
          to: lead.user.email,
          subject: `Customer Question About Offer #${quote.id}`,
          html: emailHtml,
        });
        console.log(`📧 Email sent to user ${lead.user.email} for offer #${quote.id}`);
      } else {
        console.log(`📵 Email notifications are disabled for user ${lead.user.id}. Skipping email.`);
      }

      
    }

    res.status(200).json({
      message: "Question saved, lead status updated, and email sent.",
      askQuestion
    });

  } catch (error) {
    console.error("Error in askedQuestion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};