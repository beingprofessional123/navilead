const express = require('express');
const router = express.Router();

const emailTemplateController = require('../controllers/emailTemplateController');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

// Get all email templates
router.get('/', emailTemplateController.getEmailTemplates);

// Get a single email template by id
router.get('/:id', emailTemplateController.getEmailTemplateById);

// Create a new email template
router.post('/', emailTemplateController.createEmailTemplate);

// Update an existing email template by id
router.put('/:id', emailTemplateController.updateEmailTemplate);

// Delete an email template by id
router.delete('/:id', emailTemplateController.deleteEmailTemplate);

module.exports = router;
