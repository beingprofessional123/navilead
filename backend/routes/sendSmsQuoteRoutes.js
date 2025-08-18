const express = require('express');
const router = express.Router();
const sendSmsQuoteController = require('../controllers/sendSmsQuoteController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware here
router.use(authMiddleware);

// POST send SMS quote
router.post('/', sendSmsQuoteController.storeSendSmsQuote);

module.exports = router;
