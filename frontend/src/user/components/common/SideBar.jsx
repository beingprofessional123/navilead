import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';
import api from '../../../utils/api';

const SideBar = () => {
    const { t } = useTranslation();
    const { user, logout, authToken } = useContext(AuthContext);
    const location = useLocation();
    const [totalUnread, setTotalUnread] = useState(0);
    const notificationSound = new Audio('/NotificationSound.mp3');

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('')
        : 'JD';

    useEffect(() => {
        if (!authToken) return;

        const checkTicketChanges = async () => {
            try {
                // 1. Fetch Latest Settings
                const settingsRes = await api.post('/tickets/update-setting', {}, {
                    headers: {
                        Authorization: `Bearer ${authToken}` // 👈 Token yahan pass hoga
                    }
                });
                const soundOn = settingsRes.data.notificationSoundTickets;

                // 2. Fetch Tickets List
               const res = await api.get('/tickets', {
                    headers: {
                        Authorization: `Bearer ${authToken}`
                    }
                });
                const tickets = res.data.tickets || [];

                // 3. Update Badge Count (Har page ke liye)
                const currentUnread = tickets.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
                setTotalUnread(currentUnread);

                // --- 🔔 ADVANCED CHANGE DETECTION ---

                // Pichla data snapshot uthayein
                const lastSnapshot = JSON.parse(localStorage.getItem('ticketSnapshot') || '[]');

                // Current data ka simplified snapshot banayein (sirf ID aur Status)
                const currentSnapshot = tickets.map(t => ({ id: t.id, status: t.status, unread: t.unreadCount }));

                // Agar pichla data exist karta hai, tabhi compare karein
                if (lastSnapshot.length > 0) {
                    const isTicketsPage = location.pathname === '/tickets';

                    // Check 1: Naya Ticket Aaya? (Length badh gayi)
                    const isNewTicket = currentSnapshot.length > lastSnapshot.length;

                    // Check 2: Ticket Delete Hua? (Length kam ho gayi)
                    const isDeleted = currentSnapshot.length < lastSnapshot.length;

                    // Check 3: Kisi ticket ka Status badla ya Naya message aaya?
                    const isStatusChanged = currentSnapshot.some(curr => {
                        const prev = lastSnapshot.find(p => p.id === curr.id);
                        return prev && (prev.status !== curr.status || curr.unread > prev.unread);
                    });

                    // Agar koi bhi badlav hua aur hum Tickets page par nahi hain
                    if ((isNewTicket || isDeleted || isStatusChanged) && !isTicketsPage) {

                        if (soundOn) {
                            notificationSound.play().catch(e => console.log("Audio Error", e));
                        }

                        // Dynamic message for Toast
                        let alertMsg = "Tickets list updated!";
                        if (isNewTicket) alertMsg = "📩 New support ticket received!";
                        if (isStatusChanged) alertMsg = "🔄 Ticket status updated!";
                        if (isDeleted) alertMsg = "🗑️ A ticket was removed.";

                        toast.info(alertMsg);

                        if (Notification.permission === "granted") {
                            new Notification("Support Update", { body: alertMsg, icon: "/assets/images/logo.svg" });
                        }
                    }
                }

                // Memory update karein (Snapshot save karein)
                localStorage.setItem('ticketSnapshot', JSON.stringify(currentSnapshot));
                localStorage.setItem('prevUnreadCount', currentUnread); // Backward compatibility ke liye

            } catch (err) {
                console.error("Global Polling Error:", err);
            }
        };

        const interval = setInterval(checkTicketChanges, 5000);
        checkTicketChanges();

        return () => clearInterval(interval);
    }, [authToken, location.pathname]);

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <Link to="/dashboard">
                    <img src="/assets/images/logo.svg" className="img-fluid" alt="Logo" />
                </Link>
            </div>
            <ul className="sidebar-menu">
                <li className={isActive('/dashboard') ? 'active' : ''}>
                    <Link to="/dashboard">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-house w-4 h-4" aria-hidden="true">
                                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            </svg>
                        </span>
                        {t('sidebar.dashboard')}
                    </Link>
                </li>
                <li className={isActive('/leads') ? 'active' : ''}>
                    <Link to="/leads">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-4 h-4" aria-hidden="true">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                        </span>
                        {t('sidebar.leads')}
                    </Link>
                </li>
                <li className={isActive('/email-sms') ? 'active' : ''}>
                    <Link to="/email-sms">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4" aria-hidden="true">
                                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                            </svg>
                        </span>
                        {t('sidebar.emailSms')}
                    </Link>
                </li>
                <li className={isActive('/workflows') ? 'active' : ''}>
                    <Link to="/workflows">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow w-4 h-4" aria-hidden="true">
                                <rect width="8" height="8" x="3" y="3" rx="2"></rect>
                                <path d="M7 11v4a2 2 0 0 0 2 2h4"></path>
                                <rect width="8" height="8" x="13" y="13" rx="2"></rect>
                            </svg>
                        </span>
                        {t('sidebar.workflows')}
                    </Link>
                </li>
                <li className={isActive('/integrations') ? 'active' : ''}>
                    <Link to="/integrations">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-puzzle w-4 h-4" aria-hidden="true">
                                <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"></path>
                            </svg>
                        </span>
                        {t('sidebar.integrations')}
                    </Link>
                </li>
                <li className={isActive('/pricing-templates') ? 'active' : ''}>
                    <Link to="/pricing-templates">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-4 h-4" aria-hidden="true">
                                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                <path d="M10 9H8"></path>
                                <path d="M16 13H8"></path>
                                <path d="M16 17H8"></path>
                            </svg>
                        </span>
                        {t('sidebar.pricingTemplates')}
                    </Link>
                </li>
                <li className={isActive('/templatesoffers') ? 'active' : ''}>
                    <Link to="/templatesoffers">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list w-4 h-4" aria-hidden="true">
                                <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <path d="M12 11h4"></path>
                                <path d="M12 16h4"></path>
                                <path d="M8 11h.01"></path>
                                <path d="M8 16h.01"></path>
                            </svg>
                        </span>
                        {t('sidebar.offerTemplates')}
                    </Link>
                </li>
                <li className={isActive('/billing') ? 'active' : ''}>
                    <Link to="/billing">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card w-4 h-4" aria-hidden="true">
                                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                <line x1="2" x2="22" y1="10" y2="10"></line>
                            </svg>
                        </span>
                        {t('sidebar.billing')}
                    </Link>
                </li>
                <li className={isActive('/sms-credits') ? 'active' : ''}>
                    <Link to="/sms-credits">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign w-4 h-4" aria-hidden="true">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>

                        </span>
                        {t('sidebar.smsCredits')}
                    </Link>
                </li>
                <li className={isActive('/tickets') ? 'active' : ''}>
                    <Link to="/tickets" className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-life-buoy w-4 h-4" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="12" r="4"></circle>
                                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                                    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                                    <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
                                    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                                </svg>
                            </span>
                            {t('sidebar.tickets') || 'Support Tickets'}
                        </div>
                        {totalUnread > 0 && (
                            <span
                                className="badge rounded-pill bg-danger d-flex align-items-center justify-content-center"
                                style={{
                                    fontSize: '10px',
                                    minWidth: '18px',
                                    height: '18px',
                                    marginLeft: '10px',
                                    padding: '2px 5px'
                                }}
                            >
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </Link>
                </li>
                <li className={isActive('/settings') ? 'active' : ''}>
                    <Link to="/settings">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings w-4 h-4" aria-hidden="true">
                                <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </span>
                        {t('sidebar.settings')}
                    </Link>
                </li>
                <li className="adminpanel">
                    <Link to="#" onClick={logout} >
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="lucide lucide-log-out w-4 h-4" aria-hidden="true">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 
                                        2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </span>
                        {t('sidebar.logout')}
                    </Link>
                </li>

            </ul>
            {/* User Information Section */}
            <div className="userinfo">
                <div className="username">
                    <div>
                        {user?.companyLogo ? (
                            // ✅ Show logo image
                            <img
                                src={user.companyLogo}
                                alt={user?.name || "User Logo"}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/user/images/no-image.webp";
                                }}
                            />
                        ) : (
                            <span>{userInitials}</span>
                        )}
                        {/* <span>{userInitials}</span> */}
                        <h5>{user?.name || "No Name"}</h5>
                        <h6>{user?.email || "No Email"}</h6>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SideBar;