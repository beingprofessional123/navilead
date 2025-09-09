const db = require('../models');
const { sendMail } = require('../utils/mail');
const AskQuestionsTemplate = require('../EmailTemplate/AskQuestionsTemplate');
const { runWorkflows } = require('../utils/runWorkflows');

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
        await runWorkflows("leadMarkedAsLost", { lead, user: req.user });
        await db.Lead.update(
          { statusId: lostStatus.id },
          { where: { id: offer.leadId } }
        );
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

    res.json({
      id: offer.id,
      leadId: offer.leadId,
      title: offer.title,
      description: replacedDescription,
      terms: replacedTerms,
      validDays: offer.validDays,
      overallDiscount: offer.overallDiscount,
      total: offer.total,
      createdAt: offer.createdAt,
      services: offer.services,
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
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Accept offer handler remains unchanged
exports.acceptOffer = async (req, res) => {
  const { quoteId, chosenServices, totalPrice, rememberNotes } = req.body;

  try {
    if (!quoteId || !chosenServices || totalPrice === undefined) {
      return res.status(400).json({ message: 'Missing required fields for accepting offer.' });
    }

    // Find the "Accepted" status for quotes
    const acceptedStatus = await Status.findOne({
      where: { name: 'Accepted', statusFor: 'Quote' },
    });

    if (!acceptedStatus) {
      return res.status(500).json({ message: 'Accepted status not configured in database.' });
    }

    // Find the "Won" status for leads
    const wonStatus = await Status.findOne({
      where: { name: 'Won', statusFor: 'Lead' },
    });

    if (!wonStatus) {
      return res.status(500).json({ message: 'Won status not configured in database.' });
    }

    // Create a new AcceptedOffer record
    const acceptedOffer = await AcceptedOffer.create({
      quoteId,
      chosenServices,
      totalPrice,
      rememberNotes: rememberNotes || null,
    });

    // Update the quote status to "Accepted"
    await Quote.update(
      { statusId: acceptedStatus.id },
      { where: { id: quoteId } }
    );

    // Also update the lead status to "Won"
    const quote = await Quote.findByPk(quoteId);
    if (quote && quote.leadId) {
      const lead = await Lead.findByPk(quote.leadId);
      await runWorkflows("leadMarkedAsLost", { lead, user: req.user });
      await db.Lead.update(
        { statusId: wonStatus.id },
        { where: { id: quote.leadId } }
      );

    }

    res.status(200).json({
      message: 'Offer accepted successfully! Lead status updated to Won.',
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
      question
    });

    // Update status
    const inDialogueStatus = await Status.findOne({
      where: { name: "In Dialogue", statusFor: "Lead" }
    });
    if (inDialogueStatus) {
      await lead.update({ statusId: inDialogueStatus.id });
    }

    console.log(lead.user?.email);

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

      await sendMail({
        to: lead.user.email,
        subject: `Customer Question About Offer #${quote.id}`,
        html: emailHtml
      });
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