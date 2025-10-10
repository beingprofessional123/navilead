import React, { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";

const LimitContext = createContext();

export const useLimit = () => useContext(LimitContext);

export const LimitProvider = ({ children }) => {
  const { userPlan } = useContext(AuthContext); // your plan object
  const [isLimitModalOpen, setIsModalOpen] = useState(false);
  const [currentLimit, setCurrentLimit] = useState({
    usage: 0,
    totalAllowed: 0,
    type: "",
  });

  // Map the feature type to the correct plan key
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

  // Check limit for any feature
  const checkLimit = (usage, type) => {
    if (!userPlan) return true; // no plan? allow everything

    const totalAllowedKey = planKeysMap[type];
    const totalAllowed = userPlan.plan[totalAllowedKey] ?? 0;

    if (usage >= totalAllowed) {
      setCurrentLimit({ usage, totalAllowed, type });
      setIsModalOpen(true);
      return false; // limit exceeded
    }

    return true; // limit not exceeded
  };

  // Check if offer page customization is allowed
  const isOfferPageCustomizationAllowed = () => {
    if (!userPlan) return true; // allow if no plan
    return userPlan.plan?.is_offerPage_customization_allowed ?? false;
  };

  // Check if API access is allowed
  const isApiAccessAllowed = () => {
    if (!userPlan) return true;
    return userPlan.plan?.api_access ?? false;
  };

  const closeLimitModal = () => setIsModalOpen(false);

  return (
    <LimitContext.Provider
      value={{
        isLimitModalOpen,
        currentLimit,
        checkLimit,
        closeLimitModal,
        isOfferPageCustomizationAllowed,
        isApiAccessAllowed
      }}
    >
      {children}
    </LimitContext.Provider>
  );
};
