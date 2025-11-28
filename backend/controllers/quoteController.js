const db = require('../models');
const { Op } = require("sequelize");
const { Quote, QuoteService, Status,UserPlan,Plan ,SendEmail,SendSms, Currency } = db;

// Get all quotes (optionally filter by leadId or userId via query params)
exports.getQuotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const filter = {};
    if (req.query.leadId) filter.leadId = req.query.leadId;
    if (req.query.userId) filter.userId = req.query.userId;

    // ✅ Fetch user's active plan (to get startDate)
    const userPlan = await UserPlan.findOne({
      where: { userId, status: "active" },
      include: { model: Plan, as: "plan" },
      
    });

    let planStartDate = null;
    if (userPlan?.startDate) {
      planStartDate = new Date(userPlan.startDate);
    }

    // ✅ Base query for quotes
    const quotes = await Quote.findAll({
      where: filter,
      include: [
        { model: QuoteService, as: "services" },
        { model: Status, as: "status" },
        {
          model: Currency,     // ✅ Include the quote's own currency
          as: 'currency',
          attributes: ['id', 'name', 'code', 'symbol'],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // ✅ Count SMS and Emails *only after plan start date*
    const smsFilter = { userId };
    const emailFilter = { userId };

    if (planStartDate) {
      smsFilter.createdAt = { [Op.gte]: planStartDate };
      emailFilter.createdAt = { [Op.gte]: planStartDate };
    }

    const totalSmsSend = await SendSms.count({ where: smsFilter });
    const totalEmailsSend = await SendEmail.count({ where: emailFilter });

    res.status(200).json({
      success: true,
      message: "api.quotes.fetchSuccess",
      quotes,
      totalSmsSend,
      totalEmailsSend,
    });
  } catch (err) {
    console.error("Error fetching quotes:", err);
    res.status(500).json({
      success: false,
      message: "api.quotes.historyFetchError",
      error: err.message,
    });
  }
};


// Get single quote by ID including services
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id, {
      include: [
        { model: QuoteService, as: 'services' },
             { model: Status, as: "status" },
              {
          model: Currency,     // ✅ Include the quote's own currency
          as: 'currency',
          attributes: ['id', 'name', 'code', 'symbol'],
        }
      ],
    });

    if (!quote) {
     return res.status(404).json({ message: 'api.quotes.notFound' });
    }

    res.status(200).json({ message: 'api.quotes.fetchSuccess', quotes });
  } catch (err) {
    res.status(500).json({ message: 'api.quotes.fetchError', error: err.message });
  }
};

// Create a new quote with services
exports.createQuote = async (req, res) => {
  try {
    const {
      userId,
      leadId,
      pricingTemplateId,
      title,
      description,
      validDays,
      overallDiscount,
      terms,
      total,
      sendSection,
      services,
      currencyId
    } = req.body;

    if (!userId || !leadId || !title) {
      return res.status(400).json({ message: 'api.quotes.requiredFields' });
    }

    const cleanOverallDiscount = overallDiscount && overallDiscount < 0 ? 0 : overallDiscount;
    const cleanSendSection = ['sms', 'email', 'both'].includes(sendSection) ? sendSection : 'both';
    const cleanPricingTemplateId = pricingTemplateId ? Number(pricingTemplateId) : null;
    // Remove emailTemplateId processing if no longer used
    // const cleanEmailTemplateId = emailTemplateId ? Number(emailTemplateId) : null;

    const quote = await Quote.create({
      userId,
      leadId,
      pricingTemplateId: cleanPricingTemplateId,
      title,
      description,
      validDays,
      overallDiscount: cleanOverallDiscount,
      terms,
      total,
      sendSection: cleanSendSection,
      currencyId
    });

    if (Array.isArray(services) && services.length > 0) {
      const servicesWithQuoteId = services.map(({ id, quoteId, discountPercent, ...service }) => ({
        ...service,
        discount: discountPercent || 0, // map discountPercent to discount column
        quoteId: quote.id,
      }));

      await QuoteService.bulkCreate(servicesWithQuoteId);
    }
    const quotes = await Quote.findByPk(quote.id, {
      include: [
        { model: QuoteService, as: 'services' },
      ],
    });

    res.status(201).json({ message: 'api.quotes.createSuccess',quotes });
  } catch (err) {
    res.status(500).json({ message: 'api.quotes.createError', error: err.message });
  }
};

// Update a quote and its services
exports.updateQuote = async (req, res) => {
  try {
    const quoteId = req.params.id;
    const {
      pricingTemplateId,
      title,
      description,
      validDays,
      overallDiscount,
      terms,
      total,
      statusId,
      sendSection,
      services,
    } = req.body;

    const quote = await Quote.findByPk(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'api.quotes.notFound' });
    }

    const cleanOverallDiscount = overallDiscount && overallDiscount < 0 ? 0 : overallDiscount;
    const cleanSendSection = ['sms', 'email', 'both'].includes(sendSection) ? sendSection : 'both';

    // updateData object banayenge
    const updateData = {
      title,
      description,
      validDays,
      overallDiscount: cleanOverallDiscount,
      terms,
      total,
      statusId,
      sendSection: cleanSendSection,
    };

    // 👇 Sirf tab add kare jab pricingTemplateId bheja gaya ho
    if (pricingTemplateId !== undefined && pricingTemplateId !== '') {
      updateData.pricingTemplateId = Number(pricingTemplateId);
    }

    await quote.update(updateData);

    if (Array.isArray(services)) {
      await QuoteService.destroy({ where: { quoteId } });
      const servicesWithQuoteId = services.map(({ id, quoteId: qId, ...service }) => ({
        ...service,
        quoteId,
      }));
      await QuoteService.bulkCreate(servicesWithQuoteId);
    }

    const updatedQuote = await Quote.findByPk(quoteId, {
      include: [
        { model: QuoteService, as: 'services' },
        { model: Status, as: "status" }
      ],
    });

    res.status(200).json({ message: 'api.quotes.updateSuccess', updatedQuote });
  } catch (err) {
    res.status(500).json({ message: 'Error updating quote', error: err.message });
  }
};


// Delete a quote and its services
exports.deleteQuote = async (req, res) => {
  try {
    const quoteId = req.params.id;

    const quote = await Quote.findByPk(quoteId);
    if (!quote) {
     return res.status(404).json({ message: 'api.quotes.notFound' });
    }

    // Delete related services
    await QuoteService.destroy({ where: { quoteId } });

    // Delete related sent emails
    await SendEmail.destroy({ where: { quoteId } });

    // Delete related sent SMS
    await SendSms.destroy({ where: { quoteId } });

    // Finally delete the quote
    await quote.destroy();

    res.status(200).json({ message: 'api.quotes.deleteSuccess' });
  } catch (err) {
    res.status(500).json({
      message: 'api.quotes.deleteError',
      error: err.message
    });
  }
};

