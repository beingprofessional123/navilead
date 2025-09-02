const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all integration routes with authentication
router.use(authMiddleware);

// GET /api/integrations/rate-Limits - Fetch user's API usage limits
router.get('/rate-Limits', integrationController.getRateLimits);

module.exports = router;
