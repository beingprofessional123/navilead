const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/admin/settingsController');
const authMiddleware = require("../../middleware/authMiddleware");
// Apply global middleware to all routes in this router
router.use(authMiddleware); // Ensures only authenticated users can access settings routes


// Main settings routes
router.route('/')
  .get(settingsController.getSettings) // GET request to fetch all settings
  .put(settingsController.updateGeneralSettings); // PUT request to update all general and notification settings

router.put("/change-password", settingsController.changePassword);

// Corporate branding routes
router.post('/upload-logo', settingsController.uploadMiddleware, settingsController.uploadLogo);
router.delete('/remove-logo', settingsController.removeLogo);

// User management routes
router.put("/language", settingsController.updateLanguage);
module.exports = router;