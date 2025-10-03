import React, { useState, useContext } from 'react';
import { useTranslation } from "react-i18next";
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';

const BillingPlansTab = ({ handleOpenUpgradeModal, userPlan, plans }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const { authToken } = useContext(AuthContext);
  const [billingType, setBillingType] = useState(() => {
    return userPlan?.plan?.billing_type === 'free' ? 'free' : userPlan?.plan?.billing_type;
  });

  // Filter plans based on selected billing type
  const filteredPlans = plans.filter(plan => plan.billing_type === billingType);
  // Calculate discounts per billing type
  const discountsByType = {
    free: plans
      .filter(plan => plan.billing_type === 'free')
      .reduce((sum, plan) => sum + (parseFloat(plan.discount_percentage) || 0), 0),
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
        cancelButtonText: 'No, keep it'
      });

      if (!result.isConfirmed) return;

      const response = await api.post(
        `/subscriptions/cancel-now`,
        { planId: plan.id },
        { headers: { Authorization: `Bearer ${authToken}` } }

      );

        localStorage.setItem('userPlan', JSON.stringify(response.data.userPlan));
      toast.success(response.data.message);
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel subscription.');
    }
  };




  return (
    <div id="menu2" className="tab-pane fade">
      <div className="plans-heading">
        <h3>{t('plans.choosePlan')}</h3>
        <p>{t('plans.subheading')}</p>
        <div className="planscheck">
          {['free', 'monthly', 'yearly'].map(type => (
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
        {filteredPlans.map(plan => (
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
                <div className="status status7">{t('plan.professional.leads', { leads: '300' })}</div>
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
                        if (userPlan?.plan?.id !== plan.id) handleOpenUpgradeModal(plan);
                      }}
                    >
                      {userPlan?.plan?.id === plan.id ? t('button.currentPlan') : t('button.upgradePlan')}
                    </Link>

                    {userPlan?.plan?.id === plan.id && userPlan.plan.billing_type !== 'free' && (
                      <button
                        className="btn btn-add"
                        onClick={() => handleCancelPlan(plan)}
                        // disabled={userPlan.status === 'cancelled'}
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

      {/* SMS Prices - Static/Translated */}
      <div className="carddesign smsprices">
        <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>{t('smsPrices.title')}</h2>
        <div className="row">
          <div className="col-md-4"><h4 className="smsprices-a">{t('smsPrices.starter')}</h4><p>{t('smsPrices.perSms', { plan: 'Starter' })}</p></div>
          <div className="col-md-4"><h4 className="smsprices-b">{t('smsPrices.professional')}</h4><p>{t('smsPrices.perSms', { plan: 'Professional & Enterprise' })}</p></div>
          <div className="col-md-4"><h4 className="smsprices-c">{t('smsPrices.payAsYouGoTitle')}</h4><p>{t('smsPrices.payAsYouGoDescription')}</p></div>
        </div>
      </div>
    </div>
  );
};

export default BillingPlansTab;
