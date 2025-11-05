import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";


const LimitContext = createContext();

export const useLimit = () => useContext(LimitContext);

export const LimitProvider = ({ children }) => {
  const { authToken } = useContext(AuthContext);
  const [userPlan, setUserPlan] = useState(null);
  const [isLimitModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [currentLimit, setCurrentLimit] = useState({
    usage: 0,
    totalAllowed: 0,
    type: "",
    cycleStart: null,
    cycleEnd: null,
    remainingDays: 0,
  });

  const fetchUserPlan = async () => {
  try {
    const currentPath = window.location.pathname; // ✅ current route check

    const res = await api.get("/auth/user-current-plan", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (res.data.success && res.data.plan) {
      const userPlanData = res.data.plan;
      const now = new Date();
      const renewalDate = userPlanData.renewalDate ? new Date(userPlanData.renewalDate) : null;
      const endDate = userPlanData.endDate ? new Date(userPlanData.endDate) : null;
      const status = userPlanData.status;

      let allowAccess = false;

      // ✅ Active plan and renewal still valid
      if (status === "active" && renewalDate && now < renewalDate) {
        allowAccess = true;
      }
      // ✅ Cancelled but endDate not yet passed
      else if (status === "cancelled" && endDate && now <= endDate) {
        allowAccess = true;
      }
      // 🚫 Renewal date passed or expired
      else {
        allowAccess = false;
      }

      // ✅ Skip redirect if user is on /subscription/success
      if (allowAccess) {
        setUserPlan(userPlanData);
      } else if (currentPath === "/subscription/success") {
        setUserPlan(userPlanData || null); // no redirect on success page
      } else {
        toast.warning("Your subscription has expired or not renewed. Please choose a plan to continue.");
        setUserPlan(null);
        navigate("/plans");
      }
    } else {
      const currentPath = window.location.pathname;
      if (currentPath !== "/subscription/success") {
        toast.info("No active plan found. Please choose a plan to continue.");
        setUserPlan(null);
        navigate("/plans");
      }
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

  // ✅ Compute cycle for all plan types (Monthly reset)
  const getCurrentCycle = (planData) => {
    const now = new Date();
    const startDate = new Date(planData.startDate);
    const renewalDate = planData.renewalDate ? new Date(planData.renewalDate) : null;


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


  // ✅ Access guard (for use in components)
  const hasValidAccess = () => {
    if (!userPlan) return false;

    const now = new Date();
    const { status, endDate, renewalDate } = userPlan;
    const planEnd = endDate ? new Date(endDate) : null;
    const renewal = renewalDate ? new Date(renewalDate) : null;

    if (status === "active") return true;
    if (status === "cancelled" && planEnd && now <= planEnd) return true;
    if (renewal && now > renewal) return false;
    return false;
  };

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
        hasValidAccess,
      }}
    >
      {children}
    </LimitContext.Provider>
  );
};
