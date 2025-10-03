const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const authenticate = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticate);

// Routes for payment methods
router.get('/', paymentMethodController.getPaymentMethods);          // Fetch all payment methods for the authenticated user
router.post('/', paymentMethodController.createPaymentMethod);      // Create a new payment method
router.put('/:id', paymentMethodController.updatePaymentMethod);    // Update a payment method

module.exports = router;
