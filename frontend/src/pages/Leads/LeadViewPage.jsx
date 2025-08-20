import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import AddEditLeadModal from './AddEditLeadModal';
import SendQuoteModal from './SendQuoteModal';
import FullPageLoader from '../../components/common/FullPageLoader';

const LeadViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [quoteStatuses, setQuoteStatuses] = useState([]);
  const [pricingTemplates, setPricingTemplates] = useState([]);
  const [isEditing, setIsEditing] = useState({
    fullName: false,
    email: false,
    phone: false,
    address: false,
    customerComment: false,
    internalNote: false,
    companyName: false,
    cvrNumber: false,
  });

  const [editedData, setEditedData] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    customerComment: "",
    internalNote: "",
    companyName: "",
    cvrNumber: "",
  });


  // State for the new quote form (right bar)
  const [newQuoteFormData, setNewQuoteFormData] = useState({
    title: '',
    description: '',
    validDays: 7,
    overallDiscount: 0,
    terms: '',
    services: [],
    pricingTemplateId: '',
    total: 0,
  });
  const [currentQuoteService, setCurrentQuoteService] = useState({
    name: '',
    description: '',
    quantity: 1,
    unit: '',
    pricePerUnit: 0,
    discountPercent: 0,
    total: 0
  });

  // State for quote history
  const [quotesHistory, setQuotesHistory] = useState([]);

  // States for SendQuoteModal
  const [showSendQuoteModal, setShowSendQuoteModal] = useState(false);
  const [quoteToActOn, setQuoteToActOn] = useState(null); // Stores the quote after creation/update



  const handleEditLead = (fieldOrEvent) => {
    // Case 1: Called with string field name -> enable editing
    if (typeof fieldOrEvent === "string") {
      setIsEditing((prev) => ({ ...prev, [fieldOrEvent]: true }));
    }
    // Case 2: Called from textarea onChange event -> update editedData
    else if (fieldOrEvent?.target) {
      const { name, value } = fieldOrEvent.target;
      setEditedData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };


  const handleSave = async (field) => {
    try {
      await api.put(
        `/leads/${id}`,
        { [field]: editedData[field] }, // <-- dynamic field (e.g., internalNote or fullName)
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      toast.success(`${field} updated successfully!`);
      fetchLeadDetails();
      setIsEditing((prev) => ({ ...prev, [field]: false }));
    } catch (err) {
      console.error(`Error saving ${field}:`, err);
      toast.error(`Failed to update ${field}`);
    }
  };



  useEffect(() => {
    fetchLeadDetails();
    fetchStatuses();
    fetchQuoteStatuses();
    fetchPricingTemplates();
    fetchQuotesHistory();
  }, [id, authToken]);

  const fetchLeadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/leads/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const leadData = response.data;
      setLead(leadData);

      setEditedData({
        fullName: leadData.fullName || "",
        company: leadData.company || "",
        email: leadData.email || "",
        phone: leadData.phone || "",
        address: leadData.address || "",
        customerComment: leadData.customerComment || "",
        internalNote: leadData.internalNote || "",
        companyName: leadData.companyName || "",
        cvrNumber: leadData.cvrNumber || "",
      });

    } catch (err) {
      console.error('Error fetching lead details:', err);
      setError('Failed to load lead details. Lead not found or unauthorized.');
      toast.error('Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await api.get('/statuses', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setStatuses(response.data.filter(s => s.statusFor === 'Lead'));
    } catch (err) {
      console.error('Error fetching lead statuses:', err);
      toast.error('Failed to load lead statuses.');
    }
  };

  const fetchQuoteStatuses = async () => {
    try {
      const response = await api.get('/statuses', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setQuoteStatuses(response.data.filter(s => s.statusFor === 'Quote'));
    } catch (err) {
      console.error('Error fetching quote statuses:', err);
      toast.error('Failed to load quote statuses.');
    }
  };

  const fetchPricingTemplates = async () => {
    try {
      const response = await api.get('/pricing-templates', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const processedTemplates = response.data.map(template => ({
        ...template,
        services: (template.services || []).map(service => ({
          ...service,
          pricePerUnit: Number(service.price) || 0,
          quantity: Number(service.quantity) || 1,
          discountPercent: 0, // Ensure default discount for template services
        }))
      }));
      setPricingTemplates(processedTemplates);
    } catch (err) {
      console.error('Error fetching pricing templates:', err);
      toast.error('Failed to load pricing templates.');
    }
  };

  const fetchQuotesHistory = async () => {
    try {
      const response = await api.get(`/quotes?leadId=${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setQuotesHistory(response.data);
    } catch (err) {
      console.error('Error fetching quotes history:', err);
      toast.error('Failed to load quote history.');
    }
  };

  const handleDelete = async () => {
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
        try {
          await api.delete(`/leads/${id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          toast.success('Lead deleted successfully!');
          navigate('/leads');
        } catch (err) {
          console.error('Error deleting lead:', err);
          toast.error('Failed to delete lead.');
        }
      }
    });
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleStatusChange = async (newStatusId) => {
    try {
      await api.put(`/leads/${id}`, { statusId: newStatusId }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Status updated successfully!');
      fetchLeadDetails();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status.');
    }
  };

  const handleCopyText = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.info('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy text.');
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value) || value === '') return 'N/A';
    return new Intl.NumberFormat('en-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(value);
  };

  const calculateServicesSubtotal = (services) => {
    return (services || []).reduce((sum, service) => {
      const quantity = parseFloat(service.quantity) || 0;
      const pricePerUnit = parseFloat(service.pricePerUnit) || 0;
      const discountPercent = parseFloat(service.discountPercent) || 0;
      const serviceNetPrice = pricePerUnit * (1 - discountPercent / 100);
      return sum + (quantity * serviceNetPrice);
    }, 0);
  };

  const calculateQuoteTotal = (services, overallDiscount) => {
    const subtotal = calculateServicesSubtotal(services);
    const finalTotal = subtotal * (1 - (overallDiscount || 0) / 100);
    return finalTotal;
  };

  const handleNewQuoteChange = (e) => {
    const { name, value } = e.target;
    setNewQuoteFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: name === 'overallDiscount' ? Number(value) :
          name === 'validDays' ? parseInt(value) :
            value,
      };
      if (name === 'overallDiscount' || name === 'services') {
        updatedFormData.total = calculateQuoteTotal(updatedFormData.services, updatedFormData.overallDiscount);
      }
      return updatedFormData;
    });
  };

  const handleCurrentQuoteServiceChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuoteService((prev) => {
      const updatedService = {
        ...prev,
        [name]: ['quantity', 'pricePerUnit', 'discountPercent'].includes(name) ? Number(value) : value,
      };
      const discountedPricePerUnit = updatedService.pricePerUnit * (1 - (updatedService.discountPercent || 0) / 100);
      updatedService.total = updatedService.quantity * discountedPricePerUnit;
      return updatedService;
    });
  };

  const handleAddQuoteService = () => {
    if (currentQuoteService.name && currentQuoteService.quantity > 0 && currentQuoteService.pricePerUnit >= 0) {
      setNewQuoteFormData((prev) => {
        const updatedServices = [...prev.services, { ...currentQuoteService, total: calculateServicesSubtotal([currentQuoteService]) }];
        const newTotal = calculateQuoteTotal(updatedServices, prev.overallDiscount);
        return {
          ...prev,
          services: updatedServices,
          total: newTotal,
        };
      });
      setCurrentQuoteService({ name: '', description: '', quantity: 1, unit: '', pricePerUnit: 0, discountPercent: 0, total: 0 });
    } else {
      toast.error("Please fill in all service fields correctly.");
    }
  };

  const handleRemoveQuoteService = (indexToRemove) => {
    setNewQuoteFormData((prev) => {
      const updatedServices = prev.services.filter((_, index) => index !== indexToRemove);
      const newTotal = calculateQuoteTotal(updatedServices, prev.overallDiscount);
      return {
        ...prev,
        services: updatedServices,
        total: newTotal,
      };
    });
  };

  const handleSaveQuote = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        userId: lead.userId,
        leadId: lead.id,
        pricingTemplateId: newQuoteFormData.pricingTemplateId || null,
        title: newQuoteFormData.title,
        description: newQuoteFormData.description,
        validDays: newQuoteFormData.validDays,
        overallDiscount: newQuoteFormData.overallDiscount,
        terms: newQuoteFormData.terms,
        total: newQuoteFormData.total,
        services: newQuoteFormData.services.map(({ total, ...service }) => service),
        statusId: quoteStatuses.find(s => s.name === 'Not sent')?.id,
      };

      const response = await api.post('/quotes', payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Quote saved successfully!');
      setQuoteToActOn(response.data); // Store the newly created quote
      setShowSendQuoteModal(true); // Open the action modal

      // Reset form after successful save
      setNewQuoteFormData({
        title: '',
        description: '',
        validDays: 7,
        overallDiscount: 0,
        terms: '',
        services: [],
        pricingTemplateId: '',
        total: 0,
      });
      setCurrentQuoteService({ name: '', description: '', quantity: 1, unit: '', pricePerUnit: 0, discountPercent: 0, total: 0 });

    } catch (err) {
      console.error('Error saving quote:', err);
      toast.error('Failed to save quote.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuoteActions = async (actions) => {
    if (!quoteToActOn) {
      toast.error('No quote data available to perform actions.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update quote status if changed in modal
      if (actions.newStatusId && actions.newStatusId !== quoteToActOn.statusId) {
        await api.put(`/quotes/${quoteToActOn.id}`, { statusId: actions.newStatusId }, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success('Quote status updated.');
      }

      // 2. Send SMS if checked
      if (actions.sendSms && actions.smsDetails) {
        const smsPayload = {
          quoteId: quoteToActOn.id,
          recipientPhone: actions.smsDetails.toPhone, // Changed 'to' to 'recipientPhone'
          senderName: actions.smsDetails.fromName,    // Changed 'fromName' to 'senderName'
          smsMessage: actions.smsDetails.message,     // Changed 'message' to 'smsMessage'
          smsTemplateId: actions.smsDetails.smsTemplateId, // Added smsTemplateId
        };
        await api.post('/send-sms-quotes', smsPayload, { // Updated endpoint
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success('SMS sent successfully!');
      }

      // 3. Send Email if checked
      if (actions.sendEmail && actions.emailDetails) {
        const emailPayload = {
          quoteId: quoteToActOn.id,
          recipientEmail: actions.emailDetails.toEmail,   // Changed 'to' to 'recipientEmail'
          emailSubject: actions.emailDetails.subject,
          emailBody: actions.emailDetails.content,        // Changed 'content' to 'emailBody'
          emailTemplateId: actions.emailDetails.emailTemplateId, // Added emailTemplateId
        };
        await api.post('/send-email-quotes', emailPayload, { // Updated endpoint
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success('Email sent successfully!');
      }

      fetchQuotesHistory();
      fetchLeadDetails();
    } catch (err) {
      console.error('Error performing quote actions:', err);
      toast.error('Failed to perform quote actions.');
    } finally {
      setLoading(false);
      setShowSendQuoteModal(false); // Close modal
      setQuoteToActOn(null); // Clear the quote in action
    }
  };


  if (loading && !lead) {
    return <FullPageLoader />;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!lead) {
    return <p>Lead not found.</p>;
  }

  let displayTags = [];
  if (typeof lead.tags === 'string' && lead.tags.startsWith('[') && lead.tags.endsWith(']')) {
    try {
      displayTags = JSON.parse(lead.tags);
    } catch (e) {
      console.error("Error parsing tags for display:", e);
      displayTags = [];
    }
  } else if (Array.isArray(lead.tags)) {
    displayTags = lead.tags;
  }

  return (
    <>
      {/* Header Section */}
      <div className="carddesign leads-header">
        <div className="leads-headerbox">
          <div className="leads-headerbox-left">
            <Link to="/leads" className="btn btn-add">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
              Back to Leads
            </Link>
            <h4>{lead.fullName} <span>{lead.companyName} {lead.leadNumber && `(${lead.leadNumber})`}</span></h4>
          </div>
          <div className="status">{lead.status?.name || 'N/A'}</div>
        </div>
      </div>

      {/* Main Content Area: Leads Left Bar, Leads Center Bar, Leads Right Bar */}
      <div className="leadsviewrow">
        {/* Leads Left Bar */}
        <div className="leadsleft-bar">
          <div className="carddesign">
            <h2 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Lead Information
            </h2>

            <div className="leads-infocol">
              <h3 className="leads-subheading">Contact</h3>
              <div className="leads-contact">
                <div className="leads-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <div className="leads-info-text">
                    {isEditing.fullName ? (
                      <input className="form-control editcontrol" placeholder="Enter full name" required="" type="text" value={editedData.fullName} name="fullName" onChange={handleEditLead} />
                    ) : (
                      <h4>{lead.fullName || 'N/A'}</h4>
                    )}
                  </div>
                </div>
                <div className="leads-info-edit">
                  {isEditing.fullName ? (
                    <button className="copybtn btn btn-add" onClick={() => handleSave("fullName")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                  ) : (
                    <button className="copybtn btn btn-add" onClick={() => handleEditLead("fullName")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                  )}
                  <button className="copybtn btn btn-add" onClick={() => handleCopyText(lead.fullName)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button>
                </div>
              </div>
              <div className="leads-contact">
                <div className="leads-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                  <div className="leads-info-text">
                    {isEditing.email ? (
                      <input className="form-control editcontrol" placeholder="Enter full name" required="" type="text" value={editedData.email} name="email" onChange={handleEditLead} />
                    ) : (
                      <h4>{lead.email || 'N/A'}</h4>
                    )}
                  </div>
                </div>
                <div className="leads-info-edit">
                  {isEditing.email ? (
                    <button className="copybtn btn btn-add" onClick={() => handleSave("email")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                  ) : (
                    <button className="copybtn btn btn-add" onClick={() => handleEditLead("email")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                  )}
                  <button className="copybtn btn btn-add" onClick={() => handleCopyText(lead.email)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button>
                </div>
              </div>
              <div className="leads-contact">
                <div className="leads-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                  <div className="leads-info-text">
                    {isEditing.phone ? (
                      <input className="form-control editcontrol" placeholder="Enter phone" required="" type="text" value={editedData.phone} name="phone" onChange={handleEditLead} />
                    ) : (
                      <h4>{lead.phone || 'N/A'}</h4>
                    )}
                  </div>
                </div>
                <div className="leads-info-edit">
                  {isEditing.phone ? (
                    <button className="copybtn btn btn-add" onClick={() => handleSave("phone")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                  ) : (
                    <button className="copybtn btn btn-add" onClick={() => handleEditLead("phone")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                  )}
                  <button className="copybtn btn btn-add" onClick={() => handleCopyText(lead.phone)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button>
                </div>
              </div>
              <div className="leads-contact">
                <div className="leads-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <div className="leads-info-text">
                    {isEditing.address ? (
                      <input className="form-control editcontrol" placeholder="Enter address" required="" type="text" value={editedData.address} name="address" onChange={handleEditLead} />
                    ) : (
                      <h4>{lead.address || 'N/A'}</h4>
                    )}
                  </div>
                </div>
                <div className="leads-info-edit">
                  {isEditing.address ? (
                    <button className="copybtn btn btn-add" onClick={() => handleSave("address")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                  ) : (
                    <button className="copybtn btn btn-add" onClick={() => handleEditLead("address")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                  )}
                  <button className="copybtn btn btn-add" onClick={() => handleCopyText(lead.address)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button>
                </div>
              </div>
            </div>

            <div className="leads-infocol">
              <h3 className="leads-subheading">Communication</h3>
              <div className="leads-view-action">
                <Link to="#" className="btn btn-add">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-3 h-3 mr-2" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                  Send Email
                </Link>
                <Link to="#" className="btn btn-add">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square w-3 h-3 mr-2" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path></svg>
                  Send SMS
                </Link>
                <Link href={`tel:${lead.phone}`} className="btn btn-add">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone w-3 h-3 mr-2" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                  Call Up
                </Link>
              </div>
            </div>

            <div className="leads-infocol">
              <div className="formdesign lead-message">
                <div className="form-group">
                  <label>Lead Message
                    {isEditing.customerComment ? (
                      <button className="copybtn btn btn-add" onClick={() => handleSave("customerComment")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                    ) : (
                      <button className="copybtn btn btn-add" onClick={() => handleEditLead("customerComment")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                    )}
                  </label>
                  {isEditing.customerComment ? (
                    <textarea className="form-control editcontrol" placeholder="Enter Lead Message" required value={editedData.customerComment} name="customerComment" onChange={handleEditLead} />
                  ) : (
                    <div className="textareaview">
                      {lead.customerComment || 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* New section for Internal Note */}
            <div className="leads-infocol">
              <div className="formdesign lead-message">
                <div className="form-group">
                  <label>Internal Note
                    {isEditing.internalNote ? (
                      <button className="copybtn btn btn-add" onClick={() => handleSave("internalNote")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                    ) : (
                      <button className="copybtn btn btn-add" onClick={() => handleEditLead("internalNote")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                    )}
                  </label>
                  {isEditing.internalNote ? (
                    <textarea className="form-control editcontrol" placeholder="Enter Internal Note" required value={editedData.internalNote} name="internalNote" onChange={handleEditLead} />
                  ) : (
                    <div className="textareaview">
                      {lead.internalNote || 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            </div>



            <div className="leads-infocol">
              <h3 className="leads-subheading">Company</h3>
              <div className="formdesign leads-firma">
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>Company Name</label>

                    {isEditing.companyName ? (
                      <input className="form-control editcontrol" placeholder="Enter company name" required="" type="text" value={editedData.companyName} name="companyName" onChange={handleEditLead} />
                    ) : (
                      <div className="leads-firma-text">
                        <h5>{lead.companyName || 'N/A'}</h5>
                      </div>
                    )}

                  </div>
                  <div className="leads-info-edit">
                    {isEditing.companyName ? (
                      <button className="copybtn btn btn-add" onClick={() => handleSave("companyName")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                    ) : (
                      <button className="copybtn btn btn-add" onClick={() => handleEditLead("companyName")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                    )}
                    <button className="copybtn btn btn-add" onClick={() => handleCopyText(lead.companyName)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button>
                  </div>
                </div>
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>CVR Number</label>

                    {isEditing.cvrNumber ? (
                      <input className="form-control editcontrol" placeholder="Enter company number" required="" type="text" value={editedData.cvrNumber} name="cvrNumber" onChange={handleEditLead} />
                    ) : (
                      <div className="leads-firma-text">
                        <h5>{lead.cvrNumber || 'N/A'}</h5>
                      </div>
                    )}

                  </div>
                  <div className="leads-info-edit">
                    {isEditing.cvrNumber ? (
                      <button className="copybtn btn btn-add" onClick={() => handleSave("cvrNumber")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-square" aria-hidden="true"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></button>
                    ) : (
                      <button className="copybtn btn btn-add" onClick={() => handleEditLead("cvrNumber")}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg></button>
                    )}
                    <button className="copybtn btn btn-add" onClick={() => handleCopyText(lead.cvrNumber)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="leads-infocol">
              <h3 className="leads-subheading">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>
                Activity Timeline
              </h3>
              <ul className="leads-timeline">
                {/* Static Timeline Entries (Replace with dynamic data from backend if available) */}
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true" style={{ color: '#ecaf11' }}><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg>
                        <h5>Sarah Nielsen</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-04 16:00</div>
                    </div>
                    <div className="leads-timeline-details"><span>Status changed: New → Proposal</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link" aria-hidden="true" style={{ color: '#00a63e' }}><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                        <h5><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot " aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>System</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-04 14:25</div>
                    </div>
                    <div className="leads-timeline-details"><span>Quote page visited: Website Development Quote</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true" style={{ color: '#00a63e' }}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <h5><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot " aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>System</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-04 14:22</div>
                    </div>
                    <div className="leads-timeline-details"><span>Email opened by customer: Regarding quote from Kasperwest.dk</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check" aria-hidden="true" style={{ color: '#00a63e' }}><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                        <h5><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot " aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>System</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-04 09:01</div>
                    </div>
                    <div className="leads-timeline-details"><span>SMS delivered to customer</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true" style={{ color: '#00a63e' }}><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                        <h5><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot " aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>System</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-04 09:00</div>
                    </div>
                    <div className="leads-timeline-details"><span>Quote sent via email and SMS: Website Development Quote</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true" style={{ color: '#0ff' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <h5>Sarah Nielsen</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-03 16:15</div>
                    </div>
                    <div className="leads-timeline-details"><span>Quote sent via email and SMS: Website Development Quote</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true" style={{ color: '#2a77ef' }}><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                        <h5>Sarah Nielsen</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-03 11:15</div>
                    </div>
                    <div className="leads-timeline-details"><span>Sent initial information</span></div>
                  </div>
                </li>
                <li>
                  <div className="leads-timeline-box">
                    <div className="leads-timeline-info">
                      <div className="leads-timeline-profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true" style={{ color: '#2a77ef' }}><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                        <h5>Sarah Nielsen</h5>
                      </div>
                      <div className="leads-timeline-date">2025-01-03 10:30</div>
                    </div>
                    <div className="leads-timeline-details"><span>Initial conversation about website needs</span></div>
                  </div>
                </li>
              </ul>
              <div className="formdesign timelinecomment">
                <div className="form-group">
                  <textarea className="form-control" rows="3" id="comment" name="text" placeholder="Add internal comment..."></textarea>
                </div>
                <button className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send " aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>Add Comment</button>
              </div>
            </div>

            <div className="leads-infocol">
              <h3 className="leads-subheading">Lead Details</h3>
              <div className="formdesign leads-firma">
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>Source</label>
                    <div className="leads-firma-text">
                      <h5>{lead.leadSource || 'N/A'}</h5>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>Estimated Value</label>
                    <div className="leads-firma-text">
                      <h5>{formatCurrency(lead.value)}</h5>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>Assigned To</label>
                    <div className="leads-firma-text">
                      <h5>{lead.assignedTo || 'Sarah Nielsen'}</h5>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>Created</label>
                    <div className="leads-firma-text">
                      <h5>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</h5>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <div className="leads-firmacol">
                    <label>Next Follow-up</label>
                    <div className="leads-firma-text">
                      <h5><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-3 h-3" aria-hidden="true" style={{ width: '10px', height: '10px', marginRight: '6px' }}><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>{lead.followUpDate || 'N/A'}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tags">
              <h3 className="leads-subheading">Tags</h3>
              {displayTags.length > 0 ? (
                displayTags.map((tag, index) => (
                  <span key={index} className="badge">{tag}</span>
                ))
              ) : (
                <p>No tags</p>
              )}
            </div>
          </div>
        </div>

        {/* Leads Center Bar */}
        <div className="leadscenter-bar">
          <div className="carddesign">
            <h2 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Search Oblique Photo via Address
            </h2>

            <div className="formdesign location-map">
              <div className="form-group ">
                <div className="input-group">
                  <input type="text" className="form-control" placeholder={lead.address || 'Enter address'} readOnly />
                  <button className="btn btn-send" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search h-4 w-4" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
                    Find Oblique Photo
                  </button>
                </div>
              </div>
              <div className="location-mapview">
                <iframe src="https://skraafoto.dataforsyningen.dk/?lon=9.354415&amp;lat=55.550372&amp;zoom=19" className="w-full h-[600px] border border-border rounded-md" allowFullScreen="" title="Oblique Photo"></iframe>
                <p>Oblique photo provided by Dataforsyningen.dk <br />Coordinates: 55.550372, 9.354415</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Right Bar */}
        <div className="leadsright-bar">
          <div className="carddesign leadssliderbox">
            <div className="leadsslider">
              <button className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left m-0" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
              <button className="btn btn-add leadssliderright-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right m-0" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
              <span>0 of 5 leads</span>
            </div>
          </div>

          <div className="emailmodaltab">
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item" role="presentation">
                <Link className={`nav-link ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")} data-bs-toggle="tab" href="#create-quote-tab" aria-selected="true" role="tab">Create Quote</Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link className={`nav-link ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")} data-bs-toggle="tab" href="#quote-history-tab" aria-selected="false" tabIndex="-1" role="tab">Quote History</Link>
              </li>
            </ul>
          </div>
          <div className="tab-content">
            {/* Create Quote Tab Content */}
            <div id="create-quote-tab" className={`tab-pane ${activeTab === "create" ? "active" : ""}`}>
              <div className="carddesign">
                <h2 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-4 h-4" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                  New Quote
                </h2>
                <form onSubmit={handleSaveQuote}> {/* Changed onSubmit to handleSaveQuote */}
                  <div className="leads-infocol">
                    <div className="formdesign">
                      <div className="form-group mb-2">
                        <label>Start with Template (Optional)</label>
                        <div className="inputselect">
                          <div className="dropdown leaddropdown">
                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                              <span>{newQuoteFormData.pricingTemplateId ? pricingTemplates.find(t => t.id === newQuoteFormData.pricingTemplateId)?.name : 'Select a quote template'}</span>
                            </button>
                            <ul className="dropdown-menu">
                              {pricingTemplates.map(template => (
                                <li key={template.id}>
                                  <Link className="dropdown-item" to="#" onClick={(e) => {
                                    e.preventDefault();
                                    const selectedTemplate = pricingTemplates.find(t => t.id === template.id);
                                    if (selectedTemplate) {
                                      const servicesToLoad = selectedTemplate.services.map(s => ({
                                        ...s,
                                        pricePerUnit: Number(s.pricePerUnit) || 0,
                                        quantity: Number(s.quantity) || 1,
                                        discountPercent: Number(s.discountPercent) || 0,
                                        total: (Number(s.pricePerUnit) || 0) * (Number(s.quantity) || 1) * (1 - (Number(s.discountPercent) || 0) / 100)
                                      }));
                                      setNewQuoteFormData(prev => {
                                        const newTotal = calculateQuoteTotal(servicesToLoad, prev.overallDiscount);
                                        return {
                                          ...prev,
                                          pricingTemplateId: selectedTemplate.id,
                                          title: selectedTemplate.title || selectedTemplate.name,
                                          description: selectedTemplate.description,
                                          terms: selectedTemplate.terms,
                                          services: servicesToLoad,
                                          total: newTotal,
                                        };
                                      });
                                    }
                                  }}>
                                    {template.name} <span>{formatCurrency(calculateServicesSubtotal(template.services))}</span>
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
                  <div className="leads-infocol">
                    <div className="formdesign">
                      <div className="form-group">
                        <label>Quote Title</label>
                        <input type="text" className="form-control" name="title" value={newQuoteFormData.title} onChange={handleNewQuoteChange} placeholder="e.g., Website development for..." required />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" rows="3" name="description" value={newQuoteFormData.description} onChange={handleNewQuoteChange} placeholder="Brief description of what the quote includes..."></textarea>
                      </div>
                      <div className="form-group mb-2">
                        <label>Validity Period</label>
                        <div className="inputselect">
                          <select className="form-select" name="validDays" value={newQuoteFormData.validDays} onChange={handleNewQuoteChange}>
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={30}>30 days</option>
                            <option value={60}>60 days</option>
                            <option value={90}>90 days</option>
                          </select>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                      </div>

                      {/* Services Section */}
                      <div className="leads-infocol">
                        <div className="formdesign">
                          <div className="workflowsadd displayadd">
                            <h2 className="card-title">Services</h2>
                            <button type="button" className="btn btn-add" onClick={handleAddQuoteService}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                              Add Service
                            </button>
                          </div>

                          {newQuoteFormData.services.map((service, index) => (
                            <div className="displayadbox" key={index}>
                              <div className="displayadbox-icon">
                                <div className="form-group mb-1">
                                  <input type="text" className="form-control" value={service.name} onChange={(e) => {
                                    const newServices = [...newQuoteFormData.services];
                                    newServices[index].name = e.target.value;
                                    setNewQuoteFormData(prev => ({ ...prev, services: newServices, total: calculateQuoteTotal(newServices, prev.overallDiscount) }));
                                  }} placeholder="Service Name" />
                                </div>
                                <div className="form-group mb-2">
                                  <textarea className="form-control" rows="3" value={service.description || ''} onChange={(e) => {
                                    const newServices = [...newQuoteFormData.services];
                                    newServices[index].description = e.target.value;
                                    setNewQuoteFormData(prev => ({ ...prev, services: newServices }));
                                  }} placeholder="Description of the service"></textarea>
                                </div>
                                <button type="button" className="btn btn-add" style={{ color: '#ef4444 !important' }} onClick={(e) => { e.preventDefault(); handleRemoveQuoteService(index); }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x m-0" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                </button>
                              </div>
                              <div className="displayadbox-group">
                                <div className="form-group mb-1">
                                  <label>Price</label>
                                  <input type="number" className="form-control" value={service.pricePerUnit} onChange={(e) => {
                                    const newServices = [...newQuoteFormData.services];
                                    newServices[index].pricePerUnit = Number(e.target.value);
                                    const discountedPricePerUnit = newServices[index].pricePerUnit * (1 - (newServices[index].discountPercent || 0) / 100);
                                    newServices[index].total = newServices[index].quantity * discountedPricePerUnit;
                                    setNewQuoteFormData(prev => ({ ...prev, services: newServices, total: calculateQuoteTotal(newServices, prev.overallDiscount) }));
                                  }} placeholder="0" min="0" />
                                </div>
                                <div className="form-group mb-1">
                                  <label>Quantity</label>
                                  <input type="number" className="form-control" value={service.quantity} onChange={(e) => {
                                    const newServices = [...newQuoteFormData.services];
                                    newServices[index].quantity = Number(e.target.value);
                                    const discountedPricePerUnit = newServices[index].pricePerUnit * (1 - (newServices[index].discountPercent || 0) / 100);
                                    newServices[index].total = newServices[index].quantity * discountedPricePerUnit;
                                    setNewQuoteFormData(prev => ({ ...prev, services: newServices, total: calculateQuoteTotal(newServices, prev.overallDiscount) }));
                                  }} placeholder="1" min="1" />
                                </div>
                                <div className="form-group mb-1">
                                  <label>Unit</label>
                                  <input type="text" className="form-control" value={service.unit} onChange={(e) => {
                                    const newServices = [...newQuoteFormData.services];
                                    newServices[index].unit = e.target.value;
                                    setNewQuoteFormData(prev => ({ ...prev, services: newServices }));
                                  }} placeholder="pcs" />
                                </div>
                                <div className="form-group mb-1">
                                  <label>Discount (%)</label>
                                  <input type="number" className="form-control" value={service.discountPercent} onChange={(e) => {
                                    const newServices = [...newQuoteFormData.services];
                                    newServices[index].discountPercent = Number(e.target.value);
                                    const discountedPricePerUnit = newServices[index].pricePerUnit * (1 - (newServices[index].discountPercent || 0) / 100);
                                    newServices[index].total = newServices[index].quantity * discountedPricePerUnit;
                                    setNewQuoteFormData(prev => ({ ...prev, services: newServices, total: calculateQuoteTotal(newServices, prev.overallDiscount) }));
                                  }} placeholder="0" min="0" max="100" />
                                </div>
                              </div>
                              <div className="displayadbox-result">
                                <div className="displayadbox-resultleft">
                                  <h6>{service.quantity} × {formatCurrency(service.pricePerUnit)}</h6>
                                  {service.discountPercent > 0 && <span>-{service.discountPercent}% Discount</span>}
                                </div>
                                <div className="displayadbox-resultright">
                                  {formatCurrency(service.total)}
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="displayadbox">
                            <div className="displayadbox-icon">
                              <div className="form-group mb-1">
                                <input type="text" className="form-control" name="name" value={currentQuoteService.name} onChange={handleCurrentQuoteServiceChange} placeholder="New service name" />
                              </div>
                              <div className="form-group mb-2">
                                <textarea className="form-control" rows="3" name="description" value={currentQuoteService.description} onChange={handleCurrentQuoteServiceChange} placeholder="Description of the service"></textarea>
                              </div>
                            </div>
                            <div className="displayadbox-group">
                              <div className="form-group mb-1">
                                <label>Price</label>
                                <input type="number" className="form-control" name="pricePerUnit" value={currentQuoteService.pricePerUnit} onChange={handleCurrentQuoteServiceChange} placeholder="0" min="0" />
                              </div>
                              <div className="form-group mb-1">
                                <label>Quantity</label>
                                <input type="number" className="form-control" name="quantity" value={currentQuoteService.quantity} onChange={handleCurrentQuoteServiceChange} placeholder="1" min="1" />
                              </div>
                              <div className="form-group mb-1">
                                <label>Unit</label>
                                <input type="text" className="form-control" name="unit" value={currentQuoteService.unit} onChange={handleCurrentQuoteServiceChange} placeholder="pcs" />
                              </div>
                              <div className="form-group mb-1">
                                <label>Discount (%)</label>
                                <input type="number" className="form-control" name="discountPercent" value={currentQuoteService.discountPercent} onChange={handleCurrentQuoteServiceChange} placeholder="0" min="0" max="100" />
                              </div>
                            </div>
                            <div className="displayadbox-result">
                              <div className="displayadbox-resultleft">
                                <h6>{currentQuoteService.quantity} × {formatCurrency(currentQuoteService.pricePerUnit)}</h6>
                                {currentQuoteService.discountPercent > 0 && <span>-{currentQuoteService.discountPercent}% Discount</span>}
                              </div>
                              <div className="displayadbox-resultright">
                                {formatCurrency(currentQuoteService.total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Overall Discount and Total Calculation */}
                      <div className="leads-infocol">
                        <div className="formdesign">
                          <div className="form-group">
                            <label>Overall Discount (%)</label>
                            <input type="number" className="form-control" name="overallDiscount" value={newQuoteFormData.overallDiscount} onChange={handleNewQuoteChange} placeholder="0" style={{ width: '95px' }} min="0" max="100" />
                          </div>
                          <div className="result-calculat">
                            <div className="result-calculattop">
                              <h5><span className="result-calculatlabel">Subtotal:</span><span className="result-calculatresult">{formatCurrency(calculateServicesSubtotal(newQuoteFormData.services))}</span></h5>
                              {newQuoteFormData.overallDiscount > 0 && (
                                <h5 className="resultrabat">
                                  <span className="result-calculatlabel">Discount ({newQuoteFormData.overallDiscount}%):</span>
                                  <span className="result-calculatresult">- {formatCurrency(calculateServicesSubtotal(newQuoteFormData.services) * (newQuoteFormData.overallDiscount / 100))}</span>
                                </h5>
                              )}
                            </div>
                            <div className="result-calculatbottom">
                              <h5><span className="result-calculat-total">Total:</span><span className="result-calculatfinal">{formatCurrency(newQuoteFormData.total)}</span></h5>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Terms and Conditions */}
                      <div className="leads-infocol">
                        <div className="formdesign">
                          <div className="form-group mb-1">
                            <label>Terms and Conditions</label>
                            <textarea className="form-control" rows="3" name="terms" value={newQuoteFormData.terms} onChange={handleNewQuoteChange} placeholder="Terms, reservations, or special conditions for this offer..."></textarea>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Quote Creation */}
                      <button type="submit" className="btn btn-send w-100 mb-2" disabled={loading}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                        {loading ? 'Saving...' : `Save Quote to ${lead.fullName}`} {/* Changed text to 'Save Quote' */}
                      </button>
                      <Link to="#" className="btn btn-add w-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        Preview
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Quote History Tab Content */}
            <div id="quote-history-tab" className={`tab-pane ${activeTab === "history" ? "active" : ""}`}>
              <div className="carddesign">
                <h2 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-4 h-4" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  Previous Quotes
                </h2>
                {quotesHistory.length > 0 ? (
                  quotesHistory.map(quote => (
                    <div className="leads-previousoffers-box mb-3" key={quote.id}>
                      <div className="leads-previousoffers-top">
                        <div className="leads-previousoffers-left">
                          <h4>{quote.title || 'No Title'}</h4>
                          <h6>{quote.description || 'No description'}</h6>
                        </div>
                        <div className="status">{quote.status?.name || 'N/A'}</div>
                      </div>
                      <h5>
                        <span>Created: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span>Last Updated: {quote.updatedAt ? new Date(quote.updatedAt).toLocaleDateString() : 'N/A'}</span>
                      </h5>
                      <h3>{formatCurrency(quote.total)}
                        <div className="leads-previousoffers-btn">
                          <button type="button" className="btn btn-add" onClick={() => { setQuoteToActOn(quote); setShowSendQuoteModal(true); }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye m-0" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg></button>
                          <button
                            type="button"
                            className="btn btn-add"
                            onClick={() => {
                              const qualifiedStatus = statuses.find(s => s.name === "Qualified");
                              if (qualifiedStatus) {
                                handleStatusChange(qualifiedStatus.id);
                              } else {
                                toast.error("Qualified status not found");
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                              viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="lucide lucide-check-circle m-0" aria-hidden="true">
                              <path d="M9 12l2 2 4-4"></path>
                              <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                          </button>

                        </div>
                      </h3>
                    </div>
                  ))
                ) : (
                  <p>No quotes found for this lead.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {lead && (
        <AddEditLeadModal
          show={isEditModalOpen}
          onHide={() => setIsEditModalOpen(false)}
          onSuccess={fetchLeadDetails}
          leadData={lead}
        />
      )}
      {quoteToActOn && (
        <SendQuoteModal
          show={showSendQuoteModal}
          onHide={() => setShowSendQuoteModal(false)}
          lead={lead}
          quoteData={quoteToActOn}
          quoteStatuses={quoteStatuses}
          onSend={handleSendQuoteActions}
        />
      )}
    </>
  );
};

export default LeadViewPage;
