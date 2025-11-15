import React, { useEffect, useState, useContext } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import MobileHeader from '../../components/MobileHeader';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import MUIDataTable from "mui-datatables";

// Initial state for a new plan in the modal
const initialPlanState = {
    id: null,
    name: '',
    shortdescription: '',
    description: [], // Array to hold individual features
    price: 0,
    discount_percentage: 0,
    billing_type: 'monthly',
    api_access: false,
    Total_Leads_Allowed: 0,
    Total_offers_Allowed: 0,
    Total_emails_allowed: 0,
    Total_SMS_allowed: 0,
    Total_workflows_Allowed: 0,
    is_offerPage_customization_allowed: false,
    stripe_product_id: '',
    stripe_price_id: '',
    status: 'active',
};

const PlanManagementPage = () => {
    const { authToken } = useContext(AdminAuthContext);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalPlan, setModalPlan] = useState(initialPlanState);
    const [viewingPlan, setViewingPlan] = useState(null);
    const { t } = useTranslation();

    // Fetch all plans
    const fetchPlans = async () => {
        try {
            // Using /admin/plan-management as per your router
            const res = await api.get('/admin/plan-management', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setPlans(res.data.plans);
        } catch (err) {
            console.error(err);
            toast.error(t('admin.planManagement.alerts.fetchFail'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, [authToken]);

    // Open modal for adding a new plan
    const openAddModal = () => {
        setModalPlan(initialPlanState);
        setViewingPlan(null);
        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('planModal')).show();
    };

    // Open modal for editing an existing plan
    const openEditModal = (plan) => {
        setModalPlan({
            ...plan,
            // Convert description string from API (comma-separated) to Array for dynamic inputs
            description: plan.description
                ? plan.description.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [],
        });
        setViewingPlan(null);
        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('planModal')).show();
    };

    // Open modal for viewing an existing plan
    const viewPlan = (plan) => {
        setViewingPlan(plan);
        setModalPlan(initialPlanState);
        window.bootstrap.Modal.getOrCreateInstance(document.getElementById('planModal')).show();
    };

    // Standard handler for non-array fields
    const handleModalChange = (e) => {
        const { name, value, type, checked } = e.target;
        setModalPlan({
            ...modalPlan,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // Handler for updating a feature within the description array
    const handleFeatureChange = (index, value) => {
        const newDescription = [...modalPlan.description];
        newDescription[index] = value;
        setModalPlan({ ...modalPlan, description: newDescription });
    };

    // Handler for adding a new empty feature input
    const handleAddFeature = () => {
        setModalPlan({ ...modalPlan, description: [...modalPlan.description, ''] });
    };

    // Handler for removing a feature by index
    const handleRemoveFeature = (index) => {
        const newDescription = modalPlan.description.filter((_, i) => i !== index);
        setModalPlan({ ...modalPlan, description: newDescription });
    };

    const deletePlan = async (id) => {
        if (!window.confirm(t('admin.planManagement.alerts.deleteConfirm'))) return;
        try {
            await api.delete(`/admin/plan-management/${id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(t('admin.planManagement.alerts.deleteSuccess'));
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.planManagement.alerts.deleteFail'));
        }
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();

        // Prepare data for API
        const dataToSubmit = {
            ...modalPlan,
            // Convert feature array back to comma-separated string for API
            description: modalPlan.description
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .join(', '),
        };

        try {
            if (modalPlan.id) {
                // Edit plan
                await api.put(`/admin/plan-management/${modalPlan.id}`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success(t('admin.planManagement.alerts.updateSuccess'));
            } else {
                // Add new plan
                await api.post(`/admin/plan-management`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success(t('admin.planManagement.alerts.createSuccess'));
            }
            fetchPlans();
            window.bootstrap.Modal.getInstance(document.getElementById('planModal')).hide();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || t('admin.planManagement.alerts.saveFail'));
        }
    };

    // Update plan status
    const updateStatus = async (id, status) => {
        try {
            await api.put(`/admin/plan-management/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(t('admin.planManagement.alerts.statusUpdateSuccess'));
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.planManagement.alerts.statusUpdateFail'));
        }
    };



    if (loading) return <div>Loading...</div>;

    return (
        <>
            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-6">
                            <div className="dash-heading">
                                <h2>{t('admin.planManagement.title')}</h2>
                                <p>{t('admin.planManagement.subtitle')}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="dashright">
                                <Link to="#" onClick={openAddModal} className="btn btn-send">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('admin.planManagement.newPlanButton')}
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <div className="carddesign leadstable">
                                <div className="admin_tabledesign">
                                    <MUIDataTable
                                        title={t('admin.planManagement.allPlansTitle', { count: plans.length })}
                                        data={plans}
                                        columns={[
                                            {
                                                name: 'name',
                                                label: t('admin.planManagement.table.name'),
                                                options: {
                                                    filter: false,
                                                    sort: false,
                                                    customBodyRender: (value, tableMeta) => {
                                                        const plan = plans[tableMeta.rowIndex];
                                                        return (
                                                            <a
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    viewPlan(plan);
                                                                }}
                                                                className="leadlink"
                                                            >
                                                                {value}
                                                            </a>
                                                        );
                                                    },
                                                },
                                            },
                                            {
                                                name: 'price',
                                                label: t('admin.planManagement.table.priceBilling'),
                                                options: {
                                                    filter: false,
                                                    sort: false,
                                                    customBodyRender: (value, tableMeta) => {
                                                        const plan = plans[tableMeta.rowIndex];
                                                        return `DKK ${plan.price} / ${t(`admin.planManagement.table.billingType.${plan.billing_type}`)}`;
                                                    },
                                                },
                                            },
                                            {
                                                name: 'Total_Leads_Allowed',
                                                label: t('admin.planManagement.table.leads'),
                                                options: { filter: false, sort: false },
                                            },
                                            {
                                                name: 'Total_emails_allowed',
                                                label: t('admin.planManagement.table.emailsSMS'),
                                                options: {
                                                    filter: false,
                                                    sort: false,
                                                    customBodyRender: (value, tableMeta) => {
                                                        const plan = plans[tableMeta.rowIndex];
                                                        return `${plan.Total_emails_allowed} / ${plan.Total_SMS_allowed}`;
                                                    },
                                                },
                                            },
                                            {
                                                name: 'status',
                                                label: t('admin.planManagement.table.status'),
                                                options: {
                                                    filter: true,
                                                    sort: true,
                                                    filterOptions: { names: ['active', 'inactive'] },
                                                    customBodyRender: (value, tableMeta) => {
                                                        const plan = plans[tableMeta.rowIndex];
                                                        return (
                                                            <div className="dropdown leaddropdown">
                                                                <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                                                    <span className={`badge ${plan.status === 'active' ? 'badge4' : 'badge1'}`}>
                                                                        {t(`admin.planManagement.modal.input.${plan.status}`)}
                                                                    </span>
                                                                </button>
                                                                <ul className="dropdown-menu">
                                                                    <li><a className="dropdown-item" href="#" onClick={() => updateStatus(plan.id, 'active')}>{t('admin.planManagement.modal.input.active')}</a></li>
                                                                    <li><a className="dropdown-item" href="#" onClick={() => updateStatus(plan.id, 'inactive')}>{t('admin.planManagement.modal.input.inactive')}</a></li>
                                                                </ul>
                                                            </div>
                                                        );
                                                    },
                                                },
                                            },
                                            {
                                                name: 'actions',
                                                label: t('admin.planManagement.table.actions'),
                                                options: {
                                                    filter: false,
                                                    sort: false,
                                                    customBodyRenderLite: (dataIndex) => {
                                                        const plan = plans[dataIndex];
                                                        return (
                                                            <div className="actionbtn">
                                                                <div className="dropdown leaddropdown">
                                                                    <button type="button" className="btn btn-add dropdown-toggle" data-bs-toggle="dropdown">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                                    </button>
                                                                    <ul className="dropdown-menu">
                                                                        <li><a className="dropdown-item" href="#" onClick={() => viewPlan(plan)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('view')}</a></li>
                                                                        <li><a className="dropdown-item" href="#" onClick={() => openEditModal(plan)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>{t('edit')}</a></li>
                                                                        <li className="sletborder"><a className="dropdown-item" href="#" onClick={() => deletePlan(plan.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>{t('delete')}</a></li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                },
                                            },
                                        ]}
                                        options={{
                                            selectableRows: 'none',
                                            elevation: 2,
                                            filter: true,
                                            responsive: 'standard',
                                            download: true,
                                            print: false,
                                            viewColumns: true,
                                            pagination: true,
                                            rowsPerPage: 10,
                                            rowsPerPageOptions: [10, 25, 50],
                                            textLabels: {
                                                body: { noMatch: t('admin.planManagement.noPlansFound') || "No plans found" },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Management Modal (Add/Edit/View) */}
            <div className="modal fade modaldesign leadsaddmodal" id="planModal">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                {viewingPlan ? t('admin.planManagement.modal.viewTitle') : modalPlan.id ? t('admin.planManagement.modal.editTitle') : t('admin.planManagement.modal.addTitle')}
                                <p>{t('admin.planManagement.modal.subtitle')}</p>
                            </h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">
                                {viewingPlan ? (
                                    /* VIEW MODE */
                                    <div className="view-plan-details">
                                        <h2 className="card-title">{t('admin.planManagement.modal.generalInfo')}</h2>
                                        <p><strong>{t('admin.planManagement.table.name')}:</strong> {viewingPlan.name}</p>
                                        <p><strong>{t('admin.planManagement.modal.input.shortDescLabel')}:</strong> {viewingPlan.shortdescription || t('admin.planManagement.modal.view.shortDescNA')}</p>
                                        <p><strong>{t('admin.planManagement.modal.description')}:</strong></p>
                                        <ul>
                                            {viewingPlan.description?.split(',').map((item, index) => <li key={index}>{item.trim()}</li>)}
                                        </ul>
                                        <p><strong>{t('admin.planManagement.table.price')}:</strong> DKK{viewingPlan.price} ({t(`admin.planManagement.table.billingType.${viewingPlan.billing_type}`)})</p>
                                        <p><strong>{t('admin.planManagement.modal.input.discountLabel')}:</strong> {viewingPlan.discount_percentage}%</p>
                                        <p><strong>{t('admin.planManagement.table.status')}:</strong> <span className={`badge ${viewingPlan.status === 'active' ? 'badge4' : 'badge1'}`}>{t(`admin.planManagement.modal.input.${viewingPlan.status}`)}</span></p>

                                        <h2 className="card-title mt-4">{t('admin.planManagement.modal.featureLimits')} & {t('admin.planManagement.modal.accessIntegration')}</h2>
                                        <p><strong>{t('admin.planManagement.modal.view.leadsAllowed')}</strong> {viewingPlan.Total_Leads_Allowed}</p>
                                        <p><strong>{t('admin.planManagement.modal.view.emailsAllowed')}</strong> {viewingPlan.Total_emails_allowed}</p>
                                        <p><strong>{t('admin.planManagement.modal.view.smsAllowed')}</strong> {viewingPlan.Total_SMS_allowed}</p>
                                        <p><strong>{t('admin.planManagement.modal.view.offersAllowed')}</strong> {viewingPlan.Total_offers_Allowed}</p>
                                        <p><strong>{t('admin.planManagement.modal.view.workflowsAllowed')}</strong> {viewingPlan.Total_workflows_Allowed}</p>
                                        <p>
                                            <strong>{t('admin.planManagement.modal.view.apiAccess')}</strong>
                                            {viewingPlan.api_access ? t('admin.planManagement.modal.view.allowed') : t('admin.planManagement.modal.view.notAllowed')}
                                        </p>
                                        <p>
                                            <strong>{t('admin.planManagement.modal.view.offerCustomization')}</strong>
                                            {viewingPlan.is_offerPage_customization_allowed ? t('admin.planManagement.modal.view.allowed') : t('admin.planManagement.modal.view.notAllowed')}
                                        </p>

                                        <div className="modalfooter btn-right">
                                            <button type="button" className="btn btn-add" data-bs-dismiss="modal">{t('admin.planManagement.modal.buttons.close')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ADD/EDIT FORM */
                                    <form onSubmit={handleModalSubmit}>
                                        <h2 className="card-title">{t('admin.planManagement.modal.generalInfo')}</h2>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.nameLabel')}</label>
                                                    <input type="text" className="form-control" name="name" value={modalPlan.name} onChange={handleModalChange} required />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.shortDescLabel')}</label>
                                                    <input type="text" className="form-control" name="shortdescription" value={modalPlan.shortdescription} onChange={handleModalChange} />
                                                </div>
                                            </div>

                                            {/* Feature/Description Dynamic Inputs */}
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="d-flex justify-content-between align-items-center">
                                                        {t('admin.planManagement.modal.description')}
                                                        <a href="#" className="btn btn-link btn-sm text-decoration-none" onClick={handleAddFeature}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg> {t('admin.planManagement.modal.addFeature')}
                                                        </a>
                                                    </label>

                                                    {modalPlan.description.map((feature, index) => (
                                                        <div key={index} className="input-group mb-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder={`${t('feature')} ${index + 1}`}
                                                                value={feature}
                                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                            />
                                                            <button
                                                                className="btn btn-danger"
                                                                type="button"
                                                                onClick={() => handleRemoveFeature(index)}
                                                                title={t('removeFeature') || "Remove feature"}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus-circle"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {modalPlan.description.length === 0 && (
                                                        <p className="text-blue">{t('admin.planManagement.modal.noFeatures')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="card-title mt-4">{t('admin.planManagement.modal.pricingBilling')}</h2>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.priceLabel')}</label>
                                                    <input type="number" className="form-control" name="price" value={modalPlan.price} onChange={handleModalChange} required min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.discountLabel')}</label>
                                                    <input type="number" className="form-control" name="discount_percentage" value={modalPlan.discount_percentage} onChange={handleModalChange} min="0" max="100" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.billingTypeLabel')}</label>
                                                    <select className="form-control" name="billing_type" value={modalPlan.billing_type} onChange={handleModalChange} required>
                                                        <option value="monthly">{t('admin.planManagement.table.billingType.monthly')}</option>
                                                        <option value="yearly">{t('admin.planManagement.table.billingType.yearly')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.statusLabel')}</label>
                                                    <select className="form-control" name="status" value={modalPlan.status} onChange={handleModalChange} required>
                                                        <option value="active">{t('admin.planManagement.modal.input.active')}</option>
                                                        <option value="inactive">{t('admin.planManagement.modal.input.inactive')}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="card-title mt-4">{t('admin.planManagement.modal.featureLimits')}</h2>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.leadsAllowed')}</label>
                                                    <input type="number" className="form-control" name="Total_Leads_Allowed" value={modalPlan.Total_Leads_Allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.emailsAllowed')}</label>
                                                    <input type="number" className="form-control" name="Total_emails_allowed" value={modalPlan.Total_emails_allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.smsAllowed')}</label>
                                                    <input type="number" className="form-control" name="Total_SMS_allowed" value={modalPlan.Total_SMS_allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.offersAllowed')}</label>
                                                    <input type="number" className="form-control" name="Total_offers_Allowed" value={modalPlan.Total_offers_Allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>{t('admin.planManagement.modal.input.workflowsAllowed')}</label>
                                                    <input type="number" className="form-control" name="Total_workflows_Allowed" value={modalPlan.Total_workflows_Allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="card-title mt-4">{t('admin.planManagement.modal.accessIntegration')}</h2>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-check form-switch mb-3">
                                                    <input className="form-check-input" type="checkbox" role="switch" id="api_access" name="api_access" checked={modalPlan.api_access} onChange={handleModalChange} />
                                                    <label className="form-check-label" htmlFor="api_access">{t('admin.planManagement.modal.input.apiAccess')}</label>
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="form-check form-switch mb-3">
                                                    <input className="form-check-input" type="checkbox" role="switch" id="is_offerPage_customization_allowed" name="is_offerPage_customization_allowed" checked={modalPlan.is_offerPage_customization_allowed} onChange={handleModalChange} />
                                                    <label className="form-check-label" htmlFor="is_offerPage_customization_allowed">{t('admin.planManagement.modal.input.offerCustomization')}</label>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Submit/Cancel Buttons */}
                                        <div className="modalfooter btn-right">
                                            <button type="button" className="btn btn-add me-2" data-bs-dismiss="modal">{t('admin.planManagement.modal.buttons.cancel')}</button>
                                            <button type="submit" className="btn btn-send">{modalPlan.id ? t('admin.planManagement.modal.buttons.update') : t('admin.planManagement.modal.buttons.save')}</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlanManagementPage;