import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import VariableSelector from './VariableSelector';



const EmailSMSPage = () => {
    const { authToken } = useContext(AuthContext);

    const [emailTemplates, setEmailTemplates] = useState([]);
    const [smsTemplates, setSmsTemplates] = useState([]);
    const [loadingEmails, setLoadingEmails] = useState(true);
    const [loadingSMS, setLoadingSMS] = useState(true);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showSmsModal, setShowSmsModal] = useState(false);
    const [showViewContentModal, setShowViewContentModal] = useState(false);
    const [variableCategories, setVariableCategories] = useState({});
    const [loadingVariables, setLoadingVariables] = useState(true);
    const [focusedRef, setFocusedRef] = useState(null);

    const [viewContent, setViewContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const [currentTemplate, setCurrentTemplate] = useState({
        id: null,
        templateName: '',
        subject: '',
        recipientEmail: '',
        body: '', // Email content
        cc: '',   // New field for CC
        recipientPhone: '',
        smsContent: '', // SMS message content
    });

    // State for managing active tab in the variables section (Contact, Lead, Company)
    const [activeEmailVariableTab, setActiveEmailVariableTab] = useState('contact');
    const [activeSmsVariableTab, setActiveSmsVariableTab] = useState('contact'); // Separate tab state for SMS modal

    // Refs for textareas to insert variables
    const emailBodyRef = useRef(null);
    const smsContentRef = useRef(null);
    const recipientEmailRef = useRef(null);
    const subjectRef = useRef(null);
    const ccRef = useRef(null);
    const recipientPhoneRef = useRef(null);

    // State for SMS character and message count
    const [smsCharCount, setSmsCharCount] = useState(0);
    const [smsMessageCount, setSmsMessageCount] = useState(1);
    const SMS_MAX_CHARS = 99; // Max characters per single SMS message

    // Helper function to reset the form state to initial empty values
    const resetForm = () => {
        setCurrentTemplate({
            id: null,
            templateName: '',
            subject: '',
            recipientEmail: '',
            body: '',
            cc: '',
            recipientPhone: '',
            smsContent: '',
        });
        setIsEditing(false);
        setSmsCharCount(0);
        setSmsMessageCount(1);
    };

    // --- Fetching Templates Functions ---
    const fetchEmailTemplates = async () => {
        if (!authToken) {
            setLoadingEmails(false);
            toast.error('Authentication token not found for email templates.');
            return;
        }
        setLoadingEmails(true);
        try {
            const response = await api.get(`/email-templates`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            // Map the data to ensure correct field names if API uses different ones
            setEmailTemplates(response.data.map(template => ({
                id: template.id,
                templateName: template.templateName,
                subject: template.subject,
                recipientEmail: template.recipientEmail,
                body: template.emailContent, // Assuming 'emailContent' from provided sample
                cc: template.ccEmails || '', // Assuming 'ccEmails' from provided sample
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
            })));
        } catch (error) {
            console.error("Error fetching email templates:", error);
            toast.error('Failed to fetch email templates.');
        } finally {
            setLoadingEmails(false);
        }
    };

    const fetchSmsTemplates = async () => {
        if (!authToken) {
            setLoadingSMS(false);
            toast.error('Authentication token not found for SMS templates.');
            return;
        }
        setLoadingSMS(true);
        try {
            const response = await api.get(`/sms-templates`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            // Map the data to ensure correct field names if API uses different ones
            setSmsTemplates(response.data.map(template => ({
                id: template.id,
                templateName: template.templateName,
                recipientPhone: template.recipientPhone,
                smsContent: template.smsContent,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
            })));
        } catch (error) {
            console.error("Error fetching SMS templates:", error);
            toast.error('Failed to fetch SMS templates.');
        } finally {
            setLoadingSMS(false);
        }
    };

    const fetchVariables = async () => {
        if (!authToken) {
            setLoadingVariables(false);
            toast.error('Authentication token not found for variables.');
            return;
        }
        setLoadingVariables(true);
        try {
            const response = await api.get('/variables', {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            // Transform into categories
            const categories = { contact: [] }; // you can expand categories later
            response.data.forEach(variable => {
                categories.contact.push({
                    name: variable.variableName.replace(/_/g, ' '), // "first_name" → "first name"
                    description: `${variable.variableValue}`,
                    variable: `{{${variable.variableName}}}`,
                });
            });

            setVariableCategories(categories);

        } catch (error) {
            console.error("Error fetching variables:", error);
            toast.error('Failed to fetch variables.');
        } finally {
            setLoadingVariables(false);
        }
    };



    useEffect(() => {
        fetchVariables();
        fetchEmailTemplates();
        fetchSmsTemplates();
    }, [authToken]);

    // --- Modal Control Functions ---
    const openEmailModal = (template = null) => {
        if (template) {
            setCurrentTemplate({
                id: template.id,
                templateName: template.templateName,
                subject: template.subject,
                recipientEmail: template.recipientEmail,
                body: template.body,
                cc: template.cc || '',
                recipientPhone: '',
                smsContent: '',
            });
            setIsEditing(true);
        } else {
            resetForm();
        }
        setShowEmailModal(true);
    };

    const closeEmailModal = () => {
        setShowEmailModal(false);
        resetForm();
    };

    const openSmsModal = (template = null) => {
        if (template) {
            setCurrentTemplate({
                id: template.id,
                templateName: template.templateName,
                recipientPhone: template.recipientPhone,
                smsContent: template.smsContent,
                subject: '',
                recipientEmail: '',
                body: '',
                cc: '',
            });
            setSmsCharCount(template.smsContent.length);
            setSmsMessageCount(Math.ceil(template.smsContent.length / SMS_MAX_CHARS) || 1);
            setIsEditing(true);
        } else {
            resetForm();
        }
        setShowSmsModal(true);
    };

    const closeSmsModal = () => {
        setShowSmsModal(false);
        resetForm();
    };

    const openViewContentModal = (content) => {
        setViewContent(content);
        setShowViewContentModal(true);
    };

    const closeViewContentModal = () => {
        setShowViewContentModal(false);
        setViewContent('');
    };

    // --- Form Input Change Handler ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentTemplate(prev => ({ ...prev, [name]: value }));

        if (name === 'smsContent') {
            setSmsCharCount(value.length);
            setSmsMessageCount(Math.ceil(value.length / SMS_MAX_CHARS) || 1);
        }
    };

    // --- Generic Variable Insertion Logic ---
    const insertVariable = (variable) => {
        if (!focusedRef?.current) return;

        const input = focusedRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        const newValue =
            input.value.substring(0, start) +
            variable +
            input.value.substring(end);

        const fieldName = input.name;

        // Update state dynamically
        setCurrentTemplate(prev => ({
            ...prev,
            [fieldName]: newValue
        }));

        // For SMS, update counts
        if (input === smsContentRef) {
            setSmsCharCount(newValue.length);
            setSmsMessageCount(Math.ceil(newValue.length / SMS_MAX_CHARS) || 1);
        }

        // Focus and move cursor after inserted variable
        setTimeout(() => {
            input.focus();
            input.selectionEnd = start + variable.length;
        }, 0);
    };


    // --- CRUD Operations Handlers ---
    const handleAddUpdateEmailTemplate = async (e) => {
        e.preventDefault();
        if (!authToken) {
            toast.error('Authentication token missing.');
            return;
        }

        const templateData = {
            templateName: currentTemplate.templateName,
            subject: currentTemplate.subject,
            recipientEmail: currentTemplate.recipientEmail,
            emailContent: currentTemplate.body, // Use 'emailContent' for API
            ccEmails: currentTemplate.cc,       // Use 'ccEmails' for API
        };

        try {
            if (isEditing) {
                await api.put(`/email-templates/${currentTemplate.id}`, templateData, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('Email template updated successfully!');
            } else {
                await api.post(`/email-templates`, templateData, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('Email template added successfully!');
            }
            closeEmailModal();
            fetchEmailTemplates();
        } catch (error) {
            console.error("Error saving email template:", error);
            toast.error(`Failed to ${isEditing ? 'update' : 'add'} email template.`);
        }
    };

    const handleAddUpdateSmsTemplate = async (e) => {
        e.preventDefault();
        if (!authToken) {
            toast.error('Authentication token missing.');
            return;
        }

        const templateData = {
            templateName: currentTemplate.templateName,
            recipientPhone: currentTemplate.recipientPhone,
            smsContent: currentTemplate.smsContent,
        };

        try {
            if (isEditing) {
                await api.put(`/sms-templates/${currentTemplate.id}`, templateData, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('SMS template updated successfully!');
            } else {
                await api.post(`/sms-templates`, templateData, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success('SMS template added successfully!');
            }
            closeSmsModal();
            fetchSmsTemplates();
        } catch (error) {
            console.error("Error saving SMS template:", error);
            toast.error(`Failed to ${isEditing ? 'update' : 'add'} SMS template.`);
        }
    };

    const handleDeleteEmailTemplate = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (!authToken) {
                    toast.error('Authentication token missing.');
                    return;
                }
                try {
                    await api.delete(`/email-templates/${id}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    toast.success('Email template deleted successfully!');
                    fetchEmailTemplates();
                } catch (error) {
                    console.error("Error deleting email template:", error);
                    toast.error('Failed to delete email template.');
                }
            }
        });
    };

    const handleDeleteSmsTemplate = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (!authToken) {
                    toast.error('Authentication token missing.');
                    return;
                }
                try {
                    await api.delete(`/sms-templates/${id}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    toast.success('SMS template deleted successfully!');
                    fetchSmsTemplates();
                } catch (error) {
                    console.error("Error deleting SMS template:", error);
                    toast.error('Failed to delete SMS template.');
                }
            }
        });
    };

    // Data for available variables, organized by tab
    const variableCategoriesasdf = {
        contact: [
            { name: 'Contact Name', description: 'Full name of the contact', variable: '{{contact_name}}' },
            { name: 'First Name', description: 'Contact\'s first name', variable: '{{contact_first_name}}' },
            { name: 'Last Name', description: 'Contact\'s last name', variable: '{{contact_last_name}}' },
            { name: 'Email', description: 'Contact\'s email address', variable: '{{contact_email}}' },
            { name: 'Phone', description: 'Contact\'s phone number', variable: '{{contact_phone}}' },
        ],
        lead: [
            { name: 'Lead Status', description: 'Current status of the lead', variable: '{{lead_status}}' },
            { name: 'Lead Source', description: 'Where the lead came from', variable: '{{lead_source}}' },
            { name: 'Lead Value', description: 'Estimated value of the lead', variable: '{{lead_value}}' },
            { name: 'Created Date', description: 'Date of lead creation', variable: '{{lead_created_date}}' },
        ],
        company: [
            { name: 'Company Name', description: 'Your company\'s name', variable: '{{company_name}}' },
            { name: 'Company Email', description: 'Your company\'s email', variable: '{{company_email}}' },
            { name: 'Company Phone', description: 'Your company\'s phone number', variable: '{{company_phone}}' },
            { name: 'Sender Name', description: 'Name of the sender', variable: '{{sender_name}}' },
            { name: 'Sender Email', description: 'Email of the sender', variable: '{{sender_email}}' },
        ],
    };

    return (
        <div className="mainbody">
            <div className="container-fluid">
                <div className="row top-row">
                    <div className="col-md-12">
                        <div className="dash-heading">
                            <h2>Email & SMS</h2>
                            <p>Manage email and SMS templates and campaigns</p>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-4">
                        <div className="carddesign emailcard">
                            <h2 className="card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4" aria-hidden="true">
                                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                </svg>
                                Email Templates
                            </h2>
                            <p>Create and manage reusable email templates</p>
                            <button className="btn btn-send" onClick={() => openEmailModal()}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5v14"></path>
                                </svg>
                                New template
                            </button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="carddesign emailcard">
                            <h2 className="card-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square w-4 h-4" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>
                                SMS Templates
                            </h2>
                            <p>Create and manage SMS templates</p>
                            <button className="btn btn-send" onClick={() => openSmsModal()}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5v14"></path>
                                </svg>
                                New template
                            </button>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="carddesign emailcard comingsoon">
                            <h2 className="card-title">Campaigns</h2>
                            <div className="badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-3 h-3 mr-1" aria-hidden="true">
                                    <path d="M12 6v6l4 2"></path>
                                    <circle cx="12" cy="12" r="10"></circle>
                                </svg>
                                Coming Soon
                            </div>
                            <p>Send email and SMS campaigns to your leads</p>
                            <Link to="#" className="btn btn-send">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5v14"></path>
                                </svg>
                                New campaign
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Email Templates Table */}
                <div className="carddesign leadstable">
                    <h2 className="card-title">All Email Templates</h2>
                    <div className="tabledesign">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="talechebox"><input className="form-check-input" type="checkbox" /></th>
                                        <th>Template Name</th>
                                        <th>Subject</th>
                                        <th>Recipient Email</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingEmails ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">Loading email templates...</td>
                                        </tr>
                                    ) : emailTemplates.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">No email templates found.</td>
                                        </tr>
                                    ) : (
                                        emailTemplates.map((template) => (
                                            <tr key={template.id}>
                                                <td className="talechebox"><input className="form-check-input" type="checkbox" /></td>
                                                <td><strong>{template.templateName}</strong></td>
                                                <td>{template.subject}</td>
                                                <td>{template.recipientEmail}</td>
                                                <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                                                <td className="actionbtn">
                                                    <div className="dropdown leaddropdown">
                                                        <button type="button" className="btn btn-add dropdown-toggle" data-bs-toggle="dropdown">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                        <li><Link className="dropdown-item" to="#" onClick={() => openViewContentModal(template.body)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>View Content</Link></li>
                                                        <li><Link className="dropdown-item" to="#"  onClick={() => openEmailModal(template)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>Edit</Link></li>
                                                        <li className="sletborder"><Link className="dropdown-item" to="#" onClick={() => handleDeleteEmailTemplate(template.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</Link></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* SMS Templates Table */}
                <div className="carddesign leadstable">
                    <h2 className="card-title">All SMS Templates</h2>
                    <div className="tabledesign">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="talechebox"><input className="form-check-input" type="checkbox" /></th>
                                        <th>Template Name</th>
                                        <th>Recipient Phone</th>
                                        <th>SMS Content</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingSMS ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">Loading SMS templates...</td>
                                        </tr>
                                    ) : smsTemplates.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">No SMS templates found.</td>
                                        </tr>
                                    ) : (
                                        smsTemplates.map((template) => (
                                            <tr key={template.id}>
                                                <td className="talechebox"><input className="form-check-input" type="checkbox" /></td>
                                                <td><strong>{template.templateName}</strong></td>
                                                <td>{template.recipientPhone}</td>
                                                <td>{template.smsContent}</td>
                                                <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                                                <td className="actionbtn">
                                                    <div className="dropdown leaddropdown">
                                                        <button type="button" className="btn btn-add dropdown-toggle" data-bs-toggle="dropdown">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                        <li><Link className="dropdown-item" to="#" onClick={() => openViewContentModal(template)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>View Content</Link></li>
                                                        <li><Link className="dropdown-item" to="#"  onClick={() => openSmsModal(template)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>Edit</Link></li>
                                                        <li className="sletborder"><Link className="dropdown-item" to="#" onClick={() => handleDeleteSmsTemplate(template.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</Link></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Modal for Add/Edit */}
            <div className={`${showEmailModal ? 'modal-backdrop fade show' : ''}`}></div>
            <div className={`modal fade modaldesign emailmodal ${showEmailModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showEmailModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-5 h-5" aria-hidden="true">
                                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                </svg>
                                {isEditing ? 'Edit Email Template' : 'Create Email Template'}
                                <p>{isEditing ? 'Edit your reusable email template with dynamic variables' : 'Create a reusable email template with dynamic variables'}</p>
                            </h4>
                            <button type="button" className="btn-close" onClick={closeEmailModal} aria-label="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                    <path d="M18 6 6 18"></path>
                                    <path d="m6 6 12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="formdesign">
                                <form onSubmit={handleAddUpdateEmailTemplate}>
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label>Template Name *</label>
                                                        <input type="text" className="form-control" name="templateName" value={currentTemplate.templateName} onChange={handleInputChange} placeholder="Enter email template name" required />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label>Recipient Email</label>
                                                        <input type="text" className="form-control" name="recipientEmail"  ref={recipientEmailRef}  onFocus={() => setFocusedRef(recipientEmailRef)} value={currentTemplate.recipientEmail} onChange={handleInputChange} placeholder="{{contact_email}} or custom email" />
                                                        <span className="inputnote">Standard: {"{{contact_email}}"} - You can also use other variables or enter directly</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label>Subject *</label>
                                                        <input type="text" className="form-control" name="subject"  onFocus={() => setFocusedRef(subjectRef)} ref={subjectRef} value={currentTemplate.subject} onChange={handleInputChange} placeholder="Enter email subject" required />
                                                        <div className="addoption">
                                                            <button type="button" className="btn btn-add" onClick={() => insertVariable(emailBodyRef, '{{contact_name}}')}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Contact Name
                                                            </button>
                                                            <button type="button" className="btn btn-add" onClick={() => insertVariable(emailBodyRef, '{{company_name}}')}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Company Name
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label>CC (optional)</label>
                                                        <input type="text" className="form-control" name="cc" ref={ccRef} value={currentTemplate.cc}  onFocus={() => setFocusedRef(ccRef)} onChange={handleInputChange} placeholder="email@example.com, variables available" />
                                                        <span className="inputnote">Separate multiple emails with commas. You can also use variables.</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="form-group">
                                                        <label>Email Content *</label>
                                                        <textarea className="form-control" rows="5" name="body" ref={emailBodyRef} value={currentTemplate.body} onChange={handleInputChange} onFocus={() => setFocusedRef(emailBodyRef)} placeholder="Write your email message here...&#10;&#10;Hello {{contact_name}},&#10;&#10;Thank you for your interest..."></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <VariableSelector
                                                activeTab={activeEmailVariableTab}
                                                setActiveTab={setActiveEmailVariableTab}
                                                variableCategories={variableCategories}
                                                insertVariable={insertVariable} // just the function
                                            />

                                            <div className="carddesign">
                                                <div className="emailmodaltab-heading">
                                                    <h3>Preview</h3>
                                                </div>
                                                <div className="form-group">
                                                    <label>To:</label>
                                                    <input type="text" className="form-control" id="" placeholder="Enter email content..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div> {/* end row */}

                                    <div className="modalfooter">
                                        <button type="button" className="btn btn-add" onClick={closeEmailModal}>Cancel</button>
                                        <button type="submit" className="btn btn-send">{isEditing ? 'Update Template' : 'Save Template'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SMS Modal for Add/Edit (Updated with new design) */}
             <div className={`${showSmsModal ? 'modal-backdrop fade show' : ''}`}></div>
            <div className={`modal fade modaldesign emailmodal ${showSmsModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showSmsModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-lg" role="document"> {/* Changed to modal-lg for wider content */}
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square w-5 h-5" aria-hidden="true">
                                    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
                                </svg>
                                {isEditing ? 'Edit SMS Template' : 'Create SMS Template'}
                                <p>{isEditing ? 'Edit your reusable SMS template with dynamic variables' : 'Create a reusable SMS template with dynamic variables'}</p>
                            </h4>
                            <button type="button" className="btn-close" onClick={closeSmsModal} aria-label="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                    <path d="M18 6 6 18"></path>
                                    <path d="m6 6 12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="formdesign">
                                <form onSubmit={handleAddUpdateSmsTemplate}>
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label>Template Name *</label>
                                                        <input type="text" className="form-control" name="templateName" value={currentTemplate.templateName} onChange={handleInputChange} placeholder="Enter SMS template name" required />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="form-group">
                                                        <label>Recipient Phone</label>
                                                        <input type="text" className="form-control" name="recipientPhone"  ref={recipientPhoneRef} value={currentTemplate.recipientPhone} onChange={handleInputChange}  onFocus={() => setFocusedRef(recipientPhoneRef)} placeholder="{{contact_phone}} or custom phone" />
                                                        <span className="inputnote">Standard: {"{{contact_phone}}"} - You can also use other variables or enter directly</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="form-group">
                                                        <label>SMS Message *</label>
                                                        <textarea className="form-control" rows="5" name="smsContent" maxLength={SMS_MAX_CHARS} ref={smsContentRef} value={currentTemplate.smsContent} onChange={handleInputChange} onFocus={() => setFocusedRef(smsContentRef)} placeholder="Write your SMS message here...&#10;&#10;Hello {{contact_first_name}}, thank you for your interest in our offer."></textarea>
                                                        <div className="texttypelimit">
                                                            <span className="inputnote">SMS Length: {smsCharCount}/{SMS_MAX_CHARS} characters</span>
                                                            <span className="texttype-besked">{smsMessageCount} message{smsMessageCount > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <VariableSelector
                                                activeTab={activeEmailVariableTab}
                                                setActiveTab={setActiveEmailVariableTab}
                                                variableCategories={variableCategories}
                                                insertVariable={insertVariable} // just the function
                                            />

                                            <div className="carddesign">
                                                <div className="emailmodaltab-heading">
                                                    <h3>Preview</h3>
                                                </div>
                                                <div className="form-group">
                                                    <label>Sms To:</label>
                                                    <input type="text" className="form-control" id="" placeholder="Enter Sms content..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div> {/* end row */}

                                    <div className="modalfooter">
                                        <button type="button" className="btn btn-add" onClick={closeSmsModal}>Cancel</button>
                                        <button type="submit" className="btn btn-send">{isEditing ? 'Update Template' : 'Save Template'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailSMSPage;
