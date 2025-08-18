const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');

// ✅ Public endpoint to get offer by Quote ID
router.get('/:quoteId', offerController.getOfferByQuoteId);
router.put('/accept-offer', offerController.acceptOffer);
router.post('/asked-question', offerController.askedQuestion);
module.exports = router;
