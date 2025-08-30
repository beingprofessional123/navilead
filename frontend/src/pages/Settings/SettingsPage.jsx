import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
    const { authToken } = useContext(AuthContext);
    const { t: translate } = useTranslation();

    // State for Account & Profile
    const [companyName, setCompanyName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');

    // State for Notifications
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [desktopNotifications, setDesktopNotifications] = useState(true);

    // State for Region & Language
    const [timezone, setTimezone] = useState('Europa/København');
    const [currency, setCurrency] = useState('DKK (Danske kroner)');
    const [language, setLanguage] = useState('Dansk');

    // State for Email Signature
    const [emailSignature, setEmailSignature] = useState('');

    // State for Corporate Branding (Logo)
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [currentLogo, setCurrentLogo] = useState({ name: 'navilead-logo.png', uploaded: '2 days ago' }); // Mock existing logo
    const logoFileInputRef = useRef(null);

    // State for Corporate Branding (Colors)
    const [primaryColor, setPrimaryColor] = useState('#00ffff');
    const [secondaryColor, setSecondaryColor] = useState('#1a1a2e');

    // Mock Users Data (replace with API calls in a real app)
    const mockUsers = [
        { id: 1, name: translate('settingsPage.userNameJohnDoe'), email: translate('settingsPage.userEmailJohnDoe'), role: translate('settingsPage.userRoleAdmin'), status: translate('settingsPage.userStatusActive') },
        { id: 2, name: translate('settingsPage.userNameJaneSmith'), email: translate('settingsPage.userEmailJaneSmith'), role: translate('settingsPage.userRoleSales'), status: translate('settingsPage.userStatusActive') },
        { id: 3, name: translate('settingsPage.userNamePeterHansen'), email: translate('settingsPage.userEmailPeterHansen'), role: translate('settingsPage.userRoleSales'), status: translate('settingsPage.userStatusInactive') },
    ];
    const activeUsers = mockUsers.filter(user => user.status === translate('settingsPage.userStatusActive')).length;
    const totalAllowedUsers = 5; // Mock total allowed users

    // --- Placeholder API Functions ---
    const fetchSettings = async () => {
        // In a real app, you would fetch all these settings from your backend
        // For now, they are initialized to their default/mock states.
        // setLoading(true);
        // try {
        //   const response = await api.get('/settings', { headers: { Authorization: `Bearer ${authToken}` } });
        //   setCompanyName(response.data.companyName);
        //   setContactEmail(response.data.contactEmail);
        //   setPhone(response.data.phone);
        //   setWebsite(response.data.website);
        //   setEmailNotifications(response.data.emailNotifications);
        //   // ... populate all other states
        // } catch (error) {
        //   toast.error(translate('api.settings.fetchError'));
        // } finally {
        //   setLoading(false);
        // }
    };

    useEffect(() => {
        fetchSettings();
    }, [authToken, translate]); // Added translate to dependencies

    const handleSaveChanges = async () => {
        // This function would send all updated settings to the backend
        // For now, it's a placeholder.
        console.log("Saving changes...");
        // try {
        //   await api.put('/settings', { companyName, contactEmail, phone, website, /* ... all other settings */ }, { headers: { Authorization: `Bearer ${authToken}` } });
        //   toast.success(translate('api.settings.saveSuccess'));
        // } catch (error) {
        //   toast.error(translate('api.settings.saveError'));
        // }
        toast.success(translate('api.settings.saveSuccess'));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            toast.error(translate('settingsPage.cannotUploadMessage'));
            return;
        }

        setCompanyLogoFile(file);
        setCurrentLogo({ name: file.name, uploaded: translate('settingsPage.systemLastUpdated') });

        // In a real app, you would upload the file to your backend/storage
        // const formData = new FormData();
        // formData.append('logo', file);
        // try {
        //     await api.post('/settings/upload-logo', formData, { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data' } });
        //     toast.success(translate('api.settings.logoUploadSuccess'));
        //     // Update currentLogo state with actual backend response data (e.g., filename, URL)
        // } catch (error) {
        //     toast.error(translate('api.settings.logoUploadError'));
        // }
        toast.success(translate('api.settings.logoUploadSuccess'));
    };

    const handleRemoveLogo = async () => {
        // In a real app, you would send a request to delete the logo from backend/storage
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
                // try {
                //     await api.delete('/settings/remove-logo', { headers: { Authorization: `Bearer ${authToken}` } });
                //     toast.success(translate('api.settings.logoRemoveSuccess'));
                // } catch (error) {
                //     toast.error(translate('api.settings.logoRemoveError'));
                // }
                toast.success(translate('api.settings.logoRemoveSuccess'));
            }
        });
    };

    const handlePreviewSignature = () => {
        Swal.fire({
            title: translate('settingsPage.previewButton'),
            html: `<pre style="white-space: pre-wrap; text-align: left; color: #fff; background: #212529; padding: 15px; border-radius: 8px;">${emailSignature || translate('settingsPage.defaultEmailSignaturePlaceholder')}</pre>`,
            confirmButtonText: translate('emailSmsPage.cancel'),
            customClass: {
                popup: 'swal2-dark'
            }
        });
    };

    const handleSaveSignature = async () => {
        // try {
        //     await api.put('/settings/email-signature', { signature: emailSignature }, { headers: { Authorization: `Bearer ${authToken}` } });
        //     toast.success(translate('api.settings.signatureSaveSuccess'));
        // } catch (error) {
        //     toast.error(translate('api.settings.signatureSaveError'));
        // }
        toast.success(translate('api.settings.signatureSaveSuccess'));
    };

    const handleInviteUser = async () => {
        const { value: email } = await Swal.fire({
            title: translate('settingsPage.inviteUserButton'),
            input: 'email',
            inputLabel: translate('settingsPage.contactEmailLabel'),
            inputPlaceholder: translate('settingsPage.contactEmailPlaceholder'),
            showCancelButton: true,
            confirmButtonText: translate('emailSmsPage.send'), // Reusing "Send"
            cancelButtonText: translate('emailSmsPage.cancel'),
            inputValidator: (value) => {
                if (!value) {
                    return translate('offerPage.askQuestionInputValidator'); // Reusing "You need to write something!"
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Please enter a valid email address.'; // This specific validation might not need i18n if it's generic
                }
                return null;
            },
            customClass: {
                popup: 'swal2-dark'
            }
        });

        if (email) {
            // try {
            //     await api.post('/users/invite', { email }, { headers: { Authorization: `Bearer ${authToken}` } });
            //     toast.success(translate('api.settings.userInviteSuccess'));
            // } catch (error) {
            //     toast.error(translate('api.settings.userInviteError'));
            // }
            toast.success(translate('api.settings.userInviteSuccess', { email }));
        }
    };

    const handleEditUser = (userId) => {
        console.log(`Editing user ${userId}`);
        // Implement logic to open a modal or navigate to edit user details
        toast.info(`Feature to edit user ${userId} coming soon!`);
    };

    return (
        <div className="mainbody">
            <div className="container-fluid">
                <MobileHeader /> {/* This component handles the mobile header from your input */}
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
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate('settingsPage.companyNameLabel')}</label>
                                        <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={translate('settingsPage.companyNamePlaceholder')} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>{translate('settingsPage.contactEmailLabel')}</label>
                                        <input type="text" className="form-control" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={translate('settingsPage.contactEmailPlaceholder')} />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-2">
                                        <label>{translate('settingsPage.phoneLabel')}</label>
                                        <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={translate('settingsPage.phonePlaceholder')} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-2">
                                        <label>{translate('settingsPage.websiteLabel')}</label>
                                        <input type="text" className="form-control" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder={translate('settingsPage.websitePlaceholder')} />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
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
                                    <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
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
                                    <input type="checkbox" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </li>
                        <li>
                            <div className="notification-settings-left">
                                <h4>{translate('settingsPage.desktopNotificationsTitle')}</h4>
                                <h6>{translate('settingsPage.desktopNotificationsDescription')}</h6>
                            </div>
                            <div className="switchbtn">
                                <label className="switch">
                                    <input type="checkbox" checked={desktopNotifications} onChange={(e) => setDesktopNotifications(e.target.checked)} />
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
                            <div className="col-md-4">
                                <div className="form-group mb-1">
                                    <label>{translate('settingsPage.timezoneLabel')}</label>
                                    <div className="inputselect">
                                        <select className="form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                                            <option>{translate('settingsPage.timezoneCopenhagen')}</option>
                                            <option>{translate('settingsPage.timezoneStockholm')}</option>
                                            <option>{translate('settingsPage.timezoneOslo')}</option>
                                            <option>{translate('settingsPage.timezoneUTC')}</option>
                                        </select>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group mb-1">
                                    <label>{translate('settingsPage.currencyLabel')}</label>
                                    <div className="inputselect">
                                        <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                            <option>{translate('settingsPage.currencyDKK')}</option>
                                            <option>{translate('settingsPage.currencySEK')}</option>
                                            <option>{translate('settingsPage.currencyNOK')}</option>
                                            <option>{translate('settingsPage.currencyEUR')}</option>
                                            <option>{translate('settingsPage.currencyUSD')}</option>
                                        </select>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group mb-1">
                                    <label>{translate('settingsPage.languageLabel')}</label>
                                    <div className="inputselect">
                                        <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                            <option>{translate('settingsPage.languageDanish')}</option>
                                            <option>{translate('settingsPage.languageSwedish')}</option>
                                            <option>{translate('settingsPage.languageNorwegian')}</option>
                                            <option>{translate('settingsPage.languageEnglish')}</option>
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
                            <textarea className="form-control" rows="7" value={emailSignature} onChange={(e) => setEmailSignature(e.target.value)} placeholder={translate('settingsPage.defaultEmailSignaturePlaceholder')}></textarea>
                            <span className="inputnote">{translate('settingsPage.emailSignatureNote')}</span>
                        </div>
                        <div className="modalfooter">
                            <button className="btn btn-add" onClick={handlePreviewSignature}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                                {translate('settingsPage.previewButton')}
                            </button>
                            <button className="btn btn-send" onClick={handleSaveSignature}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                                {translate('settingsPage.saveSignatureButton')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Users */}
                <div className="carddesign cserscard">
                    <div className="workflowsadd">
                        <h2 className="card-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-primary" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
                            {translate('settingsPage.usersTitle')}
                        </h2>
                        <button className="btn btn-send" onClick={handleInviteUser}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                            {translate('settingsPage.inviteUserButton')}
                        </button>
                    </div>
                    <ul className="usersul">
                        {mockUsers.map(user => (
                            <li key={user.id}>
                                <div className="usersul-card">
                                    <div className="usersul-left">
                                        <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-primary" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                                        <div className="usersul-name">
                                            <h4>{user.name}</h4>
                                            <h6>{user.email}</h6>
                                        </div>
                                    </div>
                                    <div className="usersul-right">
                                        <div className="status"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield mr-1" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>{user.role}</div>
                                        <div className={`status ${user.status === translate('settingsPage.userStatusInactive') ? 'status4' : 'status3'}`}>{user.status}</div>
                                        <button className="btn btn-add" onClick={() => handleEditUser(user.id)}>{translate('settingsPage.editButton')}</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="modalfooter">
                        <span className="inputnote">{translate('settingsPage.activeUsersNote', { active: activeUsers, total: totalAllowedUsers })}</span>
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
                                            <input type="file" className="default-file-input" onChange={handleLogoUpload} ref={logoFileInputRef} />
                                            <span className="browse-files-text">{translate('settingsPage.uploadLogoText')}</span>
                                        </span>
                                    </label>
                                    <h3 className="dynamic-message">{translate('settingsPage.logoFileFormats')}</h3>
                                    {/* The "Vælg fil" button in the original HTML is redundant given the label.
                                        Keeping it as a button for direct click functionality if desired by user, otherwise the label handles it. */}
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
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image text-primary" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                        </span>
                                        <div className="uploadview-info">
                                            <h4>{companyLogoFile ? companyLogoFile.name : currentLogo.name}</h4>
                                            <h5>{translate('settingsPage.currentLogoUploadDate')}</h5> {/* Mocked upload date */}
                                        </div>
                                    </div>
                                    <button className="btn btn-add" onClick={handleRemoveLogo}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2 m-0" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="standardcolors">
                            <div className="formdesign">
                                <div className="form-group">
                                    <label>{translate('settingsPage.standardColorsLabel')}
                                        <p className="form-labelnot">{translate('settingsPage.standardColorsNote')}</p>
                                    </label>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>{translate('settingsPage.primaryColorLabel')}</label>
                                            <div className="standardcolors-main">
                                                <div className="standardcolorbox" style={{ backgroundColor: primaryColor }}></div>
                                                <input type="color" className="form-control" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ maxWidth: '94px', height: '36px' }} />
                                                <input type="text" className="form-control" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#00FFFF" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>{translate('settingsPage.secondaryColorLabel')}</label>
                                            <div className="standardcolors-main">
                                                <div className="standardcolorbox" style={{ backgroundColor: secondaryColor }}></div>
                                                <input type="color" className="form-control" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ maxWidth: '94px', height: '36px' }} />
                                                <input type="text" className="form-control" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="#1A1A2E" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
            <ToastContainer position="top-center" autoClose={3000} />
        </div>
    );
};

export default SettingsPage;
