import React, { useState, useEffect, useContext } from "react";
import MobileHeader from "../../components/common/MobileHeader";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import Swal from 'sweetalert2';

const WorkflowsPage = () => {
    const { authToken } = useContext(AuthContext);
    const { t } = useTranslation();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [steps, setSteps] = useState([]);
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [smsTemplates, setSmsTemplates] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [leads, setLeads] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const totalWorkflows = workflows.length;

    // stats states
    const [totalSms, setTotalSms] = useState(0);
    const [totalEmails, setTotalEmails] = useState(0);
    const [totalTimeSaved, setTotalTimeSaved] = useState({ minutes: 0, hours: 0 });
    const [executionsToday, setExecutionsToday] = useState(0);
    const [executionsYesterday, setExecutionsYesterday] = useState(0);
    const [activeWorkflows, setActiveWorkflows] = useState(0);

    // Form data
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        triggerEvent: "",
        description: "",
        isActive: true,
        steps: [],
    });

    function formatTimeSaved(totalMinutes) {
        if (!totalMinutes || isNaN(totalMinutes)) {
            return "0m";
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours === 0) {
            return `${minutes}m`;
        } else if (minutes === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${minutes}m`;
        }
    }


    // Fetch Workflows
    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/workflows`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const workflowsData = res.data;

            let totalSmsCount = 0;
            let totalEmailCount = 0;

            let executionsTodayCount = 0;
            let executionsYesterdayCount = 0;

            const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);

            // --- Add executionCount, totalEmails, totalSms per workflow ---
            const workflowsWithCounts = workflowsData.map(wf => {
                let executionCount = 0;
                let totalEmails = 0;
                let totalSms = 0;

                // Count workflow executions (any step done)
                executionCount = wf.logs?.filter(log => log.status === "done").length || 0;

                // Loop over steps to count email/sms specifically
                wf.steps?.forEach(step => {
                    if (step.type === "sendEmail") {
                        const stepEmailCount = wf.logs?.filter(log => log.stepId === step.id && log.status === "done").length || 0;
                        totalEmails += stepEmailCount;
                        totalEmailCount += stepEmailCount; // aggregate across all workflows
                    }

                    if (step.type === "sendSms") {
                        const stepSmsCount = wf.logs?.filter(log => log.stepId === step.id && log.status === "done").length || 0;
                        totalSms += stepSmsCount;
                        totalSmsCount += stepSmsCount; // aggregate across all workflows
                    }

                    // Count executions today/yesterday
                    wf.logs?.forEach(log => {
                        if (log.status === "done" && log.executedAt) {
                            const logDate = log.executedAt.slice(0, 10);
                            if (logDate === todayStr) executionsTodayCount++;
                            if (logDate === yesterdayStr) executionsYesterdayCount++;
                        }
                    });
                });

                return {
                    ...wf,
                    executionCount,
                    totalEmails,
                    totalSms
                };
            });

          
            // Update state
            setWorkflows(workflowsWithCounts);
            setTotalSms(totalSmsCount);
            setTotalEmails(totalEmailCount);
            setTotalTimeSaved(totalEmailCount + totalSmsCount); // assuming 1 min saved per email/SMS
            setActiveWorkflows(workflowsData.filter(wf => wf.isActive).length);
            setExecutionsToday(executionsTodayCount);
            setExecutionsYesterday(executionsYesterdayCount);

        } catch (err) {
            console.error(err);
            toast.error(t("Failed to load workflows"));
        } finally {
            setLoading(false);
        }
    };



    // --- Fetching Templates Functions ---
    const fetchEmailTemplates = async () => {
        if (!authToken) {
            toast.error(t('api.emailTemplates.authError'));
            return;
        }
        try {
            const response = await api.get(`/email-templates`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            // Map the data to ensure correct field names if API uses different ones
            setEmailTemplates(response.data.map(template => ({
                id: template.id,
                templateName: template.templateName,
                subject: template.subject,
            })));
        } catch (error) {
            console.error("Error fetching email templates:", error);
            toast.error(t('api.emailTemplates.fetchError'));
        }
    };

    const fetchSmsTemplates = async () => {
        if (!authToken) {
            toast.error(t('api.smsTemplates.authError'));
            return;
        }
        try {
            const response = await api.get(`/sms-templates`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            // Map the data to ensure correct field names if API uses different ones
            setSmsTemplates(response.data.map(template => ({
                id: template.id,
                templateName: template.templateName,
                smsContent: template.smsContent,
            })));
        } catch (error) {
            console.error("Error fetching SMS templates:", error);
            toast.error(t('api.smsTemplates.fetchError'));
        }
    };


    const fetchStatuses = async () => {
        try {
            const response = await api.get('/statuses', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            // Filter statuses relevant to 'Lead' and set them
            setStatuses(response.data.filter(s => s.statusFor === 'Lead'));
        } catch (err) {
            console.error('Error fetching statuses:', err);
            toast.error(t('api.leads.statusUpdateError'));
        }
    };

    const fetchLeads = async () => {
        try {
            const response = await api.get('/leads', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setLeads(response.data);
        } catch (err) {
            console.error('Error fetching leads:', err);
            toast.error(t('api.leads.fetchError'));
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchEmailTemplates();
        fetchSmsTemplates();
        fetchWorkflows();
        fetchStatuses();
        fetchLeads();
    }, []);

    // Handle Input Change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    // Add Step
    const addStep = (type) => {
        const newStep = {
            id: uuidv4(),
            type,
            config: {}, // later store chosen email template, SMS body, etc.
        };
        setSteps([...steps, newStep]);
    };


    // Remove Step
    const removeStep = (id) => {
        setSteps(steps.filter((step) => step.id !== id));
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                steps: steps.map(step => ({
                    type: step.type,
                    config: step.config
                }))
            };

            const config = {
                headers: { Authorization: `Bearer ${authToken}` } // pass token here
            };

            if (formData.id) {
                // Update existing workflow
                await api.put(`/workflows/${formData.id}`, payload, config);
                toast.success(t("api.workflows.updatedSuccessfully"));
            } else {
                // Create new workflow
                await api.post("/workflows", payload, config);
                toast.success(t("api.workflows.createdSuccessfully"));
            }

            fetchWorkflows();

            // Reset form
            setFormData({ name: "", triggerEvent: "", description: "", isActive: true });
            setSteps([]);
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving workflow:", err);
            toast.error(formData.id ? t("api.workflows.updateFailed") : t("api.workflows.creationFailed"));
        }
    };


    // Step ऊपर ले जाना
    const moveStepUp = (index) => {
        if (index === 0) return; // पहला step ऊपर नहीं जा सकता
        setSteps(prevSteps => {
            const updated = [...prevSteps];
            [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
            return updated;
        });
    };

    // Step नीचे ले जाना
    const moveStepDown = (index) => {
        if (index === steps.length - 1) return; // आख़िरी step नीचे नहीं जा सकता
        setSteps(prevSteps => {
            const updated = [...prevSteps];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated;
        });
    };

    const updateStepConfig = (stepId, key, value) => {
        setSteps(prevSteps =>
            prevSteps.map(s =>
                s.id === stepId
                    ? { ...s, config: { ...s.config, [key]: value } }
                    : s
            )
        );
    };




    const renderStep = (step, index) => {
        const selectedEmailTemplate = emailTemplates.find(t => t.id === step.config?.emailTemplateId) || null;

        const handleEmailTemplateSelect = (templateId) => {
            setSteps(prevSteps =>
                prevSteps.map(s =>
                    s.id === step.id
                        ? { ...s, config: { ...s.config, emailTemplateId: templateId } }
                        : s
                )
            );
        };
        const selectedSmsTemplate = smsTemplates.find(t => t.id === step.config?.smsTemplateId) || null;


        const handleSmsTemplateSelect = (templateId) => {
            setSteps(prevSteps =>
                prevSteps.map(s =>
                    s.id === step.id
                        ? { ...s, config: { ...s.config, smsTemplateId: templateId } }
                        : s
                )
            );
        };

        const selectedStatusTemplate = statuses.find(t => t.id === step.config?.statusId) || null;

        const handleStatusSelect = (statusId) => {
            setSteps(prevSteps =>
                prevSteps.map(s =>
                    s.id === step.id
                        ? { ...s, config: { ...s.config, statusId } }
                        : s
                )
            );
        };

        const selectedLeads = leads.find(t => t.id === step.config?.leadId) || null;

        const handleLeadSelect = (leadId) => {
            setSteps(prevSteps =>
                prevSteps.map(s =>
                    s.id === step.id
                        ? { ...s, config: { ...s.config, leadId } }
                        : s
                )
            );
        };

        const duplicateStep = (index) => {
            setSteps(prevSteps => {
                const stepToDuplicate = prevSteps[index];
                const newStep = {
                    ...stepToDuplicate,
                    id: Date.now(),
                    config: { ...stepToDuplicate.config }, // Ensure config exists
                    title: stepToDuplicate.title
                        ? stepToDuplicate.title.endsWith("(copy)")
                            ? stepToDuplicate.title
                            : `${stepToDuplicate.title} (copy)`
                        : `${t('workflows.stepTypes.' + stepToDuplicate.type)} (copy)`,
                };
                const newSteps = [...prevSteps];
                newSteps.splice(index + 1, 0, newStep);
                return newSteps;
            });
        };


        switch (step.type) {
            case "sendEmail":
                return (
                    <div className="carddesign workflowsaddcarddesign">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.sendEmail')} <span className="status">{t('workflows.stepTypes.sendEmail')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.sendEmailDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.emailConfiguration')}</h2>
                                <div className="form-group mb-1">
                                    <label>{t('workflows.emailTemplate')}</label>
                                    <div className="inputselect">
                                        <div className="dropdown leaddropdown sendemaidropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                <span>
                                                    {selectedEmailTemplate
                                                        ? selectedEmailTemplate.templateName
                                                        : t('workflows.selectEmailTemplate')}
                                                </span>
                                            </button>
                                            <ul className="dropdown-menu" >
                                                {emailTemplates.map(template => (
                                                    <li key={template.id}><Link className="dropdown-item" to="#" onClick={() => handleEmailTemplateSelect(template.id)}>{template.templateName} <span>{template.subject.length > 40 ? template.subject.substring(0, 40) + "..." : template.subject}</span></Link></li>
                                                ))}
                                            </ul>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "sendSms":
                return (
                    <div className="carddesign workflowsaddcarddesign">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.sendSms')} <span className="status">{t('workflows.stepTypes.sendSms')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.sendSmsDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.smsConfiguration')}</h2>
                                <div className="form-group mb-1">
                                    <label>{t('workflows.smsTemplate')}</label>
                                    <div className="inputselect">
                                        <div className="dropdown leaddropdown sendemaidropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                <span>
                                                    {selectedSmsTemplate
                                                        ? selectedSmsTemplate.templateName
                                                        : t('workflows.selectSmsTemplate')}
                                                </span>
                                            </button>
                                            <ul className="dropdown-menu" >
                                                {smsTemplates.map(template => (
                                                    <li key={template.id}><Link className="dropdown-item" to="#" onClick={() => handleSmsTemplateSelect(template.id)}>{template.templateName} <span> {template.smsContent.length > 40 ? template.smsContent.substring(0, 40) + "..." : template.smsContent}</span></Link></li>
                                                ))}
                                            </ul>

                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "updateStatus":
                return (
                    <div className="carddesign workflowsaddcarddesign statusupdate">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.updateStatus')} <span className="status">{t('workflows.stepTypes.updateStatus')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.updateStatusDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.statusUpdate')}</h2>
                                <div className="form-group mb-1">
                                    <label>{t('workflows.newStatus')}</label>
                                    <div className="inputselect">
                                        <div className="dropdown leaddropdown sendemaidropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                <span>
                                                    {selectedStatusTemplate
                                                        ? // Translate selected status name
                                                        selectedStatusTemplate.name === "New" ? t('workflows.statusOptions.new') :
                                                            selectedStatusTemplate.name === "In Dialogue" ? t('workflows.statusOptions.contacted') :
                                                                selectedStatusTemplate.name === "Qualified" ? t('workflows.statusOptions.qualified') :
                                                                    selectedStatusTemplate.name === "Offer Sent" ? t('workflows.statusOptions.offerSent') :
                                                                        selectedStatusTemplate.name === "Won" ? t('workflows.statusOptions.won') :
                                                                            selectedStatusTemplate.name === "Lost" ? t('workflows.statusOptions.lost') :
                                                                                selectedStatusTemplate.name
                                                        : t('workflows.selectNewStatus')}
                                                </span>
                                            </button>
                                            <ul className="dropdown-menu">
                                                {statuses.map(status => (
                                                    <li key={status.id}>
                                                        <Link
                                                            className="dropdown-item"
                                                            to="#"
                                                            onClick={() => handleStatusSelect(status.id)}
                                                        >
                                                            {status.name === "Offer Sent" && <div className="dot purpledot"></div>}
                                                            {status.name === "Won" && <div className="dot greendot"></div>}
                                                            {status.name === "Lost" && <div className="dot reddot"></div>}
                                                            {status.name === "New" && t('workflows.statusOptions.new')}
                                                            {status.name === "In Dialogue" && t('workflows.statusOptions.contacted')}
                                                            {status.name === "Qualified" && t('workflows.statusOptions.qualified')}
                                                            {status.name === "Offer Sent" && <span>{t('workflows.statusOptions.offerSent')}</span>}
                                                            {status.name === "Won" && <span>{t('workflows.statusOptions.won')}</span>}
                                                            {status.name === "Lost" && <span>{t('workflows.statusOptions.lost')}</span>}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>


                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "assignUser":
                return (
                    <div className="carddesign workflowsaddcarddesign assignuser">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.assignUser')} <span className="status">{t('workflows.stepTypes.assignUser')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.assignUserDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.userAssignment')}</h2>
                                <div className="form-group mb-1">
                                    <label>{t('workflows.assignTo')}</label>
                                    <div className="inputselect">
                                        <div className="dropdown leaddropdown sendemaidropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                <span>
                                                    {selectedLeads
                                                        ? selectedLeads.fullName
                                                        : t('workflows.selectUser')}
                                                </span>
                                            </button>
                                            <ul className="dropdown-menu" >
                                                {leads.map(lead => (
                                                    <li key={lead.id}><Link className="dropdown-item" to="#" onClick={() => handleLeadSelect(lead.id)}>{lead.fullName} <span>{lead.email}</span></Link></li>
                                                ))}
                                            </ul>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "addTags":
                return (
                    <div className="carddesign workflowsaddcarddesign assignuser">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.addTags')} <span className="status">{t('workflows.stepTypes.addTags')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.addTagsDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.tagConfiguration')}</h2>
                                <div className="form-group mb-1">
                                    <label>{t('workflows.tagsPlaceholder')}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={step.config?.tags?.join(",") || ""}
                                        placeholder="hot-lead, urgent, vip"
                                        onChange={(e) => updateStepConfig(step.id, "tags", e.target.value.split(","))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "waitDelay":
                return (
                    <div className="carddesign workflowsaddcarddesign waitdelay">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.waitDelay')} <span className="status">{t('workflows.stepTypes.waitDelay')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.waitDelayDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.waitDelayConfiguration')}</h2>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-1">
                                            <label>{t('workflows.duration')}</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={step.config?.delay || ""}
                                                onChange={(e) => updateStepConfig(step.id, "delay", Number(e.target.value))}
                                                placeholder="5"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-1">
                                            <label>{t('workflows.unit')}</label>
                                            <div className="inputselect">
                                                <select
                                                    className="form-select"
                                                    value={step.config?.unit || "minutes"}
                                                    onChange={(e) => updateStepConfig(step.id, "unit", e.target.value)}
                                                >
                                                    <option value="">{t('workflows.unitOptions.chooseTime')}</option>
                                                    <option value="minutes">{t('workflows.unitOptions.minutes')}</option>
                                                    <option value="hours">{t('workflows.unitOptions.hours')}</option>
                                                    <option value="days">{t('workflows.unitOptions.days')}</option>
                                                </select>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "condition":
                return (
                    <div className="carddesign workflowsaddcarddesign condition">
                        <div className="workflows-showbox-title">
                            <div className="workflowsadd-icon">
                                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg></span>
                                <div className="badge">{index + 1}</div>
                            </div>
                            <div className="workflowsadd-icondesc">
                                <div className="workflowsadd-headingsec">
                                    <div className="workflowsadd-heading">
                                        <h4>{step.title || t('workflows.stepTypes.condition')} <span className="status">{t('workflows.stepTypes.condition')}</span></h4>
                                        <div className="workflows-status">{t('workflows.stepTypes.conditionDescription')}</div>
                                    </div>
                                    <div className="workflowsadd-heading-action">
                                        <Link to="#" className="btn btn-add" onClick={() => duplicateStep(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                        {index > 0 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepUp(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up" aria-hidden="true"><path d="m18 15-6-6-6 6"></path></svg></Link>
                                        )}
                                        {index < steps.length - 1 && (
                                            <Link to="#" className="btn btn-add" onClick={() => moveStepDown(index)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></Link>
                                        )}
                                        <Link to="#" className="btn btn-add" onClick={() => removeStep(step.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                    </div>
                                </div>
                                <h2 className="card-title">{t('workflows.conditionConfiguration')}</h2>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="form-group mb-1">
                                            <label>{t('workflows.field')}</label>
                                            <div className="inputselect">
                                                <select className="form-select" value={step.config?.field || ""} onChange={(e) => updateStepConfig(step.id, "field", e.target.value)}>
                                                    <option value="">{t('workflows.selectField')}</option>
                                                    <option value="status">{t('workflows.fieldOptions.status')}</option>
                                                    <option value="leadValue">{t('workflows.fieldOptions.leadValue')}</option>
                                                    <option value="source">{t('workflows.fieldOptions.source')}</option>
                                                    <option value="email">{t('workflows.fieldOptions.email')}</option>
                                                    <option value="phone">{t('workflows.fieldOptions.phone')}</option>
                                                    <option value="company">{t('workflows.fieldOptions.company')}</option>
                                                    <option value="tags">{t('workflows.fieldOptions.tags')}</option>
                                                </select>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group mb-1">
                                            <label>{t('workflows.operator')}</label>
                                            <div className="inputselect">
                                                <select className="form-select" value={step.config?.operator || ""} onChange={(e) => updateStepConfig(step.id, "operator", e.target.value)}>
                                                    <option value="">{t('workflows.selectOperator')}</option>
                                                    <option value="equals">{t('workflows.operatorOptions.equals')}</option>
                                                    <option value="notEquals">{t('workflows.operatorOptions.notEquals')}</option>
                                                    <option value="contains">{t('workflows.operatorOptions.contains')}</option>
                                                    <option value="greaterThan">{t('workflows.operatorOptions.greaterThan')}</option>
                                                    <option value="lessThan">{t('workflows.operatorOptions.lessThan')}</option>
                                                </select>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group mb-1">
                                            <label>{t('workflows.value')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={step.config?.value || ""}
                                                onChange={(e) => updateStepConfig(step.id, "value", e.target.value)}
                                                placeholder={t('workflows.enterValuePlaceholder')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <h2 className="card-title conditioncard-title2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>{t('workflows.ifThenElse')}</h2>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="carddesign cardhandling1">
                                            <h4><span></span>{t('workflows.ifTrue')}</h4>
                                            <div className="form-group mb-1">
                                                <label>{t('workflows.action')}</label>
                                                <div className="inputselect">
                                                    <select className="form-select">
                                                        <option>{t('workflows.actionOptions.continueNextStep')}</option>
                                                        <option>{t('workflows.actionOptions.endWorkflow')}</option>
                                                        <option>{t('workflows.actionOptions.jumpToStep')}</option>
                                                    </select>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="carddesign cardhandling2">
                                            <h4><span></span>{t('workflows.ifFalse')}</h4>
                                            <div className="form-group mb-1">
                                                <label>{t('workflows.action')}</label>
                                                <div className="inputselect">
                                                    <select className="form-select">
                                                        <option>{t('workflows.actionOptions.continueNextStep')}</option>
                                                        <option>{t('workflows.actionOptions.endWorkflow')}</option>
                                                        <option>{t('workflows.actionOptions.jumpToStep')}</option>
                                                    </select>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const handleToggleActive = async (workflowId, isActive) => {
        try {
            const payload = { isActive }; // only updating isActive
            const config = {
                headers: { Authorization: `Bearer ${authToken}` },
            };

            await api.put(`/workflows/${workflowId}`, payload, config);

            // Update UI immediately
            setWorkflows(prev =>
                prev.map(w => (w.id === workflowId ? { ...w, isActive } : w))
            );

            toast.success(t("api.workflows.statusUpdated"));
        } catch (err) {
            console.error("Error updating workflow status:", err);
            toast.error(t("api.workflows.updateFailed"));
        }
    };


    const openCreateModal = () => {
        setIsEditing(false); // we are creating
        setFormData({
            name: "",
            triggerEvent: "",
            description: "",
            isActive: true,
        });
        setSteps([]);
    };


    const openEditModal = (workflow) => {
        setFormData({
            id: workflow.id,
            name: workflow.name,
            triggerEvent: workflow.triggerEvent,
            description: workflow.description,
            isActive: workflow.isActive,
        });

        // ✅ Sort steps by order before setting
        const sortedSteps = [...(workflow.steps || [])].sort((a, b) => a.order - b.order);

        // If backend steps don’t have `uuid`, assign one for React rendering
        const mappedSteps = sortedSteps.map(step => ({
            id: step.id || uuidv4(),
            type: step.type,
            config: step.config || {},
            order: step.order
        }));

        setSteps(mappedSteps);

        setIsEditing(true);
    };



    const handleDeleteWorkflow = async (workflowId) => {
        const result = await Swal.fire({
            title: t("api.workflows.confirmDeleteTitle"),
            text: t("api.workflows.confirmDeleteMessage"),
            icon: "warning",
            showCancelButton: true,
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${authToken}` },
                };
                await api.delete(`/workflows/${workflowId}`, config);

                // Remove the workflow from UI
                setWorkflows(prev => prev.filter(w => w.id !== workflowId));

                Swal.fire({
                    title: t("api.workflows.deletedSuccessfully"),
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } catch (err) {
                console.error("Error deleting workflow:", err);
                Swal.fire({
                    title: t("api.workflows.deleteFailed"),
                    icon: "error",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
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
                                <h2>{t('workflows.pageTitle')}</h2>
                                <p>{t('workflows.pageDescription')}</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="dashright">
                                <Link to="#" onClick={() => openCreateModal()} className="btn btn-send" data-bs-toggle="modal" data-bs-target="#myModal3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.newWorkflowButton')}</Link>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow h-4 w-4 text-muted-foreground" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg></span>
                                <h3>{t('workflows.totalWorkflows')}</h3>
                                <h5>{totalWorkflows}</h5>
                                <h6 className="activenot">{t('workflows.activeWorkflows', { count: activeWorkflows })}</h6>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-4 w-4 text-muted-foreground" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>
                                <h3>{t('workflows.executionsToday')}</h3>
                                <h5>{executionsToday}</h5>
                                <h6>{t('workflows.fromYesterday', { count: executionsYesterday })}</h6>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        className="lucide lucide-mail h-4 w-4 text-muted-foreground"
                                        aria-hidden="true">
                                        <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                                        <polyline points="3,7 12,13 21,7"></polyline>
                                    </svg>
                                </span>
                                <h3>{t('workflows.totalMessagesSent')}</h3>
                                {/* <h3>{totalSms + totalEmails}</h3> */}
                                <div className="d-flex justify-content-between">
                                    <div>
                                        <h5>{totalSms}</h5>
                                        <h6 className="mb-0">{t('workflows.totalSmsSent')}</h6>
                                    </div>
                                    <div>
                                        <h5>{totalEmails}</h5>
                                        <h6 className="mb-0">{t('workflows.totalEmailsSent')}</h6>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="col-md-3">
                            <div className="carddesign cardinfo">
                                <span className="card-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow h-4 w-4 text-muted-foreground" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg></span>
                                <h3>{t('workflows.timeSaved')}</h3>
                                <h5>{formatTimeSaved(totalTimeSaved)}</h5>
                                <h6 className="activenot">{t('workflows.thisWeek')}</h6>
                            </div>
                        </div>
                    </div>
                    <div className="carddesign workflows">
                        <h2 className="card-title">{t('workflows.yourWorkflows')}</h2>
                        <div className="leadlist">
                            <ul className="leadlistul">
                                {loading ? (
                                    <li>
                                        <p className="text-center">
                                            {t('loading', 'Loading...')}
                                        </p>
                                    </li>
                                ) : workflows.length === 0 ? (

                                    <li>
                                        <p className="text-center">
                                            {t('workflows.noWorkflows', 'No workflows found')}
                                        </p>
                                    </li>
                                ) : (
                                    <>
                                        {workflows.map((wf) => (
                                            <li key={wf.id}>
                                                <div className="leadlist-box">
                                                    <div className="leadlist-info">
                                                        <div className="leadlist-name">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-workflow" aria-hidden="true"><rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect></svg>
                                                        </div>
                                                        <h4>{wf.name}{' '} <div className="badge">{t('workflows.stepsBadge', { count: wf.steps?.length || 0 })}</div><div className={`status ${wf.isActive ? 'status3' : 'status4'}`}> {wf.isActive ? t('workflows.statusActive') : t('workflows.statusInactive')}</div></h4>
                                                        <h5>{wf.description}</h5>
                                                        <h5><span>{t('workflows.trigger')} {wf.triggerEvent ? wf.triggerEvent.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : ''}</span><span>{wf.lastRun && (<span> {t('workflows.lastRun')} {wf.lastRun} </span>)}</span><span>{t('workflows.executions', { count: wf.executionCount || 0 })}</span></h5>
                                                    </div>
                                                    <div className="leadlist-action">
                                                        <div className="switchbtn">
                                                            <label className="switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={wf.isActive}
                                                                    onChange={(e) => handleToggleActive(wf.id, e.target.checked)}
                                                                />


                                                                <span className="slider round"></span>
                                                            </label>
                                                        </div>
                                                        <Link to="#" className="action-icon" data-bs-toggle="modal" data-bs-target="#myModal3" onClick={() => openEditModal(wf)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen w-4 h-4" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></Link>
                                                        <Link to="#" className="action-icon" onClick={() => handleDeleteWorkflow(wf.id)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></Link>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div >
            </div >
            <div className="modal fade modaldesign workflowmodal" id="myModal3">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title"><span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></span>{isEditing ? t('workflows.editWorkflow') : t('workflows.createWorkflow')}</h4>
                            <p>{isEditing ? t('workflows.editWorkflowDescription') : t('workflows.createWorkflowDescription')}</p>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
                        </div>
                        <div className="modal-body">
                            <div className="formdesign">
                                <form onSubmit={handleSubmit}>
                                    <div className="carddesign">
                                        <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings" aria-hidden="true"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('workflows.workflowSettings')}</h2>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('workflows.workflowName')}</label>
                                                    <input type="text" className="form-control" id="" name="name" value={formData.name} onChange={handleChange} placeholder={t('workflows.workflowNamePlaceholder')} required />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>{t('workflows.triggerEvent')}</label>
                                                    <div className="inputselect">
                                                        <select className="form-select" name="triggerEvent" value={formData.triggerEvent} onChange={handleChange} required>
                                                            <option value="">{t('workflows.selectTrigger')}</option>
                                                            <option value="newLeadCreated">{t('workflows.triggerOptions.newLeadCreated')}</option>
                                                            <option value="leadCreatedViaFacebook">{t('workflows.triggerOptions.leadCreatedViaFacebook')}</option>
                                                            <option value="leadCreatedViaWebsite">{t('workflows.triggerOptions.leadCreatedViaWebsite')}</option>
                                                            <option value="leadCreatedViaAPI">{t('workflows.triggerOptions.leadCreatedViaAPI')}</option>
                                                            <option value="leadUpdated">{t('workflows.triggerOptions.leadUpdated')}</option>
                                                            <option value="leadStatusChanged">{t('workflows.triggerOptions.leadStatusChanged')}</option>
                                                            <option value="leadMarkedAsWon">{t('workflows.triggerOptions.leadMarkedAsWon')}</option>
                                                            <option value="leadMarkedAsLost">{t('workflows.triggerOptions.leadMarkedAsLost')}</option>
                                                            <option value="leadInactive">{t('workflows.triggerOptions.leadInactive')}</option>
                                                        </select>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label>{t('workflows.description')}</label>
                                                    <textarea className="form-control" rows="3" name="description" value={formData.description} onChange={handleChange} placeholder={t('workflows.descriptionPlaceholder')} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="switchbtn">
                                            <label className="switch">
                                                <input type="checkbox" defaultChecked="" name="isActive" checked={formData.isActive} onChange={handleChange} />
                                                <span className="slider round"></span>
                                            </label><span className="switchbtntext">{t('workflows.activateWorkflow')}</span><span className="status status5">{formData.isActive ? t("workflows.statusActive") : t("workflows.statusInactive")}</span>
                                        </div>
                                        <div className="alertbox">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>{t('workflows.alertTriggerEvent')}</h2>
                                            <p>{t('workflows.alertTriggerMessage')}<strong> {formData.triggerEvent ? formData.triggerEvent.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : ''}</strong></p>
                                        </div>
                                    </div>
                                    <div className="carddesign">
                                        <div className="addstep-heading">
                                            <h2 className="card-title"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.workflowSteps', { count: steps.length })}</h2>
                                            <div className="form-group">
                                                <div className="inputselect">
                                                    <div className="dropdown leaddropdown">
                                                        <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg><span>{t('workflows.addStep')}</span>
                                                        </button>
                                                        <ul className="dropdown-menu" >
                                                            <li><Link className="dropdown-item" to="#" onClick={() => addStep("sendEmail")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg></div><label>{t('workflows.stepTypes.sendEmail')} <span>{t('workflows.stepTypes.sendEmailDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#" onClick={() => addStep("sendSms")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg></div><label>{t('workflows.stepTypes.sendSms')} <span>{t('workflows.stepTypes.sendSmsDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#" onClick={() => addStep("updateStatus")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div><label>{t('workflows.stepTypes.updateStatus')} <span>{t('workflows.stepTypes.updateStatusDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#" onClick={() => addStep("waitDelay")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg></div><label>{t('workflows.stepTypes.waitDelay')} <span>{t('workflows.stepTypes.waitDelayDescription')}</span></label></Link></li>
                                                             {/* <li><Link className="dropdown-item" to="#" onClick={() => addStep("assignUser")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg></div><label>{t('workflows.stepTypes.assignUser')} <span>{t('workflows.stepTypes.assignUserDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#" onClick={() => addStep("addTags")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg></div><label>{t('workflows.stepTypes.addTags')} <span>{t('workflows.stepTypes.addTagsDescription')}</span></label></Link></li>
                                                            <li><Link className="dropdown-item" to="#" onClick={() => addStep("condition")}><div className="addstep-svg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg></div><label>{t('workflows.stepTypes.condition')} <span>{t('workflows.stepTypes.conditionDescription')}</span></label></Link></li>*/} 
                                                        </ul>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        {steps.length === 0 && (
                                            <div className="addstepbox">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mx-auto" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                                <h4>{t('workflows.noStepsAdded')}</h4>
                                                <p>{t('workflows.addStepInstruction')}</p>
                                                <button type="button" className="btn btn-send" onClick={() => addStep("sendEmail")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{t('workflows.addFirstStep')}</button>
                                            </div>
                                        )}
                                        {steps.map((step, index) => (
                                            <div key={step.id}>
                                                {renderStep(step, index)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="modalfooter btn-right opretworkflow">
                                        <div className="opretworkflowleft">{t('workflows.stepsConfigured', { count: steps.length })}</div>
                                        <div className="opretworkflow-right">
                                            <button data-bs-dismiss="modal" type="button" className="btn btn-add">{t('workflows.cancel')}</button>
                                            <button className="btn btn-send" data-bs-dismiss="modal" type="submit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap" aria-hidden="true"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>{t('workflows.saveWorkflow')}</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default WorkflowsPage;