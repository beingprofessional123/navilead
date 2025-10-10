const express = require('express');
const router = express.Router();
const sendEmailQuoteController = require('../controllers/sendEmailQuoteController');
const authMiddleware = require('../middleware/authMiddleware');
const planValidation = require('../middleware/planValidationMiddleware');


// Apply auth middleware here
router.use(authMiddleware);

router.post('/', planValidation('Emails'), sendEmailQuoteController.storeSendEmailQuote);

module.exports = router;
