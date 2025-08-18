import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for internal navigation

const Dashboard = () => {
  return (
    <div className="mainbody">
      <div className="container-fluid">

        <div className="row top-row">
          <div className="col-md-6">
            <div className="dash-heading">
              <h2>Dashboard</h2>
              <p>Welcome back! Here's your overview.</p> {/* Translated from "Velkommen tilbage! Her er dit overblik." */}
            </div>
          </div>
          <div className="col-md-6">
            <div className="dashright">
              {/* Using Link for internal navigation */}
              <Link to="/add-lead" className="btn btn-add"> {/* Placeholder path for "Tilføj lead" */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Lead {/* Translated from "Tilføj lead" */}
              </Link>
              {/* Using Link for internal navigation */}
              <Link to="/send-offer" className="btn btn-send"> {/* Placeholder path for "Send tilbud" */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                  <path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
                Send Offer {/* Translated from "Send tilbud" */}
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
              <h3>New leads this week</h3> {/* Translated from "Nye leads denne uge" */}
              <h5>47</h5>
              <h6>+12% from last month</h6> {/* Translated from "+12% fra sidste måned" */}
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
              <h3>Conversion Rate</h3> {/* Translated from "Konverteringsrate" */}
              <h5>24.5%</h5>
              <h6>+3.2% from last month</h6> {/* Translated from "+3.2% fra sidste måned" */}
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
              <h3>Offers Sent</h3> {/* Translated from "Tilbud sendt" */}
              <h5>23</h5>
              <h6>+5 from last month</h6> {/* Translated from "+5 fra sidste måned" */}
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
              <h3>Offers Accepted</h3> {/* Translated from "Tilbud accepteret" */}
              <h5>8</h5>
              <h6>+2 from last month</h6> {/* Translated from "+2 fra sidste måned" */}
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
                Recent Activity {/* Translated from "Seneste aktivitet" */}
              </h2>
              <ul className="activation-ul">
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>New lead received</h3> {/* Translated from "Nyt lead modtaget" */}
                      <h4>Maria Hansen - Google Ads</h4>
                    </div>
                    <div className="activation-time">
                      <span>2 min ago</span> {/* Translated from "2 min siden" */}
                    </div>
                  </div>
                </li>
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>Offer accepted</h3> {/* Translated from "Tilbud accepteret" */}
                      <h4>Website development - 45.000 DKK</h4> {/* "DKK" remains as currency */}
                    </div>
                    <div className="activation-time">
                      <span>1 hour ago</span> {/* Translated from "1 time siden" */}
                    </div>
                  </div>
                </li>
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>Email sent</h3> {/* Translated from "Email sendt" */}
                      <h4>Follow-up to 5 leads</h4> {/* Translated from "Follow-up til 5 leads" */}
                    </div>
                    <div className="activation-time">
                      <span>3 hours ago</span> {/* Translated from "3 timer siden" */}
                    </div>
                  </div>
                </li>
                <li>
                  <div className="activation-list">
                    <div className="activation-info">
                      <span className="activation-dot"></span>
                      <h3>Lead assigned</h3> {/* Translated from "Lead tildelt" */}
                      <h4>Peter Nielsen to Sarah</h4> {/* Translated from "Peter Nielsen til Sarah" */}
                    </div>
                    <div className="activation-time">
                      <span>5 hours ago</span> {/* Translated from "5 timer siden" */}
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
                Notifications {/* Translated from "Notifikationer" */}
              </h2>
              <ul className="notification-ul">
                <li>
                  <h5>You have 3 leads waiting for follow-up</h5> {/* Translated from "Du har 3 leads der venter på opfølgning" */}
                  <Link to="/leads" className="btn btn-leads">View Leads</Link> {/* Placeholder path, translated from "Se leads" */}
                </li>
                <li>
                  <h5>Email campaign was sent to 125 contacts</h5> {/* Translated from "Email kampagne blev sendt til 125 kontakter" */}
                  <Link to="/emailsms" className="btn btn-leads">View Leads</Link> {/* Placeholder path, translated from "Se leads" */}
                </li>
                <li>
                  <h5>Price folder is running out of credits</h5> {/* Translated from "Prisfolder er ved at løbe tør for kreditter" */}
                  <Link to="/billing" className="btn btn-leads">View Leads</Link> {/* Placeholder path, translated from "Se leads" */}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="carddesign handler">
          <h2 className="card-title">Quick Actions</h2> {/* Translated from "Hurtige handlinger" */}
          <div className="row">
            <div className="col-md-4">
              <Link to="/create-lead" className="handler-card"> {/* Placeholder path for "Opret nyt lead" */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-5 h-5" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <h5>Create new lead</h5> {/* Translated from "Opret nyt lead" */}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/send-email-campaign" className="handler-card"> {/* Placeholder path for "Send email kampagne" */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send w-5 h-5" aria-hidden="true">
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                  <path d="m21.854 2.147-10.94 10.939"></path>
                </svg>
                <h5>Send email campaign</h5> {/* Translated from "Send email kampagne" */}
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/create-offer-template" className="handler-card"> {/* Placeholder path for "Opret tilbudsskabelon" */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-5 h-5" aria-hidden="true">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
                <h5>Create offer template</h5> {/* Translated from "Opret tilbudsskabelon" */}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
