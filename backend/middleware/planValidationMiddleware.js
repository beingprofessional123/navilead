const { UserPlan, Plan, Lead, SendSms, EmailTemplate, SendEmail, Quote, OfferTemplate, PricingTemplate, Workflow } = require('../models');

const planValidation = (type) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get active UserPlan with plan details
      const userPlan = await UserPlan.findOne({
        where: { userId, status: 'active' },
        include: { model: Plan, as: 'plan' }
      });

      if (!userPlan || !userPlan.plan) {
        return res.status(403).json({ success: false, message: 'User plan not found.' });
      }

      const plan = userPlan.plan;

      // Map feature type to plan key
      const planKeysMap = {
        Leads: "Total_Leads_Allowed",
        SMS_Templates: "Total_SMS_Templates_Allowed",
        SMS: "Total_SMS_allowed",
        Emails: "Total_emails_allowed",
        Email_Templates: "Total_email_templates_allowed",
        Offers: "Total_offers_Allowed",
        Offers_Templates: "Total_offers_Templates_Allowed",
        Pricing_Templates: "Total_pricing_Templates_Allowed",
        Workflows: "Total_workflows_Allowed",
      };

      const totalAllowedKey = planKeysMap[type];
      if (!totalAllowedKey) {
        return res.status(400).json({ success: false, message: 'Invalid plan type.' });
      }

      const totalAllowed = plan[totalAllowedKey] ?? 0;

      // Calculate current usage for countable features
      let currentUsage = 0;
      switch (type) {
        case "Leads":
          currentUsage = await Lead.count({ where: { userId } });
          break;
        case "SMS":
          currentUsage = await SendSms.count({ where: { userId } });
          break;
        case "Emails":
          currentUsage = await SendEmail.count({ where: { userId } });
          break;
        case "SMS_Templates":
          currentUsage = await SendSms.count({ where: { userId } });
          break;
        case "Email_Templates":
          currentUsage = await EmailTemplate.count({ where: { userId } });
          break;
        case "Offers":
          currentUsage = await Quote.count({ where: { userId } });
          break;
        case "Offers_Templates":
          currentUsage = await OfferTemplate.count({ where: { userId } });
          break;
        case "Pricing_Templates":
          currentUsage = await PricingTemplate.count({ where: { userId } });
          break;
        case "Workflows":
          currentUsage = await Workflow.count({ where: { userId } });
          break;
      }

      // Limit check for countable features
      if (["Leads","SMS","Emails","SMS_Templates","Email_Templates","Offers","Offers_Templates","Pricing_Templates","Workflows"].includes(type) &&
          currentUsage >= totalAllowed) {
        return res.status(400).json({
          success: false,
          message: `${type} limit exceeded (${currentUsage}/${totalAllowed})`
        });
      }

      next();
    } catch (err) {
      console.error('Plan validation error:', err);
      return res.status(500).json({ success: false, message: 'Server error during plan validation.' });
    }
  };
};

module.exports = planValidation;
