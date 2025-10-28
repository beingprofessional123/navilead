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
        : 'JD';

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <Link to="/dashboard">
                    <img src="/assets/images/logo.svg" className="img-fluid" alt="Logo" />
                </Link>
            </div>
            <ul className="sidebar-menu">
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
                    <span>{userInitials}</span>
                    <h5>{user?.name}</h5>
                    <h6>{user?.email}</h6>
                </div>
            </div>
        </div>
    );
};

export default SideBar;