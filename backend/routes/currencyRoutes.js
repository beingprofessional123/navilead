const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all currency routes with authentication
router.use(authMiddleware);

// GET /api/currencies - Get all currencies
router.get('/', currencyController.getCurrencies);

module.exports = router;
