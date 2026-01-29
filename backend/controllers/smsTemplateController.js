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
    res.status(500).json({ error: 'api.smsTemplates.fetchError' });
  }
};

// GET single SMS template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await SmsTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'api.smsTemplates.notFound' });
    }

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.smsTemplates.fetchByIdError' });
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
    res.status(500).json({ error: 'api.smsTemplates.createError' });
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
      return res.status(404).json({ error: 'api.smsTemplates.notFound' });
    }

    await template.update({
      templateName,
      recipientPhone,
      smsContent,
    });

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.smsTemplates.updateError' });
  }
};

// DELETE SMS template by ID
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await SmsTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'api.smsTemplates.notFound' });
    }

    await template.destroy();

    res.json({ message: 'api.smsTemplates.deleteSuccess' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.smsTemplates.deleteError' });
  }
};

exports.makeDefaultTemplate = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 🔍 Find current default (if any)
    const existingDefault = await SmsTemplate.findOne({
      where: {
        userId,
        isDefault: true,
      },
    });

    // 🟢 CASE 1: Same template already default
    if (existingDefault && existingDefault.id === Number(id)) {
      return res.json({
        message: 'This sms template is already the default',
      });
    }

    // 🟡 CASE 2: Another template is default → remove it
    if (existingDefault && existingDefault.id !== Number(id)) {
      await SmsTemplate.update(
        { isDefault: false },
        { where: { id: existingDefault.id, userId } }
      );
    }

    // 🟢 CASE 3: Make selected template default
    const updated = await SmsTemplate.update(
      { isDefault: true },
      { where: { id, userId } }
    );

    if (updated[0] === 0) {
      return res.status(404).json({
        message: 'Template not found',
      });
    }

    return res.json({
      message: 'Template marked as default successfully',
    });

  } catch (error) {
    console.error('makeDefaultTemplate error:', error);
    return res.status(500).json({
      message: 'Failed to set default template',
    });
  }
};
