import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext'; // Assuming AuthContext provides authToken
import api from '../../../utils/api'; // Assuming an API utility for requests
import AddEditLeadModal from './AddEditLeadModal'; // Import the custom modal component
import { useTranslation } from "react-i18next";
import MobileHeader from '../../components/common/MobileHeader';
import LimitModal from '../../components/LimitModal'; // the modal we created earlier
import { useLimit } from "../../context/LimitContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



const LeadsPage = () => {
  const { t } = useTranslation();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null); // Used for editing or null for creating
  const [statuses, setStatuses] = useState([]); // State to store statuses from backend
  const { checkLimit, isLimitModalOpen, currentLimit, closeLimitModal, refreshPlan, userPlan } = useLimit();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter and Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // Stores status name
  const [selectedSource, setSelectedSource] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // Default sort by creation date
  const [sortOrder, setSortOrder] = useState('desc'); // Default sort order descending

  const { authToken } = useContext(AuthContext);

  // Fetch leads and statuses when the component mounts or auth token changes
  useEffect(() => {
    fetchLeads();
    fetchStatuses();
  }, [authToken]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true") {
      handleCreateNew();
      navigate("/leads", { replace: true }); // ✅ removes ?create=true
    }
  }, [location.search]);


  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/leads', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLeads(response.data);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(t('api.leads.fetchError')); // Translated error message
      toast.error(t('api.leads.fetchError'));
    } finally {
      setLoading(false);
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

  const handleDelete = async (leadId) => {
    Swal.fire({
      title: t('leadsPage.deleteConfirmTitle'), // Translated title
      text: t('leadsPage.deleteConfirmText'),   // Translated text
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: t('leadsPage.deleteConfirmButton'), // Translated confirm button
      cancelButtonText: t('leadsPage.deleteCancelButton'),    // Translated cancel button
      customClass: {
                popup: 'custom-swal-popup'
            }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/leads/${leadId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          toast.success(t('api.leads.deleteSuccess')); // Translated toast message
          fetchLeads(); // Refresh the list after deletion
          refreshPlan();
        } catch (err) {
          console.error('Error deleting lead:', err);
          toast.error(t('api.leads.deleteError')); // Translated toast message
        }
      }
    });
  };

  const handleEdit = (lead) => {
    setCurrentLead(lead); // Set the lead data to be edited
    setIsModalOpen(true); // Open the modal
  };

  const handleCreateNew = () => {
    console.log(userPlan);
    setCurrentLead(null); // Clear currentLead to indicate new creation

    // Ensure both leads and plan data are loaded
    if (!userPlan?.startDate) {
      toast.error("Plan start date not found");
      return;
    }
    const planStartDate = new Date(userPlan.startDate);

    // Count only leads created on or after plan start date
    const leadsAfterStart = leads.filter((lead) => {
      const leadCreatedAt = new Date(lead.createdAt);
      return leadCreatedAt >= planStartDate; // ✅ includes same date
    });

    const currentLeadCount = leadsAfterStart.length;

    // Check if user is within the limit
    const canProceed = checkLimit(currentLeadCount, 'Leads');

    if (canProceed) {
      setIsModalOpen(true); // open the Add/Edit Lead modal
    }
  };



  const handleStatusChange = async (leadId, newStatusId) => {
    try {
      await api.put(`/leads/${leadId}`, { statusId: newStatusId ,type: "leadStatusChanged" }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success(t('api.leads.statusUpdateSuccess')); // Translated toast message
      fetchLeads(); // Refresh leads to reflect new status
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(t('api.leads.statusUpdateError')); // Translated toast message
    }
  };

  // Helper to format currency (assuming Danish Krone DKK)
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0';
    return String(value); // ensures you get "1000", "0", "599999"
  };


  // Function to determine badge class based on status name
  const getStatusBadgeClass = (statusName) => {
    switch (statusName) {
      case 'Offer Sent':
        return 'badge badge1';
      case 'Sent':
      case 'New':
        return 'badge badge2';
      case 'In Dialogue':
        return 'badge badge3';
      case 'Qualified':
        return 'badge badge4';
      case 'Won':
        return 'badge badge5';
      case 'Lost':
        return 'badge badge6';
      default:
        return 'badge badge-default';
    }
  };

  // Filtering and Sorting Logic
  const filteredAndSortedLeads = leads
    .filter((lead) => {
      const matchesSearch = searchTerm === '' ||
        (lead.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === '' || lead.status?.name === selectedStatus;
      const matchesSource = selectedSource === '' || lead.leadSource === selectedSource;

      return matchesSearch && matchesStatus && matchesSource;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle null/undefined values for sorting
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      // Specific handling for date fields
      if (sortBy === 'createdAt' || sortBy === 'followUpDate') {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });


  // Calculate summary statistics
  const totalLeads = filteredAndSortedLeads.length;
  const newLeads = filteredAndSortedLeads.filter(lead => lead.status?.name === 'Sent' || lead.status?.name === 'New').length;
  const qualifiedLeads = filteredAndSortedLeads.filter(lead => lead.status?.name === 'Qualified').length;
  const wonLeads = filteredAndSortedLeads.filter(lead => lead.status?.name === 'Won').length;
  const totalValue = filteredAndSortedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const avgValue = totalLeads > 0 ? Math.round(totalValue / totalLeads) : 0;

  const handleExportToExcel = () => {
    if (!leads || leads.length === 0) {
      toast.warning("No leads available to export.");
      return;
    }

    // Transform data into a simpler format for Excel
    const exportData = leads.map((lead) => ({
      "Lead ID": lead.leadNumber || lead.id,
      "Full Name": lead.fullName || "",
      "Company": lead.companyName || "",
      "Email": lead.email || "",
      "Phone": lead.phone || "",
      "Status": lead.status?.name || "",
      "Value": lead.value || "",
      "Source": lead.leadSource || "",
      "Created At": new Date(lead.createdAt).toLocaleString(),
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Leads_${new Date().toISOString().split("T")[0]}.xlsx`);
  };



  return (
    <>

      <div className="mainbody">
        <div className="container-fluid">
          <MobileHeader />
          <div className="row top-row">
            <div className="col-md-6">
              <div className="dash-heading">
                <h2>{t('leadsPage.title')}</h2>
                <p>{t('leadsPage.description')}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="dashright">
                <Link to="#" className="btn btn-add" onClick={handleExportToExcel}>

                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download w-4 h-4 mr-2" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>
                  {t('leadsPage.exportButton')}
                </Link>
                <Link to="#" className="btn btn-send" onClick={handleCreateNew}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                  {t('leadsPage.newLeadButton')}
                </Link>
              </div>
            </div>
          </div>

          {/* Lead Summary Cards */}
          <div className="leads-row">
            <div className="leads-col">
              <div className="carddesign">
                <div className="leads-card leads-card1">
                  <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg></span>
                  <h5>{t('leadsPage.totalLeads')}</h5>
                  <h4>{totalLeads}</h4>
                </div>
              </div>
            </div>
            <div className="leads-col">
              <div className="carddesign">
                <div className="leads-card leads-card2">
                  <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg></span>
                  <h5>{t('leadsPage.newLeads')}</h5>
                  <h4>{newLeads}</h4>
                </div>
              </div>
            </div>
            <div className="leads-col">
              <div className="carddesign">
                <div className="leads-card leads-card3">
                  <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                  <h5>{t('leadsPage.qualifiedLeads')}</h5>
                  <h4>{qualifiedLeads}</h4>
                </div>
              </div>
            </div>
            <div className="leads-col">
              <div className="carddesign">
                <div className="leads-card leads-card4">
                  <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award" aria-hidden="true"><circle cx="12" cy="8" r="7"></circle><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"></path></svg></span>
                  <h5>{t('leadsPage.wonLeads')}</h5>
                  <h4>{wonLeads}</h4>
                </div>
              </div>
            </div>
            <div className="leads-col">
              <div className="carddesign">
                <div className="leads-card leads-card5">
                  <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12a2 2 0 0 0 0 4h2"></path><path d="M20 12v1H4"></path></svg></span>
                  <h5>{t('leadsPage.avgValue')}</h5>
                  <h4>{formatCurrency(avgValue)}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="row">
            <div className="col-md-12">
              <div className="carddesign lead-search">
                <div className="inputsearch">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucude-search absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('leadsPage.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <div className="inputselect">
                    <select
                      className="form-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="">{t('leadsPage.allStatuses')}</option>
                      {statuses.map(status => (
                        <option key={status.id} value={status.name}>{status.name}</option>
                      ))}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                  </div>
                  <div className="inputselect">
                    <select
                      className="form-select"
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                    >
                      <option value="">{t('leadsPage.allSources')}</option>
                      <option>{t('leadsPage.sourceGoogleAds')}</option>
                      <option>{t('leadsPage.sourceLinkedIn')}</option>
                      <option>{t('leadsPage.sourceWebsiteForm')}</option>
                      <option>{t('leadsPage.sourceFacebookAds')}</option>
                      <option>{t('leadsPage.sourceReferral')}</option>
                      <option>{t('leadsPage.sourcePhone')}</option>
                      <option>{t('leadsPage.sourceEmail')}</option>
                      <option>{t('leadsPage.sourceTradeShow')}</option>
                      <option>{t('leadsPage.sourceColdOutreach')}</option>
                      <option>{t('leadsPage.sourceOther')}</option>

                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                  </div>
                  <div className="inputselect">
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="createdAt">{t('leadsPage.sortByCreationDate')}</option>
                      <option value="followUpDate">{t('leadsPage.sortByFollowUpDate')}</option>
                      <option value="fullName">{t('leadsPage.sortByName')}</option>
                      <option value="value">{t('leadsPage.sortByValue')}</option>
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                  </div>
                  <div className="filterbtn">
                    <button
                      className="btn btn-add"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down" aria-hidden="true"><path d="m21 16-4 4-4-4"></path><path d="M17 20V4"></path><path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path></svg>
                      {sortOrder === 'asc' ? t('leadsPage.ascending') : t('leadsPage.descending')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="row">
            <div className="col-md-12">
              <div className="carddesign leadstable">
                <h2 className="card-title">{t('leadsPage.tableTitle')}</h2>
                <div className="tabledesign">
                  <div className="table-responsive" style={{ minHeight: "170px", maxHeight: "480px" }}>
                    <table className="table">
                      <thead style={{ position: "sticky", top: 0, background: "rgb(22 31 38)", zIndex: 10, }}>
                        <tr>
                          <th className="talechebox"><input className="form-check-input" type="checkbox" id="checkAll" /></th>
                          <th>{t('leadsPage.tableHeaderLeadID')}</th>
                          <th>{t('leadsPage.tableHeaderName')}</th>
                          <th>{t('leadsPage.tableHeaderCompany')}</th>
                          <th>{t('leadsPage.tableHeaderEmail')}</th>
                          <th>{t('leadsPage.tableHeaderPhone')}</th>
                          <th>{t('leadsPage.tableHeaderStatus')}</th>
                          <th>{t('leadsPage.tableHeaderValue')}</th>
                          <th>{t('leadsPage.tableHeaderSource')}</th>
                          <th>{t('leadsPage.tableHeaderActions')}</th>
                        </tr>
                      </thead>
                      <tbody>

                        {loading ? (
                          <tr>
                            <td colSpan="10" className="text-center">{t('leadsPage.loadingLeads')}</td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="10" className="text-danger text-center">{error}</td>
                          </tr>
                        ) : filteredAndSortedLeads.length > 0 ? (
                          filteredAndSortedLeads.map((lead) => (
                            <tr key={lead.id} className={filteredAndSortedLeads.length === 1 ? "tablemaiikdata" : ""}>
                              <td className="talechebox"><input className="form-check-input" type="checkbox" /></td>
                              <td><Link to={`/leads/${lead.id}`} className="leadlink">{lead.leadNumber}</Link></td>
                              <td><strong>{lead.fullName}</strong></td>
                              <td>{lead.companyName}</td>
                              <td>{lead.email}</td>
                              <td>{lead.phone}</td>
                              <td>
                                <div className="dropdown leaddropdown">
                                  <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                    <span className={getStatusBadgeClass(lead.status?.name)}>{lead.status?.name}</span>
                                  </button>
                                  <ul className="dropdown-menu">
                                    {/* Dynamically render status options */}
                                    {statuses.map(status => (
                                      <li key={status.id}>
                                        <Link className="dropdown-item" to="#" onClick={(e) => { e.preventDefault(); handleStatusChange(lead.id, status.id); }}>
                                          {status.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </td>
                              <td><strong>{formatCurrency(lead.value)}</strong></td>
                              <td>{lead.leadSource}</td>
                              <td className="actionbtn">
                                <div className="dropdown leaddropdown">
                                  <button type="button" className="btn btn-add dropdown-toggle" data-bs-toggle="dropdown">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis m-0" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                                  </button>
                                  <ul className="dropdown-menu">
                                    <li><Link className="dropdown-item" to={`/leads/${lead.id}`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                      {t('leadsPage.viewDetails')}
                                    </Link></li>
                                    <li><Link className="dropdown-item" to="#" onClick={(e) => { e.preventDefault(); handleEdit(lead); }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>
                                      {t('leadsPage.edit')}
                                    </Link></li>
                                    {/* <li><Link className="dropdown-item" to="#">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                                      {t('leadsPage.sendMessage')}
                                    </Link></li> */}
                                    <li className="sletborder"><Link className="dropdown-item" to="#" onClick={(e) => { e.preventDefault(); handleDelete(lead.id); }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      {t('leadsPage.delete')}
                                    </Link></li>
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center">{t('leadsPage.noLeadsFound')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* The Custom Add/Edit Lead Modal */}
        <AddEditLeadModal
          show={isModalOpen}
          onHide={() => setIsModalOpen(false)}
          onSuccess={fetchLeads} // Refresh the lead list after successful submission
          leadData={currentLead} // Pass the lead data for editing, or null for new creation
          currentLeadCount={leads.length}
        />
      </div>

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

export default LeadsPage;
