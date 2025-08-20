import React, { useState } from 'react';

const IntegrationsPage = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        email: '',
        fullName: '',
        companyName: '',
        phone: '',
        notifyOnFollowUp: true,
        tags: '',
        attName: '',
        address: '',
        cvrNumber: '',
        leadSource: '',
        internalNote: '',
        customerComment: '',
        followUpDate: '',
        value: '',
        simulatedUrl: ''
    });

    const integrations = [
        {
            name: 'Facebook Ads',
            category: 'Marketing',
            description: 'Import leads directly from your Facebook ad campaigns',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
            ),
        },
        {
            name: 'Google Ads',
            category: 'Marketing',
            description: 'Sync conversion data and import leads from Google Ads.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone" aria-hidden="true">
                    <path d="m3 11 18-8-2 13L3 11z"></path>
                    <path d="M11.6 16.8a3 3 0 1 1-5.6-1.7l3.7-2.7 3.7 2.7Z"></path>
                </svg>
            ),
        },
        {
            name: 'Website Form',
            category: 'Lead Capture',
            description: 'Integrate forms from your website to capture leads directly.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-form" aria-hidden="true">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <path d="M14 2v6h6"></path>
                    <path d="M10 12h8"></path>
                    <path d="M10 18h8"></path>
                    <path d="M10 15h8"></path>
                </svg>
            ),
        },
        {
            name: 'Phone Call',
            category: 'Lead Capture',
            description: 'Track incoming phone calls as new leads in your system.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2.02 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
            ),
        },
        {
            name: 'Email',
            category: 'Communication',
            description: 'Integrate your email system for lead communication.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
            ),
        },
        {
            name: 'Referral',
            category: 'Lead Source',
            description: 'Manage and track leads generated through referrals.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2" aria-hidden="true">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <path d="m8.59 13.51 6.83 4.97"></path>
                    <path d="m15.41 6.49-6.83 4.97"></path>
                </svg>
            ),
        },
        {
            name: 'LinkedIn',
            category: 'Social Media',
            description: 'Import professional leads and connect through LinkedIn.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                </svg>
            ),
        },
        {
            name: 'Trade Show',
            category: 'Event Marketing',
            description: 'Import leads collected from trade shows and events.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building" aria-hidden="true">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                    <path d="M9 22v-4h6v4"></path>
                    <path d="M8 6h.01"></path>
                    <path d="M16 6h.01"></path>
                    <path d="M12 6h.01"></path>
                    <path d="M12 10h.01"></path>
                    <path d="M12 14h.01"></path>
                    <path d="M16 10h.01"></path>
                    <path d="M16 14h.01"></path>
                    <path d="M8 10h.01"></path>
                    <path d="M8 14h.01"></path>
                </svg>
            ),
        },
        {
            name: 'Cold Outreach',
            category: 'Sales',
            description: 'Manage and track leads generated through cold outreach campaigns.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                    <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
                    <path d="M9 11l-6 6"></path>
                </svg>
            ),
        },
        {
            name: 'Other',
            category: 'General',
            description: 'Connect with other custom lead sources.',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 12h8"></path>
                    <path d="M12 8v8"></path>
                </svg>
            ),
        },
    ];

    const handleConnectClick = (integrationName) => {
        const baseUrl = `${process.env.REACT_APP_API_BASE_URL}/public-leads`;
        const currentFormData = {
            userId: ' ',
            email: ' ',
            fullName: ' ',
            companyName: ' ',
            phone: ' ',
            notifyOnFollowUp: true,
            tags: '',
            attName: ' ',
            address: ' ',
            cvrNumber: '98765432',
            leadSource: integrationName,
            internalNote: ' ',
            customerComment: ' ',
            followUpDate: ' ',
            value: ' '
        };

        const queryParams = new URLSearchParams();
        for (const key in currentFormData) {
            if (typeof currentFormData[key] === 'boolean') {
                queryParams.append(key, currentFormData[key] ? 'true' : 'false');
            } else {
                queryParams.append(key, currentFormData[key]);
            }
        }
        const generatedUrl = `${baseUrl}?${queryParams.toString()}`;

        setFormData((prevData) => ({
            ...prevData,
            leadSource: integrationName,
            simulatedUrl: generatedUrl
        }));
         window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth' // This makes the scroll animate smoothly
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(formData.simulatedUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return (
        <div className="mainbody">
            <div className="container-fluid">
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
                            <a className={`nav-link ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')} data-bs-toggle="tab" href="#browse">Browse Integrations</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 'webhooks' ? 'active' : ''}`} onClick={() => setActiveTab('webhooks')} data-bs-toggle="tab" href="#webhooks">Webhooks</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')} data-bs-toggle="tab" href="#api">API Access</a>
                        </li>
                    </ul>
                    <div className="tab-content">
                        <div id="browse" className={`tab-pane fade ${activeTab === 'browse' ? 'show active' : ''}`}>
                            <div className="row">
                                {integrations.map((integration) => (
                                    <div className="col-md-4" key={integration.name}>
                                        <div className="carddesign integrationsbox">
                                            <div className="integrations-top">
                                                <span>{integration.icon}</span>
                                                <h4>{integration.name}</h4>
                                                <h5>{integration.category}</h5>
                                            </div>
                                            <p>{integration.description}</p>
                                            <a href="#" className="btn btn-send" onClick={(e) => { e.preventDefault(); handleConnectClick(integration.name); }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                                    <path d="M5 12h14"></path>
                                                    <path d="M12 5v14"></path>
                                                </svg>
                                                Connect
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="carddesign integrationsbox">
                                <div className="integrations-top">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook" aria-hidden="true">
                                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z"></path>
                                        <path d="M15 12.5a2.5 2.5 0 0 1-2.5 2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 15a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M9.5 12.5a2.5 2.5 0 0 1 2.5-2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 9.5a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                    </svg></span>
                                    <h4>API Integration</h4>
                                    <h5>Generate API Endpoints</h5>
                                </div>
                                <p>This simulates an API endpoint for a new lead based on the last integration you selected. Click 'Connect' on any integration to generate a new URL.</p>
                                <div className="mt-3">
                                    <p className="">
                                        **API URL:** <span className="text-sm" style={{ wordBreak: 'break-all', fontSize: '14px' }}>{formData.simulatedUrl}</span>
                                    </p>
                                    <button className="btn btn-send" onClick={handleCopy} disabled={!formData.simulatedUrl}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="webhooks" className={`tab-pane fade ${activeTab === 'webhooks' ? 'show active' : ''}`}>
                            <h3>Webhooks</h3>
                            <p>Connect with other services using webhooks.</p>
                            <div className="row">
                                <div className="col-md-4">
                                <div className="carddesign integrationsbox">
                                    <div className="integrations-top">
                                     <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook" aria-hidden="true">
                                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z"></path>
                                        <path d="M15 12.5a2.5 2.5 0 0 1-2.5 2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 15a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M9.5 12.5a2.5 2.5 0 0 1 2.5-2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 9.5a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                    </svg></span>
                                    <h4>Webhooks</h4>
                                    <h5>Connect with other services using webhooks.</h5>
                                    </div>
                                    <p>Connect with other services using webhooks.</p>
                                    <a href="#" className="btn btn-send" onClick={(e) => { e.preventDefault(); handleConnectClick("Other"); }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Connect</a>
                                </div>
                                </div>
                            </div>
                            <div className="carddesign integrationsbox">
                                <div className="integrations-top">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook" aria-hidden="true">
                                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z"></path>
                                        <path d="M15 12.5a2.5 2.5 0 0 1-2.5 2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 15a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M9.5 12.5a2.5 2.5 0 0 1 2.5-2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 9.5a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                    </svg></span>
                                    <h4>API Integration</h4>
                                    <h5>Generate API Endpoints</h5>
                                </div>
                                <p>This simulates an API endpoint for a new lead based on the last integration you selected. Click 'Connect' on any integration to generate a new URL.</p>
                                <div className="mt-3">
                                    <p className="">
                                        **API URL:** <span className="text-sm" style={{ wordBreak: 'break-all', fontSize: '14px' }}>{formData.simulatedUrl}</span>
                                    </p>
                                    <button className="btn btn-send" onClick={handleCopy} disabled={!formData.simulatedUrl}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="api" className={`tab-pane fade ${activeTab === 'api' ? 'show active' : ''}`}>
                            <h3>API Access</h3>
                            <p>Access and manage your data with our powerful API.</p>
                            <div className="row">
                                <div className="col-md-4">
                                <div className="carddesign integrationsbox">
                                    <div className="integrations-top">
                                     <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook" aria-hidden="true">
                                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z"></path>
                                        <path d="M15 12.5a2.5 2.5 0 0 1-2.5 2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 15a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M9.5 12.5a2.5 2.5 0 0 1 2.5-2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 9.5a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                    </svg></span>
                                    <h4>API Access</h4>
                                    <h5>Connect with other services using api access.</h5>
                                    </div>
                                    <p>Connect with other services using webhooks.</p>
                                    <a href="#" className="btn btn-send" onClick={(e) => { e.preventDefault(); handleConnectClick("Other"); }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Connect</a>
                                </div>
                                </div>
                            </div>
                            <div className="carddesign integrationsbox">
                                <div className="integrations-top">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-webhook" aria-hidden="true">
                                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z"></path>
                                        <path d="M15 12.5a2.5 2.5 0 0 1-2.5 2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 15a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M9.5 12.5a2.5 2.5 0 0 1 2.5-2.5V12.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                        <path d="M12.5 9.5a2.5 2.5 0 0 1-2.5-2.5H12.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1-2.5 2.5Z"></path>
                                    </svg></span>
                                    <h4>API Integration</h4>
                                    <h5>Generate API Endpoints</h5>
                                </div>
                                <p>This simulates an API endpoint for a new lead based on the last integration you selected. Click 'Connect' on any integration to generate a new URL.</p>
                                <div className="mt-3">
                                    <p className="">
                                        **API URL:** <span className="text-sm" style={{ wordBreak: 'break-all', fontSize: '14px' }}>{formData.simulatedUrl}</span>
                                    </p>
                                    <button className="btn btn-send" onClick={handleCopy} disabled={!formData.simulatedUrl}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;