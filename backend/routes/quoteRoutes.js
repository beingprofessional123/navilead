const express = require('express');
const router = express.Router();

const quoteController = require('../controllers/quoteController');
const authenticate = require('../middleware/authMiddleware');
const planValidation = require('../middleware/planValidationMiddleware');


router.use(authenticate);

router.get('/', quoteController.getQuotes);
router.get('/:id', quoteController.getQuoteById);
router.post('/', planValidation('Offers'), quoteController.createQuote);
router.put('/:id', quoteController.updateQuote);
router.delete('/:id', quoteController.deleteQuote);

module.exports = router;
