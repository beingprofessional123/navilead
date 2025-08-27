import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { useTranslation } from "react-i18next"; // Import useTranslation
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const SendQuoteModal = ({ show, onHide, lead, quoteData, quoteStatuses, onSend }) => {
  const { authToken, user } = useContext(AuthContext);
  const { t: translate } = useTranslation(); // Initialize translation hook

  const [currentStatusId, setCurrentStatusId] = useState(quoteData?.statusId || '');
  const [sendSmsChecked, setSendSmsChecked] = useState(false);
  const [smsFromName, setSmsFromName] = useState(user.name); // Default from name
  const [smsMessage, setSmsMessage] = useState(""); // Default message
  const [loadingSMS, setLoadingSMS] = useState(false);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [selectedSmsTemplateId, setSelectedSmsTemplateId] = useState('');

  const [sendEmailChecked, setSendEmailChecked] = useState(true); // Email checked by default
  const [emailFromName, setEmailFromName] = useState(user.name); // Default from name
  const [emailFromEmail, setEmailFromEmail] = useState(user.email); // Default from email
  const [emailSubject, setEmailSubject] = useState(""); // Default subject
  const [emailContent, setEmailContent] = useState(""); // Default content
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState('None'); // For email attachments
  const [variables, setVariables] = useState([]);
  const [loadingVariables, setLoadingVariables] = useState(false);


  // Character count for SMS
  const smsCharCount = smsMessage.length;
  const smsType = smsCharCount <= 99 ? translate('sendQuoteModal.singleSms') : translate('sendQuoteModal.multiPartSms', { parts: Math.ceil(smsCharCount / 99) }); // Translated


  // Update state when quoteData or lead changes (e.g., when a new quote is created)
  useEffect(() => {
    if (quoteData) {
      setCurrentStatusId(quoteData.statusId || quoteStatuses.find(s => s.name === 'Not sent')?.id || '');
    }
    if (lead) {
      // Update default SMS/Email messages with lead's name if available
      setSmsMessage("");
      setEmailContent("");
      setEmailSubject("");
    }
  }, [quoteData, lead, quoteStatuses]);

  const fetchVariables = async () => {
    if (!authToken) {
      toast.error(translate('api.auth.tokenNotFound')); // Translated
      return;
    }

    setLoadingVariables(true);
    try {
      const response = await api.get("/variables", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setVariables(response.data); // save directly
    } catch (error) {
      console.error("Error fetching variables:", error);
      toast.error(translate('api.userVariables.fetchError')); // Translated
    } finally {
      setLoadingVariables(false);
    }
  };


  useEffect(() => {
    fetchVariables();
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
      toast.error(translate('api.auth.tokenNotFoundForEmailTemplates')); // Translated
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
      toast.error(translate('api.emailTemplates.fetchError')); // Translated
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchSmsTemplates = async () => {
    if (!authToken) {
      setLoadingSMS(false);
      toast.error(translate('api.auth.tokenNotFoundForSmsTemplates')); // Translated
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
      toast.error(translate('api.smsTemplates.fetchError')); // Translated
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
      setEmailFromName(user.name);
      setEmailFromEmail(user.email);
    } else {
      // If "Select a template" is chosen, reset to default content/subject
      setEmailSubject("");
      setEmailContent("");
      setEmailFromName(user.name);
      setEmailFromEmail(user.email);
    }
  };

  const handleSmsTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedSmsTemplateId(templateId);
    const selectedTemplate = smsTemplates.find(t => t.id === Number(templateId));
    if (selectedTemplate) {
      setSmsMessage(selectedTemplate.smsContent);
      setSmsFromName(selectedTemplate.fromName || user.name);
    } else {
      // If "Select a template" is chosen, reset to default message
      setSmsMessage("");
      setSmsFromName(user.name);
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

  const replaceVariables = (message, variables, extra = {}) => {
    if (!message) return "";

    let replaced = message;

    // Replace database variables first
    variables.forEach(v => {
      const regex = new RegExp(`{{${v.variableName}}}`, "g");
      replaced = replaced.replace(regex, v.variableValue || "");
    });

    // Handle special dynamic placeholders like :quoteId
    if (extra.quoteId) {
      replaced = replaced.replace(/:quoteId/g, extra.quoteId);
    }

    return replaced;
  };

  return (
    <>
    <div className={`${show ? 'modal-backdrop fade show' : ''}`}></div>
   
      <div className={`modal modaldesign sendoffer ${show ? 'd-block' : ''}`} id="SendQuote" tabIndex="-1" role="dialog" aria-labelledby="SendQuoteLabel" aria-hidden={!show}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">{translate('sendQuoteModal.actionsFor', { quoteTitle: quoteData?.title || translate('sendQuoteModal.newQuote') })}</h4> {/* Translated */}
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
                <label>{translate('sendQuoteModal.setStatus')}</label> {/* Translated */}
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
                  <span>{translate('sendQuoteModal.currently')}: {quoteStatuses.find(s => s.id === currentStatusId)?.name || translate('leadViewPage.na')}</span> {/* Translated */}
                </div>
              </div>
              <div className="modalfooter btn-right">
                <button type="button" className="btn btn-add" onClick={onHide}>{translate('sendQuoteModal.cancel')}</button> {/* Translated */}
                <button type="button" className="btn btn-send" onClick={handleSendOffer}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send" aria-hidden="true">
                    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                    <path d="m21.854 2.147-10.94 10.939"></path>
                  </svg>{translate('sendQuoteModal.sendOffer')} {/* Translated */}
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
                      </svg>{translate('sendQuoteModal.sendSms')} {/* Translated */}
                    </label>
                  </h2>
                  <div className="carddesign" style={{ opacity: sendSmsChecked ? 1 : 0.5, pointerEvents: sendSmsChecked ? 'auto' : 'none' }}>
                    <h2 className="card-title">{translate('sendQuoteModal.smsEditor')}</h2> {/* Translated */}
                    <div className="sendoffer-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true">
                        <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                      </svg>{translate('sendQuoteModal.to')} {lead?.phone || translate('leadViewPage.na')} {/* Translated */}
                    </div>
                    <div className="form-group mb-2">
                      <label>{translate('sendQuoteModal.smsTemplate')}</label> {/* Translated */}
                      <div className="inputselect">
                        <select className="form-select" value={selectedSmsTemplateId} onChange={handleSmsTemplateChange} disabled={loadingSMS}>
                          <option value="">{translate('sendQuoteModal.selectATemplate')}</option> {/* Translated */}
                          {smsTemplates.map(template => (
                            <option key={template.id} value={template.id}>{template.templateName}</option>
                          ))}
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.fromName')}</label> {/* Translated */}
                      <input type="text" className="form-control" placeholder="" value={smsFromName} onChange={(e) => setSmsFromName(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.smsMessage')}</label> {/* Translated */}
                      <textarea className="form-control" rows="5" placeholder={translate('sendQuoteModal.yourSmsMessagePlaceholder')} maxLength={99} value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)}></textarea> {/* Translated */}
                      <div className="texttypelimit">
                        <span className="inputnote">{translate('sendQuoteModal.characterCount')} {smsCharCount}</span> {/* Translated */}
                        <span className="texttype-besked">{smsType}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.preview')}</label> {/* Translated */}
                      <div className="carddesign smspreview">
                        <div className="smspreviewbox">
                          <h5>{translate('sendQuoteModal.smsFrom', { fromName: smsFromName })}</h5> {/* Translated */}
                          <p>{replaceVariables(smsMessage, variables, { quoteId: quoteData.id })}</p>
                        </div>
                        <div className="texttypelimit">
                          <span
                            className={`inputnote ${replaceVariables(smsMessage, variables).length > 99 ? "text-danger" : ""
                              }`}
                          >
                            {translate('sendQuoteModal.characterCount')} {replaceVariables(smsMessage, variables, { quoteId: quoteData.id }).length}/99 {/* Translated */}
                          </span>
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
                      </svg>{translate('sendQuoteModal.sendEmail')} {/* Translated */}
                    </label>
                  </h2>
                  <div className="carddesign" style={{ opacity: sendEmailChecked ? 1 : 0.5, pointerEvents: sendEmailChecked ? 'auto' : 'none' }}>
                    <h2 className="card-title">{translate('sendQuoteModal.emailEditor')}</h2> {/* Translated */}
                    <div className="sendoffer-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true">
                        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      </svg>{translate('sendQuoteModal.to')} {lead?.email || translate('leadViewPage.na')} {/* Translated */}
                    </div>
                    <div className="form-group mb-2">
                      <label>{translate('sendQuoteModal.emailTemplate')}</label> {/* Translated */}
                      <div className="inputselect">
                        <select className="form-select" value={selectedEmailTemplateId} onChange={handleEmailTemplateChange} disabled={loadingEmails}>
                          <option value="">{translate('sendQuoteModal.selectATemplate')}</option> {/* Translated */}
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
                          <label>{translate('sendQuoteModal.fromName')}</label> {/* Translated */}
                          <input type="text" className="form-control" placeholder="" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>{translate('sendQuoteModal.fromEmail')}</label> {/* Translated */}
                          <input type="text" className="form-control" placeholder={translate('sendQuoteModal.fromEmailPlaceholder')} value={emailFromEmail} onChange={(e) => setEmailFromEmail(e.target.value)} /> {/* Translated */}
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.subject')}</label> {/* Translated */}
                      <input type="text" className="form-control" placeholder={translate('sendQuoteModal.subjectPlaceholder')} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} /> {/* Translated */}
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.emailContent')}</label> {/* Translated */}
                      {/* <textarea className="form-control" rows="10" placeholder={translate('sendQuoteModal.yourEmailContentPlaceholder')} value={emailContent} onChange={(e) => setEmailContent(e.target.value)}></textarea> Translated */}
                        <CKEditor
                          editor={ClassicEditor}
                          data={emailContent} // initial value
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              setEmailContent(data);
                              const fakeEvent = { target: { value: data } };
                              setEmailContent(fakeEvent.target.value);
                            }}
                        />
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.attachments')}</label> {/* Translated */}
                      <div className="inputselect">
                        <select className="form-select" value={selectedAttachment} onChange={(e) => setSelectedAttachment(e.target.value)}>
                          <option value="None">{translate('sendQuoteModal.none')}</option> {/* Translated */}
                          {quoteData?.attachments?.map((attachment, index) => (
                            <option
                              key={index}
                              value={attachment.url ?? `http://localhost:4000/${attachment.filePath}`}
                            >
                              {attachment.originalName}
                            </option>
                          ))}
                        </select>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>{translate('sendQuoteModal.preview')}</label> {/* Translated */}
                      <div className="carddesign emailpreview">
                        <div className="emailpreviewbox">
                          <div className="emailpreview-from">
                            <div><strong>{translate('sendQuoteModal.fromName')}:</strong> {emailFromName} &lt;{emailFromEmail}&gt;</div> {/* Translated */}
                            <div><strong>{translate('sendQuoteModal.to')}:</strong> {lead?.email || translate('leadViewPage.na')}</div> {/* Translated */}
                            <div><strong>{translate('sendQuoteModal.subject')}:</strong> {emailSubject}</div> {/* Translated */}
                          </div>
                          <div className="pre-wrap text-black"  dangerouslySetInnerHTML={{ __html: emailContent }} />
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
    </>

  );
};

export default SendQuoteModal;
