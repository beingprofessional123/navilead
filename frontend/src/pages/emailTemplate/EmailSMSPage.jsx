import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import VariableSelector from './VariableSelector';
import MobileHeader from '../../components/common/MobileHeader';
import { useTranslation } from "react-i18next";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import LimitModal from '../../components/LimitModal'; // the modal we created earlier
import { useLimit } from "../../context/LimitContext";



const EmailSMSPage = () => {
    const { authToken } = useContext(AuthContext);
    const { t: translate } = useTranslation();
    const { checkLimit, isLimitModalOpen, currentLimit, closeLimitModal } = useLimit(); // use limit context
    

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
        attachments: [], // Array to hold attachment metadata { originalName, fileName, filePath, mimetype, size }
        recipientPhone: '',
        smsContent: '', // SMS message content
    });

    const [selectedFiles, setSelectedFiles] = useState([]); // For new files to be uploaded
    const fileInputRef = useRef(null); // Ref for the file input

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
            attachments: [],
            recipientPhone: '',
            smsContent: '',
        });
        setSelectedFiles([]); // Clear selected files
        // Reset the file input value visually
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        setIsEditing(false);
        setSmsCharCount(0);
        setSmsMessageCount(1);
    };

    // --- Fetching Templates Functions ---
    const fetchEmailTemplates = async () => {
        if (!authToken) {
            setLoadingEmails(false);
            toast.error(translate('api.emailTemplates.authError'));
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
                attachments: template.attachments || [], // Include attachments
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
            })));
        } catch (error) {
            console.error("Error fetching email templates:", error);
            toast.error(translate('api.emailTemplates.fetchError'));
        } finally {
            setLoadingEmails(false);
        }
    };

    const fetchSmsTemplates = async () => {
        if (!authToken) {
            setLoadingSMS(false);
            toast.error(translate('api.smsTemplates.authError'));
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
            toast.error(translate('api.smsTemplates.fetchError'));
        } finally {
            setLoadingSMS(false);
        }
    };

    const fetchVariables = async () => {
        if (!authToken) {
            setLoadingVariables(false);
            toast.error(translate('api.variables.authError'));
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
            toast.error(translate('api.variables.fetchError'));
        } finally {
            setLoadingVariables(false);
        }
    };



    useEffect(() => {
        fetchVariables();
        fetchEmailTemplates();
        fetchSmsTemplates();
    }, [authToken, translate]); // Added translate to dependencies

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
                attachments: template.attachments || [], // Load existing attachments
                recipientPhone: '',
                smsContent: '',
            });
            setIsEditing(true);
            setShowEmailModal(true);
        } else {
            resetForm();
            const currentLeadCount = emailTemplates.length; // total leads used
                const canProceed = checkLimit(currentLeadCount, 'Email_Templates'); // matches userPlan key
                if (canProceed) {
                setShowEmailModal(true);
            }
        }
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
                attachments: [],
            });
            setSmsCharCount(template.smsContent.length);
            setSmsMessageCount(Math.ceil(template.smsContent.length / SMS_MAX_CHARS) || 1);
            setIsEditing(true);
            setShowSmsModal(true);
        } else {
            resetForm();
            const currentLeadCount = smsTemplates.length; // total leads used
                const canProceed = checkLimit(currentLeadCount, 'SMS_Templates'); // matches userPlan key
                if (canProceed) {
                setShowSmsModal(true);
            }
        }
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

    // --- File Input Handlers ---
    const handleFileChange = (e) => {
        // Concatenate new files with any previously selected new files
        setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files)]);
    };

    const handleRemoveSelectedFile = (indexToRemove) => {
        setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        // Optionally clear the file input if all files are removed
        if (fileInputRef.current && selectedFiles.length === 1 && indexToRemove === 0) {
            fileInputRef.current.value = null;
        }
    };

    const handleRemoveExistingAttachment = (filenameToRemove) => {
        setCurrentTemplate(prev => ({
            ...prev,
            attachments: prev.attachments.filter(att => att.fileName !== filenameToRemove)
        }));
    };


    // --- Generic Variable Insertion Logic ---
    const insertVariable = (variable) => {
        if (!focusedRef?.current) return;

        const editor = focusedRef.current;

        // Case 1: CKEditor
        if (editor.model) {
            editor.model.change((writer) => {
                const insertPosition = editor.model.document.selection.getFirstPosition();
                writer.insertText(variable, insertPosition);
            });
            return;
        }

        // Case 2: normal input/textarea
        const input = editor;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        const newValue =
            input.value.substring(0, start) + variable + input.value.substring(end);

        const fieldName = input.name;

        setCurrentTemplate((prev) => ({
            ...prev,
            [fieldName]: newValue,
        }));

        if (input === smsContentRef.current) {
            setSmsCharCount(newValue.length);
            setSmsMessageCount(Math.ceil(newValue.length / SMS_MAX_CHARS) || 1);
        }

        setTimeout(() => {
            input.focus();
            input.selectionEnd = start + variable.length;
        }, 0);
    };



    // --- CRUD Operations Handlers ---
    const handleAddUpdateEmailTemplate = async (e) => {
        e.preventDefault();
        if (!authToken) {
            toast.error(translate('api.emailTemplates.authError'));
            return;
        }

        const formData = new FormData(); // Use FormData for multipart/form-data
        formData.append('templateName', currentTemplate.templateName);
        formData.append('subject', currentTemplate.subject);
        formData.append('recipientEmail', currentTemplate.recipientEmail);
        formData.append('emailContent', currentTemplate.body);
        formData.append('ccEmails', currentTemplate.cc);

        // Append new files
        selectedFiles.forEach(file => {
            formData.append('attachments', file);
        });

        // Append existing attachments metadata (if any are kept)
        if (currentTemplate.attachments && currentTemplate.attachments.length > 0) {
            formData.append('existingAttachments', JSON.stringify(currentTemplate.attachments));
        }

        try {
            if (isEditing) {
                await api.put(`/email-templates/${currentTemplate.id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        // 'Content-Type': 'multipart/form-data', // Axios handles this automatically with FormData
                    },
                });
                toast.success(translate('api.emailTemplates.updateSuccess'));
            } else {
                await api.post(`/email-templates`, formData, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        // 'Content-Type': 'multipart/form-data', // Axios handles this automatically with FormData
                    },
                });
                toast.success(translate('api.emailTemplates.createSuccess'));
            }
            closeEmailModal();
            fetchEmailTemplates();
        } catch (error) {
            console.error("Error saving email template:", error);
            const actionKey = isEditing ? 'update' : 'create';
            toast.error(translate('api.emailTemplates.saveError', { action: translate(`emailSmsPage.${actionKey}Template`) }));
        }
    };

    const handleAddUpdateSmsTemplate = async (e) => {
        e.preventDefault();
        if (!authToken) {
            toast.error(translate('api.smsTemplates.authError'));
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
                toast.success(translate('api.smsTemplates.updateSuccess'));
            } else {
                await api.post(`/sms-templates`, templateData, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                toast.success(translate('api.smsTemplates.createSuccess'));
            }
            closeSmsModal();
            fetchSmsTemplates();
        } catch (error) {
            console.error("Error saving SMS template:", error);
            const actionKey = isEditing ? 'update' : 'create';
            toast.error(translate('api.smsTemplates.saveError', { action: translate(`emailSmsPage.${actionKey}Template`) }));
        }
    };

    const handleDeleteEmailTemplate = async (id) => {
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
                if (!authToken) {
                    toast.error(translate('api.emailTemplates.authError'));
                    return;
                }
                try {
                    const response = await api.delete(`/email-templates/${id}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    toast.success(translate(response.data.message || 'api.emailTemplates.deleteSuccess')); // Using API message if provided
                    fetchEmailTemplates();
                } catch (error) {
                    console.error("Error deleting email template:", error);
                    toast.error(translate('api.emailTemplates.deleteError'));
                }
            }
        });
    };

    const handleDeleteSmsTemplate = async (id) => {
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
                if (!authToken) {
                    toast.error(translate('api.smsTemplates.authError'));
                    return;
                }
                try {
                    const response = await api.delete(`/sms-templates/${id}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    toast.success(translate(response.data.message || 'api.smsTemplates.deleteSuccess')); // Using API message if provided
                    fetchSmsTemplates();
                } catch (error) {
                    console.error("Error deleting SMS template:", error);
                    toast.error(translate('api.smsTemplates.deleteError'));
                }
            }
        });
    };

    // The hardcoded variableCategoriesasdf is no longer used, as `variableCategories` state is populated from API.
    // const variableCategoriesasdf = { ... };

    return (
        <>

            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-12">
                            <div className="dash-heading">
                                <h2>{translate('emailSmsPage.title')}</h2>
                                <p>{translate('emailSmsPage.description')}</p>
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
                                    {translate('emailSmsPage.emailTemplatesTitle')}
                                </h2>
                                <p>{translate('emailSmsPage.emailTemplatesDescription')}</p>
                                <button className="btn btn-send" onClick={() => openEmailModal()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                    </svg>
                                    {translate('emailSmsPage.newTemplateButton')}
                                </button>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="carddesign emailcard">
                                <h2 className="card-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square w-4 h-4" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>
                                    {translate('emailSmsPage.smsTemplatesTitle')}
                                </h2>
                                <p>{translate('emailSmsPage.smsTemplatesDescription')}</p>
                                <button className="btn btn-send" onClick={() => openSmsModal()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                    </svg>
                                    {translate('emailSmsPage.newTemplateButton')}
                                </button>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="carddesign emailcard comingsoon">
                                <h2 className="card-title">{translate('emailSmsPage.campaignsTitle')}</h2>
                                <div className="badge">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-3 h-3 mr-1" aria-hidden="true">
                                        <path d="M12 6v6l4 2"></path>
                                        <circle cx="12" cy="12" r="10"></circle>
                                    </svg>
                                    {translate('emailSmsPage.comingSoonBadge')}
                                </div>
                                <p>{translate('emailSmsPage.campaignsDescription')}</p>
                                <Link to="#" className="btn btn-send">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                    </svg>
                                    {translate('emailSmsPage.newCampaignButton')}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Email Templates Table */}
                    <div className="carddesign leadstable">
                        <h2 className="card-title">{translate('emailSmsPage.allEmailTemplates')}</h2>
                        <div className="tabledesign">
                            <div className="table-responsive" style={{ minHeight: "150px", maxHeight: "230px" }}>
                                <table className="table">
                                    <thead style={{ position: "sticky", top: 0, background: "rgb(22 31 38)", zIndex: 10, }}>
                                        <tr>
                                            <th className="talechebox"><input className="form-check-input" type="checkbox" /></th>
                                            <th>{translate('emailSmsPage.templateNameTable')}</th>
                                            <th>{translate('emailSmsPage.subjectTable')}</th>
                                            <th>{translate('emailSmsPage.recipientEmailTable')}</th>
                                            <th>{translate('emailSmsPage.createdAtTable')}</th>
                                            <th>{translate('emailSmsPage.actionsTable')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingEmails ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">{translate('emailSmsPage.loadingEmailTemplates')}</td>
                                            </tr>
                                        ) : emailTemplates.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">{translate('emailSmsPage.noEmailTemplates')}</td>
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                            </button>
                                                            <ul className="dropdown-menu">
                                                                <li><Link className="dropdown-item" to="#" onClick={() => openViewContentModal(template.body)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{translate('emailSmsPage.viewContent')}</Link></li>
                                                                <li><Link className="dropdown-item" to="#" onClick={() => openEmailModal(template)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>{translate('emailSmsPage.edit')}</Link></li>
                                                                <li className="sletborder"><Link className="dropdown-item" to="#" onClick={() => handleDeleteEmailTemplate(template.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>{translate('emailSmsPage.delete')}</Link></li>
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
                        <h2 className="card-title">{translate('emailSmsPage.allSmsTemplates')}</h2>
                        <div className="tabledesign">
                            <div className="table-responsive" style={{ minHeight: "150px", maxHeight: "230px" }}>
                                <table className="table">
                                    <thead style={{ position: "sticky", top: 0, background: "rgb(22 31 38)", zIndex: 10, }}>
                                        <tr>
                                            <th className="talechebox"><input className="form-check-input" type="checkbox" /></th>
                                            <th>{translate('emailSmsPage.templateNameTable')}</th>
                                            <th>{translate('emailSmsPage.recipientPhoneTable')}</th>
                                            <th>{translate('emailSmsPage.smsContentTable')}</th>
                                            <th>{translate('emailSmsPage.createdAtTable')}</th>
                                            <th>{translate('emailSmsPage.actionsTable')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingSMS ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">{translate('emailSmsPage.loadingSmsTemplates')}</td>
                                            </tr>
                                        ) : smsTemplates.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">{translate('emailSmsPage.noSmsTemplates')}</td>
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                                            </button>
                                                            <ul className="dropdown-menu">
                                                                <li><Link className="dropdown-item" to="#" onClick={() => openViewContentModal(template.smsContent)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{translate('emailSmsPage.viewContent')}</Link></li>
                                                                <li><Link className="dropdown-item" to="#" onClick={() => openSmsModal(template)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>{translate('emailSmsPage.edit')}</Link></li>
                                                                <li className="sletborder"><Link className="dropdown-item" to="#" onClick={() => handleDeleteSmsTemplate(template.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>{translate('emailSmsPage.delete')}</Link></li>
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
                                    {isEditing ? translate('emailSmsPage.editEmailTemplate') : translate('emailSmsPage.createEmailTemplate')}
                                    <p>{isEditing ? translate('emailSmsPage.editEmailTemplateDesc') : translate('emailSmsPage.createEmailTemplateDesc')}</p>
                                </h4>
                                <button type="button" className="btn-close" onClick={closeEmailModal} aria-label={translate('emailSmsPage.cancel')}>
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
                                                            <label>{translate('emailSmsPage.templateNameLabel')}</label>
                                                            <input type="text" className="form-control" name="templateName" value={currentTemplate.templateName} onChange={handleInputChange} placeholder={translate('emailSmsPage.templateNamePlaceholderEmail')} required />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>{translate('emailSmsPage.recipientEmailLabel')}</label>
                                                            <input type="text" className="form-control" name="recipientEmail" ref={recipientEmailRef} onFocus={() => setFocusedRef(recipientEmailRef)} value={currentTemplate.recipientEmail} onChange={handleInputChange} placeholder={translate('emailSmsPage.recipientEmailPlaceholder')} />
                                                            <span className="inputnote">{translate('emailSmsPage.recipientEmailNote', { contact_email: '{{contact_email}}' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>{translate('emailSmsPage.subjectLabel')}</label>
                                                            <input type="text" className="form-control" name="subject" onFocus={() => setFocusedRef(subjectRef)} ref={subjectRef} value={currentTemplate.subject} onChange={handleInputChange} placeholder={translate('emailSmsPage.subjectPlaceholder')} required />
                                                            <div className="addoption">
                                                                <button type="button" className="btn btn-add" onClick={() => insertVariable('{{contact_name}}')}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{translate('emailSmsPage.contactName')}
                                                                </button>
                                                                <button type="button" className="btn btn-add" onClick={() => insertVariable('{{company_name}}')}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{translate('emailSmsPage.companyName')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>{translate('emailSmsPage.ccLabel')}</label>
                                                            <input type="text" className="form-control" name="cc" ref={ccRef} value={currentTemplate.cc} onFocus={() => setFocusedRef(ccRef)} onChange={handleInputChange} placeholder={translate('emailSmsPage.ccPlaceholder')} />
                                                            <span className="inputnote">{translate('emailSmsPage.ccNote')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <label>{translate('emailSmsPage.emailContentLabel')}</label>
                                                            <CKEditor
                                                                editor={ClassicEditor}
                                                                name="body"
                                                                data={currentTemplate.body || ''}   // similar to value
                                                                onReady={(editor) => {
                                                                    emailBodyRef.current = editor;
                                                                    // Apply height style directly when editor is ready
                                                                    editor.editing.view.change((writer) => {
                                                                        writer.setStyle(
                                                                            "min-height",
                                                                            "200px", // change as per need
                                                                            editor.editing.view.document.getRoot()
                                                                        );
                                                                    });
                                                                }}
                                                                onChange={(event, editor) => {
                                                                    const data = editor.getData();

                                                                    // Mimic normal input event for handleInputChange
                                                                    handleInputChange({
                                                                        target: { name: "body", value: data }
                                                                    });
                                                                }}
                                                                onFocus={() => setFocusedRef(emailBodyRef)}
                                                                config={{
                                                                    placeholder: translate('emailSmsPage.emailContentPlaceholder')
                                                                }}
                                                            />
                                                            {/* <textarea className="form-control" rows="5" name="body" ref={emailBodyRef} value={currentTemplate.body} onChange={handleInputChange} onFocus={() => setFocusedRef(emailBodyRef)} placeholder={translate('emailSmsPage.emailContentPlaceholder')}></textarea> */}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Attachments Section */}
                                                <div className="form-group">
                                                    <label className="form-label">{translate('emailSmsPage.uploadFilesLabel')}</label>
                                                    <div className="upload-files-container">
                                                        <div className="drag-file-area">
                                                            <span className="material-icons-outlined upload-icon">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-8 h-8 text-muted-foreground" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                                                            </span>

                                                            <label className="label">
                                                                <span className="browse-files">
                                                                    <input type="file" className="default-file-input" multiple onChange={handleFileChange} ref={fileInputRef} />
                                                                    <span className="browse-files-text">{translate('emailSmsPage.uploadFilesClick')}</span>
                                                                </span>
                                                            </label>
                                                            <h3 className="dynamic-message">{translate('emailSmsPage.uploadFilesMessage')}</h3>
                                                        </div>
                                                    </div>
                                                    {/* Display existing attachments from backend */}
                                                    {currentTemplate.attachments && currentTemplate.attachments.length > 0 && (
                                                        <div className="mt-2">
                                                            <label className="d-block mb-1">{translate('emailSmsPage.existingAttachmentsTitle')}</label>
                                                            <ul className="list-group">
                                                                {currentTemplate.attachments.map((file, index) => (
                                                                    <li key={`existing-${file.fileName || index}`} className="list-group-item d-flex justify-content-between align-items-center" style={{ background: 'rgb(27 38 50)', border: "1px solid #8cd9d9" }}>
                                                                        <div className="file-info">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file w-4 h-4 mr-1" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>
                                                                            <span className="file-name">{file.originalName}</span> | <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                                                                        </div>
                                                                        <button type="button" className="btn btn-add" onClick={() => handleRemoveExistingAttachment(file.fileName)}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 w-3 h-3 m-0" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                            {/* {translate('emailSmsPage.removeAttachment')} */}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {/* Display newly added files */}
                                                    {selectedFiles.length > 0 && (
                                                        <div className="mt-2" >
                                                            <label className="d-block mb-1">{translate('emailSmsPage.newFilesTitle')}</label>
                                                            <ul className="list-group" style={{ '--bs-list-group-color': 'var(--bs-body-color)' }}>
                                                                {selectedFiles.map((file, index) => (
                                                                    <li key={`new-${index}`} className="list-group-item d-flex justify-content-between align-items-center" style={{ background: 'rgb(27 38 50)', border: "1px solid #8cd9d9" }}>
                                                                        <div className="file-info">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file w-4 h-4 mr-1" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>
                                                                            <span className="file-name">{file.name}</span> | <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                                                                        </div>
                                                                        <button type="button" className="btn btn-add" onClick={() => handleRemoveExistingAttachment(file.fileName)}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 w-3 h-3 m-0" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                            {/* {translate('emailSmsPage.removeAttachment')} */}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
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
                                                        <h3>{translate('emailSmsPage.preview')}</h3>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>{translate('emailSmsPage.to')}</label>
                                                        <input type="text" className="form-control" readOnly value={currentTemplate.recipientEmail} placeholder={translate('emailSmsPage.recipientEmailPlaceholder')} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div> {/* end row */}

                                        <div className="modalfooter">
                                            <button type="button" className="btn btn-add" onClick={closeEmailModal}>{translate('emailSmsPage.cancel')}</button>
                                            <button type="submit" className="btn btn-send">{isEditing ? translate('emailSmsPage.updateTemplate') : translate('emailSmsPage.saveTemplate')}</button>
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
                                    {isEditing ? translate('emailSmsPage.editSmsTemplate') : translate('emailSmsPage.createSmsTemplate')}
                                    <p>{isEditing ? translate('emailSmsPage.editSmsTemplateDesc') : translate('emailSmsPage.createSmsTemplateDesc')}</p>
                                </h4>
                                <button type="button" className="btn-close" onClick={closeSmsModal} aria-label={translate('emailSmsPage.cancel')}>
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
                                                            <label>{translate('emailSmsPage.templateNameLabel')}</label>
                                                            <input type="text" className="form-control" name="templateName" value={currentTemplate.templateName} onChange={handleInputChange} placeholder={translate('emailSmsPage.templateNamePlaceholderSms')} required />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-group">
                                                            <label>{translate('emailSmsPage.recipientPhoneLabel')}</label>
                                                            <input type="text" className="form-control" name="recipientPhone" ref={recipientPhoneRef} value={currentTemplate.recipientPhone} onChange={handleInputChange} onFocus={() => setFocusedRef(recipientPhoneRef)} placeholder={translate('emailSmsPage.recipientPhonePlaceholder')} />
                                                            <span className="inputnote">{translate('emailSmsPage.recipientPhoneNote', { contact_phone: '{{contact_phone}}' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <div className="form-group">
                                                            <label>{translate('emailSmsPage.smsMessageLabel')}</label>
                                                            <textarea className="form-control" rows="5" name="smsContent" maxLength={SMS_MAX_CHARS} ref={smsContentRef} value={currentTemplate.smsContent} onChange={handleInputChange} onFocus={() => setFocusedRef(smsContentRef)} placeholder={translate('emailSmsPage.smsMessagePlaceholder')}></textarea>
                                                            <div className="texttypelimit">
                                                                <span className="inputnote">{translate('emailSmsPage.smsLength')} {smsCharCount}/{SMS_MAX_CHARS} {translate('emailSmsPage.characters')}</span>
                                                                <span className="texttype-besked">{smsMessageCount} {smsMessageCount > 1 ? translate('emailSmsPage.messages') : translate('emailSmsPage.message')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <VariableSelector
                                                    activeTab={activeSmsVariableTab} // Changed to activeSmsVariableTab
                                                    setActiveTab={setActiveSmsVariableTab} // Changed to setActiveSmsVariableTab
                                                    variableCategories={variableCategories}
                                                    insertVariable={insertVariable} // just the function
                                                />

                                                <div className="carddesign">
                                                    <div className="emailmodaltab-heading">
                                                        <h3>{translate('emailSmsPage.preview')}</h3>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>{translate('emailSmsPage.smsTo')}</label>
                                                        <input type="text" className="form-control" readOnly value={currentTemplate.recipientPhone} placeholder={translate('emailSmsPage.recipientPhonePlaceholder')} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modalfooter">
                                            <button type="button" className="btn btn-add" onClick={closeSmsModal}>{translate('emailSmsPage.cancel')}</button>
                                            <button type="submit" className="btn btn-send">{isEditing ? translate('emailSmsPage.updateTemplate') : translate('emailSmsPage.saveTemplate')}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Content Modal */}
                {/* <div className={`${showViewContentModal ? 'modal-backdrop fade show' : ''}`}></div>
            <div className={`modal fade modaldesign emailmodal ${showViewContentModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ display: showViewContentModal ? 'block' : 'none' }}>
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">{translate('emailSmsPage.viewContent')}</h4>
                            <button type="button" className="btn-close" onClick={closeViewContentModal} aria-label={translate('emailSmsPage.cancel')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                    <path d="M18 6 6 18"></path>
                                    <path d="m6 6 12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <pre className="pre-wrap">{viewContent}</pre>
                        </div>
                        <div className="modalfooter">
                            <button type="button" className="btn btn-add" onClick={closeViewContentModal}>{translate('emailSmsPage.cancel')}</button>
                        </div>
                    </div>
                </div>
            </div> */}
            </div>

            <LimitModal
                isOpen={isLimitModalOpen}
                onClose={closeLimitModal}
                usedLimit={currentLimit.usage}
                totalAllowed={currentLimit.totalAllowed}
            />
        </>
    );
};

export default EmailSMSPage;
