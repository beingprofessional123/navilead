import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';


// Import Components
import BillingOverviewTab from './BillingOverviewTab';
import BillingPlansTab from './BillingPlansTab';
import BillingPaymentTab from './BillingPaymentTab';
import BillingHistoryTab from './BillingHistoryTab';

// Import Dynamic Modals
import AddPaymentMethodModal from './AddPaymentMethodModal';
import UpgradePlanModal from './UpgradePlanModal';

const BillingPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { authToken, userPlan } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [editCard, setEditCard] = useState(null);



  useEffect(() => {
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
    const fetchTransaction = async () => {
      try {
        const response = await api.get('/transactions', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setTransactions(response.data || []); // use response.data directly
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchPaymentMethods = async () => {
      try {
        const response = await api.get('/paymentMethods', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setPaymentMethods(response.data.paymentMethods || []); // use response.data directly
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchPlans();
      fetchTransaction();
      fetchPaymentMethods();
    }
  }, [authToken]);

  const handleNewPaymentMethod = (paymentMethods) => {
    console.log(paymentMethods);
    setEditCard(paymentMethods);
    setIsAddPaymentModalOpen(true);
  };

  const handleOpenUpgradeModal = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseUpgradeModal = () => {
    setSelectedPlan(null);
    setIsModalOpen(false);
  };


  if (loading) {
    return <div className="loading-state p-5 text-center">{t('loading')}...</div>;
  }

  if (error) {
    return <div className="error-state p-5 text-danger text-center">{t('error')}: {error.message}</div>;
  }

  if (!plans) {
    return <div className="no-data-state p-5 text-center">{t('noData')}</div>;
  }

  return (
    <div className="mainbody">
      <div className="container-fluid">
        <div className="row top-row">
          <div className="col-md-6"><div className="dash-heading"><h2><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>{t('billing.title')}</h2><p>{t('billing.description')}</p></div></div>
          <div className="col-md-6">
            <div className="dashright">
              <div className="badge"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>{userPlan.plan.name}</div>
              <a href="#" className="btn btn-send" onClick={(e) => {
                e.preventDefault();

                // filter out free plan and currently active plan
                const filteredPlans = plans.filter(
                  (plan) => plan.name !== "Free" && plan.id !== userPlan?.planId
                );
                if (filteredPlans.length > 0) {
                  const randomPlan = filteredPlans[Math.floor(Math.random() * filteredPlans.length)];
                  handleOpenUpgradeModal(randomPlan);
                }
              }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>{t('button.upgradePlan')}
              </a>
            </div>
          </div>
        </div>

        <div className="emailmodaltab billing">
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item"><a className="nav-link active" data-bs-toggle="tab" href="#home1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg>{t('tabs.overview')}</a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" href="#menu2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>{t('tabs.plans')}</a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" href="#menu3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>{t('tabs.payment')}</a></li>
            <li className="nav-item"><a className="nav-link" data-bs-toggle="tab" href="#menu4"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>{t('tabs.history')}</a></li>
          </ul>

          <div className="tab-content">
            <BillingOverviewTab handleNewPaymentMethod={handleNewPaymentMethod} paymentMethods={paymentMethods} handleOpenUpgradeModal={handleOpenUpgradeModal} userPlan={userPlan} plans={plans} />
            <BillingPlansTab handleOpenUpgradeModal={handleOpenUpgradeModal} plans={plans} userPlan={userPlan} />
            <BillingPaymentTab handleNewPaymentMethod={handleNewPaymentMethod} paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} />
            <BillingHistoryTab transactions={transactions} />
          </div>
        </div>
      </div>

      <AddPaymentMethodModal
        isModalOpen={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setEditCard(null); // modal close hone par reset
        }}
        onSuccess={(updatedCard) => {
          if (editCard) {
            // agar edit ho raha hai to replace
            setPaymentMethods((prev) =>
              prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
            );
          } else {
            // agar naya add ho raha hai to append
            setPaymentMethods((prev) => [...prev, updatedCard]);
          }

          setIsAddPaymentModalOpen(false);
          setEditCard(null);
        }}
        editData={editCard}
      />



      <UpgradePlanModal
        id="upgradeModal1"
        onClose={handleCloseUpgradeModal}
        isModalOpen={isModalOpen}
        planDetails={selectedPlan}
        userPlan={userPlan}
        authToken
      />
    </div>
  );
};

export default BillingPage;
