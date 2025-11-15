import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { useTranslation } from "react-i18next";

const SideBar = () => {
    const { t } = useTranslation();
    const { user, logout } = useContext(AdminAuthContext);
    const location = useLocation();

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('')
        : 'JD'; // Default initials

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                {/* Assuming /admin/dashboard is the correct path */}
                <Link to="/admin/dashboard"> 
                    <img src="/assets/images/logo.svg" className="img-fluid" alt="Logo" />
                </Link>
            </div>
            <ul className="sidebar-menu">
                {/* Dashboard (Home Icon) */}
                <li className={isActive('/admin/dashboard') ? 'active' : ''}>
                    <Link to="/admin/dashboard">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-house w-4 h-4" aria-hidden="true">
                                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            </svg>
                        </span>
                        {t('sidebar.dashboard')}
                    </Link>
                </li>
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