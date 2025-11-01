import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

const LimitContext = createContext();

export const useLimit = () => useContext(LimitContext);

export const LimitProvider = ({ children }) => {
  const { authToken } = useContext(AuthContext);
  const [userPlan, setUserPlan] = useState(null);
  const [isLimitModalOpen, setIsModalOpen] = useState(false);
  const [currentLimit, setCurrentLimit] = useState({
    usage: 0,
    totalAllowed: 0,
    type: "",
    cycleStart: null,
    cycleEnd: null,
    remainingDays: 0,
  });

  // ✅ Fetch user plan
  const fetchUserPlan = async () => {
    try {
      const res = await api.get("/auth/user-current-plan", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.data.success) {
        setUserPlan(res.data.plan);
      } else {
        toast.error("Failed to load plan details");
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
      toast.error("Error fetching plan details");
    }
  };

  useEffect(() => {
    if (authToken) fetchUserPlan();
  }, [authToken]);

  // ✅ Plan feature keys
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
    API: "api_access",
  };

  // ✅ Compute cycle for all plan types (Free → Monthly reset)
  const getCurrentCycle = (planData) => {
    const now = new Date();
    const startDate = new Date(planData.startDate);
    const renewalDate = planData.renewalDate ? new Date(planData.renewalDate) : null;

    // 🟢 Free plan → Monthly reset
    if (planData.plan.billing_type === "free") {
      const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const remainingDays = Math.ceil((cycleEnd - now) / (1000 * 60 * 60 * 24));
      return { start: cycleStart, end: cycleEnd, remainingDays, label: "Free (Monthly reset)" };
    }

    // 🟡 Monthly plan
    if (planData.plan.billing_type === "monthly") {
      const cycleStart = startDate;
      const cycleEnd = renewalDate;
      const remainingDays = Math.max(
        0,
        Math.ceil((cycleEnd - now) / (1000 * 60 * 60 * 24))
      );
      return { start: cycleStart, end: cycleEnd, remainingDays, label: "Monthly" };
    }

    // 🔵 Yearly plan → monthly sub-cycle reset
    if (planData.plan.billing_type === "yearly") {
      let currentCycleStart = new Date(startDate);
      let currentCycleEnd = new Date(startDate);
      currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);

      const yearlyEnd = new Date(startDate);
      yearlyEnd.setFullYear(startDate.getFullYear() + 1);

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

  // ✅ Check limit usage
  const checkLimit = (usage, type) => {
    if (!userPlan || !userPlan.plan) return true;

    const totalAllowedKey = planKeysMap[type];
    const totalAllowed = userPlan.plan[totalAllowedKey] ?? 0;

    if (totalAllowed === 0) return true;

    // Get current cycle
    const cycle = getCurrentCycle(userPlan);

    if (usage >= totalAllowed) {
      setCurrentLimit({
        usage,
        totalAllowed,
        type,
        cycleStart: cycle.start,
        cycleEnd: cycle.end,
        remainingDays: cycle.remainingDays,
      });
      setIsModalOpen(true);
      return false;
    }

    return true;
  };

  // ✅ Offer customization check
  const isOfferPageCustomizationAllowed = () => {
    if (!userPlan || !userPlan.plan) return false;
    return userPlan.plan.is_offerPage_customization_allowed === true;
  };

  const closeLimitModal = () => setIsModalOpen(false);

  return (
    <LimitContext.Provider
      value={{
        userPlan,
        isLimitModalOpen,
        currentLimit,
        checkLimit,
        closeLimitModal,
        refreshPlan: fetchUserPlan,
        isOfferPageCustomizationAllowed,
      }}
    >
      {children}
    </LimitContext.Provider>
  );
};
