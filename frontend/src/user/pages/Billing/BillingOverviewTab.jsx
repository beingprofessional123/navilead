import React from 'react';
import { useTranslation } from "react-i18next";

const BillingOverviewTab = ({ handleOpenUpgradeModal, userPlan, plans, handleNewPaymentMethod, paymentMethods }) => {
  const { t } = useTranslation();
  console.log('userPlan in BillingOverviewTab:', userPlan);

  const totalLeads = userPlan?.plan?.usage?.totalLeads || 0;
  const allowedLeads = userPlan?.plan?.usage?.allowedLeads || 0;

  const leadsUsagePercentage =
    allowedLeads > 0 ? Math.min((totalLeads / allowedLeads) * 100, 100) : 0;
  const storageUsagePercentage = (0 / 0) * 100;

  return (
    <div id="home1" className="tab-pane active">
      {/* Current Plan Card - Dynamic */}
      <div className="carddesign planactive">
        <div className="planactive-heading">
          <div>
            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown text-primary" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>{t('currentPlan.title')}</h2>
            <p>{t('currentPlan.subtitle')}</p>
          </div>
          <div className={`status status6 ${userPlan?.status === 'cancelled' ? 'cancelled' : ''}`}>
            {userPlan?.status}
          </div>

        </div>
        <div className="planactive-details">
          <div className="row">
            <div className="col-md-4">
              <h4>{userPlan?.plan?.name}</h4>
              <h5>{t('currentPlan.plan')}</h5>
            </div>
            <div className="col-md-4">
              <h4>{userPlan?.plan?.price} {t('currency.dkk')} {userPlan?.plan?.billing_type === 'yearly' ? <span>/{t('plans.perYear')}</span> : <span>/{t('currentPlan.perMonth')}</span>}</h4>
              {/* <h5>€139 {t('currency.eur')}</h5> */}
            </div>
            <div className="col-md-4">
              <h4>
                {userPlan?.renewalDate
                  ? new Date(userPlan.renewalDate).toISOString().split('T')[0]
                  : userPlan?.endDate
                    ? new Date(userPlan.endDate).toISOString().split('T')[0]
                    : '-'}
              </h4>
              <h5>
                {userPlan?.renewalDate
                  ? t('currentPlan.nextPayment')
                  : t('currentPlan.EndDate')}
              </h5>
            </div>

          </div>
        </div>
        <div className="planactive-list">
          <h4>{t('currentPlan.featuresTitle')}</h4>
          <ul>
            {userPlan?.plan?.description.split(',').map((feature, index) => (
              <li key={feature.id}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{feature.trim()}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="row">
        {/* Usage Overview - Dynamic */}
        <div className="col-md-12">
          <div className="carddesign planactiveoverview">
            <div className="planactive-heading">
              <div>
                <h2 className="card-title">{t('usageOverview.title')}</h2>
                <p>{t('usageOverview.subtitle')}</p>
              </div>
            </div>
            <ul>
              {/* <li><div className="planactiveoverviewlist"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>{t('usageOverview.users')}</span><span className="planactiveoverviewlist-data">{0} / {t('usageOverview.unlimited')}</span></div></li> */}
              <li>
                <div className="planactiveoverviewlist"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>{t('usageOverview.leads')}</span><span className="planactiveoverviewlist-data">{totalLeads} / {allowedLeads}</span></div>
                <div className="progressoverview">
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${leadsUsagePercentage}%` }}></div>
                  </div>
                  <p><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg><span style={{ marginLeft: '6px' }}>
                    {allowedLeads - totalLeads > 0 ? (
                      <>
                        {allowedLeads - totalLeads} Leads Remaining
                      </>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: '500' }}>
                        Lead Limit Reached
                      </span>
                    )}
                  </span>
                  </p>
                </div>
              </li>
              {/* <li><div className="planactiveoverviewlist"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>{t('usageOverview.smsSent')}</span><span className="planactiveoverviewlist-data">{0} {t('usageOverview.unit')}</span></div>
                <p>{t('usageOverview.smsCost', { cost: (0 * 0).toFixed(1), price: 0 })}</p>
              </li>
              <li><div className="planactiveoverviewlist"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>{t('usageOverview.emailsSent')}</span><span className="planactiveoverviewlist-data">{0}</span></div>
                <p className="text-green-600">{t('usageOverview.unlimitedIncluded')}</p>
              </li> */}
            </ul>
          </div>
        </div>
        {/* Storage Space - Dynamic */}
        {/* <div className="col-md-6">
          <div className="carddesign planactiveoverview">
            <div className="planactive-heading">
              <div>
                <h2 className="card-title">{t('storage.title')}</h2>
                <p>{t('storage.subtitle')}</p>
              </div>
            </div>
            <div className="storagespace">
              <h4>{0}GB <span>{t('storage.usedOf', { total: `${0}GB` })}</span></h4>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${storageUsagePercentage}%` }}></div>
              </div>
              <div className="storagespacetotal">
                <span className="storagespacetotal-left">{t('storage.used')}: {0}GB</span><span className="storagespacetotal-right">{t('storage.available')}: {0}GB</span>
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Quick Actions - Static/Translated */}
      <div className="carddesign quickactions">
        <h2 className="card-title">{t('quickActions.title')}</h2>
        <div className="row">
          <div className="col-md-4">
            <a href="#" className="btn btn-add" onClick={(e) => {
              e.preventDefault();

              const filteredPlans = plans.filter(
                (plan) => plan.id !== userPlan?.planId
              );

              if (filteredPlans.length > 0) {
                // pick a random plan
                const randomPlan = filteredPlans[Math.floor(Math.random() * filteredPlans.length)];
                handleOpenUpgradeModal(randomPlan);
              }
            }}>
              <div className="quickactions-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown text-primary" aria-hidden="true"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg></div>
              <div className="quickactions-info"><h5>{t('quickActions.upgradePlan.title')}</h5><p>{t('quickActions.upgradePlan.subtitle')}</p></div>
            </a>
          </div>
          <div className="col-md-4">
            <a href="#" className="btn btn-add" onClick={(e) => { e.preventDefault(); handleNewPaymentMethod(paymentMethods[0]); }}>
              <div className="quickactions-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card text-primary" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg></div>
              <div className="quickactions-info"><h5>{t('quickActions.paymentMethods.title')}</h5><p>{t('quickActions.paymentMethods.subtitle')}</p></div>
            </a>
          </div>
          <div className="col-md-4">
            <a href={userPlan?.transaction?.invoiceUrl} className="btn btn-add">
              <div className="quickactions-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download text-primary" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg></div>
              <div className="quickactions-info"><h5>{t('quickActions.downloadInvoices.title')}</h5><p>{t('quickActions.downloadInvoices.subtitle')}</p></div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingOverviewTab;
