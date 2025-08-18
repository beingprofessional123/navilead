const db = require('../models');
const { SmsTemplate } = db;

// GET all SMS templates for logged-in user
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await SmsTemplate.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch SMS templates' });
  }
};

// GET single SMS template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await SmsTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'SMS template not found' });
    }

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch SMS template' });
  }
};

// POST create a new SMS template
exports.createTemplate = async (req, res) => {
  const {
    templateName,
    recipientPhone,
    smsContent,
  } = req.body;

  try {
    const template = await SmsTemplate.create({
      userId: req.user.id,
      templateName,
      recipientPhone,
      smsContent,
    });

    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create SMS template' });
  }
};

// PUT update an existing SMS template
exports.updateTemplate = async (req, res) => {
  const {
    templateName,
    recipientPhone,
    smsContent,
  } = req.body;

  try {
    const template = await SmsTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'SMS template not found' });
    }

    await template.update({
      templateName,
      recipientPhone,
      smsContent,
    });

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update SMS template' });
  }
};

// DELETE SMS template by ID
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await SmsTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'SMS template not found' });
    }

    await template.destroy();

    res.json({ message: 'SMS template deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete SMS template' });
  }
};
