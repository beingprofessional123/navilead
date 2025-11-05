import React from "react";
import dayjs from "dayjs";

const LimitModal = ({
  isOpen,
  onClose,
  usedLimit,
  totalAllowed,
  currentLimit = {},
  userPlan,
}) => {
  if (!isOpen) return null;

  const { type } = currentLimit || {};

  const billingType = userPlan?.plan?.billing_type;
  const startDate = userPlan?.startDate ? dayjs(userPlan.startDate) : null;
  const renewalDate = userPlan?.renewalDate ? dayjs(userPlan.renewalDate) : null;
  const endDate = userPlan?.endDate ? dayjs(userPlan.endDate) : null;

  let cycleStart = null;
  let cycleEnd = null;
  let remainingDaysText = "";

  // 🧭 Handle billing cycles
  if (billingType === "monthly") {
    cycleStart = startDate || dayjs();
    cycleEnd = renewalDate || dayjs().add(1, "month");
    const remainingDays = cycleEnd.diff(dayjs(), "day");
    remainingDaysText =
      remainingDays >= 0
        ? `${remainingDays} days left in this month’s cycle.`
        : "Renewal period ended.";
  } 
  else if (billingType === "yearly") {
    // Yearly plan but monthly renewal window
    const currentCycleStart = dayjs().date(startDate?.date() || 1);
    const currentCycleEnd = currentCycleStart.add(1, "month");
    cycleStart = currentCycleStart;
    cycleEnd = currentCycleEnd;

    const remainingDays = cycleEnd.diff(dayjs(), "day");
    remainingDaysText =
      remainingDays >= 0
        ? `${remainingDays} days left in this month’s sub-cycle.`
        : "This month’s sub-cycle has ended.";
  }

  // ✅ Feature type mapping
  const featureNames = {
    Leads: "Leads",
    SMS_Templates: "SMS Templates",
    SMS: "SMS Messages",
    Emails: "Emails",
    Email_Templates: "Email Templates",
    Offers: "Offers",
    Offers_Templates: "Offer Templates",
    Pricing_Templates: "Pricing Templates",
    Workflows: "Workflows",
  };

  const featureName = featureNames[type] || "Feature";
  const remaining = totalAllowed - usedLimit > 0 ? totalAllowed - usedLimit : 0;

  return (
    <>
      <div className={`${isOpen ? "modal-backdrop fade show" : ""}`}></div>
      <div
        className={`modal modaldesign leadsaddmodal ${
          isOpen ? "d-block" : ""
        }`}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header bg-red-100">
              <h4 className="modal-title text-red-600 font-semibold">
                {featureName} Limit Reached
              </h4>
              <button type="button" className="btn-close" onClick={onClose}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="mb-3 text-gray-700">
                You’ve reached your <strong>{featureName}</strong> usage limit for
                the current{" "}
                <strong>
                  {billingType === "yearly"
                    ? "year plan (monthly reset)"
                    : billingType}
                </strong>{" "}
                period.
              </p>

              <div className="border rounded-md p-3 mb-3 bg-gray-50">
                <p>
                  <strong>Plan Type:</strong> {billingType?.toUpperCase()}
                </p>
                <p>
                  <strong>Plan Limit:</strong> {totalAllowed}
                </p>
                <p>
                  <strong>Used Quota:</strong> {usedLimit}
                </p>
                <p>
                  <strong>Remaining:</strong> {remaining}
                </p>
                <p className="mt-2 text-sm text-gray-600">{remainingDaysText}</p>
                    {cycleStart && cycleEnd && (
                      <p className="text-sm text-gray-500">
                        <strong>Cycle:</strong>{" "}
                        {cycleStart.format("DD MMM YYYY")} →{" "}
                        {cycleEnd.format("DD MMM YYYY")}
                      </p>
                    )}
             
              </div>

              <p className="text-sm text-gray-600">
                To continue using {featureName}, please upgrade your plan.
              </p>

              <div className="text-end mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-add"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LimitModal;
