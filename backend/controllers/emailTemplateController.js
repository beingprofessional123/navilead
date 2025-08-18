const db = require('../models');
const { EmailTemplate } = db;

// GET all email templates for logged-in user
exports.getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
};

// GET single email template by ID
exports.getEmailTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
};

// POST create a new email template
exports.createEmailTemplate = async (req, res) => {
  const {
    templateName,
    recipientEmail,
    subject,
    ccEmails,
    emailContent,
  } = req.body;

  try {
    const template = await EmailTemplate.create({
      userId: req.user.id,
      templateName,
      recipientEmail,
      subject,
      ccEmails,
      emailContent,
    });

    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create email template' });
  }
};

// PUT update an existing email template
exports.updateEmailTemplate = async (req, res) => {
  const {
    templateName,
    recipientEmail,
    subject,
    ccEmails,
    emailContent,
  } = req.body;

  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    await template.update({
      templateName,
      recipientEmail,
      subject,
      ccEmails,
      emailContent,
    });

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update email template' });
  }
};

// DELETE email template by ID
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Email template not found' });
    }

    await template.destroy();

    res.json({ message: 'Email template deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete email template' });
  }
};
