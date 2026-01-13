import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MobileHeader from "../components/common/MobileHeader";
import { AuthContext } from "../context/AuthContext";
import api from "../../utils/api";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { t: translate } = useTranslation();
  const { authToken } = useContext(AuthContext);

  // Initializing state with nested empty arrays for all expected activity types
  const [dashboardData, setDashboardData] = useState({
    overview: {
      newLeads: 0,
      conversionRate: 0,
      offersSent: 0,
      offersAccepted: 0,
    },
    activities: {
      leads: [],
      offers: [],
      emails: [],
      sms: [],
      recentAskQuestion: [],
    },
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/dashboard", {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.data.success) {
          const rawActivities = res.data.data.activities || [];

          // Core Logic: Restructure the single 'activities' array from API into grouped arrays
          const groupedActivities = rawActivities.reduce(
            (acc, activity) => {
              switch (activity.type) {
                case "lead":
                  acc.leads.push(activity);
                  break;
                case "offer":
                  acc.offers.push(activity);
                  break;
                case "email":
                  acc.emails.push(activity);
                  break;
                case "sms":
                  acc.sms.push(activity);
                  break;
                case "question":
                  acc.recentAskQuestion.push(activity);
                  break;
                default:
                  // Ignore unknown types
                  break;
              }
              return acc;
            },
            {
              leads: [],
              offers: [],
              emails: [],
              sms: [],
              recentAskQuestion: [],
            }
          );

          setDashboardData({
            overview: res.data.data.overview || {},
            activities: groupedActivities,
            loading: false,
          });
        } else {
          toast.error(translate("dashboard.fetchError"));
          setDashboardData((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        toast.error(translate("dashboard.fetchError"));
        setDashboardData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, [authToken, translate]);

  const { overview, activities, loading } = dashboardData;

  /**
   * Helper: format relative time using i18n pluralization.
   * Assumes translation keys like 'time.minAgo', 'time.hourAgo', 'time.dayAgo' exist.
   */
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return translate("time.justNow");
    if (diffMins < 60) return translate("time.minAgo", { count: diffMins });
    if (diffHours < 24)
      return translate("time.hourAgo", { count: diffHours });
    return translate("time.dayAgo", { count: diffDays });
  };

  if (loading) return <div className="loader">{translate("common.loading")}</div>;

  // --- Rendering Logic Starts ---
  const allActivities = [
    ...activities.leads,
    ...activities.offers,
    ...activities.emails,
    ...activities.sms,
    ...activities.recentAskQuestion,
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  return (
    <div className="mainbody">
      <div className="container-fluid">
        <MobileHeader />
        <div className="row top-row">
          <div className="col-md-6">
            <div className="dash-heading">
              <h2>{translate("dashboard.heading")}</h2>
              <p>{translate("dashboard.welcomeMessage")}</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="dashright">
              {/* Optional Buttons area (currently empty/commented) */}
            </div>
          </div>
        </div>

        {/* --- Overview Cards --- */}
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
              <h3>{translate("dashboard.newLeadsThisWeek")}</h3>
              <h5>{overview.newLeads}</h5>
              <h6>{translate("dashboard.updatedNow")}</h6>
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
              <h3>{translate("dashboard.conversionRate")}</h3>
              <h5>{overview.conversionRate}%</h5>
              <h6>{translate("dashboard.updatedNow")}</h6>
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
              <h3>{translate("dashboard.offersSent")}</h3>
              <h5>{overview.offersSent}</h5>
              <h6>{translate("dashboard.updatedNow")}</h6>
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
              <h3>{translate("dashboard.offersAccepted")}</h3>
              <h5>{overview.offersAccepted}</h5>
              <h6>{translate("dashboard.updatedNow")}</h6>
            </div>
          </div>
        </div>

        {/* --- Recent Activity & Notifications --- */}
        <div className="row">
          <div className="col-md-12">
            <div
              className="carddesign h-100"
              style={{
                maxHeight: "450px",
                overflowY: "auto",
                paddingRight: "6px",
                scrollbarWidth: "thin",
              }}
            >
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity w-4 h-4" aria-hidden="true">
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
                </svg>
                {translate("dashboard.recentActivity")}
              </h2>
              <ul className="activation-ul">
                {allActivities.length > 0 ? (
                  allActivities.map((activity, index) => {
                    const timeAgo = formatTimeAgo(activity.createdAt);
                    let title = "";
                    let subtitle = "";

                    switch (activity.type) {
                      case "lead":
                        title = translate("dashboard.newLeadReceived");
                        subtitle = `${activity.fullName} - ${activity.leadSource} - ${activity?.email || activity?.fullName}`;
                        break;
                      case "offer":
                        title = translate("dashboard.offerAccepted");
                        subtitle = `${
                          activity.quote?.title || translate("common.untitled")
                        } - ${activity.totalPrice.toFixed(2)} DKK - ${activity.quote?.lead?.email || activity.quote?.lead?.fullName}`;
                        break;
                      case "email":
                        title = translate("dashboard.emailSent");
                        subtitle = `${activity.emailSubject} — ${
                          activity.Quote?.title || translate("common.untitledQuote")
                        } - ${activity.Quote?.lead?.email || activity.Quote?.lead?.fullName}`;
                        break;
                      case "sms":
                        title = translate("dashboard.smsSent");
                        subtitle = `${
                          activity.senderName || translate("common.unknownSender")} — ${
                          activity.Quote?.title || translate("common.untitledQuote")} - ${activity.Quote?.lead?.email || activity.Quote?.lead?.fullName}`;  
                        break;
                      case "question":
                        title = translate("dashboard.questionAsked");
                        subtitle = `${activity.question} — ${
                          activity.quote?.title || translate("common.untitledQuote")} - ${activity?.quote?.lead.email || activity.quote?.lead?.fullName}`;
                        break;
                      default:
                        return null; 
                    }

                    return (
                      <li key={`activity-${index}`}>
                        <div className="activation-list">
                          <div className="activation-info">
                            <span className="activation-dot"></span>
                            <h3>{title}</h3>
                            <h4>{subtitle}</h4>
                          </div>
                          <div className="activation-time">
                            <span>{timeAgo}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li>
                    <p>{translate("dashboard.noRecentActivity")}</p>
                  </li>
                )}
              </ul>
            </div>
          </div>
          {/* <div className="col-md-4">
            <div className="carddesign h-100">
              <h2 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell w-4 h-4" aria-hidden="true">
                  <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                </svg>
                {translate("dashboard.notifications")}
              </h2>
              <ul className="notification-ul">
                <li>
                  <h5>{translate("notification.leadsWaiting", {count: 3})}</h5>
                  <Link to="/leads" className="btn btn-leads">
                    {translate("dashboard.viewLeads")}
                  </Link>
                </li>
                <li>
                  <h5>{translate("notification.emailCampaignSent", {count: 125})}</h5>
                  <Link to="/emailsms" className="btn btn-leads">
                    {translate("dashboard.viewLeads")}
                  </Link>
                </li>
                <li>
                  <h5>{translate("dashboard.priceFolderCreditsLow")}</h5>
                  <Link to="/billing" className="btn btn-leads">
                    {translate("dashboard.viewLeads")}
                  </Link>
                </li>
              </ul>
            </div>
          </div> */}
        </div>

        {/* --- Quick Actions --- */}
        <div className="carddesign handler">
          <h2 className="card-title">{translate("dashboard.quickActions")}</h2>
          <div className="row">
            <div className="col-md-3">
              <Link to="/leads?create=true" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <h5>{translate("dashboard.createNewLead")}</h5>
              </Link>
            </div>
            <div className="col-md-3">
              <Link to="/pricing-templates?create=true" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <h5>{translate("dashboard.createPricingTemplate")}</h5>
              </Link>
            </div>
            <div className="col-md-3">
              <Link to="/email-sms" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <h5>{translate("dashboard.sendEmailCampaign")}</h5>
              </Link>
            </div>
            <div className="col-md-3">
              <Link to="/templatesoffers" className="handler-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
                <h5>{translate("dashboard.createOfferTemplate")}</h5>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;