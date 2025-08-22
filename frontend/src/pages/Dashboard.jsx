import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next"; // Import useTranslation
import MobileHeader from '../components/common/MobileHeader';

const Dashboard = () => {
  // Renamed 't' to 'translate' as requested
  const { t: translate } = useTranslation(); // Initialize the translation hook

  return (
    <div className="mainbody">
      <div className="container-fluid">
        <MobileHeader />
        <div className="row top-row">
          <div className="col-md-6">
            <div className="dash-heading">
              {/* Translated heading and welcome message */}
              <h2>{translate('dashboard.heading')}</h2>
              <p>{translate('dashboard.welcomeMessage')}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="dashright">
              {/* Add Lead Button */}
              <Link to="/add-lead" className="btn btn-add">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                {translate('dashboard.addLead')} {/* Translated text */}
              </Link>
              {/* Send Offer Button */}
              <Link to="/send-offer" className="btn btn-send">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                  <path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
                {translate('dashboard.sendOffer')} {/* Translated text */}
              </Link>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              <span className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </span>
              <h3>{translate('dashboard.newLeadsThisWeek')}</h3> {/* Translated text */}
              <h5>47</h5>
              {/* Viser nu den faktiske værdi i stedet for pladsholder */}
              <h6>+12% fra sidste måned</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              <span className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true">
                  <path d="M16 7h6v6"></path>
                  <path d="m22 7-8.5 8.5-5-5L2 17"></path>
                </svg>
              </span>
              <h3>{translate('dashboard.conversionRate')}</h3> {/* Translated text */}
              <h5>24.5%</h5>
              {/* Viser nu den faktiske værdi i stedet for pladsholder */}
              <h6>+3.2% fra sidste måned</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              <span className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </span>
              <h3>{translate('dashboard.offersSent')}</h3> {/* Translated text */}
              <h5>23</h5>
              {/* Viser nu den faktiske værdi i stedet for pladsholder */}
              <h6>+5 fra sidste måned</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="carddesign cardinfo">
              <span className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </span>
              <h3>{translate('dashboard.offersAccepted')}</h3> {/* Translated text */}
              <h5>8</h5>
              {/* Viser nu den faktiske værdi i stedet for pladsholder */}
              <h6>+2 fra sidste måned</h6>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="carddesign h-100">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity w-4 h-4" aria-hidden="true">
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
                </svg>
                {translate('dashboard.recentActivity')} {/* Translated text */}
              </h2>
              <ul className="activation-ul">
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>{translate('dashboard.newLeadReceived')}</h3> {/* Translated text */}
                      <h4>Maria Hansen - Google Ads</h4> {/* Keep dynamic content as is */}
                    </div>
                    <div className="activation-time">
                      {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                      <span>2 min siden</span>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>{translate('dashboard.offerAccepted')}</h3> {/* Translated text */}
                      <h4>Website development - 45.000 DKK</h4> {/* Keep dynamic content as is */}
                    </div>
                    <div className="activation-time">
                      {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                      <span>1 time siden</span>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>{translate('dashboard.emailSent')}</h3> {/* Translated text */}
                      {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                      <h4>Follow-up til 5 leads</h4>
                    </div>
                    <div className="activation-time">
                      {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                      <span>3 timer siden</span>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>{translate('dashboard.leadAssigned')}</h3> {/* Translated text */}
                      <h4>Peter Nielsen to Sarah</h4> {/* Keep dynamic content as is */}
                    </div>
                    <div className="activation-time">
                      {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                      <span>5 timer siden</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="col-md-4">
            <div className="carddesign h-100">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell w-4 h-4" aria-hidden="true">
                  <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                </svg>
                {translate('dashboard.notifications')} {/* Translated text */}
              </h2>
              <ul className="notification-ul">
                <li>
                  {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                  <h5>Du har 3 leads der venter på opfølgning</h5>
                  <Link to="/leads" className="btn btn-leads">{translate('dashboard.viewLeads')}</Link> {/* Translated text */}
                </li>
                <li>
                  {/* Viser nu den faktiske værdi i stedet for pladsholder */}
                  <h5>Email kampagne blev sendt til 125 kontakter</h5>
                  <Link to="/emailsms" className="btn btn-leads">{translate('dashboard.viewLeads')}</Link> {/* Translated text */}
                </li>
                <li>
                  <h5>{translate('dashboard.priceFolderCreditsLow')}</h5> {/* Translated text */}
                  <Link to="/billing" className="btn btn-leads">{translate('dashboard.viewLeads')}</Link> {/* Translated text */}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="carddesign handler">
          <h2 className="card-title">{translate('dashboard.quickActions')}</h2> {/* Translated text */}
          <div className="row">
            <div className="col-md-4">
              <Link to="/create-lead" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <h5>{translate('dashboard.createNewLead')}</h5> {/* Translated text */}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/send-email-campaign" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                  <path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
                <h5>{translate('dashboard.sendEmailCampaign')}</h5> {/* Translated text */}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/create-offer-template" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
                <h5>{translate('dashboard.createOfferTemplate')}</h5> {/* Translated text */}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
