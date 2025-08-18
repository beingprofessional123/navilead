const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Get all statuses
router.get('/', statusController.getAllStatuses);

module.exports = router;