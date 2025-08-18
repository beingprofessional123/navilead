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
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch templates' });
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

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create template' });
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

    if (!template) return res.status(404).json({ error: 'Template not found' });

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// PUT update template
exports.updateTemplate = async (req, res) => {
  const { name, title, description, choiceType, terms, currencyId, services } = req.body;

  try {
    const template = await PricingTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

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

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// DELETE template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await PricingTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    await template.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
