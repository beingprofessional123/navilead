import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext'; // Assuming AuthContext provides authToken
import api from '../../utils/api'; // Assuming an API utility for requests
import AddEditLeadModal from './AddEditLeadModal'; // Import the custom modal component

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null); // Used for editing or null for creating
  const [statuses, setStatuses] = useState([]); // State to store statuses from backend

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
      setError('Failed to fetch leads.');
      toast.error('Failed to load leads.');
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
      toast.error('Failed to load statuses.');
    }
  };

  const handleDelete = async (leadId) => {
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
          await api.delete(`/leads/${leadId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          toast.success('Lead deleted successfully!');
          fetchLeads(); // Refresh the list after deletion
        } catch (err) {
          console.error('Error deleting lead:', err);
          toast.error('Failed to delete lead.');
        }
      }
    });
  };

  const handleEdit = (lead) => {
    setCurrentLead(lead); // Set the lead data to be edited
    setIsModalOpen(true); // Open the modal
  };

  const handleCreateNew = () => {
    setCurrentLead(null); // Clear currentLead to indicate new creation
    setIsModalOpen(true); // Open the modal
  };

  const handleStatusChange = async (leadId, newStatusId) => {
    try {
      await api.put(`/leads/${leadId}`, { statusId: newStatusId }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Status updated successfully!');
      fetchLeads(); // Refresh leads to reflect new status
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status.');
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
        lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());

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



  return (
    <div className="mainbody">
      <div className="container-fluid">

        <div className="row top-row">
          <div className="col-md-6">
            <div className="dash-heading">
              <h2>Lead Management</h2>
              <p>Manage and follow up on all your leads</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="dashright">
              <a href="#" className="btn btn-add">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download w-4 h-4 mr-2" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>
                Export
              </a>
              <a href="#" className="btn btn-send" onClick={handleCreateNew}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                New Lead
              </a>
            </div>
          </div>
        </div>

        {/* Lead Summary Cards */}
        <div className="leads-row">
          <div className="leads-col">
            <div className="carddesign">
              <div className="leads-card leads-card1">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg></span>
                <h5>Total Leads</h5>
                <h4>{totalLeads}</h4>
              </div>
            </div>
          </div>
          <div className="leads-col">
            <div className="carddesign">
              <div className="leads-card leads-card2">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up" aria-hidden="true"><path d="M16 7h6v6"></path><path d="m22 7-8.5 8.5-5-5L2 17"></path></svg></span>
                <h5>New Leads</h5>
                <h4>{newLeads}</h4>
              </div>
            </div>
          </div>
          <div className="leads-col">
            <div className="carddesign">
              <div className="leads-card leads-card3">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></span>
                <h5>Qualified</h5>
                <h4>{qualifiedLeads}</h4>
              </div>
            </div>
          </div>
          <div className="leads-col">
            <div className="carddesign">
              <div className="leads-card leads-card4">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award" aria-hidden="true"><circle cx="12" cy="8" r="7"></circle><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11"></path></svg></span>
                <h5>Won</h5>
                <h4>{wonLeads}</h4>
              </div>
            </div>
          </div>
          <div className="leads-col">
            <div className="carddesign">
              <div className="leads-card leads-card5">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h12a2 2 0 0 1 0 4H5a2 2 0 0 0 0 4h12a2 2 0 0 0 0 4h2"></path><path d="M20 12v1H4"></path></svg></span>
                <h5>Avg. Value</h5>
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
                  placeholder="Search by name, company, or email..."
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
                    <option value="">All Statuses</option>
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
                    <option value="">All Sources</option>
                    <option>Google Ads</option>
                    <option>LinkedIn</option>
                    <option>Website Form</option>
                    <option>Facebook Ads</option>
                    <option>Referral</option>
                    <option>Phone</option>
                    <option>Email</option>
                    <option>Trade Show</option>
                    <option>Cold Outreach</option>
                    <option>Other</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                </div>
                <div className="inputselect">
                  <select
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Creation Date</option>
                    <option value="followUpDate">Follow-up Date</option>
                    <option value="fullName">Name</option>
                    <option value="value">Value</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                </div>
                <div className="filterbtn">
                  <button
                    className="btn btn-add"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down" aria-hidden="true"><path d="m21 16-4 4-4-4"></path><path d="M17 20V4"></path><path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path></svg>
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
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
              <h2 className="card-title">All Leads</h2>
              <div className="tabledesign">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="talechebox"><input className="form-check-input" type="checkbox" id="checkAll" /></th>
                        <th>Lead ID</th>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Value</th>
                        <th>Source</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>

                     {loading ? (
                        <tr>
                          <td colSpan="10" className="text-center">Loading leads...</td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="10" className="text-danger text-center">{error}</td>
                        </tr>
                      ) : filteredAndSortedLeads.length > 0 ? (
                        filteredAndSortedLeads.map((lead) => (
                          <tr key={lead.id}>
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
                                      <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleStatusChange(lead.id, status.id); }}>
                                        {status.name}
                                      </a>
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
                                    View Details
                                  </Link></li>
                                  <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleEdit(lead); }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" aria-hidden="true"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path></svg>
                                    Edit
                                  </a></li>
                                  <li><a className="dropdown-item" href="#">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                                    Send Message
                                  </a></li>
                                  <li className="sletborder"><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleDelete(lead.id); }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2 lucide-trash-2" aria-hidden="true"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    Delete
                                  </a></li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))
                       ) : (
                          <tr>
                            <td colSpan="10" className="text-center">No leads found.</td>
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
      />
    </div>
  );
};

export default LeadsPage;
