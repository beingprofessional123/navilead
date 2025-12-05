const {
  UserPlan,
  Plan,
  Lead,
  SendSms,
  EmailTemplate,
  SendEmail,
  Quote,
  OfferTemplate,
  PricingTemplate,
  Workflow,
} = require("../models");
const { Op } = require("sequelize");

// ✅ Helper: compute current cycle
const getCurrentCycle = (planData) => {
  const now = new Date();
  const startDate = new Date(planData.startDate);
  const renewalDate = planData.renewalDate ? new Date(planData.renewalDate) : null;

  // 🟡 Monthly plan
  if (planData.plan.billing_type === "monthly") {
    const cycleStart = startDate;
    const cycleEnd = planData.renewalDate
      ? new Date(planData.renewalDate)
      : planData.endDate
        ? new Date(planData.endDate)
        : null;
    const remainingDays = Math.max(0, Math.ceil((cycleEnd - now) / (1000 * 60 * 60 * 24)));
    return { start: cycleStart, end: cycleEnd, remainingDays, label: "Monthly" };
  }

  // 🔵 Yearly plan → monthly sub-cycle reset
  if (planData.plan.billing_type === "yearly") {
    const yearlyStart = new Date(planData.startDate);

    // ✅ Renewal date is the anchor (if available), otherwise use endDate or fallback to start
    const anchorDate = planData.renewalDate
      ? new Date(planData.renewalDate)
      : planData.endDate
        ? new Date(planData.endDate)
        : new Date(yearlyStart);

    let currentCycleStart = new Date(yearlyStart);
    let currentCycleEnd = new Date(currentCycleStart);
    currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);

    const yearlyEnd = new Date(yearlyStart);
    yearlyEnd.setFullYear(yearlyStart.getFullYear() + 1);

    // 🔁 Iterate monthly until we reach the current cycle
    while (now >= currentCycleEnd && currentCycleEnd < yearlyEnd) {
      currentCycleStart = new Date(currentCycleEnd);
      currentCycleEnd = new Date(currentCycleStart);
      currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);
    }

    const remainingDays = Math.max(
      0,
      Math.ceil((currentCycleEnd - now) / (1000 * 60 * 60 * 24))
    );

    return {
      start: currentCycleStart,
      end: currentCycleEnd,
      remainingDays,
      label: "Yearly (Monthly reset)",
    };
  }

  return null;
};

// ✅ Middleware
const planValidation = (type) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const userPlan = await UserPlan.findOne({
        where: { userId },
        include: { model: Plan, as: "plan" },
      });

      if (!userPlan || !userPlan.plan) {
        return res.status(403).json({ success: false, message: "User plan not found." });
      }

      const plan = userPlan.plan;
      const cycle = getCurrentCycle(userPlan);

      // Plan feature mapping
      const planKeysMap = {
        Leads: "Total_Leads_Allowed",
        SMS_Templates: "Total_SMS_Templates_Allowed",
        Emails: "Total_emails_allowed",
        Email_Templates: "Total_email_templates_allowed",
        Offers: "Total_offers_Allowed",
        Offers_Templates: "Total_offers_Templates_Allowed",
        Pricing_Templates: "Total_pricing_Templates_Allowed",
        Workflows: "Total_workflows_Allowed",
      };

      const totalAllowedKey = planKeysMap[type];
      if (!totalAllowedKey) {
        return res.status(400).json({ success: false, message: "Invalid plan type." });
      }

      const totalAllowed = plan[totalAllowedKey] ?? 0;
      if (totalAllowed === 0) return next();

      const whereCondition = { userId };

      // Apply cycle date filter (for Monthly, Yearly)
      if (cycle?.start && cycle?.end) {
        whereCondition.createdAt = { [Op.between]: [cycle.start, cycle.end] };
      }

      let currentUsage = 0;
      switch (type) {
        case "Leads":
          currentUsage = await Lead.count({ where: whereCondition });
          break;
        case "Emails":
          currentUsage = await SendEmail.count({ where: whereCondition });
          break;
        case "SMS_Templates":
          currentUsage = await SendSms.count({ where: whereCondition });
          break;
        case "Email_Templates":
          currentUsage = await EmailTemplate.count({ where: whereCondition });
          break;
        case "Offers":
          currentUsage = await Quote.count({ where: whereCondition });
          break;
        case "Offers_Templates":
          currentUsage = await OfferTemplate.count({ where: whereCondition });
          break;
        case "Pricing_Templates":
          currentUsage = await PricingTemplate.count({ where: whereCondition });
          break;
        case "Workflows":
          currentUsage = await Workflow.count({ where: whereCondition });
          break;
      }

      if (currentUsage >= totalAllowed) {
        return res.status(400).json({
          success: false,
          message: `${type} limit exceeded (${currentUsage}/${totalAllowed}) — please wait until your next ${cycle?.label || "cycle"}.`,
          cycle,
        });
      }


      next();
    } catch (err) {
      console.error("Plan validation error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error during plan validation.",
      });
    }
  };
};

module.exports = planValidation;
