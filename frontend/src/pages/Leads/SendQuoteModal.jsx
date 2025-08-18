import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
// Removed: import { Modal } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api'; // Ensure this path is correct

const SendQuoteModal = ({ show, onHide, lead, quoteData, quoteStatuses, onSend }) => {
  const { authToken } = useContext(AuthContext);

  const [currentStatusId, setCurrentStatusId] = useState(quoteData?.statusId || '');
  const [sendSmsChecked, setSendSmsChecked] = useState(false);
  const [smsFromName, setSmsFromName] = useState('Kasper West'); // Default from name
  const [smsMessage, setSmsMessage] = useState(`Hej ${lead?.attName || lead?.fullName || 'kunde'}! Jeg har sendt dig et tilbud på mail. Ring hvis du har spørgsmål. Mvh Kasper West`); // Default message
  const [loadingSMS, setLoadingSMS] = useState(false);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [selectedSmsTemplateId, setSelectedSmsTemplateId] = useState('');

  const [sendEmailChecked, setSendEmailChecked] = useState(true); // Email checked by default
  const [emailFromName, setEmailFromName] = useState('Kasper West'); // Default from name
  const [emailFromEmail, setEmailFromEmail] = useState('kontakt@kasperwest.dk'); // Default from email
  const [emailSubject, setEmailSubject] = useState(`Ang. tilbud fra Kasperwest.dk`); // Default subject
  const [emailContent, setEmailContent] = useState(`Hej ${lead?.attName || lead?.fullName || 'kunde'} 👋

Jeg har lige sendt dig en sms, men du får lige tilbuddet her også!

Jeg håber, du vil tage et kig på det og fortælle mig, hvad du synes om tilbuddet.

Tryk her for at åbne tilbud

Du kan acceptere tilbuddet på en af flg. måder:
• Trykke på accept knappen inden på tilbudssiden.
• Ringe til mig på telefon nr.: 30143060
• Besvare denne mail

Jeg håber, at tilbuddet lever op til dine forventninger.

Bedste hilsner
Kasper West
+45 30143060 (kun opkald)
Kontakt@kasperwest.dk`); // Default content
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState('None'); // For email attachments

  // Character count for SMS
  const smsCharCount = smsMessage.length;
  const smsType = smsCharCount <= 160 ? 'Single SMS' : `Multi-part SMS (${Math.ceil(smsCharCount / 153)} parts)`;


  // Update state when quoteData or lead changes (e.g., when a new quote is created)
  useEffect(() => {
    if (quoteData) {
      setCurrentStatusId(quoteData.statusId || quoteStatuses.find(s => s.name === 'Not sent')?.id || '');
    }
    if (lead) {
        // Update default SMS/Email messages with lead's name if available
        setSmsMessage(`Hej ${lead?.attName || lead?.fullName || 'kunde'}! Jeg har sendt dig et tilbud på mail. Ring hvis du har spørgsmål. Mvh Kasper West`);
        setEmailContent(`Hej ${lead?.attName || lead?.fullName || 'kunde'} 👋

Jeg har lige sendt dig en sms, men du får lige tilbuddet her også!

Jeg håber, du vil tage et kig på det og fortælle me, hvad du synes om tilbuddet.

Tryk her for at åbne tilbud

Du kan acceptere tilbuddet på en af flg. måder:
• Trykke på accept knappen inden på tilbudssiden.
• Ringe til mig på telefon nr.: 30143060
• Besvare denne mail

Jeg håber, at tilbuddet lever op til dine forventninger.

Bedste hilsner
Kasper West
+45 30143060 (kun opkald)
Kontakt@kasperwest.dk`);
        setEmailSubject(`Ang. tilbud fra Kasperwest.dk for ${lead?.companyName || lead?.fullName}`);
    }
  }, [quoteData, lead, quoteStatuses]);


  useEffect(() => {
    if (show && authToken) {
      fetchEmailTemplates();
      fetchSmsTemplates();
      // Add 'modal-open' class to body when modal is shown to prevent scrolling
      document.body.classList.add('modal-open');
    } else {
      // Remove 'modal-open' class from body when modal is hidden
      document.body.classList.remove('modal-open');
    }
  }, [show, authToken]);

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
      setEmailTemplates(response.data.map(template => ({
        id: template.id,
        templateName: template.templateName,
        subject: template.subject,
        recipientEmail: template.recipientEmail,
        body: template.emailContent,
        fromName: template.fromName, // Assuming 'fromName' from API
        fromEmail: template.fromEmail, // Assuming 'fromEmail' from API
        cc: template.ccEmails || '',
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
      setSmsTemplates(response.data.map(template => ({
        id: template.id,
        templateName: template.templateName,
        recipientPhone: template.recipientPhone,
        smsContent: template.smsContent,
        fromName: template.fromName, // Assuming 'fromName' from API
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

  const handleEmailTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedEmailTemplateId(templateId);
    const selectedTemplate = emailTemplates.find(t => t.id === Number(templateId));
    if (selectedTemplate) {
      setEmailSubject(selectedTemplate.subject);
      setEmailContent(selectedTemplate.body);
      setEmailFromName(selectedTemplate.fromName || 'Kasper West');
      setEmailFromEmail(selectedTemplate.fromEmail || 'kontakt@kasperwest.dk');
    } else {
        // If "Select a template" is chosen, reset to default content/subject
        setEmailSubject(`Ang. tilbud fra Kasperwest.dk for ${lead?.companyName || lead?.fullName}`);
        setEmailContent(`Hej ${lead?.attName || lead?.fullName || 'kunde'} 👋

Jeg har lige sendt dig en sms, men du får lige tilbuddet her også!

Jeg håber, du vil tage et kig på det og fortælle mig, hvad du synes om tilbuddet.

Tryk her for at åbne tilbud

Du kan acceptere tilbuddet på en af flg. måder:
• Trykke på accept knappen inden på tilbudssiden.
• Ringe til mig på telefon nr.: 30143060
• Besvare denne mail

Jeg håber, at tilbuddet lever op til dine forventninger.

Bedste hilsner
Kasper West
+45 30143060 (kun opkald)
Kontakt@kasperwest.dk`);
        setEmailFromName('Kasper West');
        setEmailFromEmail('kontakt@kasperwest.dk');
    }
  };

  const handleSmsTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedSmsTemplateId(templateId);
    const selectedTemplate = smsTemplates.find(t => t.id === Number(templateId));
    if (selectedTemplate) {
      setSmsMessage(selectedTemplate.smsContent);
      setSmsFromName(selectedTemplate.fromName || 'Kasper West');
    } else {
        // If "Select a template" is chosen, reset to default message
        setSmsMessage(`Hej ${lead?.attName || lead?.fullName || 'kunde'}! Jeg har sendt dig et tilbud på mail. Ring hvis du har spørgsmål. Mvh Kasper West`);
        setSmsFromName('Kasper West');
    }
  };

  const handleSendOffer = () => {
    const actions = {
      newStatusId: currentStatusId,
      sendSms: sendSmsChecked,
      smsDetails: sendSmsChecked ? {
        fromName: smsFromName,
        message: smsMessage,
        toPhone: lead?.phone,
        smsTemplateId: selectedSmsTemplateId || null, // Include selected SMS template ID
      } : null,
      sendEmail: sendEmailChecked,
      emailDetails: sendEmailChecked ? {
        fromName: emailFromName,
        fromEmail: emailFromEmail,
        subject: emailSubject,
        content: emailContent,
        toEmail: lead?.email,
        attachments: selectedAttachment !== 'None' ? [selectedAttachment] : [], // Only include if an attachment is selected
        emailTemplateId: selectedEmailTemplateId || null, // Include selected Email template ID
      } : null,
    };
    onSend(actions);
    // onHide(); // Don't call onHide here, let parent component handle closing after onSend completes
  };

  return (
    <div className={`modal fade modaldesign sendoffer ${show ? 'show d-block' : ''}`} id="myModal3" tabIndex="-1" role="dialog" aria-labelledby="myModal3Label" aria-hidden={!show}>
      <div className="modal-dialog modal-dialog-centered" role="document"> {/* Added modal-dialog-centered */}
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Actions for: {quoteData?.title || 'New Quote'}</h4>
            <button type="button" className="btn-close" onClick={onHide}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="formdesign sendoffer-action">
              <div className="form-group">
                <label>Set status</label>
                <div className="sendoffer-status">
                  <div className="inputselect">
                    <select className="form-select" value={currentStatusId} onChange={(e) => setCurrentStatusId(Number(e.target.value))}>
                      {quoteStatuses.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true">
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                  <span>Currently: {quoteStatuses.find(s => s.id === currentStatusId)?.name || 'N/A'}</span>
                </div>
              </div>
              <div className="modalfooter btn-right">
                <button type="button" className="btn btn-add" onClick={onHide}>Cancel</button>
                <button type="button" className="btn btn-send" onClick={handleSendOffer}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                    <path d="m21.854 2.147-10.94 10.939"></path>
                  </svg>Send Tilbud
                </button>
              </div>
            </div>

            <div className="row sendoffercheck-row">
              <div className="col-md-6">
                <div className="formdesign sendoffer-sms">
                  <h2 className="card-title">
                    <input className="form-check-input" type="checkbox" checked={sendSmsChecked} onChange={(e) => setSendSmsChecked(e.target.checked)} id="sendSmsCheckbox" />
                    <label htmlFor="sendSmsCheckbox" className="form-check-label d-inline-flex align-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true">
                        <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
                      </svg>Send SMS
                    </label>
                  </h2>
                  <div className="carddesign" style={{ opacity: sendSmsChecked ? 1 : 0.5, pointerEvents: sendSmsChecked ? 'auto' : 'none' }}>
                    <h2 className="card-title">SMS Editor</h2>
                    <div className="sendoffer-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true">
                        <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                      </svg>To: {lead?.phone || 'N/A'}
                    </div>
                    <div className="form-group mb-2">
                      <label>SMS Template</label>
                      <div className="inputselect">
                        <select className="form-select" value={selectedSmsTemplateId} onChange={handleSmsTemplateChange} disabled={loadingSMS}>
                          <option value="">Select a template</option>
                          {smsTemplates.map(template => (
                            <option key={template.id} value={template.id}>{template.templateName}</option>
                          ))}
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>From name</label>
                      <input type="text" className="form-control" placeholder="Kasper West" value={smsFromName} onChange={(e) => setSmsFromName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>SMS Message</label>
                      <textarea className="form-control" rows="5" placeholder="Your SMS message..." value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)}></textarea>
                      <div className="texttypelimit">
                        <span className="inputnote">Character count: {smsCharCount}</span>
                        <span className="texttype-besked">{smsType}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Preview</label>
                      <div className="carddesign smspreview">
                        <div className="smspreviewbox">
                          <h5>SMS from {smsFromName}</h5>
                          <p>{smsMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="formdesign sendoffer-sms">
                  <h2 className="card-title">
                    <input className="form-check-input" type="checkbox" checked={sendEmailChecked} onChange={(e) => setSendEmailChecked(e.target.checked)} id="sendEmailCheckbox" />
                    <label htmlFor="sendEmailCheckbox" className="form-check-label d-inline-flex align-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-5 h-5" aria-hidden="true">
                        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      </svg>Send Email
                    </label>
                  </h2>
                  <div className="carddesign" style={{ opacity: sendEmailChecked ? 1 : 0.5, pointerEvents: sendEmailChecked ? 'auto' : 'none' }}>
                    <h2 className="card-title">Email Editor</h2>
                    <div className="sendoffer-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true">
                        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      </svg>To: {lead?.email || 'N/A'}
                    </div>
                    <div className="form-group mb-2">
                      <label>Email template</label>
                      <div className="inputselect">
                        <select className="form-select" value={selectedEmailTemplateId} onChange={handleEmailTemplateChange} disabled={loadingEmails}>
                          <option value="">Select a template</option>
                          {emailTemplates.map(template => (
                            <option key={template.id} value={template.id}>{template.templateName}</option>
                          ))}
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>From name</label>
                          <input type="text" className="form-control" placeholder="Kasper West" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>From email</label>
                          <input type="text" className="form-control" placeholder="kontakt@kasperwest.dk" value={emailFromEmail} onChange={(e) => setEmailFromEmail(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <input type="text" className="form-control" placeholder="Regarding quote from Kasperwest.dk" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Email Content</label>
                      <textarea className="form-control" rows="10" placeholder="Your email content..." value={emailContent} onChange={(e) => setEmailContent(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Attachments</label>
                      <div className="inputselect">
                        <select className="form-select" value={selectedAttachment} onChange={(e) => setSelectedAttachment(e.target.value)}>
                          <option value="None">None</option>
                          {/* You'd dynamically populate these based on quote attachments or predefined files */}
                          {quoteData?.attachments?.map((attachment, index) => (
                             <option key={index} value={attachment.url}>{attachment.originalname}</option>
                          ))}
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Preview</label>
                      <div className="carddesign emailpreview">
                        <div className="emailpreviewbox">
                          <div className="emailpreview-from">
                            <div><strong>From:</strong> {emailFromName} &lt;{emailFromEmail}&gt;</div>
                            <div><strong>To:</strong> {lead?.email || 'N/A'}</div>
                            <div><strong>Subject:</strong> {emailSubject}</div>
                          </div>
                          <div className="emailpreview-body">
                            <pre className="pre-wrap">{emailContent}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendQuoteModal;
