import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/MobileHeader';
import { useTranslation } from "react-i18next";



const SettingsPage = () => {
    const { authToken } = useContext(AdminAuthContext);
    const { t: translate } = useTranslation();

    // Consolidated formData state for general settings
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        language: "en",
    });

    // State for Change Password section
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    // State for Corporate Branding (Logo)
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const logoFileInputRef = useRef(null);

    // --- API Functions ---
    const fetchSettings = async () => {
        try {
            const response = await api.get("/admin/settings", {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const data = response.data;
            setFormData({
                name: data.user.name || "",
                email: data.user.email || "",
                phone: data.user.phone || "",
                language: data.user.language || "en",
            });


            // Set logo state if it exists
            if (data.user.companyLogo) {
                const logoUrl = data.user.companyLogo; // Already full URL
                setCurrentLogo({
                    url: logoUrl,
                    name: logoUrl.split("/").pop(), // extract filename
                    uploaded: translate("admin.admin.settingsPage.systemLastUpdated")
                });
            } else {
                setCurrentLogo(null);
            }

            // --- 🔄 Update localStorage (AdminUser) ---
            const storedUser = JSON.parse(localStorage.getItem('AdminUser') || '{}');
            const updatedUser = {
                ...storedUser,
                name: data.user.name,
                email: data.user.email,
                phone: data.user.phone,
                language: data.user.language,
                companyLogo: data.user.companyLogo
            };
            localStorage.setItem('AdminUser', JSON.stringify(updatedUser));
        } catch (error) {
            toast.error(translate("api.settings.fetchError"));
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [authToken, translate]);

    // Handle input changes for all form fields (name, email, phone, language)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle input changes for password fields
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Save general settings changes
    const handleSaveChanges = async () => {
        try {
            // Prepare data to send
            const updateData = {};
            // Only include fields that have a value
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== "" && formData[key] !== null) {
                    updateData[key] = formData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                toast.warn(translate("admin.settingsPage.noChangesToUpdate"));
                return;
            }

            // Send update request
            const response = await api.put("/admin/settings", updateData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const updatedUser = response.data.user;

            if (updatedUser) {
                // Update local storage and i18n language
                const existingUser = JSON.parse(localStorage.getItem("AdminUser")) || {};
                const newUser = {
                    ...existingUser,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    language: updatedUser.language,
                    companyLogo: updatedUser.companyLogo,
                };

                localStorage.setItem("AdminUser", JSON.stringify(newUser));
                localStorage.setItem("i18nextLng", newUser.language || "en");
            }
            toast.success(translate("api.settings.updateSuccess"));
            fetchSettings();
             setTimeout(() => {
                window.location.reload();
            }, 5000);

        } catch (error) {
            console.error(error);
            toast.error(translate("api.settings.updateError"));
        }
    };

    // Save password changes
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmNewPassword } = passwordData;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast.error(translate("admin.settingsPage.allPasswordFieldsRequired"));
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast.error(translate("admin.settingsPage.passwordMismatch"));
            return;
        }

        try {
            await api.put("/admin/settings/change-password", {
                currentPassword,
                confirmPassword: confirmNewPassword,
                newPassword,
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            toast.success(translate("admin.settingsPage.passwordUpdateSuccess"));
            // Clear the password fields on success
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || translate("admin.settingsPage.passwordUpdateError");
            toast.error(errorMessage);
        }
    };


    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            toast.error(translate('admin.settingsPage.cannotUploadMessage'));
            return;
        }

        setCompanyLogoFile(file);
        setCurrentLogo({ name: file.name, uploaded: translate('admin.settingsPage.systemLastUpdated') });

        const formData = new FormData();
        formData.append('logo', file);
        try {
            await api.post('/admin/settings/upload-logo', formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success(translate('api.settings.logoUploadSuccess'));
            // Refetch settings to get the actual path from the backend
            fetchSettings();

            setTimeout(() => {
                window.location.reload();
            }, 5000);

        } catch (error) {
            toast.error(translate('api.settings.logoUploadError'));
        }
    };

    

    const handleRemoveLogo = async () => {
        Swal.fire({
            title: translate('emailSmsPage.areYouSure'),
            text: translate('emailSmsPage.revertWarning'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: translate('emailSmsPage.yesDeleteIt'),
            cancelButtonText: translate('emailSmsPage.cancel')
        }).then(async (result) => {
            if (result.isConfirmed) {
                setCompanyLogoFile(null);
                setCurrentLogo(null);
                if (logoFileInputRef.current) {
                    logoFileInputRef.current.value = null; // Clear file input
                }
                try {
                    await api.delete('/admin/settings/remove-logo', { headers: { Authorization: `Bearer ${authToken}` } });
                    toast.success(translate('api.settings.logoRemoveSuccess'));
                      setTimeout(() => {
                        window.location.reload();
                    }, 5000);

                } catch (error) {
                    toast.error(translate('api.settings.logoRemoveError'));
                }
            }
        });
    };

    return (
        <div className="mainbody">
            <div className="container-fluid">
                <MobileHeader />
                <div className="row top-row">
                    <div className="col-md-6">
                        <div className="dash-heading">
                            <h2>{translate('admin.settingsPage.title')}</h2>
                            <p>{translate('admin.settingsPage.description')}</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="dashright">
                            <button className="btn btn-send" onClick={handleSaveChanges}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                {translate('admin.settingsPage.saveChangesButton')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account & Profile */}
                <div className="carddesign">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-primary" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {translate('admin.settingsPage.accountProfileTitle')}
                    </h2>
                    <div className="formdesign">
                        <form>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate('admin.settingsPage.NameLabel')}</label>
                                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder={translate('admin.settingsPage.namePlaceholder')} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate('admin.settingsPage.contactEmailLabel')}</label>
                                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder={translate('admin.settingsPage.contactEmailPlaceholder')} />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group mb-2">
                                        <label>{translate('admin.settingsPage.phoneLabel')}</label>
                                        <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder={translate('admin.settingsPage.phonePlaceholder')} />
                                    </div>
                                </div>
                                {/* <div className="col-md-6">
                                    <div className="form-group mb-1">
                                        <label>{translate('admin.settingsPage.languageLabel')}</label>
                                        <div className="inputselect">
                                            <select className="form-select" name="language" value={formData.language} onChange={handleChange}>
                                                <option value="da">{translate('admin.settingsPage.languageDanish')}</option>
                                                <option value="en">{translate('admin.settingsPage.languageEnglish')}</option>
                                            </select>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Change Password - NEW SECTION */}
                <div className="carddesign change-password">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round text-primary" aria-hidden="true"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
                        {translate('admin.settingsPage.changePasswordTitle')}
                    </h2>
                    <div className="formdesign">
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>{translate('admin.settingsPage.currentPasswordLabel')}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            placeholder={translate('admin.settingsPage.currentPasswordPlaceholder')}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>{translate('admin.settingsPage.newPasswordLabel')}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            placeholder={translate('admin.settingsPage.newPasswordPlaceholder')}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>{translate('admin.settingsPage.confirmNewPasswordLabel')}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="confirmNewPassword"
                                            value={passwordData.confirmNewPassword}
                                            onChange={handlePasswordChange}
                                            placeholder={translate('admin.settingsPage.confirmNewPasswordPlaceholder')}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-send mt-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock-keyhole" aria-hidden="true"><circle cx="12" cy="16" r="1"></circle><rect width="18" height="12" x="3" y="10" rx="2"></rect><path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg>
                                {translate('admin.settingsPage.updatePasswordButton')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Corporate Branding */}
                <div className="carddesign corporate-branding">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palette text-primary" aria-hidden="true"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"></path><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
                        {translate('admin.settingsPage.corporateBrandingTitle')}
                    </h2>
                    <div className="formdesign">
                        <div className="form-group">
                            <label className="form-label">{translate('admin.settingsPage.profileLabel')}
                                <p className="form-labelnot">{translate('admin.settingsPage.profileNote')}</p>
                            </label>
                            <div className="upload-files-container">
                                <div className="drag-file-area">
                                    <span className="material-icons-outlined upload-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                                    </span>
                                    <label className="label">
                                        <span className="browse-files">
                                            <input type="file" className="default-file-input" accept="image/*" onChange={handleLogoUpload} ref={logoFileInputRef} />
                                            <span className="browse-files-text">{translate('admin.settingsPage.uploadLogoText')}</span>
                                        </span>
                                    </label>
                                    <h3 className="dynamic-message">{translate('admin.settingsPage.logoFileFormats')}</h3>
                                    <button type="button" className="btn btn-add" onClick={() => logoFileInputRef.current?.click()}>
                                        {translate('admin.settingsPage.chooseFileButton')}
                                    </button>
                                </div>
                            </div>

                            {/* Display current/uploaded logo */}
                            {currentLogo && (
                                <div className="carddesign uploadview mt-3">
                                    <div className="uploadview-left">
                                        <span className="uploadview-icon">
                                            {currentLogo.url ? (
                                                <img
                                                    src={currentLogo.url}
                                                    alt="Company Logo"
                                                    style={{ width: "42px", height: "42px", borderRadius: "8px" }}
                                                />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image text-primary" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                            )}
                                        </span>
                                        <div className="uploadview-info">
                                            <h4>{companyLogoFile ? companyLogoFile.name : currentLogo.name}</h4>
                                            {/* <h5>{translate('admin.settingsPage.currentLogoUploadDate')}</h5> */}
                                        </div>
                                    </div>
                                    <button className="btn btn-add" onClick={handleRemoveLogo}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2 m-0" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="carddesign systemstatus">
                    <ul className="usersul">
                        <li>
                            <div className="usersul-card">
                                <div className="usersul-left">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings text-primary" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></span>
                                    <div className="usersul-name">
                                        <h4>{translate('admin.settingsPage.systemStatusTitle')}</h4>
                                        <h6>{translate('admin.settingsPage.systemStatusDescription')}</h6>
                                    </div>
                                </div>
                                <div className="usersul-right">
                                    <div className="status status3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{translate('admin.settingsPage.systemStatusOnline')}</div>
                                    <div className="lastupdated">{translate('admin.settingsPage.systemLastUpdated')}</div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;