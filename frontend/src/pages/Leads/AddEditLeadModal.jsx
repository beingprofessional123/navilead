import React, { useState, useEffect, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const AddEditLeadModal = ({ show, onHide, onSuccess, leadData }) => {
  const { authToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: '',
    attName: '',
    phone: '',
    email: '',
    address: '',
    companyName: '',
    cvrNumber: '',
    leadSource: '',
    tags: [], // Tags stored as an array
    internalNote: '',
    customerComment: '',
    followUpDate: '',
    notifyOnFollowUp: false,
    value: '',
    statusId: '',
    reminderTime: '08:00', // Default reminder time
  });
  const [attachments, setAttachments] = useState([]); // Array of existing file objects (from leadData) or new File objects
  const [newlyAddedFiles, setNewlyAddedFiles] = useState([]); // For newly selected files
  const [removedAttachmentFilenames, setRemovedAttachmentFilenames] = useState([]); // Array of filenames to remove
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]); // State to store statuses fetched from backend
  const [currentTagInput, setCurrentTagInput] = useState(''); // State for the current tag being typed
  const fileInputRef = useRef(null); // Ref for the hidden file input

  // Fetch statuses when the component mounts or authToken changes
  useEffect(() => {
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
    fetchStatuses();
  }, [authToken]);

  // Effect to populate form data when leadData changes (for editing) or clear for new lead
  useEffect(() => {
    if (leadData) {
      // Parse tags from stringified JSON if it's a string, otherwise use as is or default to empty array
      let parsedTags = [];
      if (typeof leadData.tags === 'string' && leadData.tags.startsWith('[') && leadData.tags.endsWith(']')) {
        try {
          parsedTags = JSON.parse(leadData.tags);
        } catch (e) {
          console.error("Error parsing tags:", e);
          parsedTags = []; // Fallback to empty array if parsing fails
        }
      } else if (Array.isArray(leadData.tags)) {
        parsedTags = leadData.tags;
      }

      setFormData({
        fullName: leadData.fullName || '',
        attName: leadData.attName || '',
        phone: leadData.phone || '',
        email: leadData.email || '',
        address: leadData.address || '',
        companyName: leadData.companyName || '',
        cvrNumber: leadData.cvrNumber || '',
        leadSource: leadData.leadSource || '',
        tags: parsedTags, // Use the parsed tags
        internalNote: leadData.internalNote || '',
        customerComment: leadData.customerComment || '',
        followUpDate: leadData.followUpDate ? leadData.followUpDate.split('T')[0] : '', // Format date for input[type="date"]
        notifyOnFollowUp: leadData.notifyOnFollowUp || false,
        value: leadData.value || '',
        statusId: leadData.statusId || '',
        reminderTime: leadData.reminderTime || '08:00', // Set reminder time if exists
      });
      // Set existing attachments from lead data
      setAttachments(leadData.attachments || []);
    } else {
      // Reset form for creating a new lead
      setFormData({
        fullName: '',
        attName: '',
        phone: '',
        email: '',
        address: '',
        companyName: '',
        cvrNumber: '',
        leadSource: '',
        tags: [],
        internalNote: '',
        customerComment: '',
        followUpDate: '',
        notifyOnFollowUp: false,
        value: '',
        statusId: statuses.length > 0 ? statuses[0].id : '', // Set default status if available
        reminderTime: '08:00',
      });
      setAttachments([]);
    }
    setNewlyAddedFiles([]); // Clear newly added files on modal open/re-open
    setRemovedAttachmentFilenames([]); // Clear removed attachments list
    setCurrentTagInput(''); // Clear the tag input field
  }, [leadData, show, statuses]); // Depend on show to reset form when modal closes/opens

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagInputChange = (e) => {
    setCurrentTagInput(e.target.value);
  };

  const handleAddTag = (e) => {
    e.preventDefault(); // Prevent form submission if triggered by Enter key
    const tag = currentTagInput.trim();
    if (tag && !formData.tags.includes(tag)) { // Add tag only if not empty and not already present
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setCurrentTagInput(''); // Clear the input after adding
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setNewlyAddedFiles([...newlyAddedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveExistingAttachment = (filename) => {
    // Add to list of attachments to remove from backend
    setRemovedAttachmentFilenames([...removedAttachmentFilenames, filename]);
    // Remove from current display list
    setAttachments(attachments.filter(att => att.filename !== filename));
  };

  const handleRemoveNewAttachment = (index) => {
    setNewlyAddedFiles(newlyAddedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const apiEndpoint = leadData ? `/leads/${leadData.id}` : '/leads';
    const method = leadData ? 'put' : 'post';

    const form = new FormData();
    // Append form data fields
    for (const key in formData) {
      // Special handling for 'value' field: send null if it's an empty string
      if (key === 'value' && formData[key] === '') {
        form.append(key, null);
      }
      // Handle tags array by stringifying if not empty
      else if (key === 'tags') {
        form.append(key, JSON.stringify(formData[key]));
      } else { // Append other fields
        form.append(key, formData[key]);
      }
    }

    // Append newly added files
    newlyAddedFiles.forEach((file) => {
      form.append('attachments', file); // 'attachments' is the field name expected by multer
    });

    // Append filenames of attachments to be removed (only for updates)
    if (leadData && removedAttachmentFilenames.length > 0) {
      form.append('removedAttachments', JSON.stringify(removedAttachmentFilenames));
    }

    try {
      await api[method](apiEndpoint, form, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
          'Authorization': `Bearer ${authToken}`,
        },
      });
      toast.success(`Lead ${leadData ? 'updated' : 'created'} successfully!`);
      onSuccess(); // Call success callback to refresh parent component data
      onHide(); // Close the modal
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(`Failed to ${leadData ? 'update' : 'create'} lead.`);
    } finally {
      setLoading(false);
    }
  };

  // Determine modal CSS classes based on 'show' prop
  const modalClasses = `modal fade modaldesign leadsaddmodal ${show ? 'show d-block' : ''}`;
  const modalStyle = { display: show ? 'block' : 'none' };

  return (
    <div className={modalClasses} id="myModal" tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">

          <div className="modal-header">
            <h4 className="modal-title">
              {leadData ? 'Edit Lead' : 'Create New Lead'}
              <p>{leadData ? 'Update lead information and customer data' : 'Fill in lead information and customer data'}</p>
            </h4>
            <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={onHide}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="formdesign">
              <form onSubmit={handleSubmit}>
                {/* Customer Information */}
                <h2 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Customer Information
                </h2>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Att. Name (Optional)</label>
                      <input type="text" className="form-control" name="attName" value={formData.attName} onChange={handleChange} placeholder="Enter att. name" />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Phone Number (Optional)</label>
                      <div className="inputicon">
                        <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Email Address (Optional)</label>
                      <div className="inputicon">
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" />
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Address (Optional)</label>
                      <div className="inputicon">
                        <textarea className="form-control" rows="3" name="address" value={formData.address} onChange={handleChange} placeholder="Enter address"></textarea>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Company Name (Optional)</label>
                      <div className="inputicon">
                        <input type="text" className="form-control" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" />
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>CVR Number *</label>
                      <div className="inputicon">
                        <input type="text" className="form-control" name="cvrNumber" value={formData.cvrNumber} onChange={handleChange} placeholder="Enter CVR number" required />
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hash" aria-hidden="true"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bordermid"></div>

                {/* Lead Information */}
                <h2 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                  Lead Information
                </h2>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Lead Source *</label>
                      <div className="inputselect">
                        <select className="form-select" name="leadSource" value={formData.leadSource} onChange={handleChange} required>
                          <option value="">Select lead source</option>
                          <option>Facebook Ads</option>
                          <option>Google Ads</option>
                          <option>Website Form</option>
                          <option>Phone Call</option>
                          <option>Email</option>
                          <option>Referral</option>
                          <option>LinkedIn</option>
                          <option>Trade Show</option>
                          <option>Cold Outreach</option>
                          <option>Other</option>
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Status</label>
                      <div className="inputselect">
                        <select className="form-select" name="statusId" value={formData.statusId} onChange={handleChange}>
                          {statuses.map(status => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <div className="inputadd">
                    <input
                      type="text"
                      className="form-control"
                      name="tagsInput"
                      value={currentTagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(e); }} // Add tag on Enter
                      placeholder="Add tag (e.g., important, new customer)"
                    />
                    <button type="button" className="btn btn-add" onClick={handleAddTag}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus m-0" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                    </button>
                  </div>
                  <div className="tags-display mt-2">
                    {formData.tags.map((tag, index) => tag && (
                      <span key={index} className="badge bg-secondary me-1">
                        {tag} <button type="button" className="btn-close" aria-label="Remove tag" onClick={() => handleRemoveTag(tag)}></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Internal Note</label>
                  <div className="inputicon">
                    <textarea className="form-control" rows="3" name="internalNote" value={formData.internalNote} onChange={handleChange} placeholder="Enter internal note..."></textarea>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path></svg>
                  </div>
                </div>
                <div className="form-group">
                  <label>Customer Comment</label>
                  <div className="inputicon">
                    <textarea className="form-control" rows="3" name="customerComment" value={formData.customerComment} onChange={handleChange} placeholder="Enter customer comment..."></textarea>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"></path></svg>
                  </div>
                </div>

                <div className="bordermid"></div>

                {/* Follow-up & Actions */}
                <h2 className="card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock" aria-hidden="true"><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="10"></circle></svg>
                  Follow-up & Actions
                </h2>
                <div className="form-group">
                  <label>Follow-up Date</label>
                  <div className="inputicon">
                    <input type="date" className="form-control" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                  </div>
                </div>

                <div className="automatically">
                  <div className="automatically-text">
                    <h4>Automatic Reminder</h4>
                    <p>Get a notification on the follow-up day</p>
                  </div>
                  <div className="switchbtn">
                    <label className="switch">
                      <input type="checkbox" name="notifyOnFollowUp" checked={formData.notifyOnFollowUp} onChange={handleChange} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>

                {formData.notifyOnFollowUp && (
                  <div className="form-group">
                    <label>Reminder Time</label>
                    <div className="inputselect">
                      <select className="form-select" name="reminderTime" value={formData.reminderTime} onChange={handleChange}>
                        {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Upload Files (Optional)</label>
                  <div className="upload-files-container">
                    <div className="drag-file-area">
                      <span className="material-icons-outlined upload-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-8 h-8 text-muted-foreground" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                      </span>

                      <label className="label">
                        <span className="browse-files">
                          <input type="file" className="default-file-input" multiple onChange={handleFileSelect} ref={fileInputRef} />
                          <span className="browse-files-text">Click to upload files</span>
                        </span>
                      </label>
                      <h3 className="dynamic-message">PDF, DOC, JPG, PNG up to 10MB</h3>
                    </div>
                  </div>
                  {/* Display existing attachments from backend */}
                  {attachments.map((file, index) => (
                    <div key={`existing-${file.filename}`} className="file-block mt-2">
                      <div className="file-info">
                        <span className="material-icons-outlined file-icon"><i className="la la-file-import"></i></span>
                        <span className="file-name">{file.originalname}</span> | <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <span className="material-icons remove-file-icon" onClick={() => handleRemoveExistingAttachment(file.filename)}><i className="la la-trash"></i></span>
                    </div>
                  ))}
                  {/* Display newly added files */}
                  {newlyAddedFiles.map((file, index) => (
                    <div key={`new-${index}`} className="file-block mt-2">
                      <div className="file-info">
                        <span className="material-icons-outlined file-icon"><i className="la la-file-import"></i></span>
                        <span className="file-name">{file.name}</span> | <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <span className="material-icons remove-file-icon" onClick={() => handleRemoveNewAttachment(index)}><i className="la la-trash"></i></span>
                    </div>
                  ))}
                </div>

                {/* Value field */}
                <div className="form-group">
                  <label>Value (Optional)</label>
                  <div className="inputicon">
                    <input type="number" className="form-control" name="value" value={formData.value} onChange={handleChange} placeholder="Enter value (e.g., 50000)" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign" aria-hidden="true"><line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                </div>

                <div className="modal-footer btn-right">
                  <button type="button" className="btn btn-add" onClick={onHide}>Cancel</button>
                  <button type="submit" className="btn btn-send" disabled={loading}>
                    {loading ? 'Submitting...' : leadData ? 'Edit Lead' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditLeadModal;
