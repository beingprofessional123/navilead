import React, { useState, useEffect, useContext } from 'react';
import MobileHeader from '../../components/common/MobileHeader';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useTranslation } from "react-i18next";

const IntegrationsPage = () => {
    const { t } = useTranslation();
    const [showAlert, setShowAlert] = useState(true);
    const [isApiAccessAllowed, setIsApiAccessAllowed] = useState(null);
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
            toast.error(t('integrationsPage.toasts.authRequired'));
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/integrations/rate-Limits', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setRateLimits(response.data);
            setRateLimits({
                requestsToday: response.data.totalLeadsUsed,
                dailyLimit: response.data.totalLeadsAllowed,
                usedPercentage: response.data.usedPercentage,
            });
            setIsApiAccessAllowed(response.data.isApiAccessAllowed);

        } catch (error) {
            console.error('Error fetching rate limits:', error);
            toast.error(error.response?.data?.error || t('integrationsPage.toasts.failedToFetchRateLimits'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyRateLimits();
    }, [authToken]);


    const handleConnect = (name) => {
        const apiUrl = `${baseUrl}/public-leads?apikey=${user.apikey}&email=secondary@example.com&fullName=John&companyName=Acme&phone=123456789&notifyOnFollowUp=true&tags=vip,priority&address=123 Street&cvrNumber=12345678&leadSource=${name}&internalNote=Test note&customerComment=Test comment&followUpDate=2025-08-25&value=1000`;

        let description = "";
        switch (name) {
            case 'Facebook Ads':
                description = t('integrationsPage.integrations.facebookAds.description');
                break;
            case 'Zapier':
                description = t('integrationsPage.integrations.zapier.description');
                break;
            case 'WordPress':
                description = t('integrationsPage.integrations.wordpress.description');
                break;
            default:
                description = "";
        }

        setSelectedIntegration({
            name,
            description,
            apiUrl,
        });
    };

    const handleCopyApiUrl = () => {
        if (selectedIntegration?.apiUrl) {
            navigator.clipboard.writeText(selectedIntegration.apiUrl)
                .then(() => {
                    toast.success(t('integrationsPage.toasts.copiedApiUrl'));
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    toast.error(t('integrationsPage.toasts.failedToCopy'));
                });
        } else {
            navigator.clipboard.writeText(user.apikey)
                .then(() => {
                    toast.success(t('integrationsPage.toasts.copiedApiKey'));
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    toast.error(t('integrationsPage.toasts.failedToCopy'));
                });

        }
    };

    const renderIcon = (name) => {
        switch (name) {
            case 'Facebook Ads':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
            case 'Zapier':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>;
            case 'WordPress':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>;
            case 'Previsto':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database text-muted-foreground" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>;
            case 'Fenster':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chrome text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" x2="12" y1="8" y2="8"></line><line x1="3.95" x2="8.54" y1="6.06" y2="14"></line><line x1="10.88" x2="15.46" y1="21.94" y2="14"></line></svg>;
            case 'Skvizbizz':
                return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
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
                                <h2>{t('integrationsPage.title')}</h2>
                                <p>{t('integrationsPage.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="emailmodaltab">
                        {!isApiAccessAllowed && showAlert && (
                            <div
                                className="alert alert-warning alert-dismissible fade show"
                                role="alert"
                            >
                                Your current plan does not allow API access!
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="alert"
                                    aria-label="Close"
                                    onClick={() => setShowAlert(false)}
                                ></button>
                            </div>
                        )}

                        <ul className="nav nav-tabs" role="tablist">
                            <li className="nav-item">
                                <a className="nav-link active" data-bs-toggle="tab" href="#home">{t('integrationsPage.tabs.browse')}</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-bs-toggle="tab" href="#menu1">{t('integrationsPage.tabs.webhooks')}</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-bs-toggle="tab" href="#menu2">{t('integrationsPage.tabs.apiAccess')}</a>
                            </li>
                        </ul>
                        <div className="tab-content">
                            <div id="home" className="tab-pane active">
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span>{renderIcon('Facebook Ads')}</span>
                                                <h4>{t('integrationsPage.integrations.facebookAds.name')}</h4>
                                                <h5>{t('integrationsPage.integrations.facebookAds.category')}</h5>
                                            </div>
                                            <p>{t('integrationsPage.integrations.facebookAds.description')}</p>
                                            <a href="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal4" onClick={() => handleConnect("Facebook Ads")}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('integrationsPage.buttons.connect')}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span>{renderIcon('Zapier')}</span>
                                                <h4>{t('integrationsPage.integrations.zapier.name')}</h4>
                                                <h5>{t('integrationsPage.integrations.zapier.category')}</h5>
                                            </div>
                                            <p>{t('integrationsPage.integrations.zapier.description')}</p>
                                            <a href="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal4" onClick={() => handleConnect("Zapier")}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('integrationsPage.buttons.connect')}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span>{renderIcon('WordPress')}</span>
                                                <h4>{t('integrationsPage.integrations.wordpress.name')}</h4>
                                                <h5>{t('integrationsPage.integrations.wordpress.category')}</h5>
                                            </div>
                                            <p>{t('integrationsPage.integrations.wordpress.description')}</p>
                                            <a href="#" className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal4" onClick={() => handleConnect("WordPress")}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('integrationsPage.buttons.connect')}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox comingsoon">
                                            <div className="integrations-top">
                                                <span>{renderIcon('Previsto')}</span>
                                                <h4>{t('integrationsPage.integrations.previsto.name')}</h4>
                                                <h5>{t('integrationsPage.integrations.previsto.category')}</h5>
                                                <div className="status status8">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{t('integrationsPage.integrations.comingSoon')}
                                                </div>
                                            </div>
                                            <p>{t('integrationsPage.integrations.previsto.description')}</p>
                                            <a href="#" className="btn btn-send">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{t('integrationsPage.integrations.comingSoon')}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox comingsoon">
                                            <div className="integrations-top">
                                                <span>{renderIcon('Fenster')}</span>
                                                <h4>{t('integrationsPage.integrations.fenster.name')}</h4>
                                                <h5>{t('integrationsPage.integrations.fenster.category')}</h5>
                                                <div className="status status8">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{t('integrationsPage.integrations.comingSoon')}
                                                </div>
                                            </div>
                                            <p>{t('integrationsPage.integrations.fenster.description')}</p>
                                            <a href="#" className="btn btn-send">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{t('integrationsPage.integrations.comingSoon')}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="carddesign integrationsbox comingsoon">
                                            <div className="integrations-top">
                                                <span>{renderIcon('Skvizbizz')}</span>
                                                <h4>{t('integrationsPage.integrations.skvizbizz.name')}</h4>
                                                <h5>{t('integrationsPage.integrations.skvizbizz.category')}</h5>
                                                <div className="status status8">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{t('integrationsPage.integrations.comingSoon')}
                                                </div>
                                            </div>
                                            <p>{t('integrationsPage.integrations.skvizbizz.description')}</p>
                                            <a href="#" className="btn btn-send">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{t('integrationsPage.integrations.comingSoon')}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="menu1" className="tab-pane fade">
                                <div className="planactive-heading integrationsheading">
                                    <div>
                                        <h2 className="card-title">{t('integrationsPage.webhooks.title')}</h2>
                                        <p>{t('integrationsPage.webhooks.description')}</p>
                                    </div>
                                    <a href="#" className="btn btn-send">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('integrationsPage.buttons.newWebhook')}
                                    </a>
                                </div>
                                <ul className="webhookslist">
                                    <li>
                                        <div className="webhookslist-left">
                                            <h2 className="card-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-muted-foreground" aria-hidden="true"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path></svg>{t('integrationsPage.webhooks.leadCreated')}
                                                <div className="status status3">{t('integrationsPage.webhooks.status.active')}</div>
                                            </h2>
                                            <p>https://api.yourcompany.com/webhooks/lead-created</p>
                                            <div className="status status7">lead.created</div>
                                            <div className="status status7">lead.updated</div>
                                        </div>
                                        <div className="webhookslist-right">
                                            <a href="#" className="btn btn-add">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings m-0" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            </a>
                                            <a href="#" className="btn btn-add">{t('integrationsPage.buttons.test')}</a>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="webhookslist-left">
                                            <h2 className="card-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook text-muted-foreground" aria-hidden="true"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path></svg>{t('integrationsPage.webhooks.offerAccepted')}
                                                <div className="status status3">{t('integrationsPage.webhooks.status.active')}</div>
                                            </h2>
                                            <p>https://api.yourcompany.com/webhooks/offer-accepted</p>
                                            <div className="status status7">offer.accepted</div>
                                        </div>
                                        <div className="webhookslist-right">
                                            <a href="#" className="btn btn-add">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings m-0" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            </a>
                                            <a href="#" className="btn btn-add">{t('integrationsPage.buttons.test')}</a>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div id="menu2" className="tab-pane fade">
                                <div className="planactive-heading integrationsheading">
                                    <div>
                                        <h2 className="card-title">{t('integrationsPage.apiAccess.title')}</h2>
                                        <p>{t('integrationsPage.apiAccess.description')}</p>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="carddesign apiaccess">
                                            <h2 className="card-title">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key" aria-hidden="true"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"></path><path d="m21 2-9.6 9.6"></path><circle cx="7.5" cy="15.5" r="5.5"></circle></svg>{t('integrationsPage.apiAccess.apiKeys.title')}
                                            </h2>
                                            <ul className="apikeys">
                                                <li>
                                                    <div className="apikeys-left">
                                                        <h3>{t('integrationsPage.apiAccess.apiKeys.title')}</h3>
                                                        <p>
                                                            {t('integrationsPage.apiAccess.apiKeys.description')}{" "}
                                                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="apikeys-right">
                                                        <a href="#" className="btn btn-add" onClick={handleCopyApiUrl}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy m-0" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                                                        </a>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="carddesign apiaccess api-documentation">
                                            <h2 className="card-title">{t('integrationsPage.apiAccess.apiDocs.title')}</h2>
                                            <p>{t('integrationsPage.apiAccess.apiDocs.description')}</p>
                                            <a href="#" className="btn btn-add w-100 text-start mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>{t('integrationsPage.apiAccess.apiDocs.link')}
                                            </a>
                                            <a href="#" className="btn btn-add w-100 text-start mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>{t('integrationsPage.apiAccess.apiDocs.examples')}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="carddesign ratelimits">
                                    <h2 className="card-title">{t('integrationsPage.apiAccess.rateLimits.title')}</h2>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="carddesign">
                                                <h3 className="text-primary">{loading ? '...' : rateLimits.requestsToday}</h3>
                                                <p>{t('integrationsPage.apiAccess.rateLimits.requestsToday')}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="carddesign">
                                                <h3>{loading ? '...' : rateLimits.dailyLimit}</h3>
                                                <p>{t('integrationsPage.apiAccess.rateLimits.dailyLimit')}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="carddesign">
                                                <h3 className="text-green-500">{loading ? '...' : rateLimits.usedPercentage}%</h3>
                                                <p>{t('integrationsPage.apiAccess.rateLimits.used')}</p>
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
                            <button type="button" className="btn-close" data-bs-dismiss="modal">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">
                                <form>
                                    <div className="carddesign connectbox">
                                        <div className="form-group mb-2">
                                            <label>{t('integrationsPage.modal.title')}</label>
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
                                            {selectedIntegration?.name === 'Facebook Ads' && (
                                                <div className='mt-3'>
                                                    <h5>{t('integrationsPage.modal.note.facebookAdsTitle')}</h5>
                                                    <p>{t('integrationsPage.modal.note.facebookAdsText')}</p>
                                                    <ul className='ps-3'>
                                                        <li><strong>{t('integrationsPage.modal.note.facebookAdsTrigger')}</strong></li>
                                                        <li><strong>{t('integrationsPage.modal.note.facebookAdsAction')}</strong></li>
                                                        <li><strong>{t('integrationsPage.modal.note.facebookAdsUrl')}</strong></li>
                                                        <li>
                                                            <strong>{t('integrationsPage.modal.note.facebookAdsParams')}</strong>
                                                            <ul className='ps-3'>
                                                                <li>apikey → YOUR_KEY</li>
                                                                <li>fullName → {"{{Full Name}}"}</li>
                                                                <li>email → {"{{Email}}"}</li>
                                                                <li>phone → {"{{Phone Number}}"}</li>
                                                                <li>address → {"{{Full Address or City}}"}</li>
                                                                <li>companyName → {"{{Company Name}}"}</li>
                                                                <li>cvrNumber → {"{{Your custom field if present}}"}</li>
                                                                <li>leadSource → Facebook Ads </li>
                                                                <li>tags → {"{{Tags (comma separated)}}"}</li>
                                                                <li>internalNote → {"{{Custom Question or leave blank}}"}</li>
                                                                <li>customerComment → {"{{Another field or blank}}"}</li>
                                                                <li>followUpDate → {"{{yyyy-mm-dd or leave blank}}"}</li>
                                                                <li>value → {"{{Lead Value or 0}}"}</li>
                                                                <li>attachments →
                                                                    <ul className="ps-3">
                                                                        <li>First upload files using <code>POST</code> method</li>
                                                                        <li>Allowed formats: <code>png</code>, <code>jpg</code>, <code>jpeg</code>, <code>pdf</code></li>
                                                                    </ul>
                                                                </li>
                                                            </ul>
                                                        </li>
                                                        <li><strong>Test → Publish</strong></li>
                                                    </ul>
                                                    <p>
                                                        <em>
                                                            {t('integrationsPage.modal.note.facebookAdsParamsTip')}
                                                        </em>
                                                    </p>
                                                </div>
                                            )}
                                            {selectedIntegration?.name === 'Zapier' && (
                                                <div className='mt-3'>
                                                    <h5>{t('integrationsPage.modal.note.otherAppsTitle')}</h5>
                                                    <ul className='ps-3'>
                                                        <li><strong>{t('integrationsPage.modal.note.otherAppsTrigger')}</strong></li>
                                                        <li><strong>{t('integrationsPage.modal.note.otherAppsAction')}</strong></li>
                                                        <li><strong>{t('integrationsPage.modal.note.otherAppsSettings')}</strong></li>
                                                        <li><strong>{t('integrationsPage.modal.note.otherAppsTest')}</strong></li>
                                                    </ul>
                                                </div>
                                            )}
                                            {selectedIntegration?.name === 'WordPress' && (
                                                <div className='mt-3'>
                                                    <h5>{t('integrationsPage.modal.note.wordpressTitle')}</h5>
                                                    <ul className='ps-3'>
                                                        <li><strong>{t('integrationsPage.modal.note.wordpressInstall')}</strong></li>
                                                        <li>
                                                            <strong>{t('integrationsPage.modal.note.wordpressConfigure')}</strong>{" "}
                                                            <code>https://navilead-backend.onrender.com/api/public-leads</code>
                                                        </li>
                                                        <li><strong>{t('integrationsPage.modal.note.wordpressAddParams')}</strong></li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modalfooter btn-right">
                                        <a href="#" className="btn btn-add" data-bs-dismiss="modal">{t('integrationsPage.buttons.close')}</a>
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