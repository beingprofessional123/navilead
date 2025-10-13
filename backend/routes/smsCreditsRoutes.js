const express = require('express');
const router = express.Router();
const smsCreditsController = require('../controllers/smsCreditsController');
const authMiddleware = require('../middleware/authMiddleware');


// All routes require authentication
router.use(authMiddleware);

// Get all SMS templates for the authenticated user
router.get('/planList', smsCreditsController.getAllPlanList);
router.get('/transactionHistoy', smsCreditsController.getAllTransactionHistoy);
router.get('/CurrentBalance', smsCreditsController.getAllCurrentBalance);

// ✅ New route for Stripe one-time payment
router.post('/create-checkout-session', smsCreditsController.createCheckoutSession);
router.post('/verify-session', smsCreditsController.verifySession);


module.exports = router;

