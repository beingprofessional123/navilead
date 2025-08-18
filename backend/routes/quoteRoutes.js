const express = require('express');
const router = express.Router();

const quoteController = require('../controllers/quoteController');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', quoteController.getQuotes);
router.get('/:id', quoteController.getQuoteById);
router.post('/', quoteController.createQuote);
router.put('/:id', quoteController.updateQuote);
router.delete('/:id', quoteController.deleteQuote);

module.exports = router;
