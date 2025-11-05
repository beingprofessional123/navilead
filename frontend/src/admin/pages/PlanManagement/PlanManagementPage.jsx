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
    description: [], // CHANGED: Now an array to hold individual features
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
            toast.error('Failed to fetch plans');
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
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/admin/plan-management/${id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Plan deleted successfully');
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete plan');
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
                toast.success('Plan updated successfully');
            } else {
                // Add new plan
                await api.post(`/admin/plan-management`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('Plan created successfully');
            }
            fetchPlans();
            window.bootstrap.Modal.getInstance(document.getElementById('planModal')).hide();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save plan');
        }
    };

    // Update plan status
    const updateStatus = async (id, status) => {
        try {
            await api.put(`/admin/plan-management/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success('Status updated');
            fetchPlans();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
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
                                <h2>Plan Management</h2>
                                <p>Create, view, and manage subscription plans.</p>
                            </div>
                        </div>
                        {/* <div className="col-md-6">
                            <div className="dashright">
                                <Link to="#" onClick={openAddModal} className="btn btn-send">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>New Plan
                                </Link>
                            </div>
                        </div> */}
                    </div>

                    <div className="row">
                        <div className="col-md-12">
                            <div className="carddesign leadstable">
                                <div className="admin_tabledesign">
                                    <MUIDataTable
                                        title={`All Plans (${plans.length})`}
                                        data={plans}
                                        columns={[
                                            {
                                                name: 'name',
                                                label: 'Name',
                                                options: {
                                                    filter: true,
                                                    sort: true,
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
                                                label: 'Price / Billing',
                                                options: {
                                                    filter: false,
                                                    sort: true,
                                                    customBodyRender: (value, tableMeta) => {
                                                        const plan = plans[tableMeta.rowIndex];
                                                        return `DKK ${plan.price} / ${plan.billing_type}`;
                                                    },
                                                },
                                            },
                                            {
                                                name: 'Total_Leads_Allowed',
                                                label: 'Leads',
                                                options: { filter: false, sort: true },
                                            },
                                            {
                                                name: 'Total_emails_allowed',
                                                label: 'Emails / SMS',
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
                                                label: 'Status',
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
                                                                        {plan.status}
                                                                    </span>
                                                                </button>
                                                                <ul className="dropdown-menu">
                                                                    <li><a className="dropdown-item" href="#" onClick={() => updateStatus(plan.id, 'active')}>Active</a></li>
                                                                    <li><a className="dropdown-item" href="#" onClick={() => updateStatus(plan.id, 'inactive')}>InActive</a></li>
                                                                </ul>
                                                            </div>
                                                        );
                                                    },
                                                },
                                            },
                                            {
                                                name: 'actions',
                                                label: 'Action',
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
                                                                        <li><a className="dropdown-item" href="#" onClick={() => viewPlan(plan)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>View</a></li>
                                                                        <li><a className="dropdown-item" href="#" onClick={() => openEditModal(plan)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>Edit</a></li>
                                                                        <li className="sletborder"><a className="dropdown-item" href="#" onClick={() => deletePlan(plan.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</a></li>
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
                                                body: { noMatch: "No plans found" },
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
                                {viewingPlan ? 'View Plan' : modalPlan.id ? 'Edit Plan' : 'Add New Plan'}
                                <p>Fill in plan details.</p>
                            </h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">
                                {viewingPlan ? (
                                    /* VIEW MODE */
                                    <div className="view-plan-details">
                                        <h2 className="card-title">General Information</h2>
                                        <p><strong>Name:</strong> {viewingPlan.name}</p>
                                        <p><strong>Short Description:</strong> {viewingPlan.shortdescription || 'N/A'}</p>
                                        <p><strong>Description:</strong></p>
                                        <ul>
                                            {/* Viewing logic remains the same (splitting comma-separated string) */}
                                            {viewingPlan.description?.split(',').map((item, index) => <li key={index}>{item.trim()}</li>)}
                                        </ul>
                                        <p><strong>Price:</strong> DKK{viewingPlan.price} ({viewingPlan.billing_type})</p>
                                        <p><strong>Discount:</strong> {viewingPlan.discount_percentage}%</p>
                                        <p><strong>Status:</strong> <span className={`badge ${viewingPlan.status === 'active' ? 'badge4' : 'badge1'}`}>{viewingPlan.status}</span></p>

                                        <h2 className="card-title mt-4">Limits & Access</h2>
                                        <p><strong>Leads Allowed:</strong> {viewingPlan.Total_Leads_Allowed}</p>
                                        <p><strong>Emails Allowed:</strong> {viewingPlan.Total_emails_allowed}</p>
                                        <p><strong>SMS Allowed:</strong> {viewingPlan.Total_SMS_allowed}</p>
                                        <p><strong>Offers Allowed:</strong> {viewingPlan.Total_offers_Allowed}</p>
                                        <p><strong>Workflows Allowed:</strong> {viewingPlan.Total_workflows_Allowed}</p>
                                        <p><strong>API Access:</strong> {viewingPlan.api_access ? 'Allowed' : 'Not Allowed'}</p>
                                        <p><strong>Offer Page Customization:</strong> {viewingPlan.is_offerPage_customization_allowed ? 'Allowed' : 'Not Allowed'}</p>
                                        <div className="modalfooter btn-right">
                                            <button type="button" className="btn btn-add" data-bs-dismiss="modal">Close</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ADD/EDIT FORM */
                                    <form onSubmit={handleModalSubmit}>
                                        <h2 className="card-title">General</h2>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Plan Name *</label>
                                                    <input type="text" className="form-control" name="name" value={modalPlan.name} onChange={handleModalChange} required />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Short Description</label>
                                                    <input type="text" className="form-control" name="shortdescription" value={modalPlan.shortdescription} onChange={handleModalChange} />
                                                </div>
                                            </div>

                                            {/* Feature/Description Dynamic Inputs */}
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label className="d-flex justify-content-between align-items-center">
                                                        Features/Description
                                                        <a href="#" className="btn btn-link btn-sm text-decoration-none" onClick={handleAddFeature}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg> Add Feature
                                                        </a>
                                                    </label>

                                                    {modalPlan.description.map((feature, index) => (
                                                        <div key={index} className="input-group mb-2">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder={`Feature ${index + 1}`}
                                                                value={feature}
                                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                            />
                                                            <button
                                                                className="btn btn-danger"
                                                                type="button"
                                                                onClick={() => handleRemoveFeature(index)}
                                                                title="Remove feature"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus-circle"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {modalPlan.description.length === 0 && (
                                                        <p className="text-blue">Click "Add Feature" to list plan features.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="card-title mt-4">Pricing & Billing</h2>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Price (DKK) *</label>
                                                    <input type="number" className="form-control" name="price" value={modalPlan.price} onChange={handleModalChange} required min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Discount (%)</label>
                                                    <input type="number" className="form-control" name="discount_percentage" value={modalPlan.discount_percentage} onChange={handleModalChange} min="0" max="100" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Billing Type *</label>
                                                    <select className="form-control" name="billing_type" value={modalPlan.billing_type} onChange={handleModalChange} required>
                                                        <option value="monthly">Monthly</option>
                                                        <option value="yearly">Yearly</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="card-title mt-4">Feature Limits</h2>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Leads Allowed</label>
                                                    <input type="number" className="form-control" name="Total_Leads_Allowed" value={modalPlan.Total_Leads_Allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Emails Allowed</label>
                                                    <input type="number" className="form-control" name="Total_emails_allowed" value={modalPlan.Total_emails_allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>SMS Allowed</label>
                                                    <input type="number" className="form-control" name="Total_SMS_allowed" value={modalPlan.Total_SMS_allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Offers Allowed</label>
                                                    <input type="number" className="form-control" name="Total_offers_Allowed" value={modalPlan.Total_offers_Allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label>Workflows Allowed</label>
                                                    <input type="number" className="form-control" name="Total_workflows_Allowed" value={modalPlan.Total_workflows_Allowed} onChange={handleModalChange} min="0" />
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="card-title mt-4">Access & Integration</h2>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-check form-switch mb-3">
                                                    <input className="form-check-input" type="checkbox" role="switch" id="api_access" name="api_access" checked={modalPlan.api_access} onChange={handleModalChange} />
                                                    <label className="form-check-label" htmlFor="api_access">API Access Allowed</label>
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="form-check form-switch mb-3">
                                                    <input className="form-check-input" type="checkbox" role="switch" id="is_offerPage_customization_allowed" name="is_offerPage_customization_allowed" checked={modalPlan.is_offerPage_customization_allowed} onChange={handleModalChange} />
                                                    <label className="form-check-label" htmlFor="is_offerPage_customization_allowed">Offer Page Customization Allowed</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modalfooter btn-right">
                                            <a href="#" className="btn btn-add" data-bs-dismiss="modal">Cancel</a>
                                            <button type="submit" className="btn btn-send">{modalPlan.id ? 'Update Plan' : 'Save Plan'}</button>
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
