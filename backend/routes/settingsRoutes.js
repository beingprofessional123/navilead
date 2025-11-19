const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticate = require('../middleware/authMiddleware');

// Apply global middleware to all routes in this router
router.use(authenticate); // Ensures only authenticated users can access settings routes


// Main settings routes
router.route('/')
  .get(settingsController.getSettings) // GET request to fetch all settings
  .put(settingsController.updateGeneralSettings); // PUT request to update all general and notification settings

  // Notifications route
router.put('/notifications', settingsController.updateNotifications); // PUT request to update email/sms notifications


// Corporate branding routes
router.post('/upload-logo', settingsController.uploadMiddleware, settingsController.uploadLogo);
router.delete('/remove-logo', settingsController.removeLogo);

// User management routes
router.post('/invite-user', settingsController.inviteUser);
router.put("/language", settingsController.updateLanguage);

router.put("/smtp", settingsController.updateSmtpSettings);

module.exports = router;