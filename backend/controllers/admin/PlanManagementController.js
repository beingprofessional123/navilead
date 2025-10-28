const { Plan } = require('../../models');
const stripe = require('../../utils/stripe'); // your stripe.js

// Helper to convert description array to comma-separated string
const formatDescription = (desc) => {
  if (!desc) return null;
  if (Array.isArray(desc)) return desc.join(', ');
  if (typeof desc === 'string') return desc; // already a string
  return null;
};

// Map billing_type to Stripe intervals
const getStripeInterval = (billing_type) => {
  switch (billing_type) {
    case 'monthly':
      return 'month';
    case 'yearly':
      return 'year';
    default:
      return null; // free plans or invalid types
  }
};

// Create Stripe product and price
const createStripeProductAndPrice = async ({ name, description, price, billing_type }) => {
  try {
    const stripeProduct = await stripe.products.create({
      name,
      description: description || undefined,
    });

    let stripePrice = null;
    const interval = getStripeInterval(billing_type);
    if (interval) {
      stripePrice = await stripe.prices.create({
        unit_amount: Math.round((price || 0) * 100),
        currency: 'dkk',
        recurring: { interval },
        product: stripeProduct.id,
      });
    }

    return {
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice ? stripePrice.id : null,
    };
  } catch (error) {
    console.error('❌ Stripe creation error:', error);
    throw new Error(error.message);
  }
};

// Update Stripe product and price
const updateStripeProductAndPrice = async (plan, { name, description, price, billing_type }) => {
  try {
    if (plan.stripe_product_id) {
      await stripe.products.update(plan.stripe_product_id, { name, description });
    }

    let stripePriceId = plan.stripe_price_id;
    const interval = getStripeInterval(billing_type);
    if (price !== undefined && interval) {
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round((price || 0) * 100),
        currency: 'dkk',
        recurring: { interval },
        product: plan.stripe_product_id,
      });
      stripePriceId = stripePrice.id;
    }

    return stripePriceId;
  } catch (error) {
    console.error('❌ Stripe update error:', error);
    throw new Error(error.message);
  }
};

// Delete (deactivate) Stripe product
const deleteStripeProduct = async (stripe_product_id) => {
  try {
    if (stripe_product_id) {
      await stripe.products.update(stripe_product_id, { active: false });
    }
  } catch (error) {
    console.error('❌ Stripe delete error:', error);
    throw new Error(error.message);
  }
};

