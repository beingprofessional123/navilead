const db = require('../models');
const { PricingTemplate, PricingTemplateService, Currency } = db;

// GET all templates for logged-in user
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await PricingTemplate.findAll({
      where: { userId: req.user.id },
      include: [
        { model: PricingTemplateService, as: 'services' },
        { model: Currency, as: 'currency' },
      ],
    });
    res.json(templates); // Successfully fetched templates, no specific success message needed here traditionally
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.pricingTemplates.fetchError' });
  }
};

// POST create new template
exports.createTemplate = async (req, res) => {
  const { name, title, description, choiceType, terms, currencyId, services } = req.body;

  try {
    const template = await PricingTemplate.create({
      userId: req.user.id,
      name,
      title,
      description,
      choiceType,
      terms,
      currencyId: parseInt(currencyId),
    });

    if (services?.length > 0) {
      const servicesWithTemplateId = services.map(service => ({
        pricingTemplateId: template.id,
        name: service.name,
        description: service.description || '',
        price: parseFloat(service.price) || 0,
        quantity: parseInt(service.quantity) || 1,
        isRequired: service.isRequired === true || service.isRequired === 'true',
      }));
      await PricingTemplateService.bulkCreate(servicesWithTemplateId);
    }

    const result = await PricingTemplate.findByPk(template.id, {
      include: [
        { model: PricingTemplateService, as: 'services' },
        { model: Currency, as: 'currency' },
      ],
    });

    res.status(201).json({ message: 'api.pricingTemplates.createSuccess', template: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.pricingTemplates.createError' });
  }
};

// GET template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await PricingTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: PricingTemplateService, as: 'services' },
        { model: Currency, as: 'currency' },
      ],
    });

    if (!template) {
        return res.status(404).json({ error: 'api.pricingTemplates.notFound' });
    }

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.pricingTemplates.fetchByIdError' });
  }
};

// PUT update template
exports.updateTemplate = async (req, res) => {
  const { name, title, description, choiceType, terms, currencyId, services } = req.body;

  try {
    const template = await PricingTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
        return res.status(404).json({ error: 'api.pricingTemplates.notFound' });
    }

    await template.update({
      name,
      title,
      description,
      choiceType,
      terms,
      currencyId: parseInt(currencyId),
    });

    // Remove all old services and add new ones
    await PricingTemplateService.destroy({ where: { pricingTemplateId: template.id } });

    if (services?.length > 0) {
      const servicesWithTemplateId = services.map(service => ({
        pricingTemplateId: template.id,
        name: service.name,
        description: service.description || '',
        price: parseFloat(service.price) || 0,
        quantity: parseInt(service.quantity) || 1,
        isRequired: service.isRequired === true || service.isRequired === 'true',
      }));
      await PricingTemplateService.bulkCreate(servicesWithTemplateId);
    }

    const updated = await PricingTemplate.findByPk(template.id, {
      include: [
        { model: PricingTemplateService, as: 'services' },
        { model: Currency, as: 'currency' },
      ],
    });

    res.json({ message: 'api.pricingTemplates.updateSuccess', template: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.pricingTemplates.updateError' });
  }
};

// DELETE template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await PricingTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
        return res.status(404).json({ error: 'api.pricingTemplates.notFound' });
    }

    await template.destroy();
    res.json({ message: 'api.pricingTemplates.deleteSuccess' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.pricingTemplates.deleteError' });
  }
};
