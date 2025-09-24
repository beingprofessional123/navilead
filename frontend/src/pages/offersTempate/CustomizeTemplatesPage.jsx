import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';

const OffersTemplatesPage = () => {
  const { authToken } = useContext(AuthContext);
  const iframeRef = useRef(null);
  const textareaRef = useRef(null);
  const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Navilead</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: 'Poppins', sans-serif; background-color: #101418; color: #cff; font-weight: 400; font-style: normal;">

<section style="padding: 50px 0px;">
  <div style="width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto;">
    <div style="display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px;">
      <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px;">
        <div style="width: 220px; margin: 0px auto 30px;">
          <a href="#"><img src="/assets/images/logo.svg" style="max-width: 100%; height: auto; display: block;" alt=""></a>
        </div>
      </div>
    </div>
    <div style="display: flex;">
      <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px; flex: 0 0 58.333333%; max-width: 58.333333%;">
        <div style="background-color: #171f26; border: 1px solid #202e3c; border-radius: 8.7px; padding: 21px; margin-bottom: 23px; position: relative;">
           <div> 
          <div class="offer-title">
           <h1 style="font-size: 21px; margin-bottom: 10px;" id="QuotesTitle">{quotestitle}</h1>
          </div>
          <div style="font-size: 14px; color: #8cd9d9; margin-bottom: 3px; font-weight: 400;">
             <p style="font-size: 14px; color: #8cd9d9; margin-bottom: 3px; font-weight: 400;" id="QuotesDescription">{quotesdescription}</p>
            <p style="font-size: 12px; color: #8cd9d9; margin-bottom: 3px; font-weight: 400;">Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
          </div>
          <div style="margin: 10px 0 2px;" class="service-container" id="mulipleserverdivmain">
            <div class="service-item" id="mulipleserverdivrepated" style="display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; padding: 12px 10px; border-radius: 10px; border: 1px solid #202e3c; margin-bottom: 10px;">
              <input type="checkbox" style="background-color: #1b2632; border: 1px solid #202e3c;" class="service-checkbox" id="mulipleservercheckbox">
              <div id="mulipleservercheckboxinnerdiv">
                <div style="font-size: 14px; font-weight: 400; margin-bottom: 1px;" class="service-title" id="mulipleserverdivtitle">{servicetitle}</div>
                <div style="font-size: 13px; color: #8cd9d9; margin-bottom: 0px; font-weight: 400;" class="service-description" id="mulipleserverdivdiscription">{servicedescription}</div>
              </div>
              <div style="color: #00d4f0; font-weight: 500; font-size: 15px;" class="service-price" id="mulipleserverdivPrice">{serviceprice}</div>
            </div>
          </div>
          <div style="border-top: 1px dashed #202e3c; margin-top: 15px; padding: 15px 0px; display: grid; gap: 6px; margin-bottom: 15px; border-bottom: 1px dashed #202e3c;">
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-size: 14px; font-weight: 500;" id="Subtotaltext">{Subtotaltext}</span>
                <strong style="font-size: 14px; font-weight: 700; color: #00d4f0;" id="Subtotalprice">{Subtotalprice}</strong>
            </div>
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-size: 14px; font-weight: 500;" id="vattext">{vattext}</span>
                <strong style="font-size: 14px; font-weight: 700; color: #00d4f0;" id="vatprice">{vatprice}</strong>
            </div>
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-weight: 700; font-size: 14px;" id="totaltext">{totaltext}</span>
                <strong style="font-size: 16px; font-weight: 700; color: #00d4f0;" id="totalprice">{totalprice}</strong>
            </div>
          </div>

          <div class="publicbottom">
            <div style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;">
                <h2 style="color: #cff; font-size: 16px; font-weight: 500; margin-bottom: 5px;" id="termstext">{termstext}</h2>
                <p style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;" id="termsDescription">{termsDescription}</p>
            </div>
         <div style="font-size: 14px; margin-bottom: 20px;">
              <input id="acceptTermsCheckbox" type="checkbox" style="background-color: #1b2632; border: 1px solid #202e3c; margin-right: 10px;">
              <label for="acceptTermsCheckbox" id="acceptTermsLabel">
                I accept the <a href="#" target="_blank" rel="noopener" style="color: #00d4f0;" id="acceptTermsText">Terms & Conditions</a>.
              </label>
            </div>
          </div>
          <div style="margin-bottom: 1.5rem;" id="customerNotesContainer">
            <label 
              for="customerNotes" 
              style="display: inline-block; margin-bottom: 0.5rem; font-weight: 400; font-size: 1rem; line-height: 1.5; color: #cff;"
             id="customerNoteslabel">
              Notes for us (optional):
            </label>

            <textarea
              id="customerNotestextarea"
              rows="3"
              style="display: block; width: 100%; padding: 8px 5px; font-size: 12px; font-weight: 400; line-height: 1.5; color: #cff; background-color: #1b2632; border: 1px solid #171f26; border-radius: 8.7px; outline: none; box-shadow: none; -webkit-appearance: none; -moz-appearance: none; appearance: none; background-clip: padding-box; transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out; min-height: calc(1.5em + .75rem + 2px); resize: vertical;"
            ></textarea>
          </div>

          <div style="display: flex; gap: 0px 9px; justify-content: space-between; border-top: 1px solid #202e3c; padding-top: 20px; margin-top: 20px;">
            <button style="padding: 7px 14px; color: #cff !important; background-color: #101418; font-size: 12.25px; border: 1px solid #202e3c !important; border-radius: 8.7px; outline: none !important; box-shadow: none !important;" id="acceptQuoteBtn">Accept Quote</button>
            <button style="padding: 7px 14px; color: #101418 !important; background-color: #00d4f0; font-size: 12.25px; border: 1px solid #202e3c !important; border-radius: 8.7px; outline: none !important; box-shadow: none !important;" id="askQuestionBtn">Ask a Question</button>
          </div></div>
        </div>
      </div>
      <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px; flex: 0 0 41.666667%; max-width: 41.666667%;">
        <div style="background-color: #171f26; border: 1px solid #202e3c; border-radius: 8.7px; padding: 21px; margin-bottom: 23px; position: relative;">
          <div style="margin-bottom: 15px;">
            <a href="#"><img src="/assets/images/blog3.jpg" style="width: 100%; height: auto; border-radius: 12px; display: block;" alt=""></a>
          </div>
          <div style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;">
            <h2 style="color: #cff; font-size: 16px; font-weight: 500; margin-bottom: 5px;">About Us</h2>
            <p style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;"><strong style="font-weight: 500; color: #cff;">About Our Company:</strong> We are a dedicated service provider focused on delivering top-quality results and exceptional customer experiences. Our mission is to make every interaction with us professional, friendly, and hassle-free.</p>
            <p style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;"><strong style="font-weight: 500; color: #cff;">Our Commitment:</strong> We take pride in our attention to detail and reliability. Whether we are working at your home or business, we treat every project with care and respect.</p>
            <p style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;"><strong style="font-weight: 500; color: #cff;">Experienced Team:</strong> Our skilled team members are carefully selected and trained to uphold our high standards, ensuring consistent results for all our clients.</p>
            <p style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;"><strong style="font-weight: 500; color: #cff;">Value You Can Trust:</strong> We offer competitive rates without compromising on quality. Our clients trust us for dependable service that exceeds expectations.</p>
            <p style="font-size: 13px; color: #8cd9d9; margin-bottom: 10px; font-weight: 400;"><strong style="font-weight: 500; color: #cff;">Clear Communication:</strong> We believe in open and honest communication, so you always know what to expect when working with us.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<script>

</script>
</body>
</html>`; // Example

  const [htmlCode, setHtmlCode] = useState(defaultHTML);
  const [templateId, setTemplateId] = useState('');

  // Fetch the first template from API
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await api.get('/offers-templates', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
          setHtmlCode(response.data[0].htmlCode || defaultHTML);
          setTemplateId(response.data[0].id);
        } else {
          toast.info('No template found. Loading default HTML.');
          setHtmlCode(defaultHTML);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch template. Loading default HTML.');
        setHtmlCode(defaultHTML);
      }
    };
    fetchTemplate();
  }, [authToken]);

  // Update iframe whenever htmlCode changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(htmlCode);
      doc.close();
    }
  }, [htmlCode]);

  const checkMissingElements = (html) => {
    const requiredElements = [
      { type: 'id', name: 'QuotesTitle', variable: 'quotestitle' },
      { type: 'id', name: 'QuotesDescription', variable: 'quotesdescription' },
      { type: 'class', name: 'service-container' },
      { type: 'class', name: 'service-item' },
      { type: 'class', name: 'service-checkbox' },
      { type: 'class', name: 'service-title', variable: 'servicetitle' },
      { type: 'class', name: 'service-description', variable: 'servicedescription' },
      { type: 'class', name: 'service-price', variable: 'serviceprice' },
      { type: 'id', name: 'Subtotaltext', variable: 'Subtotaltext' },
      { type: 'id', name: 'Subtotalprice', variable: 'Subtotalprice' },
      { type: 'id', name: 'vattext', variable: 'vattext' },
      { type: 'id', name: 'vatprice', variable: 'vatprice' },
      { type: 'id', name: 'totaltext', variable: 'totaltext' },
      { type: 'id', name: 'totalprice', variable: 'totalprice' },
      { type: 'id', name: 'termstext', variable: 'termstext' },
      { type: 'id', name: 'termsDescription', variable: 'termsDescription' },
      { type: 'id', name: 'acceptTermsCheckbox' },
      { type: 'id', name: 'acceptTermsLabel' },
      { type: 'id', name: 'acceptTermsText' },
      { type: 'id', name: 'customerNotesContainer' },
      { type: 'id', name: 'customerNoteslabel' },
      { type: 'id', name: 'customerNotestextarea' },
      { type: 'id', name: 'acceptQuoteBtn' },
      { type: 'id', name: 'askQuestionBtn' },
    ];

    const missingElements = [];

    requiredElements.forEach(el => {
      if (el.type === 'id') {
        if (!html.includes(`id="${el.name}"`)) missingElements.push(`ID: ${el.name}`);
        if (el.variable && !html.includes(`{${el.variable}}`)) missingElements.push(`Variable: ${el.variable}`);
      }
      if (el.type === 'class') {
        if (!html.includes(`class="${el.name}"`)) missingElements.push(`Class: ${el.name}`);
        if (el.variable && !html.includes(`{${el.variable}}`)) missingElements.push(`Variable: ${el.variable}`);
      }
    });

    return missingElements;
  };


  const handleApplyNow = async ({ htmlCode, templateId, authToken }) => {
    // Ensure htmlCode is valid
    if (!htmlCode || typeof htmlCode !== 'string') {
      toast.error('HTML Code is missing or invalid (expected a string)!');
      return;
    }

    if (!templateId) {
      toast.error('Template ID is missing!');
      return;
    }

    const missingElements = checkMissingElements(htmlCode);
    if (missingElements.length > 0) {
      toast.error(`Missing required elements:\n${missingElements.join('\n')}`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('htmlCode', htmlCode);

      await api.put(`/offers-templates/${templateId}`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Template updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update template.');
    }
  };



  return (
    <>
      <div className="mainbody">
        <div className="container-fluid">
          <MobileHeader />
          <div className="formdesign">
            <div className="row">
              <div className="col-md-4">
                <div className='d-flex justify-content-between align-items-center'>
                  <h4 className="mb-4">Code Here</h4>
                  <button
                    className="btn btn-send"
                    onClick={() => setHtmlCode(defaultHTML)}
                  >
                    Default HTML
                  </button>
                </div>
                <div className="form-group">
                  <textarea
                    ref={textareaRef}
                    className="form-control"
                    rows={47}
                    name="htmlCode"
                    value={htmlCode}
                    onChange={e => setHtmlCode(e.target.value)}
                    placeholder="Write full HTML code here"
                    required
                    onKeyUp={e => {
                      const updatedHtml = e.target.value;
                      setHtmlCode(updatedHtml);
                      const missing = checkMissingElements(updatedHtml);
                      if (missing.length > 0) {
                        toast.error(`Missing elements:\n${missing.join('\n')}`);
                      } else {
                        toast.success('All required elements are present!');
                      }
                    }}
                  />

                </div>
              </div>
              <div className="col-md-8">
                <div>
                  <h4 className="mb-4">Live Preview</h4>
                </div>
                <div className="carddesign">
                  <iframe
                    ref={iframeRef}
                    title="live-preview"
                    style={{ width: '100%', height: '81vh', border: 'none' }}
                  />
                </div>
              </div>
            </div>
            <div className="modalfooter btn-right mb-5">
              <a href="#" data-bs-dismiss="modal" className="btn btn-add">Cancel</a>
              <a href="#" onClick={() => handleApplyNow({ htmlCode, templateId, authToken })} className="btn btn-send">Apply Now</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OffersTemplatesPage;
