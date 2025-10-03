const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authenticate = require('../middleware/authMiddleware');

// Protect all routes
router.use(authenticate);

// CRUD routes for plans
router.get('/', planController.getPlans);          // Fetch all plans
router.get('/:id', planController.getPlanById);   // Fetch a single plan
router.post('/', planController.createPlan);      // Create a new plan
router.put('/:id', planController.updatePlan);    // Update a plan
router.delete('/:id', planController.deletePlan); // Delete a plan

module.exports = router;
