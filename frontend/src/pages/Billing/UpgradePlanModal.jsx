import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const UpgradePlanModal = ({ id, onClose, isModalOpen, planDetails, userPlan, authToken }) => {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmUpgrade = async (planDetails) => {
    try {
      setIsConfirming(true);

      const response = await api.post(
        '/subscriptions/checkout',
        { planId: planDetails.id },
        { headers: { Authorization: `Bearer ${authToken}` } } // Make sure authToken is available
      );

      // Save stripeCustomerId to localStorage if returned
      if (response.data.stripeCustomerId) {
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        storedUser.stripeCustomerId = response.data.stripeCustomerId;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }

      window.location.href = response.data.checkoutUrl;

    } catch (error) {
      console.error('Upgrade plan error:', error);
      toast.error('Failed to upgrade plan: ' + error.response?.data?.message || error.message);
    } finally {
      setIsConfirming(false);
    }
  };
  if (!planDetails) return null;

  return (
    <>
      <div className={`${onClose ? 'modal-backdrop fade show' : ''}`}></div>
      <div className={`modal fade modaldesign ugradeplanmodal ${isModalOpen ? 'show d-block' : 'd-none'}`} aria-hidden={!isModalOpen}>

        <div className="modal-dialog">
          <div className="modal-content">

            <div className="modal-header">
              <h4 className="modal-title" id={`${id}Label`}>{t('upgradePlanModal.title')}</h4>
              <button type="button" className="btn-close" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
            </div>

            <div className="modal-body">

              <div className="ugradeplanmodal-body">
                <h2>{planDetails.name}</h2>
                <h3>{planDetails.price} {t('currency.dkk')} {planDetails.billing_type === 'yearly' ? <span>/{t('plans.perYear')}</span> : <span>/{t('currentPlan.perMonth')}</span>}</h3>
                <div className="ugradeplanmodal-eur"><span>{Math.round(parseFloat(planDetails.discount_percentage))}%</span></div>
                <p>{planDetails.shortdescription}</p>
                <ul>
                  <li><span>{userPlan.plan.name}</span><span>{userPlan.plan.price} {t('currency.dkk')}</span></li>
                  <li><span>{planDetails.name}</span><span>{planDetails.price} {t('currency.dkk')}</span></li>
                </ul>
                <div className="ugradeplanmodal-total"><span>{t('upgradePlanModal.difference')}</span><span>{planDetails.price - userPlan.plan.price} {t('currency.dkk')}</span></div>
                <div className="ugradeplanmodal-alart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert text-yellow-500" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>{t('upgradePlanModal.prorationWarning')}
                </div>
              </div>

              <div className="modalfooter btn-right">
                <button className="btn btn-add" onClick={onClose}>{t('button.cancel')}</button>
                <button className="btn btn-send" onClick={() => handleConfirmUpgrade(planDetails)} disabled={isConfirming}>
                  {isConfirming ? t('button.upgrading') : t('button.confirmUpgrade')}
                </button>
              </div>


            </div>


          </div>
        </div>
      </div>
    </>
  );
};

export default UpgradePlanModal;
