const express = require('express');
const router = express.Router();

const emailTemplateController = require('../controllers/emailTemplateController');
const authenticate = require('../middleware/authMiddleware');
const planValidation = require('../middleware/planValidationMiddleware');


router.use(authenticate);

// Get all email templates
router.get('/', emailTemplateController.getEmailTemplates);

// Get a single email template by id
router.get('/:id', emailTemplateController.getEmailTemplateById);

// Create a new email template with attachment support
// The 'upload.array('attachments')' middleware will process files uploaded under the 'attachments' field.
router.post('/',planValidation('Email_Templates'),  emailTemplateController.upload.array('attachments'), emailTemplateController.createEmailTemplate);

// Update an existing email template by id with attachment support
// The 'upload.array('attachments')' middleware will process new files for update.
router.put('/:id', emailTemplateController.upload.array('attachments'), emailTemplateController.updateEmailTemplate);

// Delete an email template by id
router.delete('/:id', emailTemplateController.deleteEmailTemplate);

module.exports = router;
