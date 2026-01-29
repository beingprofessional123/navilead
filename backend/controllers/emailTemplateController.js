const db = require('../models');
const { EmailTemplate } = db;
const multer = require('multer'); // Import multer
const path = require('path');     // Import path for file handling

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });


const BACKEND_URL = process.env.BACKEND_URL;

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
    res.status(500).json({ error: 'api.emailTemplates.fetchError' });
  }
};

// GET single email template by ID
exports.getEmailTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'api.emailTemplates.notFound' });
    }

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.emailTemplates.fetchByIdError' });
  }
};

// POST create a new email template
// This function expects 'upload.array('attachments')' middleware to be run before it.
exports.createEmailTemplate = async (req, res) => {
  const {
    templateName,
    recipientEmail,
    subject,
    ccEmails,
    emailContent,
  } = req.body; // Regular fields come from req.body

  const attachments = req.files; // Files are available in req.files from multer

  try {
    // Process attachments to store relevant metadata
    const attachmentMetadata = attachments ? attachments.map(file => ({
      originalName: file.originalname,
      fileName: file.filename, // Name of the file on the server
      filePath: file.path,     // Full path to the stored file
      mimetype: file.mimetype,
      size: file.size,
      url: `${BACKEND_URL}/${file.path.replace(/\\/g, "/")}`
    })) : [];

    const template = await EmailTemplate.create({
      userId: req.user.id,
      templateName,
      recipientEmail,
      subject,
      ccEmails,
      emailContent,
      attachments: attachmentMetadata, // Store attachment metadata in the database
    });

    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.emailTemplates.createError' });
  }
};

// PUT update an existing email template
// This function also expects 'upload.array('attachments')' middleware to be run before it.
exports.updateEmailTemplate = async (req, res) => {
  const {
    templateName,
    recipientEmail,
    subject,
    ccEmails,
    emailContent,
    existingAttachments // Frontend might send info about existing attachments to keep
  } = req.body;

  const newAttachments = req.files; // New files uploaded

  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'api.emailTemplates.notFound' });
    }

    // Combine existing attachments (if any are kept) with new uploads
    let updatedAttachments = [];

    // If frontend sends an array of existing attachments to keep (e.g., as JSON string)
    if (existingAttachments) {
      // Ensure existingAttachments is parsed if it's a JSON string
      const parsedExisting = typeof existingAttachments === 'string'
        ? JSON.parse(existingAttachments)
        : existingAttachments;
      updatedAttachments = parsedExisting;
    }

    // Add metadata for newly uploaded files
    if (newAttachments && newAttachments.length > 0) {
      const newAttachmentMetadata = newAttachments.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        mimetype: file.mimetype,
        size: file.size,
      }));
      updatedAttachments = [...updatedAttachments, ...newAttachmentMetadata];
    }

    await template.update({
      templateName,
      recipientEmail,
      subject,
      ccEmails,
      emailContent,
      attachments: updatedAttachments, // Update with the new combined list
    });

    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.emailTemplates.updateError' });
  }
};

// DELETE email template by ID
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'api.emailTemplates.notFound' });
    }

    // TODO: In a real application, you should also delete the physical files
    // from 'uploads/email-attachments/' when the template or attachment is deleted.
    // Example: fs.unlink(template.attachments[i].filePath, (err) => { ... });

    await template.destroy();

    res.json({ message: 'api.emailTemplates.deleteSuccess' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'api.emailTemplates.deleteError' });
  }
};


exports.makeDefaultTemplate = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 🔍 Find current default (if any)
    const existingDefault = await EmailTemplate.findOne({
      where: {
        userId,
        isDefault: true,
      },
    });

    // 🟢 CASE 1: Same template already default
    if (existingDefault && existingDefault.id === Number(id)) {
      return res.json({
        message: 'This template is already the default',
      });
    }

    // 🟡 CASE 2: Another template is default → remove it
    if (existingDefault && existingDefault.id !== Number(id)) {
      await EmailTemplate.update(
        { isDefault: false },
        { where: { id: existingDefault.id, userId } }
      );
    }

    // 🟢 CASE 3: Make selected template default
    const updated = await EmailTemplate.update(
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



// Expose the upload middleware so it can be used in your route definitions
exports.upload = upload;
