const { Plan } = require('../models');
const stripe = require('../utils/stripe');

// GET all plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE plan (DB + Stripe if not free)
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      shortdescription,
      description,
      price,
      billing_type,
      discount_percentage,
      api_access,
      total_leads_allowed,
      total_offers_allowed,
      total_emails_allowed,
      total_sms_allowed,
      total_email_templates_allowed,
      total_sms_templates_allowed,
      total_pricing_templates_allowed,
      total_workflows_allowed,
      is_offer_page_customization_allowed,
      status
    } = req.body;

    let stripeProductId = null;
    let stripePriceId = null;

    if (billing_type !== 'free') {
    // Map billing_type to Stripe interval
    let stripeInterval;
    if (billing_type === 'monthly') stripeInterval = 'month';
    else if (billing_type === 'yearly') stripeInterval = 'year';

    // Create Stripe Product
    const stripeProduct = await stripe.products.create({ name, description });

    // Create Stripe Price in DKK
    const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(price * 100), // Stripe uses smallest currency unit (øre)
        currency: 'dkk', // <-- Danish Krone
        recurring: stripeInterval ? { interval: stripeInterval } : undefined
    });

    stripeProductId = stripeProduct.id;
    stripePriceId = stripePrice.id;
    }


    const plan = await Plan.create({
      name,
      shortdescription,
      description,
      price,
      discount_percentage,
      billing_type,
      api_access,
      total_leads_allowed,
      total_offers_allowed,
      total_emails_allowed,
      total_sms_allowed,
      total_email_templates_allowed,
      total_sms_templates_allowed,
      total_pricing_templates_allowed,
      total_workflows_allowed,
      is_offer_page_customization_allowed,
      status: status || 'active',
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE plan (DB + Stripe if not free)
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const {
      name,
      shortdescription,
      description,
      price,
      billing_type,
      discount_percentage,
      api_access,
      total_leads_allowed,
      total_offers_allowed,
      total_emails_allowed,
      total_sms_allowed,
      total_email_templates_allowed,
      total_sms_templates_allowed,
      total_pricing_templates_allowed,
      total_workflows_allowed,
      is_offer_page_customization_allowed,
      status
    } = req.body;

    if (billing_type !== 'free' && plan.billing_type !== 'free') {
      // Update Stripe Product
      if (plan.stripe_product_id) {
        await stripe.products.update(plan.stripe_product_id, { name, description });
      }

      // Update Stripe Price
      if (plan.stripe_price_id) {
        await stripe.prices.update(plan.stripe_price_id, { active: false });

        const newStripePrice = await stripe.prices.create({
          product: plan.stripe_product_id,
          unit_amount: Math.round(price * 100),
          currency: 'usd',
          recurring: billing_type === 'monthly' || billing_type === 'yearly' ? { interval: billing_type } : undefined
        });

        req.body.stripe_price_id = newStripePrice.id;
      }
    }

    await plan.update({
      name,
      shortdescription,
      description,
      price,
      discount_percentage,
      billing_type,
      api_access,
      total_leads_allowed,
      total_offers_allowed,
      total_emails_allowed,
      total_sms_allowed,
      total_email_templates_allowed,
      total_sms_templates_allowed,
      total_pricing_templates_allowed,
      total_workflows_allowed,
      is_offer_page_customization_allowed,
      status: status || plan.status,
      stripe_price_id: req.body.stripe_price_id || plan.stripe_price_id
    });

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE plan (soft delete: set inactive for free / archive Stripe for paid)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    if (plan.billing_type !== 'free' && plan.stripe_product_id) {
      await stripe.products.update(plan.stripe_product_id, { active: false });
    }

    // Soft delete by setting status inactive
    await plan.update({ status: 'inactive' });

    res.json({ message: 'Plan set to inactive successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
