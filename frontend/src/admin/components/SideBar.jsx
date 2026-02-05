import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { useTranslation } from "react-i18next";
import api from '../utils/api'; // Apna api instance import karein
import { toast } from 'react-toastify';

const SideBar = () => {
    const { t } = useTranslation();
    const { user, logout, authToken } = useContext(AdminAuthContext); // authToken bhi nikal lein
    const location = useLocation();
    const [totalUnread, setTotalUnread] = useState(0);
    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };
    const notificationSound = new Audio('/NotificationSound.mp3');

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('')
        : 'JD'; // Default initials

    useEffect(() => {
        if (!authToken) return;

        const checkTicketChanges = async () => {
            try {
                // 1. Fetch Latest Settings
                const settingsRes = await api.post('/admin/tickets/update-setting', {}, {
                    headers: {
                        Authorization: `Bearer ${authToken}` // 👈 Token yahan pass hoga
                    }
                });
                const soundOn = settingsRes.data.notificationSoundTickets;

                // 2. Fetch Tickets List
                const res = await api.get('/admin/tickets', {
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
                const lastSnapshot = JSON.parse(localStorage.getItem('AdminticketSnapshot') || '[]');

                // Current data ka simplified snapshot banayein (sirf ID aur Status)
                const currentSnapshot = tickets.map(t => ({ id: t.id, status: t.status, unread: t.unreadCount }));

                // Agar pichla data exist karta hai, tabhi compare karein
                if (lastSnapshot.length > 0) {
                    const isTicketsPage = location.pathname === '/admin/tickets';

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
                localStorage.setItem('AdminticketSnapshot', JSON.stringify(currentSnapshot));
                localStorage.setItem('AdminprevUnreadCount', currentUnread); // Backward compatibility ke liye

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
                {/* Assuming /admin/dashboard is the correct path */}
                <Link to="/admin/users-management">
                    <img src="/assets/images/logo.svg" className="img-fluid" alt="Logo" />
                </Link>
            </div>
            <ul className="sidebar-menu">
                {/* Dashboard (Home Icon) */}
                {/* <li className={isActive('/admin/dashboard') ? 'active' : ''}>
                    <Link to="/admin/dashboard">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-house w-4 h-4" aria-hidden="true">
                                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            </svg>
                        </span>
                        {t('sidebar.dashboard')}
                    </Link>
                </li> */}
                {/* Users Management (Users Icon) */}
                <li className={isActive('/admin/users-management') ? 'active' : ''}>
                    <Link to="/admin/users-management">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-4 h-4" aria-hidden="true">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                        </span>
                        {t('sidebar.users-management')}
                    </Link>
                </li>
                {/* Subscription Plan Management (Money Icon) */}
                <li className={isActive('/admin/plan-management') ? 'active' : ''}>
                    <Link to="/admin/plan-management">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign w-4 h-4" aria-hidden="true">
                                <line x1="12" x2="12" y1="2" y2="22"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </span>
                        {t('sidebar.plan-management')}
                    </Link>
                </li>
                {/* Credit Plan Management (Money Icon) */}
                <li className={isActive('/admin/credit-plan-management') ? 'active' : ''}>
                    <Link to="/admin/credit-plan-management">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign w-4 h-4" aria-hidden="true">
                                <line x1="12" x2="12" y1="2" y2="22"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </span>
                        {t('sidebar.credit-plan-management')}
                    </Link>
                </li>
                {/* Transaction Management (Receipt Icon - UPDATED) */}
                <li className={isActive('/admin/transaction-management') ? 'active' : ''}>
                    <Link to="/admin/transaction-management">
                        <span>
                            {/* Icon changed from lucide-settings to lucide-receipt for better semantic fit */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt w-4 h-4" aria-hidden="true">
                                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2h-2m-14 0h16"></path>
                                <path d="M8 11h8"></path>
                                <path d="M8 15h8"></path>
                            </svg>
                        </span>
                        {t('sidebar.transaction-management')}
                    </Link>
                </li>
                <li className={isActive('/admin/tickets') ? 'active' : ''}>
                    <Link to="/admin/tickets" className="d-flex justify-content-between align-items-center">
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
                {/* Settings (Settings Icon - NEW) */}
                <li className={isActive('/admin/settings') ? 'active' : ''}>
                    <Link to="/admin/settings">
                        <span>
                            {/* Using lucide-settings for the new Settings tab */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings w-4 h-4" aria-hidden="true">
                                <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </span>
                        {t('sidebar.settings')} {/* Assuming this translation key exists */}
                    </Link>
                </li>
                {/* Logout */}
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