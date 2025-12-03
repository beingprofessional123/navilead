import React, { useState, useContext, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2"; // ✅ Fix #1
import api from "../../utils/api"; // ✅ Fix #2 (your Axios instance path)
import { useLimit } from "../../context/LimitContext";
import { AuthContext } from "../../context/AuthContext";
import UpgradePlanModal from '../Billing/UpgradePlanModal';

const PlanPage = () => {
  const { t } = useTranslation();
  const { userPlan, refreshPlan } = useLimit();
  const { authToken } = useContext(AuthContext);
  const [plans, setPlans] = useState([]); // ✅ Fix #3 (declare plans)
  const [loading, setLoading] = useState(true);
  const [billingType, setBillingType] = useState(() => {
    return userPlan?.plan?.billing_type || "monthly";
  });
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {

    fetchPlans();

    if (userPlan && userPlan.plan) {
      navigate('/dashboard');
    }
  }, [userPlan, navigate]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setPlans(response.data || []); // use response.data directly
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };


  // Filter plans based on selected billing type
  const filteredPlans = plans.filter(plan => plan.billing_type === billingType);
  // Calculate discounts per billing type
  const discountsByType = {
    monthly: plans
      .filter(plan => plan.billing_type === 'monthly')
      .reduce((sum, plan) => sum + (parseFloat(plan.discount_percentage) || 0), 0),
    yearly: plans
      .filter(plan => plan.billing_type === 'yearly')
      .reduce((sum, plan) => sum + (parseFloat(plan.discount_percentage) || 0), 0),
  };

  const handleCancelPlan = async (plan) => {
    try {
      // SweetAlert confirmation
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you really want to cancel this plan?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep it',
        customClass: {
                popup: 'custom-swal-popup'
            }
      });

      if (!result.isConfirmed) return;

      const response = await api.post(
        `/subscriptions/cancel-now`,
        { planId: plan.id },
        { headers: { Authorization: `Bearer ${authToken}` } }

      );

      localStorage.setItem('userPlan', JSON.stringify(response.data.userPlan));
      toast.success(response.data.message);
      await refreshPlan();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel subscription.');
    }
  };

  const displayedPlans = filteredPlans.filter(plan => {
    return plan.status === 'active' || plan.id === userPlan?.plan?.id;
  });

  const handleCloseUpgradeModal = () => {
    setSelectedPlan(null);
    setIsModalOpen(false);
  };

  const handleOpenUpgradeModal = (plan) => {
    console.log('Selected plan for upgrade:', plan);
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };



  return (
    <div className="p-5">
      <div className="logo">
        <Link href="#">
          <img
            src="assets/images/logo.svg"
            className="img-fluid"
            alt="Logo"
          />
        </Link>
      </div>

      <div className="plans-heading">
        <h3>{t('plans.choosePlan')}</h3>
        <p>{t('plans.subheading')}</p>
        <div className="planscheck">
          {['monthly', 'yearly'].map(type => (
            <div className="form-check" key={type}>
              <label className="form-check-label" htmlFor={type}>
                <input
                  type="radio"
                  className="form-check-input"
                  id={type}
                  name="billingType"
                  value={type}
                  checked={billingType === type}
                  onChange={() => setBillingType(type)}
                />
                <div>
                  {t(`plans.${type === 'yearly' ? 'annually' : type}`)}
                  {discountsByType[type] > 0 && (
                    <span> {t('plans.discount', { discount: discountsByType[type] })}</span>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

      </div>
      <div className="row">
        {displayedPlans.map(plan => (
          <div className="col-md-4" key={plan.id}>
            <div className={`carddesign plancard ${userPlan?.plan?.id === plan.id ? 'mostplancard' : ''}`}>

              <div className="plancard-heading">
                {userPlan?.plan?.id === plan.id ? (
                  <div className="mostplan"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg> {t('button.currentPlan')}</div>
                ) : null}
                <h3>{plan?.name}</h3>
                <h4>{plan.price} {t('currency.dkk')} {billingType === 'yearly' ? <span>/{t('plans.perYear')}</span> : <span>/{t('currentPlan.perMonth')}</span>}</h4>
                {plan.discount_percentage > 0 && (
                  <div className="save">{t('plans.save', { amount: (plan.price * plan.discount_percentage / 100).toFixed(2) })} {t('currency.dkk')} </div>
                )}
                <p>{plan.shortdescription}</p>
                <div className="status status7">{t('plan.professional.leads', { leads: plan.Total_Leads_Allowed })}</div>
              </div>
              <div className="plancard-body">
                <ul>
                  {plan.description.split(',').map((feature, index) => (
                    <li key={index}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                      {feature.trim()}
                    </li>
                  ))}
                </ul>
                <Link
                  to="#"
                  className="btn btn-add"
                  style={
                    userPlan?.plan?.id === plan.id
                      ? { pointerEvents: "none", opacity: 0.6, cursor: "not-allowed" }
                      : {}
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    // Only allow if it's not the current plan
                    if (userPlan?.plan?.id !== plan.id) {
                      handleOpenUpgradeModal(plan);
                    }
                  }}
                >
                  {userPlan?.plan?.id === plan.id
                    ? t('button.currentPlan')
                    : t('button.upgradePlan')}
                </Link>

                {userPlan?.plan?.id === plan.id && (
                  <button
                    className="btn btn-add"
                    onClick={() => handleCancelPlan(plan)}
                  >
                    {userPlan.status === 'cancelled'
                      ? t('button.cancelled')
                      : t('button.Cancelnow')}
                  </button>
                )}



              </div>
            </div>
          </div>
        ))}
      </div>

      <UpgradePlanModal
        id="upgradeModal1"
        onClose={handleCloseUpgradeModal}
        isModalOpen={isModalOpen}
        planDetails={selectedPlan}
        authToken={authToken}
        userPlan={
          userPlan && userPlan.plan
            ? userPlan
            : {
              plan: {
                id: 0,
                name: "No Active Plan",
                price: 0,
              },
            }
        }
      />

    </div>
  );
};

export default PlanPage;
