const express = require('express');
const router = express.Router();
const sendEmailQuoteController = require('../controllers/sendEmailQuoteController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware here
router.use(authMiddleware);

router.post('/', sendEmailQuoteController.storeSendEmailQuote);

module.exports = router;
