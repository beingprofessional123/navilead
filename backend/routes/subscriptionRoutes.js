const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

// Protect all subscription routes
router.use(authenticate);

// Create a Stripe subscription / assign plan
router.post('/checkout', subscriptionController.checkout);
router.post('/verify-session', authenticate, subscriptionController.verifySession);
router.post('/cancel-now', subscriptionController.cancelSubscription);



module.exports = router;
