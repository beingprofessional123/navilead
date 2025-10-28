import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import MobileHeader from '../components/MobileHeader';

const Dashboard = () => {
  const { t: translate } = useTranslation();

  return (
    <div className="mainbody">
      <div className="container-fluid">
        <MobileHeader />
        
        {/* ====================================
            ROW 1: HEADER & ACTION BUTTONS 
        ==================================== */}
        <div className="row top-row">
          <div className="col-md-6">
            <div className="dash-heading">
              <h2>{translate('dashboard.heading')}</h2>
              <p>{translate('dashboard.welcomeMessage')}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="dashright">
              <Link to="/add-lead" className="btn btn-add">
                {/* Plus Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path><path d="M12 5v14"></path>
                </svg>
                {translate('dashboard.addLead')}
              </Link>
              <Link to="/send-offer" className="btn btn-send">
                {/* Send Icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
                {translate('dashboard.sendOffer')}
              </Link>
            </div>
          </div>
        </div>

        {/* ====================================
            ROW 2: SALES/LEAD METRIC CARDS (Existing)
        ==================================== */}
        <div className="row">
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              {/* Users Icon SVG */}
              <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
              </span>
              <h3>{translate('dashboard.newLeadsThisWeek')}</h3>
              <h5>47</h5>
              <h6>+12% fra sidste måned</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              {/* Trending Up Icon SVG */}
              <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true">
                  <path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg>
              </span>
              <h3>{translate('dashboard.conversionRate')}</h3>
              <h5>24.5%</h5>
              <h6>+3.2% fra sidste måned</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              {/* File Text Icon SVG */}
              <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
              </span>
              <h3>{translate('dashboard.offersSent')}</h3>
              <h5>23</h5>
              <h6>+5 fra sidste måned</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              {/* Circle Check Icon SVG */}
              <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg>
              </span>
              <h3>{translate('dashboard.offersAccepted')}</h3>
              <h5>8</h5>
              <h6>+2 fra sidste måned</h6>
            </div>
          </div>
        </div>
        
        {/* ====================================
            NEW ROW: ADMIN/USAGE METRIC CARDS 
        ==================================== */}
        <div className="row mt-4"> {/* Added margin-top for separation */}
          {/* TOTAL USERS */}
          <div className="col-md-3">
            <div className="carddesign cardinfo card-admin">
              <span className="card-icon">
                {/* Icon: Users */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path></svg>
              </span>
              <h3>{translate('admin.totalUsers')}</h3>
              {/* This would be dynamically fetched data */}
              <h5>1,245</h5> 
              <h6>{translate('admin.activeThisMonth')}</h6>
            </div>
          </div>

          {/* TOTAL SMS CREDITS USED */}
          <div className="col-md-3">
            <div className="carddesign cardinfo card-admin">
              <span className="card-icon">
                {/* Icon: Credit Card / Wallet */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
              </span>
              <h3>{translate('admin.smsCreditsUsed')}</h3>
              {/* This would be dynamically fetched data */}
              <h5>8,500</h5>
              <h6>{translate('admin.remainingCredits')}</h6>
            </div>
          </div>

          {/* TOTAL SMS SENT */}
          <div className="col-md-3">
            <div className="carddesign cardinfo card-admin">
              <span className="card-icon">
                {/* Icon: Message Square */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </span>
              <h3>{translate('admin.totalSmsSent')}</h3>
              {/* This would be dynamically fetched data */}
              <h5>12,400</h5>
              <h6>{translate('admin.thisMonth')}</h6>
            </div>
          </div>

          {/* TOTAL EMAIL SENT */}
          <div className="col-md-3">
            <div className="carddesign cardinfo card-admin">
              <span className="card-icon">
                {/* Icon: Mail */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              </span>
              <h3>{translate('admin.totalEmailSent')}</h3>
              {/* This would be dynamically fetched data */}
              <h5>45,900</h5>
              <h6>{translate('admin.last30Days')}</h6>
            </div>
          </div>
        </div>
        
        {/* ====================================
            EXISTING ROWS (Activity, Notifications, Quick Actions)
            ... (Keep the rest of the existing code here)
        ==================================== */}
        <div className="row mt-4">
          <div className="col-md-8">
            <div className="carddesign h-100">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity w-4 h-4" aria-hidden="true">
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
                </svg>
                {translate('dashboard.recentActivity')}
              </h2>
              <ul className="activation-ul">
                {/* ... (Existing Activity Items) ... */}
                <li><div className="activation-list"><div className="activation-info"><span className="activation-dot"></span><h3>{translate('dashboard.newLeadReceived')}</h3><h4>Maria Hansen - Google Ads</h4></div><div className="activation-time"><span>2 min siden</span></div></div></li>
                <li><div className="activation-list"><div className="activation-info"><span className="activation-dot"></span><h3>{translate('dashboard.offerAccepted')}</h3><h4>Website development - 45.000 DKK</h4></div><div className="activation-time"><span>1 time siden</span></div></div></li>
                <li><div className="activation-list"><div className="activation-info"><span className="activation-dot"></span><h3>{translate('dashboard.emailSent')}</h3><h4>Follow-up til 5 leads</h4></div><div className="activation-time"><span>3 timer siden</span></div></div></li>
                <li><div className="activation-list"><div className="activation-info"><span className="activation-dot"></span><h3>{translate('dashboard.leadAssigned')}</h3><h4>Peter Nielsen to Sarah</h4></div><div className="activation-time"><span>5 timer siden</span></div></div></li>
              </ul>
            </div>
          </div>
          <div className="col-md-4">
            <div className="carddesign h-100">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell w-4 h-4" aria-hidden="true">
                  <path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                </svg>
                {translate('dashboard.notifications')}
              </h2>
              <ul className="notification-ul">
                {/* ... (Existing Notification Items) ... */}
                <li><h5>Du har 3 leads der venter på opfølgning</h5><Link to="/leads" className="btn btn-leads">{translate('dashboard.viewLeads')}</Link></li>
                <li><h5>Email kampagne blev sendt til 125 kontakter</h5><Link to="/emailsms" className="btn btn-leads">{translate('dashboard.viewLeads')}</Link></li>
                <li><h5>{translate('dashboard.priceFolderCreditsLow')}</h5><Link to="/billing" className="btn btn-leads">{translate('dashboard.viewLeads')}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="carddesign handler mt-4">
          <h2 className="card-title">{translate('dashboard.quickActions')}</h2>
          <div className="row">
            {/* ... (Existing Quick Actions) ... */}
            <div className="col-md-4"><Link to="/create-lead" className="handler-card"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg><h5>{translate('dashboard.createNewLead')}</h5></Link></div>
            <div className="col-md-4"><Link to="/send-email-campaign" className="handler-card"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg><h5>{translate('dashboard.sendEmailCampaign')}</h5></Link></div>
            <div className="col-md-4"><Link to="/create-offer-template" className="handler-card"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg><h5>{translate('dashboard.createOfferTemplate')}</h5></Link></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;