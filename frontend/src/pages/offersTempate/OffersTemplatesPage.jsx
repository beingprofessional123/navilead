import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import Swal from 'sweetalert2';
import LimitModal from '../../components/LimitModal'; // the modal we created earlier
import { useLimit } from "../../context/LimitContext";


const OffersTemplatesPage = () => {
    const { t } = useTranslation();
    const { checkLimit, isLimitModalOpen, currentLimit, closeLimitModal,isOfferPageCustomizationAllowed, refreshPlan, userPlan } = useLimit();
    const { authToken, user } = useContext(AuthContext);
    const [offerTemplates, setTemplate] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const navigate = useNavigate();

    const handleCreateOfferClick = () => {
        // 🚫 Check if offer customization is allowed for current plan
        if (!isOfferPageCustomizationAllowed()) {
            Swal.fire({
            icon: "warning",
            title: "Access Denied",
            text: "Your current plan does not allow creating or customizing templates. Please upgrade to access this feature.",
            confirmButtonText: "OK",
            customClass: {
                popup: 'custom-swal-popup'
            }
            });
            return;
        }

        // 🗓️ Check if plan start date exists
        if (!userPlan?.startDate) {
            toast.error("Plan start date not found");
            return;
        }

        const planStartDate = new Date(userPlan.startDate);

        // ✅ Count only offers created on/after plan start date
        const filteredOffers = offerTemplates.filter((offer) => {
            const createdAt = new Date(offer.createdAt);
            return createdAt >= planStartDate;
        });

        const currentOfferCount = filteredOffers.length;

        // ✅ Check plan limit
        const canProceed = checkLimit(currentOfferCount, "Offers_Templates");

        if (canProceed) {
            navigate("/templatesoffers/create");
        }
    };

    const handleSelectTemplate = async (tmpl) => {
        setSelectedTemplate(tmpl); // Update selected template in state
        await handleMarkAsDefault(tmpl.id); // Mark as active
    };



    const fetchUserTemplate = async () => {
        try {
            const response = await api.get('/offers-templates', {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.data && response.data.length > 0) {
                setTemplate(response.data); // ✅ keep full array
                const activeTemplate = response.data.find(tmpl => tmpl.status === 'active');
                if (activeTemplate) {
                    setSelectedTemplate(activeTemplate);
                }
            } else {
                setTemplate([]);
            }

        } catch (error) {
            console.error("Error fetching user template:", error);
            if (error.response && error.response.status === 404) {
                toast.info("No template found. Please create one.");
            } else {
                toast.error("Failed to load template");
            }
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (authToken) {
            fetchUserTemplate();
        }
    }, [authToken]);


    const handleDeleteTemplate = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            customClass: {
                popup: 'custom-swal-popup'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/offers-templates/${id}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                // Remove the deleted template from state
                setTemplate(prev => prev.filter(tmpl => tmpl.id !== id));

                fetchUserTemplate();

                Swal.fire(
                    'Deleted!',
                    'Template has been deleted.',
                    'success'
                );
            } catch (error) {
                console.error("Error deleting template:", error);
                Swal.fire(
                    'Error!',
                    'Failed to delete template.',
                    'error'
                );
            }
        }
    };

    const handleCopyTemplate = async (template) => {
        try {


            if (!isOfferPageCustomizationAllowed()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Access Denied',
                    text: 'Your current plan does not allow creating or customizing templates. Please upgrade to access this feature.',
                    confirmButtonText: 'OK',
                    customClass: {
                        popup: 'custom-swal-popup'
                    }
                });
                return;
            }

            const currentOfferCount = offerTemplates.length;
            const canProceed = checkLimit(currentOfferCount, "Offers_Templates");

            if (!canProceed) return;

            const formData = new FormData();
            // 🔹 Basic details
            formData.append('title', `Copy of ${template.title || 'Untitled Template'}`);
            formData.append('description', template.description || '');
            formData.append('companyName', template.companyName || '');
            formData.append('aboutUsDescription', template.aboutUsDescription || '');
            formData.append('htmlCode', template.htmlCode || '');
            formData.append('type', template.type || 'Default');

            // 🔹 Colors
            formData.append('mainBgColor', template.mainBgColor || '#ffffff');
            formData.append('leftCardBgColor', template.leftCardBgColor || '#ffffff');
            formData.append('rightCardBgColor', template.rightCardBgColor || '#ffffff');
            formData.append('textColor', template.textColor || '#000000');
            formData.append('subTextColor', template.subTextColor || '#000000');
            formData.append('status', 'inactive');

            // 🔹 Logos (handle existing URLs)
            if (template.companyLogo) {
                formData.append('companyLogoUrl', template.companyLogo);
                // backend should check if `companyLogoUrl` exists and copy from URL directly
            }

            if (template.aboutUsLogo) {
                formData.append('aboutUsLogoUrl', template.aboutUsLogo);
            }

            // 🔹 Send request
            await api.post(`/offers-templates/create`, formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Copy of Template created successfully!');
            fetchUserTemplate(); // refresh list if needed
        } catch (error) {
            console.error(error);
            toast.error('Failed to create template.');
        }
    };




    const handleMarkAsDefault = async (templateId) => {
        try {
            await api.patch(`/offers-templates/${templateId}/mark-default`, {}, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            toast.success('Template marked as Active successfully!');

            // Refresh templates
            fetchUserTemplate();
        } catch (error) {
            console.error('Error marking template as default:', error);
            toast.error('Failed to mark template as default.');
        }
    };

    return (
        <>
            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-6">
                            <div className="dash-heading">
                                <h2>{t('offerTemplate.pagetitle')}</h2>
                                <p>{t('offerTemplate.pagesubtitle')}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="dashright">
                                <button type='button' onClick={handleCreateOfferClick} className="btn btn-send">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                    {t('offerTemplate.newTemplateBtn')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="carddesign activetemplate-form">
                        <div className="activetemplate">
                            <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></span>
                            <h4>{t('offerTemplate.activeTemplatesTitle')}</h4>
                            <h5>{t('offerTemplate.activeTemplatesSubtitle')}</h5>
                        </div>
                        <div className="formdesign">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group mb-1">
                                        <label><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path></svg>{t('offerTemplate.offerPageLabel')}</label>
                                        <div className="inputselect">
                                            <div className="dropdown leaddropdown sendemaidropdown">
                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-4 h-4 text-primary" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><span>{selectedTemplate ? selectedTemplate.title || selectedTemplate.title : t("offerTemplate.defaultOfferName")}</span>
                                                </button>
                                                <ul className="dropdown-menu">
                                                    {offerTemplates && offerTemplates.length > 0 ? (
                                                        offerTemplates.map((tmpl) => (
                                                            <li key={tmpl.id}>
                                                                <Link className="dropdown-item" to="#" onClick={() => handleSelectTemplate(tmpl)}>
                                                                    {/* Icon based on template type or status */}
                                                                    {tmpl.type === 'Default' ? (
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            width="24"
                                                                            height="24"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            className="lucide lucide-lock"
                                                                            aria-hidden="true"
                                                                        >
                                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            width="24"
                                                                            height="24"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            className="lucide lucide-code"
                                                                            aria-hidden="true"
                                                                        >
                                                                            <path d="m16 18 6-6-6-6" />
                                                                            <path d="m8 6-6 6 6 6" />
                                                                        </svg>
                                                                    )}

                                                                    {/* Template name */}
                                                                    {tmpl.title}

                                                                    {/* Optional status tag */}
                                                                    {tmpl.type === 'Default' && (
                                                                        <div className="status status7">{t('offerTemplate.standardTag')}</div>
                                                                    )}
                                                                </Link>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>
                                                            <span className="dropdown-item text-muted">No templates available</span>
                                                        </li>
                                                    )}
                                                </ul>

                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                        </div>
                                        <span className="inputnote">{t('offerTemplate.offerPageNote')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Standard Offer Template Card */}
                        {offerTemplates.length > 0 ? (
                            offerTemplates.map((tmpl) => (
                                <div className="col-xl-4 col-lg-6 col-md-6" key={tmpl.id}>
                                    <div className={`carddesign activetemplate-card ${tmpl.status === 'active' ? 'active' : ''}`}>
                                        <div className="activetemplatecard-top">
                                            {tmpl.status === 'active' ? (
                                                <>
                                                    <h4>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock text-primary" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                        {tmpl.title || "Untitled Tmpl"}
                                                    </h4>
                                                    <div className="activetemplatecard-topright">
                                                        {tmpl.status === 'active' ? (
                                                            <div className="status status9">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                                                                {t('offerTemplate.statusActive')}
                                                            </div>
                                                        ) : (
                                                            <div className="status status9 bg-danger">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x" aria-hidden="true"> <path d="M18 6 6 18" /> <path d="m6 6 12 12" /></svg>
                                                                {t('offerTemplate.statusInActive')}
                                                            </div>
                                                        )}
                                                        {tmpl.type === 'Default' ? (
                                                            <div className="status status7">{t('offerTemplate.standardTag')}</div>
                                                        ) : (
                                                            <div className="status status7">{tmpl.type}</div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <h4>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code text-muted-foreground" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>
                                                        {tmpl.title || "Untitled Tmpl"}
                                                    </h4>
                                                    <div className="activetemplatecard-topright">
                                                        <div className="status statusno">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code text-muted-foreground" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p>{tmpl.description}</p>
                                        <div className="activetemplate-carddate">
                                            <div className="activetemplate-carddateleft">
                                                {t('offerTemplate.lastEdited')} {" "}
                                                {new Date(tmpl.updatedAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </div>
                                            <div className="activetemplate-carddateright">
                                                {tmpl.type === 'Default' ? (
                                                    <>

                                                        <div className="status status7">{t('offerTemplate.standardTag')}</div>
                                                        <div className="status status7">{t('offerTemplate.offerTag')}</div>
                                                    </>

                                                ) : (
                                                    <>
                                                        <div className="status status7">{t('offerTemplate.customTag')}</div>
                                                        <div className="status status7">{t('offerTemplate.offerTag')}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="activetemplate-cardbtn">
                                            {tmpl.type === 'Default' ? (
                                                <>
                                                    <Link to={`/templatesoffers/${tmpl.type}/edit/${tmpl.id}`} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>{t('offerTemplate.editBtn')}</Link>
                                                    <Link to={`/templatesoffers/${tmpl.type}/view/${tmpl.id}`} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('offerTemplate.previewBtn')}</Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link to={`/templatesoffers/${tmpl.type}/edit/${tmpl.id}`} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>{t('offerTemplate.editBtn')}</Link>
                                                    <Link to={`/templatesoffers/${tmpl.type}/view/${tmpl.id}`} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('offerTemplate.previewBtn')}</Link>
                                                    <Link to="#" onClick={() => handleCopyTemplate(tmpl)} className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>{t('offerTemplate.duplicateBtn')}</Link>
                                                    <Link to="#" onClick={() => handleDeleteTemplate(tmpl.id)} className="btn btn-send btntrash2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>{t('offerTemplate.deleteBtn')}</Link>


                                                </>
                                            )}
                                        </div>
                                        <div className="activetemplatecard-ab">
                                            {tmpl.status === 'active' && (
                                                <>
                                                    <span className="bg-primary10"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock w-3 h-3 text-primary" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
                                                    <span className="bg-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-3 h-3 text-primary-foreground" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center">
                                <p className='text-danger'>{t('pricingTemplatesPage.noTemplatesFound')}</p> {/* td */}
                            </div>
                        )}


                        {/* Create New Template Card */}
                        <div className="col-xl-4 col-lg-6 col-md-6">
                            <a href='#' onClick={handleCreateOfferClick}>
                                <div className="carddesign opennew-template">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg></span>
                                    <h4>{t('offerTemplate.createNewTemplateTitle')}</h4>
                                    <p>{t('offerTemplate.createNewTemplateDesc')}</p>
                                </div>
                            </a>
                        </div>

                        {/* About Templates Card */}
                        <div className="col-md-12">
                            <div className="carddesign om-templates">
                                <div className="om-templatesin">
                                    <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-primary" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg></span>
                                    <h4>{t('offerTemplate.aboutTemplatesTitle')}</h4>
                                    <p>{t('offerTemplate.aboutTemplatesDesc')}</p>
                                    <ul>
                                        <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-receipt text-primary" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path></svg><strong>{t('offerTemplate.listOfferPageTitle')}:</strong> {t('offerTemplate.listOfferPageDesc')}</li>
                                        <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock text-primary" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><strong>{t('offerTemplate.listStandardTitle')}:</strong> {t('offerTemplate.listStandardDesc')}</li>
                                        <li><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code text-primary" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg><strong>{t('offerTemplate.listCustomTitle')}:</strong> {t('offerTemplate.listCustomDesc')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

           <LimitModal
                isOpen={isLimitModalOpen}
                onClose={closeLimitModal}
                usedLimit={currentLimit.usage}
                totalAllowed={currentLimit.totalAllowed}
                currentLimit={currentLimit}
                userPlan={userPlan}
            />
          
        </>
    );
};

export default OffersTemplatesPage;