const PlanManagementController = {

  // GET all plans
  getAllPlans: async (req, res) => {
    try {
      const plans = await Plan.findAll({ order: [['createdAt', 'DESC']] });
      res.status(200).json({ success: true, plans });
    } catch (error) {
      console.error('❌ Error fetching plans:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // CREATE new plan
  createUser: async (req, res) => {
    try {
      const {
        name,
        shortdescription,
        description,
        price,
        discount_percentage,
        billing_type,
        api_access,
        Total_Leads_Allowed,
        Total_offers_Allowed,
        Total_offers_Templates_Allowed,
        Total_emails_allowed,
        Total_SMS_allowed,
        Total_email_templates_allowed,
        Total_SMS_Templates_Allowed,
        Total_pricing_Templates_Allowed,
        Total_workflows_Allowed,
        is_offerPage_customization_allowed,
        status
      } = req.body;

      if (!name) return res.status(400).json({ success: false, message: 'Plan name is required' });

      const { stripe_product_id, stripe_price_id } = await createStripeProductAndPrice({
        name,
        description: formatDescription(description),
        price,
        billing_type,
      });

      const newPlan = await Plan.create({
        name,
        shortdescription,
        description: formatDescription(description),
        price: price || 0,
        discount_percentage: discount_percentage || 0,
        billing_type: billing_type || 'free',
        api_access: api_access || false,
        Total_Leads_Allowed: Total_Leads_Allowed || 0,
        Total_offers_Allowed: Total_offers_Allowed || 0,
        Total_offers_Templates_Allowed: Total_offers_Templates_Allowed || 0,
        Total_emails_allowed: Total_emails_allowed || 0,
        Total_SMS_allowed: Total_SMS_allowed || 0,
        Total_email_templates_allowed: Total_email_templates_allowed || 0,
        Total_SMS_Templates_Allowed: Total_SMS_Templates_Allowed || 0,
        Total_pricing_Templates_Allowed: Total_pricing_Templates_Allowed || 0,
        Total_workflows_Allowed: Total_workflows_Allowed || 0,
        is_offerPage_customization_allowed: is_offerPage_customization_allowed || false,
        stripe_product_id,
        stripe_price_id,
        status: status || 'active'
      });

      res.status(201).json({ success: true, plan: newPlan });
    } catch (error) {
      console.error('❌ Error creating plan:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  // UPDATE plan
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await Plan.findByPk(id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

      const {
        name,
        shortdescription,
        description,
        price,
        discount_percentage,
        billing_type,
        api_access,
        Total_Leads_Allowed,
        Total_offers_Allowed,
        Total_offers_Templates_Allowed,
        Total_emails_allowed,
        Total_SMS_allowed,
        Total_email_templates_allowed,
        Total_SMS_Templates_Allowed,
        Total_pricing_Templates_Allowed,
        Total_workflows_Allowed,
        is_offerPage_customization_allowed,
        status
      } = req.body;

      let stripe_price_id = plan.stripe_price_id;

      // Update Stripe if relevant fields change
      if (
        name !== plan.name ||
        description !== plan.description ||
        price !== plan.price ||
        billing_type !== plan.billing_type
      ) {
        stripe_price_id = await updateStripeProductAndPrice(plan, {
          name: name ?? plan.name,
          description: description ?? plan.description,
          price: price ?? plan.price,
          billing_type: billing_type ?? plan.billing_type,
        });
      }

      await plan.update({
        name: name ?? plan.name,
        shortdescription: shortdescription ?? plan.shortdescription,
        description: description ? formatDescription(description) : plan.description,
        price: price ?? plan.price,
        discount_percentage: discount_percentage ?? plan.discount_percentage,
        billing_type: billing_type ?? plan.billing_type,
        api_access: api_access ?? plan.api_access,
        Total_Leads_Allowed: Total_Leads_Allowed ?? plan.Total_Leads_Allowed,
        Total_offers_Allowed: Total_offers_Allowed ?? plan.Total_offers_Allowed,
        Total_offers_Templates_Allowed: Total_offers_Templates_Allowed ?? plan.Total_offers_Templates_Allowed,
        Total_emails_allowed: Total_emails_allowed ?? plan.Total_emails_allowed,
        Total_SMS_allowed: Total_SMS_allowed ?? plan.Total_SMS_allowed,
        Total_email_templates_allowed: Total_email_templates_allowed ?? plan.Total_email_templates_allowed,
        Total_SMS_Templates_Allowed: Total_SMS_Templates_Allowed ?? plan.Total_SMS_Templates_Allowed,
        Total_pricing_Templates_Allowed: Total_pricing_Templates_Allowed ?? plan.Total_pricing_Templates_Allowed,
        Total_workflows_Allowed: Total_workflows_Allowed ?? plan.Total_workflows_Allowed,
        is_offerPage_customization_allowed: is_offerPage_customization_allowed ?? plan.is_offerPage_customization_allowed,
        stripe_product_id: plan.stripe_product_id,
        stripe_price_id,
        status: status ?? plan.status,
      });

      res.status(200).json({ success: true, plan });
    } catch (error) {
      console.error('❌ Error updating plan:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

 // DELETE plan (soft delete)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await Plan.findByPk(id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

      // Soft delete: mark as inactive
      await plan.update({ status: 'inactive' });

      // Optionally, deactivate in Stripe
      if (plan.stripe_product_id) {
        await deleteStripeProduct(plan.stripe_product_id);
      }

      res.status(200).json({ success: true, message: 'Plan marked as inactive successfully', plan });
    } catch (error) {
      console.error('❌ Error deleting plan:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },


  // UPDATE plan status
  updatePlanStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const plan = await Plan.findByPk(id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

      plan.status = status;
      await plan.save();

      res.status(200).json({ success: true, message: `Plan status updated to ${status}`, plan });
    } catch (error) {
      console.error('❌ Error updating plan status:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }

};

module.exports = PlanManagementController;
