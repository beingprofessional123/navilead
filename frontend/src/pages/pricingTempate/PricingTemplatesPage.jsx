import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import PricingTemplateModal from './PricingTemplateModal';
import MobileHeader from '../../components/common/MobileHeader';
import { useTranslation } from "react-i18next"; // Import useTranslation
import LimitModal from '../../components/LimitModal'; // the modal we created earlier
import { useLimit } from "../../context/LimitContext";

const PricingTemplatesPage = () => {
    const { authToken } = useContext(AuthContext);
    const { t: translate } = useTranslation(); // Initialize the translation hook
    const { checkLimit, isLimitModalOpen, currentLimit, closeLimitModal, refreshPlan, userPlan } = useLimit();
    
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalShow, setModalShow] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
     const navigate = useNavigate();
      const location = useLocation();

        useEffect(() => {
          const params = new URLSearchParams(location.search);
          if (params.get("create") === "true") {
            handleCreateTemplate();
            navigate("/pricing-templates", { replace: true }); // ✅ removes ?create=true
          }
        }, [location.search]);

    const fetchPricingTemplates = async () => {
        if (!authToken) {
            setLoading(false);
            toast.error(translate('api.pricingTemplates.authError')); // Translated
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/pricing-templates', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching pricing templates:", error);
            const errorMessage = error.response?.data?.error || 'api.pricingTemplates.fetchError'; // Use backend message or default
            toast.error(translate(errorMessage)); // Translated
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricingTemplates();
    }, [authToken, translate]); // Added translate to dependencies

  const handleCreateTemplate = () => {
    if (!userPlan?.startDate) {
        toast.error("Plan start date not found");
        return;
    }

    const planStartDate = new Date(userPlan.startDate);

    // ✅ Count only pricing templates created after or on plan start date
    const filteredTemplates = templates.filter((template) => {
        const createdAt = new Date(template.createdAt);
        return createdAt >= planStartDate;
    });

    const currentCount = filteredTemplates.length;

    // ✅ Check plan limit
    const canProceed = checkLimit(currentCount, "Pricing_Templates");

    if (!canProceed) return;

    // ✅ Open modal if allowed
    setCurrentTemplate(null);
    setModalShow(true);
    };


    const handleEditTemplate = (template) => {
        setCurrentTemplate(template);
        setModalShow(true);
    };

    const handleDeleteTemplate = async (templateId) => {
        Swal.fire({
            title: translate('pricingTemplatesPage.deleteConfirmTitle'), // Translated
            text: translate('pricingTemplatesPage.deleteConfirmText'), // Translated
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: translate('pricingTemplatesPage.deleteConfirmButton'), // Translated
            cancelButtonText: translate('pricingTemplatesPage.cancelButton'), // Translated
            customClass: {
                popup: 'custom-swal-popup'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await api.delete(`/pricing-templates/${templateId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    toast.success(translate(response.data.message || 'api.pricingTemplates.deleteSuccess')); // Translated
                    fetchPricingTemplates();
                    refreshPlan();
                } catch (error) {
                    console.error("Error deleting template:", error);
                    const errorMessage = error.response?.data?.error || 'api.pricingTemplates.deleteError'; // Use backend message or default
                    toast.error(translate(errorMessage)); // Translated
                }
            }
        });
    };

    const handleSaveTemplate = () => {
        fetchPricingTemplates();
        refreshPlan();
        setModalShow(false);
    };

    const handleCopyTemplate = async (template) => {
        try {

            const currentCount = templates.length; // total templates used
            const canProceed = checkLimit(currentCount, "Pricing_Templates"); // match your plan key
            if (!canProceed) return; // stops if limit reached



            // Build new template data from existing one
            const copyData = {
                name: `(Copy) ${template.name}`,
                title: template.title,
                description: template.description,
                terms: template.terms,
                currencyId: template.currencyId,
                choiceType: template.choiceType,
                services: template.services.map((service) => ({
                    name: service.name,
                    description: service.description,
                    price: service.price,
                    quantity: service.quantity,
                    isRequired: service.isRequired,
                })),
            };

            // Call API to create the copy
            const response = await api.post('/pricing-templates', copyData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            // Success toast
            toast.success(
                translate(response.data.message || 'api.pricingTemplates.createSuccess')
            );

            // Refresh list
            fetchPricingTemplates();
            refreshPlan();
        } catch (error) {
            console.error("Error copying template:", error);
            toast.error(translate('api.pricingTemplates.copyError'));
        }
    };


    if (loading) {
        return <div className="loading">{translate('pricingTemplatesPage.loading')}</div>; // Translated
    }

    return (
        <>
           <div className="mainbody">
            <div className="container-fluid">
                <MobileHeader />
                <div className="row top-row">
                    <div className="col-md-6">
                        <div className="dash-heading">
                            <h2>{translate('pricingTemplatesPage.pricingTemplatesTitle')}</h2> {/* Translated */}
                            <p>{translate('pricingTemplatesPage.manageTemplatesDescription')}</p> {/* Translated */}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="dashright">
                            <Link href="#" className="btn btn-send" onClick={handleCreateTemplate}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5v14"></path>
                                </svg>
                                {translate('pricingTemplatesPage.newTemplateButton')} {/* Translated */}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {templates.length > 0 ? (
                        templates.map((template) => (
                            <div className="col-md-4" key={template.id}>
                                <div className="carddesign emailcard">
                                    <h2 className="card-title">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
                                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                            <path d="M10 9H8"></path>
                                            <path d="M16 13H8"></path>
                                            <path d="M16 17H8"></path>
                                        </svg>
                                        {template.name}
                                    </h2>
                                    <p>{translate('pricingTemplatesPage.servicesCount', { count: template.services ? template.services.length : 0 })}</p> {/* Translated */}
                                    <h4>
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: template.currency?.code || 'USD'
                                        }).format(
                                            template.services ? template.services.reduce((total, service) => total + (service.price * service.quantity), 0) : 0
                                        )}
                                    </h4>
                                    <div className="pricing-cardbtn">
                                        <Link href="#" className="btn btn-add" onClick={() => handleEditTemplate(template)}>{translate('pricingTemplatesPage.editButton')}</Link> {/* Translated */}
                                        <Link href="#" className="btn btn-add" onClick={() => handleCopyTemplate(template)}>{translate('pricingTemplatesPage.copyButton')}</Link> {/* Translated */}
                                        <Link to="#" className="btn btn-add">{translate('pricingTemplatesPage.useButton')}</Link> {/* Translated */}
                                        <Link href="#" className="btn btn-add" onClick={() => handleDeleteTemplate(template.id)}>{translate('pricingTemplatesPage.deleteButton')}</Link> {/* Translated */}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center">
                            <p className='text-danger'>{translate('pricingTemplatesPage.noTemplatesFound')}</p> {/* Translated */}
                        </div>
                    )}
                </div>
            </div>
        </div>
        
         {modalShow && (
                <PricingTemplateModal
                    show={modalShow}
                    onHide={() => setModalShow(false)}
                    template={currentTemplate}
                    onSave={handleSaveTemplate}
                />
            )}

         {/* Limit Modal */}
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

export default PricingTemplatesPage;
