import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
    const { authToken } = useContext(AuthContext);
    const { t: translate } = useTranslation();
    const [currencies, setCurrencies] = useState([]);

    // Consolidated formData state to include all fields
    const [formData, setFormData] = useState({
        companyName: "",
        email: "",
        phone: "",
        name: "",
        websiteUrl: "",
        timezone: "",
        currencyId: "",
        language: "en", // Default to English as per the original code
        emailSignature: "",
        primaryColor: "#00ffff", // Default values
        secondaryColor: "#1a1a2e", // Default values
        smtpHost: "",
        smtpPort: "",
        smtpUser: "",
        smtpPass: "",
        smtpEncryption: "",
        fromName: "",
        fromEmail: "",
        smtpActive: false
    });

    // State for Notifications
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);

    // State for Corporate Branding (Logo)
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const logoFileInputRef = useRef(null);

    // Mock Users Data (replace with API calls in a real app)
    const mockUsers = [
        { id: 1, name: translate('settingsPage.userNameJohnDoe'), email: translate('settingsPage.userEmailJohnDoe'), role: translate('settingsPage.userRoleAdmin'), status: translate('settingsPage.userStatusActive') },
        { id: 2, name: translate('settingsPage.userNameJaneSmith'), email: translate('settingsPage.userEmailJaneSmith'), role: translate('settingsPage.userRoleSales'), status: translate('settingsPage.userStatusActive') },
        { id: 3, name: translate('settingsPage.userNamePeterHansen'), email: translate('settingsPage.userEmailPeterHansen'), role: translate('settingsPage.userRoleSales'), status: translate('settingsPage.userStatusInactive') },
    ];
    const activeUsers = mockUsers.filter(user => user.status === translate('settingsPage.userStatusActive')).length;
    const totalAllowedUsers = 5; // Mock total allowed users

    // --- API Functions ---
    const fetchSettings = async () => {
        try {
            const response = await api.get("/settings", {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const data = response.data;
            const smtp = data.smtpSettings?.[0] || {};
            setFormData({
                companyName: data.user.companyName || "",
                email: data.user.email || "",
                phone: data.user.phone || "",
                name: data.user.name || "",
                websiteUrl: data.user.websiteUrl || "",
                timezone: data.user.timezone || "",
                currencyId: data.user.currencyId || "",
                language: data.user.language || "en",
                emailSignature: data.user.emailSignature || "",
                primaryColor: data.user.primaryColor || "#00ffff", // Assuming API returns this
                secondaryColor: data.user.secondaryColor || "#1a1a2e", // Assuming API returns this
                 smtpHost: smtp.smtpHost || "",
                    smtpPort: smtp.smtpPort || "",
                    smtpUser: smtp.smtpUser || "",
                    smtpPass: smtp.smtpPass || "",
                    smtpEncryption: smtp.smtpEncryption || "",
                    fromName: smtp.fromName || "",
                    fromEmail: smtp.fromEmail || "",
                    smtpActive: smtp.smtpActive || false,
            });

            // Extract notification settings from array
            const emailSetting = data.settings.find(s => s.key === "emailNotifications");
            const smsSetting = data.settings.find(s => s.key === "smsNotifications");

            setEmailNotifications(emailSetting?.value === "true");
            setSmsNotifications(smsSetting?.value === "true");


            // Set logo state if it exists
            if (data.user.companyLogo) {
                const logoUrl = data.user.companyLogo; // Already full URL
                setCurrentLogo({
                    url: logoUrl,
                    name: logoUrl.split("/").pop(), // extract filename like 1756718625055-26.jpeg
                    uploaded: translate("settingsPage.systemLastUpdated")
                });
            } else {
                setCurrentLogo(null);
            }

            // --- 🔄 Update localStorage (user) ---
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = {
                ...storedUser,
                apikey: data.user.apikey,
                companyLogo: data.user.companyLogo,
                companyName: data.user.companyName,
                currencyId: data.user.currencyId,
                email: data.user.email,
                language: data.user.language,
                name: data.user.name,
                phone: data.user.phone,
                stripeCustomerId: data.user.stripeCustomerId
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));


        } catch (error) {
            toast.error("Failed to fetch settings.");
        }
    };

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await api.get('/currencies');
                setCurrencies(response.data);
            } catch (error) {
                console.error("Error fetching currencies:", error);
                toast.error(translate('api.currencies.fetchError'));
            }
        };
        fetchCurrencies();
        fetchSettings();
    }, [authToken, translate]);

    // Handle input changes for all form fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Save all changes
    const handleSaveChanges = async () => {
        try {
            // Prepare data to send
            const updateData = {};
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== "" && formData[key] !== null) {
                    updateData[key] = formData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                toast.warn("No changes to update.");
                return;
            }

            // Send update request
            const response = await api.put("/settings", updateData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const updatedUser = response.data.user;
            console.log("Updated user from API:", updatedUser);

            if (updatedUser) {
                // Get existing user from localStorage
                const existingUser = JSON.parse(localStorage.getItem("user")) || {};

                // Only update specific fields from API user object
                const newUser = {
                    ...existingUser,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    currencyId: updatedUser.currencyId,
                    language: updatedUser.language,
                    companyName: updatedUser.companyName,
                    companyLogo: updatedUser.companyLogo,
                };

                // Save back to localStorage
                localStorage.setItem("user", JSON.stringify(newUser));
                localStorage.setItem("i18nextLng", newUser.language || "en");
            }
            toast.success("Settings updated successfully!");
            fetchSettings();
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings.");
        }
    };



    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            toast.error(translate('settingsPage.cannotUploadMessage'));
            return;
        }

        setCompanyLogoFile(file);
        setCurrentLogo({ name: file.name, uploaded: translate('settingsPage.systemLastUpdated') });

        const formData = new FormData();
        formData.append('logo', file);
        try {
            await api.post('/settings/upload-logo', formData, {
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
            cancelButtonText: translate('emailSmsPage.cancel'),
            customClass: {
                popup: 'custom-swal-popup'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                setCompanyLogoFile(null);
                setCurrentLogo(null);
                if (logoFileInputRef.current) {
                    logoFileInputRef.current.value = null; // Clear file input
                }
                try {
                    await api.delete('/settings/remove-logo', { headers: { Authorization: `Bearer ${authToken}` } });
                    toast.success(translate('api.settings.logoRemoveSuccess'));
                    fetchSettings();
                    setTimeout(() => {
                        window.location.reload();
                    }, 5000);
                } catch (error) {
                    toast.error(translate('api.settings.logoRemoveError'));
                }
            }
        });
    };

    const handlePreviewSignature = () => {
        Swal.fire({
            title: translate('settingsPage.previewButton'),
            html: `<pre style="white-space: pre-wrap; text-align: left; color: #fff;">${formData.emailSignature || translate('settingsPage.defaultEmailSignaturePlaceholder')}</pre>`,
            confirmButtonText: translate('emailSmsPage.cancel'),
            customClass: {
                popup: 'custom-swal-popup',
                title: 'custom-swal-title',
                confirmButton: 'custom-swal-button'
            }
        });
    };

    const handleNotificationChange = async (type, value) => {
        // Update local state immediately
        if (type === 'email') setEmailNotifications(value);
        if (type === 'sms') setSmsNotifications(value);

        try {
            // Send update to backend
            await api.put('/settings/notifications',
                {
                    emailNotifications: type === 'email' ? value : emailNotifications,
                    smsNotifications: type === 'sms' ? value : smsNotifications
                },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            toast.success('Notification settings updated!');
        } catch (error) {
            toast.error('Failed to update notification settings.');
            // Optionally revert toggle on error
            if (type === 'email') setEmailNotifications(!value);
            if (type === 'sms') setSmsNotifications(!value);
        }
    };

  const handleSaveSmttpChanges = async () => {
    const requiredFields = {
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpUser: formData.smtpUser,
        smtpPass: formData.smtpPass,
        smtpEncryption: formData.smtpEncryption,
        fromName: formData.fromName,
        fromEmail: formData.fromEmail,
    };

    // SAFE VALIDATION (no trim error)
    const emptyFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || String(value).trim() === "")
        .map(([key]) => key);

    if (emptyFields.length > 0) {
        toast.error(translate("settingsPage.allFieldsRequired"));
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.fromEmail)) {
        return toast.error(translate("settingsPage.validation.fromEmail"));
    }

    try {
        await api.put("/settings/smtp", {
            smtpHost: formData.smtpHost,
            smtpPort: formData.smtpPort,
            smtpUser: formData.smtpUser,
            smtpPass: formData.smtpPass,
            smtpEncryption: formData.smtpEncryption,
            fromName: formData.fromName,
            fromEmail: formData.fromEmail,
            smtpActive: formData.smtpActive
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        toast.success(translate("settingsPage.smtpSavedSuccess"));
        fetchSettings();
    } catch (error) {
        console.error(error);
        toast.error(translate("settingsPage.smtpSavedError"));
    }
};




    return (
        <div className="mainbody">
            <div className="container-fluid">
                <MobileHeader />
                <div className="row top-row">
                    <div className="col-md-6">
                        <div className="dash-heading">
                            <h2>{translate('settingsPage.title')}</h2>
                            <p>{translate('settingsPage.description')}</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="dashright">
                            <button className="btn btn-send" onClick={handleSaveChanges}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                {translate('settingsPage.saveChangesButton')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account & Profile */}
                <div className="carddesign">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-primary" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        {translate('settingsPage.accountProfileTitle')}
                    </h2>
                    <div className="formdesign">
                        <form>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>{translate('settingsPage.NameLabel')}</label>
                                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder={translate('settingsPage.namePlaceholder')} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate('settingsPage.companyNameLabel')}</label>
                                        <input type="text" className="form-control" name="companyName" value={formData.companyName} onChange={handleChange} placeholder={translate('settingsPage.companyNamePlaceholder')} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate('settingsPage.contactEmailLabel')}</label>
                                        <input type="text" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder={translate('settingsPage.contactEmailPlaceholder')} />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-2">
                                        <label>{translate('settingsPage.phoneLabel')}</label>
                                        <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder={translate('settingsPage.phonePlaceholder')} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-2">
                                        <label>{translate('settingsPage.websiteLabel')}</label>
                                        <input type="text" className="form-control" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder={translate('settingsPage.websitePlaceholder')} />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                {/* smtp detials */}
                <div className="carddesign">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                            className="lucide lucide-mail text-primary">
                            <path d="M4 4h16v16H4z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {translate("settingsPage.smtpSettings")}
                    </h2>

                    <div className="formdesign">
                        <form>
                            <div className="row">

                                {/* SMTP HOST */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.smtpHost")} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="smtpHost"
                                            value={formData.smtpHost}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.smtpHostPlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* SMTP PORT */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.smtpPort")} *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="smtpPort"
                                            value={formData.smtpPort}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.smtpPortPlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* USERNAME */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.smtpUsername")} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="smtpUser"
                                            value={formData.smtpUser}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.smtpUsernamePlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.smtpPassword")} *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="smtpPass"
                                            value={formData.smtpPass}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.smtpPasswordPlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* ENCRYPTION */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.smtpEncryption")}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="smtpEncryption"
                                            value={formData.smtpEncryption}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.smtpEncryptionPlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* FROM NAME */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.fromName")}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="fromName"
                                            value={formData.fromName}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.fromNamePlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* FROM EMAIL */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.fromEmail")}</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="fromEmail"
                                            value={formData.fromEmail}
                                            onChange={handleChange}
                                            placeholder={translate("settingsPage.fromEmailPlaceholder")}
                                        />
                                    </div>
                                </div>

                                {/* ACTIVE SWITCH */}
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate("settingsPage.status")}</label>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="smtpActive"
                                                checked={formData.smtpActive}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, smtpActive: e.target.checked })
                                                }
                                            />
                                            <span className="ms-2">
                                                {formData.smtpActive
                                                    ? translate("settingsPage.active")
                                                    : translate("settingsPage.inactive")}
                                            </span>

                                        </div>
                                    </div>

                                    {/* Status message */}
                                    {formData.smtpActive ? (
                                        <p className="text-success mt-2">
                                            {translate("settingsPage.activeMessage")}
                                        </p>
                                    ) : (
                                        <p className="text-warning mt-2">
                                            {translate("settingsPage.inactiveMessage")}
                                        </p>
                                    )}
                                </div>

                            </div>
                        </form>
                    </div>

                    <button className="btn btn-send" onClick={handleSaveSmttpChanges}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                        {translate('settingsPage.saveChangesButton')}
                    </button>
                </div>


                {/* Notifications */}
                <div className="carddesign">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell text-primary" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></svg>
                        {translate('settingsPage.notificationsTitle')}
                    </h2>
                    <ul className="notification-settings">
                        <li>
                            <div className="notification-settings-left">
                                <h4>{translate('settingsPage.emailNotificationsTitle')}</h4>
                                <h6>{translate('settingsPage.emailNotificationsDescription')}</h6>
                            </div>
                            <div className="switchbtn">
                                <label className="switch">
                                    <input type="checkbox" checked={emailNotifications} onChange={(e) => handleNotificationChange('email', e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </li>
                        <li>
                            <div className="notification-settings-left">
                                <h4>{translate('settingsPage.smsNotificationsTitle')}</h4>
                                <h6>{translate('settingsPage.smsNotificationsDescription')}</h6>
                            </div>
                            <div className="switchbtn">
                                <label className="switch">
                                    <input type="checkbox" checked={smsNotifications} onChange={(e) => handleNotificationChange('sms', e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Region & Language */}
                <div className="carddesign">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe text-primary" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                        {translate('settingsPage.regionLanguageTitle')}
                    </h2>
                    <div className="formdesign">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group mb-1">
                                    <label>{translate('settingsPage.currencyLabel')}</label>
                                    <div className="inputselect">
                                        <select
                                            className="form-select"
                                            id="currencySelect"
                                            name="currencyId"
                                            value={formData.currencyId}
                                            onChange={handleChange}
                                        >
                                            {currencies.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.code} ({c.symbol})
                                                </option>
                                            ))}
                                        </select>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group mb-1">
                                    <label>{translate('settingsPage.languageLabel')}</label>
                                    <div className="inputselect">
                                        <select className="form-select" name="language" value={formData.language} onChange={handleChange}>
                                            <option value="da">{translate('settingsPage.languageDanish')}</option>
                                            <option value="en">{translate('settingsPage.languageEnglish')}</option>
                                        </select>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Signature */}
                <div className="carddesign emailsignature">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-primary" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                        {translate('settingsPage.emailSignatureTitle')}
                    </h2>
                    <div className="formdesign">
                        <div className="form-group">
                            <label>{translate('settingsPage.defaultEmailSignatureLabel')}</label>
                            <textarea className="form-control" rows="7" name="emailSignature" value={formData.emailSignature} onChange={handleChange} placeholder={translate('settingsPage.defaultEmailSignaturePlaceholder')}></textarea>
                            <span className="inputnote">{translate('settingsPage.emailSignatureNote')}</span>
                        </div>
                        <div className="modalfooter">
                            <button className="btn btn-add" onClick={handlePreviewSignature}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                {translate('settingsPage.previewButton')}
                            </button>
                            <button className="btn btn-send" onClick={handleSaveChanges}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                                {translate('settingsPage.saveChangesButton')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Corporate Branding */}
                <div className="carddesign corporate-branding">
                    <h2 className="card-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palette text-primary" aria-hidden="true"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"></path><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
                        {translate('settingsPage.corporateBrandingTitle')}
                    </h2>
                    <div className="formdesign">
                        <div className="form-group">
                            <label className="form-label">{translate('settingsPage.companyLogoLabel')}
                                <p className="form-labelnot">{translate('settingsPage.companyLogoNote')}</p>
                            </label>
                            <div className="upload-files-container">
                                <div className="drag-file-area">
                                    <span className="material-icons-outlined upload-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                                    </span>
                                    <label className="label">
                                        <span className="browse-files">
                                            <input type="file" className="default-file-input" accept="image/*" onChange={handleLogoUpload} ref={logoFileInputRef} />
                                            <span className="browse-files-text">{translate('settingsPage.uploadLogoText')}</span>
                                        </span>
                                    </label>
                                    <h3 className="dynamic-message">{translate('settingsPage.logoFileFormats')}</h3>
                                    <button type="button" className="btn btn-add" onClick={() => logoFileInputRef.current?.click()}>
                                        {translate('settingsPage.chooseFileButton')}
                                    </button>
                                </div>
                            </div>

                            {/* Display current/uploaded logo */}
                            {currentLogo && (
                                <div className="carddesign uploadview mt-3">
                                    <div className="uploadview-left">
                                        <span className="uploadview-icon">
                                            <img
                                                src={currentLogo.url}
                                                alt="Company Logo"
                                                style={{ width: "42px", height: "42px", borderRadius: "8px" }}
                                            />

                                            {!currentLogo && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image text-primary" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                            )}
                                        </span>
                                        <div className="uploadview-info">
                                            <h4>{companyLogoFile ? companyLogoFile.name : currentLogo.name}</h4>
                                            {/* <h5>{translate('settingsPage.currentLogoUploadDate')}</h5> */}
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
                                        <h4>{translate('settingsPage.systemStatusTitle')}</h4>
                                        <h6>{translate('settingsPage.systemStatusDescription')}</h6>
                                    </div>
                                </div>
                                <div className="usersul-right">
                                    <div className="status status3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>{translate('settingsPage.systemStatusOnline')}</div>
                                    <div className="lastupdated">{translate('settingsPage.systemLastUpdated')}</div>
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
