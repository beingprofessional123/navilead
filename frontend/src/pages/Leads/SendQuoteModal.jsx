import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { useTranslation } from "react-i18next";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import LimitModal from '../../components/LimitModal';
import { useLimit } from "../../context/LimitContext";


const SendQuoteModal = ({ show, onHide, lead, quoteData, quoteStatuses, onSend, totalSmsSend, totalEmailsSend, fetchAllQuotesHistory }) => {
  const { authToken, user } = useContext(AuthContext);
  const { t: translate } = useTranslation();
  const { checkLimit, isLimitModalOpen, currentLimit, closeLimitModal, refreshPlan, userPlan } = useLimit();

  // --- SMS Character Constants ---
  // The standard max length for a single GSM-7 SMS
  const SMS_SINGLE_PART_LIMIT = 160;
  // The max length for subsequent segments in a multi-part SMS (160 - 7 bytes header)
  const SMS_MULTI_PART_LIMIT = 153;
  // Max characters allowed in the input field (e.g., 4 full parts: 160 + 3*153 = 612)
  const SMS_INPUT_MAX_LENGTH = 612; 
  // --- End SMS Character Constants ---

  const [currentStatusId, setCurrentStatusId] = useState(quoteData?.statusId || '');
  const [sendSmsChecked, setSendSmsChecked] = useState(false);
  const [smsFromName, setSmsFromName] = useState(user.name);
  const [smsMessage, setSmsMessage] = useState("");
  const [loadingSMS, setLoadingSMS] = useState(false);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [selectedSmsTemplateId, setSelectedSmsTemplateId] = useState('');
  const [sendEmailChecked, setSendEmailChecked] = useState(false);
  const [emailFromName, setEmailFromName] = useState(user.name);
  const [emailFromEmail, setEmailFromEmail] = useState(user.email);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedAttachment, setselectedAttachment] = useState('');
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');
  const [variables, setVariables] = useState([]);
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [sending, setSending] = useState(false);


  // Character count for SMS
  const smsCharCount = smsMessage.length;
  // Calculate parts based on the single part limit (160) for the first segment, 
  // and the 153 limit for subsequent segments.
  const calculateSmsParts = (length) => {
    if (length <= 0) return 0;
    if (length <= SMS_SINGLE_PART_LIMIT) return 1;

    const remainingLength = length - SMS_SINGLE_PART_LIMIT;
    const remainingParts = Math.ceil(remainingLength / SMS_MULTI_PART_LIMIT);
    
    return 1 + remainingParts;
  };

  const smsParts = calculateSmsParts(smsCharCount);
  const smsType = smsCharCount <= SMS_SINGLE_PART_LIMIT 
      ? translate('sendQuoteModal.singleSms') 
      : translate('sendQuoteModal.multiPartSms', { parts: smsParts });


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
      toast.error(translate('api.auth.tokenNotFound'));
      return;
    }

    setLoadingVariables(true);
    try {
      const response = await api.get("/variables", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setVariables(response.data);
    } catch (error) {
      console.error("Error fetching variables:", error);
      toast.error(translate('api.userVariables.fetchError'));
    } finally {
      setLoadingVariables(false);
    }
  };


  useEffect(() => {
    fetchVariables();
    refreshPlan();
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
      toast.error(translate('api.auth.tokenNotFoundForEmailTemplates'));
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
        fromName: template.fromName,
        fromEmail: template.fromEmail,
        cc: template.ccEmails || '',
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        attachments: template.attachments || [],
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
      toast.error(translate('api.auth.tokenNotFoundForSmsTemplates'));
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
        fromName: template.fromName,
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


  const handleEmailTemplateChange = (e) => {
    const templateId = Number(e.target.value);
    setSelectedEmailTemplateId(templateId);

    const selectedTemplate = emailTemplates.find(t => t.id === templateId);
    setEmailSubject(selectedTemplate?.subject || "");
    setEmailContent(selectedTemplate?.body || "");
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

  const handleSendOffer = async () => {
    if (sendSmsChecked) {
      const canProceedSms = checkLimit(totalSmsSend, "SMS");
      if (!canProceedSms) return;
    }
    // Check Email limit
    if (sendEmailChecked) {
      const canProceedEmail = checkLimit(totalEmailsSend, "Emails");
      if (!canProceedEmail) return;
    }
    setSending(true);
    try {
      const actions = {
        newStatusId: currentStatusId,
        sendSms: sendSmsChecked,
        smsDetails: sendSmsChecked
          ? {
            fromName: smsFromName,
            message: smsMessage,
            toPhone: lead?.phone,
            smsTemplateId: selectedSmsTemplateId || null,
          }
          : null,
        sendEmail: sendEmailChecked,
        emailDetails: sendEmailChecked
          ? {
            fromName: emailFromName,
            fromEmail: emailFromEmail,
            subject: emailSubject,
            content: emailContent,
            toEmail: lead?.email,
            attachments: selectedAttachment,
            emailTemplateId: selectedEmailTemplateId || null,
          }
          : null,
      };
      const result = await onSend(actions);

      // // ✅ Only close modal if sending succeeded
      if (result?.success) {
        onHide(); // Close modal
        refreshPlan();
        fetchAllQuotesHistory();
      } else {
        console.warn("Offer send failed. Modal will remain open.");
      }
    } catch (err) {
      console.error("Error sending offer:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSetSendSmsChecked = (checked) => {
    const canProceedSms = checkLimit(totalSmsSend, "SMS");
    if (!canProceedSms) {
      toast.warning("SMS limit reached!");
      return;
    }
    setSendSmsChecked(checked);
  };

  // Similarly for Email
  const handleSetSendEmailChecked = (checked) => {
    const canProceedEmail = checkLimit(totalEmailsSend, "Emails");
    if (!canProceedEmail) {
      toast.warning("Email limit reached!");
      return;
    }
    setSendEmailChecked(checked);
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

  const canSend = () => {
    if (!sendSmsChecked && !sendEmailChecked) return false;
    if (sendSmsChecked && smsMessage.trim() === "") return false;
    if (sendEmailChecked) {
      if (
        emailSubject.trim() === "" ||
        emailContent.trim() === "" ||
        emailFromEmail.trim() === ""
      ) return false;
    }
    return true;
  };

  const handleAttachmentDropdownSelect = (event) => {
    const selectedOption = event.target.selectedOptions[0];
    if (!selectedOption) return;
    const url = selectedOption.getAttribute('data-url');
    const originalName = selectedOption.getAttribute('data-originalname');
    setselectedAttachment(url && originalName ? [{ filename: originalName, path: url }] : []);
  };

  // Function to calculate final replaced message length and parts
  const getReplacedSmsInfo = () => {
    const finalMessage = replaceVariables(smsMessage, variables, { quoteId: quoteData.id });
    const length = finalMessage.length;
    
    const parts = calculateSmsParts(length);

    return { 
      length, 
      parts, 
      type: length <= SMS_SINGLE_PART_LIMIT ? translate('sendQuoteModal.singleSms') : translate('sendQuoteModal.multiPartSms', { parts }) 
    };
  };

  const replacedSmsInfo = getReplacedSmsInfo();


  return (
    <>
      <div className={`${show ? 'modal-backdrop fade show' : ''}`}></div>

      <div className={`modal modaldesign sendoffer ${show ? 'd-block' : ''}`} id="SendQuote" tabIndex="-1" role="dialog" aria-labelledby="SendQuoteLabel" aria-hidden={!show}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">{translate('sendQuoteModal.actionsFor', { quoteTitle: quoteData?.title || translate('sendQuoteModal.newQuote') })}</h4>
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
                  <label>{translate('sendQuoteModal.setStatus')}</label>
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
                    <span>{translate('sendQuoteModal.currently')} {quoteStatuses.find(s => s.id === currentStatusId)?.name || translate('leadViewPage.na')}</span>
                  </div>
                </div>
                <div className="modalfooter btn-right">
                  <button type="button" className="btn btn-add" onClick={onHide}>{translate('sendQuoteModal.cancel')}</button>
                  <button
                    type="button"
                    className="btn btn-send d-flex align-items-center justify-content-center"
                    disabled={sending || !canSend()}
                    onClick={handleSendOffer}
                  >
                    {sending ? (
                      <>
                        <svg
                          className="animate-spin me-2"
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2 a10 10 0 0 1 10 10" />
                        </svg>
                        sending...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-send me-2"
                          aria-hidden="true"
                        >
                          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path>
                          <path d="m21.854 2.147-10.94 10.939"></path>
                        </svg>
                        {translate('sendQuoteModal.sendOffer')}
                      </>
                    )}
                  </button>

                </div>
              </div>

              <div className="row sendoffercheck-row">
                <div className="col-md-6">
                  <div className="formdesign sendoffer-sms">
                    <h2 className="card-title d-flex align-items-center justify-content-between">
                      <div>
                        <input className="form-check-input" type="checkbox" checked={sendSmsChecked} onChange={(e) => handleSetSendSmsChecked(e.target.checked)} id="sendSmsCheckbox" />
                        <label htmlFor="sendSmsCheckbox" className="form-check-label d-inline-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square" aria-hidden="true">
                            <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"></path>
                          </svg>{translate('sendQuoteModal.sendSms')}
                        </label>
                      </div>
                      <span> USED:{totalSmsSend ?? 0} /  LIMIT: {userPlan.plan.Total_SMS_allowed} </span>
                    </h2>
                    <div className="carddesign" style={{ opacity: sendSmsChecked ? 1 : 0.5, pointerEvents: sendSmsChecked ? 'auto' : 'none' }}>
                      <h2 className="card-title">{translate('sendQuoteModal.smsEditor')}</h2>
                      <div className="sendoffer-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone" aria-hidden="true">
                          <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
                        </svg>{translate('sendQuoteModal.to')} {lead?.phone || translate('leadViewPage.na')}
                      </div>
                      <div className="form-group mb-2">
                        <label>{translate('sendQuoteModal.smsTemplate')}</label>
                        <div className="inputselect">
                          <select className="form-select" value={selectedSmsTemplateId} onChange={handleSmsTemplateChange} disabled={loadingSMS}>
                            <option value="">{translate('sendQuoteModal.selectATemplate')}</option>
                            {smsTemplates.map(template => (
                              <option key={template.id} value={template.id}>{template.templateName}</option>
                            ))}
                          </select>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{translate('sendQuoteModal.fromName')}</label>
                        <input type="text" className="form-control" placeholder="" value={smsFromName} onChange={(e) => setSmsFromName(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{translate('sendQuoteModal.smsMessage')}</label>
                        {/* UPDATE: Increased max length to allow multi-part messages (e.g., 612 for 4 parts) */}
                        <textarea 
                          className="form-control" 
                          rows="5" 
                          placeholder={translate('sendQuoteModal.yourSmsMessagePlaceholder')} 
                          maxLength={SMS_INPUT_MAX_LENGTH} 
                          value={smsMessage} 
                          onChange={(e) => setSmsMessage(e.target.value)}
                        ></textarea>
                        <div className="texttypelimit">
                          <span className="inputnote">{translate('sendQuoteModal.characterCount')} {smsCharCount}/{SMS_INPUT_MAX_LENGTH}</span>
                          <span className="texttype-besked">{smsType}</span>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{translate('sendQuoteModal.preview')}</label>
                        <div className="carddesign smspreview">
                          <div className="smspreviewbox">
                            <h5>{translate('sendQuoteModal.smsFrom', { fromName: smsFromName })}</h5>
                            <p>{replaceVariables(smsMessage, variables, { quoteId: quoteData.id })}</p>
                          </div>
                          <div className="texttypelimit">
                            <span
                              // Check if the final message, after variable replacement, exceeds the single part limit.
                              className={`inputnote ${replacedSmsInfo.parts > 1 ? "text-danger" : ""}`}
                            >
                              {/* Display length and the total parts it will be split into */}
                              {translate('sendQuoteModal.characterCount')} {replacedSmsInfo.length} (Parts: {replacedSmsInfo.parts})
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="formdesign sendoffer-sms">
                    <h2 className="card-title  d-flex align-items-center justify-content-between">
                      <div>
                        <input className="form-check-input" type="checkbox" checked={sendEmailChecked} onChange={(e) => handleSetSendEmailChecked(e.target.checked)} id="sendEmailCheckbox" />
                        <label htmlFor="sendEmailCheckbox" className="form-check-label d-inline-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-5 h-5" aria-hidden="true">
                            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                          </svg>{translate('sendQuoteModal.sendEmail')}
                        </label>
                      </div>
                      <span> USED:{totalEmailsSend ?? 0}  /  LIMIT: {userPlan.plan.Total_emails_allowed} </span>

                    </h2>
                    <div className="carddesign" style={{ opacity: sendEmailChecked ? 1 : 0.5, pointerEvents: sendEmailChecked ? 'auto' : 'none' }}>
                      <h2 className="card-title">{translate('sendQuoteModal.emailEditor')}</h2>
                      <div className="sendoffer-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail" aria-hidden="true">
                          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        </svg>{translate('sendQuoteModal.to')} {lead?.email || translate('leadViewPage.na')}
                      </div>
                      <div className="form-group mb-2">
                        <label>{translate('sendQuoteModal.emailTemplate')}</label>
                        <div className="inputselect">
                          <select className="form-select" value={selectedEmailTemplateId} onChange={handleEmailTemplateChange} disabled={loadingEmails}>
                            <option value="">{translate('sendQuoteModal.selectATemplate')}</option>
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
                            <label>{translate('sendQuoteModal.fromName')}</label>
                            <input type="text" className="form-control" placeholder="" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label>{translate('sendQuoteModal.fromEmail')}</label>
                            <input type="text" className="form-control" placeholder={translate('sendQuoteModal.fromEmailPlaceholder')} value={emailFromEmail} onChange={(e) => setEmailFromEmail(e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{translate('sendQuoteModal.subject')}</label>
                        <input type="text" className="form-control" placeholder={translate('sendQuoteModal.subjectPlaceholder')} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>{translate('sendQuoteModal.emailContent')}</label>
                        <CKEditor
                          editor={ClassicEditor}
                          data={emailContent}
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            setEmailContent(data);
                            const fakeEvent = { target: { value: data } };
                            setEmailContent(fakeEvent.target.value);
                          }}
                        />
                      </div>
                      {/* ATTACHMENTS */}
                      <div className="form-group">
                        <label>{translate('sendQuoteModal.attachments')}</label>

                        <div className="inputselect">
                          <select
                            className="form-select"
                            onChange={handleAttachmentDropdownSelect}
                            disabled={!selectedEmailTemplateId}
                          >
                            <option value="">Select Attachment</option>
                            {selectedEmailTemplateId &&
                              emailTemplates
                                .find(t => t.id === selectedEmailTemplateId)
                                ?.attachments?.map((att) => (
                                 <option
                                    key={att.url}
                                    data-url={att.url}
                                    data-originalname={att.originalName}
                                  >
                                    {att.originalName}
                                  </option>
                                ))
                            }
                          </select>

                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true">
                            <path d="m6 9 6 6 6-6"></path>
                          </svg>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>{translate('sendQuoteModal.preview')}</label>
                        <div className="carddesign emailpreview">
                          <div className="emailpreviewbox">
                            <div className="emailpreview-from">
                              <div><strong>{translate('sendQuoteModal.fromName')}:</strong> {emailFromName} &lt;{emailFromEmail}&gt;</div>
                              <div><strong>{translate('sendQuoteModal.to')}:</strong> {lead?.email || translate('leadViewPage.na')}</div>
                              <div><strong>{translate('sendQuoteModal.subject')}:</strong> {emailSubject}</div>
                            </div>
                            <div className="pre-wrap text-black" dangerouslySetInnerHTML={{ __html: emailContent }} />
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