// utils/stripe.js
const Stripe = require("stripe");

// Only the secret key is needed for server-side operations
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
