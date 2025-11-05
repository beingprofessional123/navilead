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

// CREATE plan (DB + Stripe)
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
      status,
    } = req.body;

    // Map billing_type to Stripe interval
    let stripeInterval;
    if (billing_type === 'monthly') stripeInterval = 'month';
    else if (billing_type === 'yearly') stripeInterval = 'year';

    // Create Stripe Product
    const stripeProduct = await stripe.products.create({ name, description });

    // Create Stripe Price (default currency DKK)
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100), // smallest unit
      currency: 'dkk',
      recurring: stripeInterval ? { interval: stripeInterval } : undefined,
    });

    // Create Plan in DB
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
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE plan (DB + Stripe)
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
      status,
    } = req.body;

    // Update Stripe Product
    if (plan.stripe_product_id) {
      await stripe.products.update(plan.stripe_product_id, { name, description });
    }

    // Deactivate old price and create a new one
    if (plan.stripe_price_id) {
      await stripe.prices.update(plan.stripe_price_id, { active: false });
    }

    const stripeInterval =
      billing_type === 'monthly'
        ? 'month'
        : billing_type === 'yearly'
        ? 'year'
        : undefined;

    const newStripePrice = await stripe.prices.create({
      product: plan.stripe_product_id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
      recurring: stripeInterval ? { interval: stripeInterval } : undefined,
    });

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
      stripe_price_id: newStripePrice.id,
    });

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE plan (soft delete + deactivate on Stripe)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    if (plan.stripe_product_id) {
      await stripe.products.update(plan.stripe_product_id, { active: false });
    }

    await plan.update({ status: 'inactive' });

    res.json({ message: 'Plan set to inactive successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
