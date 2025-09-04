import React, { useState, useEffect, useContext } from 'react';
import MobileHeader from '../../components/common/MobileHeader';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const IntegrationsPage = () => {
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    const { authToken, user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [rateLimits, setRateLimits] = useState({
        requestsToday: 0,
        dailyLimit: 0,
        usedPercentage: 0,
    });

    const baseUrl = process.env.REACT_APP_API_BASE_URL;

    // Fetch user's API usage limits
    const fetchDailyRateLimits = async () => {
        if (!authToken) {
            setLoading(false);
            toast.error('Authentication required');
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/integrations/rate-Limits', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setRateLimits(response.data);
        } catch (error) {
            console.error('Error fetching rate limits:', error);
            toast.error(error.response?.data?.error || 'Failed to fetch rate limits');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyRateLimits();
    }, [authToken]);


    const handleConnect = (name) => {
        // Construct dynamic API URL
        const apiUrl = `${baseUrl}/public-leads?apikey=${user.apikey}&email=secondary@example.com&fullName=John&companyName=Acme&phone=123456789&notifyOnFollowUp=true&tags=vip,priority&address=123 Street&cvrNumber=12345678&leadSource=${name}&internalNote=Test note&customerComment=Test comment&followUpDate=2025-08-25&value=1000`;

        // Update the state
        setSelectedIntegration({
            name,
            description: `${name}`,
            apiUrl,
        });
    };

    const handleCopyApiUrl = () => {
        if (selectedIntegration?.apiUrl) {
            navigator.clipboard.writeText(selectedIntegration.apiUrl)
                .then(() => {
                    toast.success('API URL copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    toast.error('Failed to copy. Please try again.'); // 😟 Show an error toast
                });
        } else {
            navigator.clipboard.writeText(user.apikey)
                .then(() => {
                    toast.success('API Key copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    toast.error('Failed to copy. Please try again.'); // 😟 Show an error toast
                });

        }
    };
    // Assuming you have a utility function or component for icons
    const renderIcon = (name) => {
        switch (name) {
            case 'Facebook Ads':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
            case 'Zapier':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>;
            case 'WordPress':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-12">
                            <div className="dash-heading">
                                <h2>Integrations</h2>
                                <p>Connect Navilead with your favorite tools</p>
                            </div>
                        </div>
                    </div>

                    <div className="emailmodaltab">
                        <ul className="nav nav-tabs" role="tablist">
                            <li className="nav-item">
                                <a className="nav-link active" data-bs-toggle="tab" href="#home">Browse Integrations</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-bs-toggle="tab" href="#menu1">Webhooks</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-bs-toggle="tab" href="#menu2">API Access</a>
                            </li>
                        </ul>
                        <div className="tab-content">
                            <div id="home" className="tab-pane active">
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook text-primary" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></span>
                                                <h4>Facebook Ads</h4>
                                                <h5>Marketing</h5>
                                            </div>
                                            <p>Import leads directly from your Facebook ad campaigns</p>
                                            <a href="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal4" onClick={() => handleConnect("Facebook Ads")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Connect</a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap text-primary" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>
                                                <h4>Zapier</h4>
                                                <h5>Automation</h5>
                                                {/* <div className="status status3">Connected</div> */}
                                            </div>
                                            <p>Automate workflows between Navilead and 5000+ other apps</p>
                                            <a href="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal4" onClick={() => handleConnect("Zapier")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Connect</a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe text-primary" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg></span>
                                                <h4>WordPress</h4>
                                                <h5>Web</h5>
                                            </div>
                                            <p>Import leads directly from your Facebook ad campaigns</p>
                                            <a href="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal4" onClick={() => handleConnect("WordPress")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Connect</a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox comingsoon">
                                            <div className="integrations-top">
                                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database text-muted-foreground" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg></span>
                                                <h4>Previsto</h4>
                                                <h5>CRM</h5>
                                                <div className="status status8"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>Coming Soon</div>
                                            </div>
                                            <p>Sync leads and customer data with Previsto CRM platform</p>
                                            <a href="#" className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>Coming Soon</a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox comingsoon">
                                            <div className="integrations-top">
                                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chrome text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" x2="12" y1="8" y2="8"></line><line x1="3.95" x2="8.54" y1="6.06" y2="14"></line><line x1="10.88" x2="15.46" y1="21.94" y2="14"></line></svg></span>
                                                <h4>Fenster</h4>
                                                <h5>Construction</h5>
                                                <div className="status status8"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>Coming Soon</div>
                                            </div>
                                            <p>Connect window quote requests from Fenster platform</p>
                                            <a href="#" className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>Coming Soon</a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox comingsoon">
                                            <div className="integrations-top">
                                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                                                <h4>Skvizbizz</h4>
                                                <h5>Business</h5>
                                                <div className="status status8"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>Coming Soon</div>
                                            </div>
                                            <p>Import business leads from Skvizbizz marketplace</p>
                                            <a href="#" className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>Coming Soon</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="menu1" className="tab-pane fade">
                                <div className="planactive-heading integrationsheading">
                                    <div>
                                        <h2 className="card-title">Webhooks</h2>
                                        <p>Receive real-time notifications when changes occur</p>
                                    </div>
                                    <a href="#" className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>New webhook</a>
                                </div>
                                <ul className="webhookslist">
                                    <li>
                                        <div className="webhookslist-left">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-muted-foreground" aria-hidden="true"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path></svg>Lead Created Webhook  <div className="status status3">Active</div></h2>
                                            <p>https://api.yourcompany.com/webhooks/lead-created</p>
                                            <div className="status status7">lead.created</div>
                                            <div className="status status7">lead.updated</div>
                                        </div>
                                        <div className="webhookslist-right">
                                            <a href="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings m-0" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></a>
                                            <a href="#" className="btn btn-add">Test</a>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="webhookslist-left">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-muted-foreground" aria-hidden="true"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path></svg>Offer Accepted Webhook  <div className="status status3">Active</div></h2>
                                            <p>https://api.yourcompany.com/webhooks/offer-accepted</p>
                                            <div className="status status7">offer.accepted</div>
                                        </div>
                                        <div className="webhookslist-right">
                                            <a href="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings m-0" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></a>
                                            <a href="#" className="btn btn-add">Test</a>
                                        </div>
                                    </li>
                                </ul>

                            </div>
                            <div id="menu2" className="tab-pane fade">
                                <div className="planactive-heading integrationsheading">
                                    <div>
                                        <h2 className="card-title">API Access</h2>
                                        <p>Manage your API keys and documentation</p>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="carddesign apiaccess">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key" aria-hidden="true"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"></path><path d="m21 2-9.6 9.6"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>API Keys</h2>
                                            <ul className="apikeys">
                                                <li>
                                                    <div className="apikeys-left">
                                                        <h3>API Key</h3>
                                                        <p>
                                                            Created{" "}
                                                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="apikeys-right">
                                                        <a href="#" className="btn btn-add" onClick={handleCopyApiUrl}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy m-0" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></a>
                                                        {/* <a href="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings m-0" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></a> */}
                                                    </div>
                                                </li>
                                                {/* <li>
                                                    <div className="apikeys-left">
                                                        <h3>Development Key</h3>
                                                        <p>Created Dec 10, 2024</p>
                                                    </div>
                                                    <div className="apikeys-right">
                                                        <a href="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy m-0" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></a>
                                                        <a href="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings m-0" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></a>
                                                    </div>
                                                </li> */}
                                            </ul>
                                            {/* <a href="#" className="btn btn-send w-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Generate new key</a> */}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="carddesign apiaccess api-documentation">
                                            <h2 className="card-title">API Documentation</h2>
                                            <p>Learn how to integrate with the Navilead API and automate your workflows.</p>
                                            <a href="#" className="btn btn-add w-100 text-start mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>API Documentation</a>
                                            <a href="#" className="btn btn-add w-100 text-start mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>API Examples</a>
                                            {/* <a href="#" className="btn btn-add w-100 text-start "><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>SDK Download</a> */}
                                        </div>
                                    </div>
                                </div>

                                <div className="carddesign ratelimits">
                                    <h2 className="card-title">Rate Limits</h2>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="carddesign">
                                                <h3 className="text-primary">{loading ? '...' : rateLimits.requestsToday}</h3>
                                                <p>Requests today</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="carddesign">
                                                <h3>{loading ? '...' : rateLimits.dailyLimit}</h3>
                                                <p>Daily limit</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="carddesign">
                                                <h3 className="text-green-500">{loading ? '...' : rateLimits.usedPercentage}%</h3>
                                                <p>Used</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>



                            </div>
                        </div>
                    </div>


                </div>
            </div>

            <div className="modal fade modaldesign workflowmodal" id="myModal4">
                <div className="modal-dialog">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h4 className="modal-title">
                                <span>{renderIcon(selectedIntegration?.name)}</span>
                                {selectedIntegration?.name}
                            </h4>
                            <p>Import leads directly from your {selectedIntegration?.name} campaigns</p>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>

                        <div className="modal-body">
                            <div className="formdesign">
                                <form>
                                    <div className="carddesign connectbox">
                                        <div className="form-group mb-2">
                                            <label>API Keys</label>
                                            <div className="input-group">
                                                <input type="text" className="form-control" id="" placeholder={selectedIntegration?.name} value={selectedIntegration?.apiUrl || ""} readOnly />
                                                <button className="btn btn-send" type="button" onClick={handleCopyApiUrl}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy m-0" aria-hidden="true">
                                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="connectbox-note">
                                            {selectedIntegration?.description === 'Facebook Ads' && (
                                                 <div className='mt-3'>
                                                    <h5>Facebook Lead Ads (via Zapier, using GET)</h5>
                                                    <p>In Zapier, create a Zap:</p>
                                                    <ul className='small ps-3'>
                                                        <li><strong>Trigger:</strong> Facebook Lead Ads → New Lead (choose Page + Form)</li>
                                                        <li><strong>Action:</strong> Webhooks by Zapier → GET</li>
                                                        <li><strong>URL:</strong> https://navilead-backend.onrender.com/api/public-leads</li>
                                                        <li>
                                                            <strong>Query String Params:</strong>
                                                            <ul className='small ps-3'>
                                                                <li>apikey → YOUR_KEY</li>
                                                                <li>firstName → {"{{First Name}}"}</li>
                                                                <li>lastName → {"{{Last Name}}"}</li>
                                                                <li>email → {"{{Email}}"}</li>
                                                                <li>phone → {"{{Phone Number}}"}</li>
                                                                <li>address → {"{{Full Address or City}}"}</li>
                                                                <li>cvrNumber → {"{{Your custom field if present}}"}</li>
                                                                <li>leadSource → Facebook Ads</li>
                                                                <li>internalNote → {"{{Custom Question or leave blank}}"}</li>
                                                                <li>customerComment → {"{{Another field or blank}}"}</li>
                                                                <li>followUpDate → {"{{yyyy-mm-dd or leave blank}}"}</li>
                                                                <li>value → {"{{Lead Value or 0}}"}</li>
                                                            </ul>
                                                        </li>
                                                        <li><strong>Test → Publish</strong></li>
                                                    </ul>
                                                    <p>
                                                        <em>
                                                            Tip: Using “GET” with “Query String Params” is safer than building one giant URL string; Zapier
                                                            handles encoding automatically.
                                                        </em>
                                                    </p>
                                                </div>
                                            )}

                                            {selectedIntegration?.description === 'Zapier' && (
                                                <div className='mt-3'>
                                                    <h5>Other Apps (Zapier → GET)</h5>
                                                    <ul className='small ps-3'>
                                                        <li><strong>Trigger:</strong> Your app (Google Forms, Typeform, Webflow, etc.)</li>
                                                        <li><strong>Action:</strong> Webhooks by Zapier → GET</li>
                                                        <li>Same settings as above (URL + Query String Params mapped from your form fields)</li>
                                                        <li><strong>Test & turn on</strong></li>
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedIntegration?.description === 'WordPress' && (
                                                <div className='mt-3'>
                                                    <h5>WordPress (Contact Form 7) → GET</h5>
                                                    <ul className='small ps-3'>
                                                        <li>Install <strong>CF7 to API</strong> / <strong>WP Webhooks</strong> (or similar)</li>
                                                        <li>
                                                            Configure it to Send GET to:{" "}
                                                            <code>https://navilead-backend.onrender.com/api/public-leads</code>
                                                        </li>
                                                        <li>Add all params (the plugin will URL-encode automatically)</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    <div className="modalfooter btn-right">
                                        <a href="#" className="btn btn-add" data-bs-dismiss="modal">Close</a>
                                    </div>
                                </form>
                            </div>

                        </div>


                    </div>
                </div>
            </div>
        </>
    );
};

export default IntegrationsPage;