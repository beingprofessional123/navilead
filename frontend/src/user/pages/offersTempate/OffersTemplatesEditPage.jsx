import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useTranslation } from 'react-i18next';



const OffersTemplatesEditPage = () => {
    const { t } = useTranslation();
    const { authToken, user } = useContext(AuthContext);
    const { templatetype, templateid } = useParams();
    const iframeRef = useRef(null);
    const textareaRef = useRef(null);
    const navigate = useNavigate();
    const [templateData, setTemplateData] = useState(null);
    const [iframeWidth, setIframeWidth] = useState('100%'); // default desktop
    const [isFullPreview, setIsFullPreview] = useState(false);
    const defaultColors = {
        mainBgColor: '#101418',  // main page background
        leftCardBgColor: '#101418',  // left card (form)
        rightCardBgColor: '#101418', // right card (preview)
        textColor: '#ccffff',
        subTextColor: '#8cd9d9',
    };
    const [formData, setFormData] = useState({
        title: templateData?.title || '',
        description: templateData?.description || '',
        type: templateData?.type || '',
        companyName: user?.companyName || '',
        companyLogo: null, // This will only hold a new file, not a URL
        aboutUsLogo: null,
        aboutUsDescription: '',
        htmlCode: '',
        ...defaultColors,
    });
     const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Navilead</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<style type="text/css">
*, ::after, ::before {
  box-sizing: border-box;
}
body {
    margin: 0px;
}
.container {
    max-width: 1140px;
    margin: 0px auto;
    background-color: #101418;
}
.sectiontop1 {
    padding: 0px !important;
}
@media all and (min-width:320px) and (max-width: 767px) {
.sectiontop {
  padding-top: 20px !important;
}
.coldiv {
    flex-wrap: wrap;
}
.coldivleft {
    max-width: 100% !important;
    flex: 0 0 100%!important;
}
.coldivright {
    max-width: 100% !important;
    flex: 0 0 100%!important;
}
.service-item {
    display: flex !important;
    flex-wrap: wrap !important;
}
.service-item div {
    font-size: 12px !important;
}
.coldivleft div {
    font-size: 12px !important;
}
.coldivleft div span{
    font-size: 12px !important;
}
.coldivleft div strong{
    font-size: 12px !important;
}
.coldivleft div label{
    font-size: 12px !important;
}
.sectiontop1 {
    padding: 0px !important;
}
.offer-title h1 {
    font-size: 15px !important;
}

}
@media all and (min-width:768px) and (max-width: 1024px) {
.sectiontop {
  padding-top: 20px !important;
}
.coldiv {
    flex-wrap: wrap;
} 
}
@media all and (min-width:768px) and (max-width: 991px) {
.container {
    max-width: 720px;
}
}
@media all and (min-width:992px) and (max-width: 1024px) {
.container {
    max-width: 960px;
}
}
@media all and (min-width:1025px) and (max-width: 1199px) {
.container {
    max-width: 960px;
}
}
</style>
<body style="font-family: 'Poppins', sans-serif; background-color: #101418; color: #cff; font-weight: 400; font-style: normal;">


<div class="container" style="background-color: #101418;">

<section class="sectiontop" style="padding: 50px 0px;">
  <div class="sectiontop1" style="width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto;">
    <div style="display: flex; flex-wrap: wrap;">
      <div style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px;">
        <div style="width: 220px; margin: 0px auto 30px;">
          <a href="#"><img src="/assets/images/logo.svg" style="max-width: 100%; height: auto; display: block;" alt=""></a>
        </div>
      </div>
    </div>
    <div class="coldiv" style="display: flex;">
      <div class="coldivleft" style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px; flex: 0 0 58.333333%; max-width: 58.333333%;">
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
              <div id="mulipleservercheckboxinnerdiv">
              <div style="color: #00d4f0; font-weight: 500; font-size: 15px;" class="service-price" id="mulipleserverdivPrice">{serviceprice}</div>
              <div class="service-discount" style="font-size: 12px; color: #ff6b6b; margin-top: 2px;display:none;" id="mulipleserverdivDiscount">Discount: {servicediscount}%</div>
                <div class="service-finalprice" style="color: #00d4f0; font-weight: 500; font-size: 15px; display:none;" id="mulipleserverdivFinalPrice">Final: {servicefinalprice}</div>
              </div>
            </div>
          </div>
          <div style="border-top: 1px dashed #202e3c; margin-top: 15px; padding: 15px 0px; display: grid; gap: 6px; margin-bottom: 15px; border-bottom: 1px dashed #202e3c;">
            <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-size: 14px; font-weight: 500;" id="Subtotaltext">{Subtotaltext}</span>
                <strong style="font-size: 14px; font-weight: 700; color: #00d4f0;" id="Subtotalprice">{Subtotalprice}</strong>
            </div>
             <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-size: 14px; font-weight: 500;" id="overalldiscounttext">{overalldiscounttext}</span>
                <strong style="font-size: 14px; font-weight: 700; color: #00d4f0;" id="Subtotalprice">{overalldiscountprice}</strong>
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
      <div class="coldivright" style="position: relative; width: 100%; padding-right: 15px; padding-left: 15px; flex: 0 0 41.666667%; max-width: 41.666667%;">
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
</div>

<script>

</script>
</body>
</html>`; // Example

    const [htmlCode, setHtmlCode] = useState(defaultHTML);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');


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
            { type: 'class', name: 'service-discount', variable: 'servicediscount' },
            { type: 'class', name: 'service-finalprice', variable: 'servicefinalprice' },
            { type: 'id', name: 'Subtotaltext', variable: 'Subtotaltext' },
            { type: 'id', name: 'Subtotalprice', variable: 'Subtotalprice' },
            { type: 'id', name: 'overalldiscountprice', variable: 'overalldiscountprice' },
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


    useEffect(() => {
        if (authToken && templateid) {
            fetchTemplate(templateid);
        }
    }, [authToken, templateid]);

    const fetchTemplate = async (templateid) => {
        try {
            const response = await api.get(`/offers-templates/${templateid}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setTemplateData(response.data); // <--- sets templateData once fetched
            setHtmlCode(response.data.htmlCode);
            setTitle(response.data.title);
            setDescription(response.data.description);
            setFormData({
                title: response.data.title || '',
                description: response.data.description || '',
                companyName: response.data.companyName || user?.companyName || '',
                aboutUsDescription: response.data.aboutUsDescription || '',
                companyLogo: response.data.companyLogo || null,
                aboutUsLogo: response.data.aboutUsLogo || null,
                mainBgColor: response.data.mainBgColor || '#101418',
                leftCardBgColor: response.data.leftCardBgColor || '#101418',
                rightCardBgColor: response.data.rightCardBgColor || '#101418',
                textColor: response.data.textColor || '#ccffff',
                subTextColor: response.data.subTextColor || '#8cd9d9',
            });
        } catch (error) {
            console.error("Error fetching template:", error);
            toast.error("Failed to fetch template");
        }
    };




    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title);
        formDataToSend.append("description", formData.description);
        formDataToSend.append("companyName", formData.companyName);
        formDataToSend.append("aboutUsDescription", formData.aboutUsDescription);
        formDataToSend.append("mainBgColor", formData.mainBgColor);
        formDataToSend.append("leftCardBgColor", formData.leftCardBgColor);
        formDataToSend.append("rightCardBgColor", formData.rightCardBgColor);
        formDataToSend.append("textColor", formData.textColor);
        formDataToSend.append("subTextColor", formData.subTextColor);
        formDataToSend.append("type", templateData.type);


        if (formData.companyLogo) {
            formDataToSend.append("companyLogo", formData.companyLogo);
        }
        if (formData.aboutUsLogo) {
            formDataToSend.append("aboutUsLogo", formData.aboutUsLogo);
        }

        try {
            let response;
            if (templateData) {
                response = await api.put(`/offers-templates/${templateData.id}`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                toast.success("Template updated successfully!");
                navigate('/templatesoffers');
            }
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error("Failed to save template");
        }
    };

    const handleFormChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files[0] : value,
        }));
    };

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/offerstyle.css'; // path relative to public/
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link); // cleanup when page unmounts
        };
    }, []);
    const previewCompanyLogo =
        formData.companyLogo instanceof File || formData.companyLogo instanceof Blob
            ? URL.createObjectURL(formData.companyLogo)
            : templateData?.companyLogo || user?.companyLogo || null;

    const previewAboutUsLogo =
        formData.aboutUsLogo instanceof File || formData.aboutUsLogo instanceof Blob
            ? URL.createObjectURL(formData.aboutUsLogo)
            : templateData?.aboutUsLogo || null;




    const handleApplyNow = async () => {
        if (!title.trim()) {
            toast.error('Template title is required!');
            return;
        }
        if (!description.trim()) {
            toast.error('Template description is required!');
            return;
        }
        if (!htmlCode || typeof htmlCode !== 'string') {
            toast.error('HTML Code is missing or invalid!');
            return;
        }

        const missingElements = checkMissingElements(htmlCode);
        if (missingElements.length > 0) {
            toast.error(`Missing required elements:\n${missingElements.join('\n')}`);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('htmlCode', htmlCode);
            formData.append('type', templateData.type);

            await api.put(`/offers-templates/${templateid}`, formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Template Updated successfully!');
            navigate('/templatesoffers');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create template.');
        }
    };

    const CopyCodeToClip = (html) => {
        if (!html) return;

        navigator.clipboard.writeText(html)
            .then(() => {
                toast.success('Template copied to clipboard!');
            })
            .catch((err) => {
                console.error('Failed to copy: ', err);
                toast.error('Failed to copy template.');
            });
    };

    const handlePreviewFull = () => {
        setIsFullPreview(true);       // full preview
        setIframeWidth('100%');       // iframe full width
    };

    const handlePreviewNormal = () => {
        setIsFullPreview(false);      // normal layout
        setIframeWidth('63%');        // iframe normal width
    };

    if (!templateData) {
        return (
            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div>Loading template...</div>
                </div>
            </div>
        );
    }


    if (templateData.type === 'Custom' && templatetype === 'Custom') {
        return (
            <>
                <div className="mainbody newoffertemplatespage">
                    <div className="container-fluid">
                        <MobileHeader />
                        <div className="newoffertop-bg">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="newoffertop-left">
                                        <button onClick={() => navigate('/templatesoffers')} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>{t('OffersTemplatesCreatePage.backToTemplatesBtn')}</button>
                                        <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageUpdateTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.customTag')}</div></h3>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="newoffertop-right">
                                        <ul className="newoffertop-system">
                                            <li className={iframeWidth === '100%' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('100%')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-monitor" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></Link></li>
                                            <li className={iframeWidth === '768px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('768px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tablet" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></Link></li>
                                            <li className={iframeWidth === '375px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('375px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-smartphone" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg></Link></li>
                                        </ul>
                                        <Link to="#" onClick={() => isFullPreview ? handlePreviewNormal() : handlePreviewFull()} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('OffersTemplatesCreatePage.previewBtn')}</Link>
                                        <Link to="#" onClick={handleApplyNow} className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> {t('OffersTemplatesCreatePage.saveBtn')}</Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="newoffertemplate-row">
                            <div className="newoffertemplate-col-left" style={{ display: isFullPreview ? 'none' : 'block' }}>
                                <div className="newoffertemplate-col-leftin">
                                    <div className="newoffertemplate-col-lefttop">
                                        <h4><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg> {t('OffersTemplatesCreatePage.htmlEditorTitle')}</h4>
                                        <div className="newoffertemplate-col-leftbtn">
                                            {/* <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-eye-off" aria-hidden="true"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path></svg></Link> */}
                                            <Link to="#" onClick={() => CopyCodeToClip(defaultHTML)} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-copy" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></Link>
                                            <Link to="#" onClick={() => { setHtmlCode(defaultHTML); toast.success('Default template loaded!'); }} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-rotate-ccw" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></Link>
                                        </div>
                                    </div>
                                    {/* <div className="emailmodaltab">
                                    <ul className="nav nav-tabs" role="tablist">
                                        <li className="nav-item" role="presentation">
                                            <Link className="nav-link active" data-bs-toggle="tab" href="#home" aria-selected="true" role="tab">Code Editor</Link>
                                        </li>
                                        <li className="nav-item" role="presentation">
                                            <Link className="nav-link" data-bs-toggle="tab" href="#menu1" aria-selected="false" tabindex="-1" role="tab">Code Snippets</Link>
                                        </li>
                                    </ul>
                                </div> */}
                                </div>
                                <div className="tab-content">
                                    <div id="home" className="tab-pane active">
                                        <div className="formdesign">
                                            <div className='p-3'>
                                                <div className="form-group mb-3">
                                                    <label htmlFor="templateTitle" className="form-label">{t('OffersTemplatesCreatePage.templateTitleLabel')}</label>
                                                    <input
                                                        type="text"
                                                        id="templateTitle"
                                                        className="form-control"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        placeholder={t('OffersTemplatesCreatePage.templateTitlePlaceholder')}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group mb-3">
                                                    <label htmlFor="templateDescription" className="form-label">{t('OffersTemplatesCreatePage.templateDescriptionLabel')}</label>
                                                    <input
                                                        id="templateDescription"
                                                        className="form-control"
                                                        rows={3}
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        placeholder={t('OffersTemplatesCreatePage.templateDescriptionPlaceholder')}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="newoffertemplate-tabtop">{t('OffersTemplatesCreatePage.codeEditorNote')}</div>
                                            <div className="newoffertemplate-tabcode-editer">
                                                <div className="form-group">
                                                    <textarea
                                                        ref={textareaRef}
                                                        className="form-control"
                                                        rows="47"
                                                        name="htmlCode"
                                                        value={htmlCode}
                                                        placeholder={t('OffersTemplatesCreatePage.codePlaceholder')}
                                                        onChange={e => setHtmlCode(e.target.value)}
                                                        required
                                                        onKeyUp={e => {
                                                            const updatedHtml = e.target.value;
                                                            setHtmlCode(updatedHtml);
                                                            const missing = checkMissingElements(updatedHtml);
                                                            if (missing.length > 0) {
                                                                toast.error(`${t('OffersTemplatesCreatePage.missingElementsToast')}\n${missing.join('\n')}`);
                                                            }
                                                        }}
                                                    />

                                                </div>
                                            </div>
                                            <div className="newoffertemplate-tab-footer">
                                                <span>{t('OffersTemplatesCreatePage.linesCount')}: {htmlCode.split('\n').length} | {t('OffersTemplatesCreatePage.charsCount')}: {htmlCode.length}</span>
                                                {/* <div>
                                                <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>Import</Link>
                                                <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-download" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>Export</Link>
                                                </div> */}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div id="menu1" className="tab-pane fade">
                                    <div className="formdesign">
                                        <div className="newoffertemplate-tabtop">Klik på et snippet for at indsætte det i din kode.
                                            <button className="codesnippetsbox">
                                                <h5>Success Header</h5>
                                                <h6>&lt;div className="success-header"&gt; &lt;div cl...</h6>
                                            </button>
                                            <button className="codesnippetsbox">
                                                <h5>Progress Step</h5>
                                                <h6>&lt;div className="step"&gt; &lt;div className="step-..</h6>
                                            </button>
                                            <button className="codesnippetsbox">
                                                <h5>Contact Section</h5>
                                                <h6>&lt;div className="contact"&gt; &lt;h3&gt;Kontakt os...</h6>
                                            </button>
                                        </div>
                                        <div className="newoffertemplate-tabcode-editer">
                                            <div className="form-group">
                                                <textarea className="form-control" rows="47" name="htmlCode" placeholder="Write full HTML code here" required=""></textarea>
                                            </div>
                                        </div>
                                        <div className="newoffertemplate-tab-footer">
                                            <span>Linjer: 127 | Tegn: 4021</span>
                                            <div><Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-upload" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>Import</Link>
                                                <Link to="#" className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-download" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>Export</Link></div>
                                        </div>
                                    </div>
                                </div> */}
                                </div>
                            </div>
                            <div className="newoffertemplate-col-right" style={{ width: isFullPreview ? '100%' : '63%' }}>
                                <div className="newoffertemplate-righttop">
                                    <h4>{t('OffersTemplatesCreatePage.livePreviewTitle')}</h4><span>{iframeWidth}</span>
                                </div>
                                <div className="newoffertemplate-previewmain">
                                    <div className="newoffertemplate-preview" style={{ display: 'flex', justifyContent: 'center', overflow: 'scroll' }}>
                                        <iframe
                                            ref={iframeRef}
                                            title="live-preview"
                                            style={{ width: iframeWidth, height: '76vh', border: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }


    if (templateData.type === 'Default' && templatetype === 'Default') {
        return (
            <>
                <style>
                    {`
        .code-snippet {
            padding: 5px;
            border-left: 3px solid #007bff;
            user-select: none; /* prevents selecting text in snippet */
        }
        `}
                </style>

                <div className="mainbody newoffertemplatespage">
                    <div className="container-fluid">
                        <MobileHeader />
                        <form onSubmit={handleSaveTemplate}>
                            <div className="newoffertop-bg">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="newoffertop-left">
                                            <button type='button' onClick={() => navigate('/templatesoffers')} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>{t('OffersTemplatesCreatePage.backToTemplatesBtn')}</button>
                                            <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageStanderdUpdateTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.standardTag')}</div></h3>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="newoffertop-right">
                                            <ul className="newoffertop-system">
                                                <li className={iframeWidth === '100%' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('100%')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-monitor" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></Link></li>
                                                <li className={iframeWidth === '768px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('768px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tablet" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></Link></li>
                                                <li className={iframeWidth === '375px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('375px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-smartphone" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg></Link></li>
                                            </ul>
                                            <Link to="#" type='button' onClick={() => isFullPreview ? handlePreviewNormal() : handlePreviewFull()} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-eye" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>{t('OffersTemplatesCreatePage.previewBtn')}</Link>
                                            <button type='submit' disabled={!formData.title || !formData.companyName} className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> {t('OffersTemplatesCreatePage.saveBtn')}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="newoffertemplate-row">
                                <div className="newoffertemplate-col-left" style={{ display: isFullPreview ? 'none' : 'block' }}>
                                    <div className="tab-content mt-4">
                                        <div id="home" className="tab-pane active">
                                            <div className="formdesign">
                                                <div className="newoffertemplate-tabtop">

                                                    <div className="form-group">
                                                        <label>Template Title *</label>
                                                        <input type="text" className="form-control" name="title" value={formData.title} onChange={handleFormChange} placeholder="e.g., Complete Website Solution" required />
                                                        <span className="inputnote">This title will be shown to clients</span>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Template Description *</label>
                                                        <input type="text" className="form-control" name="description" value={formData.description} onChange={handleFormChange} placeholder="e.g., Complete Website Solution" required />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Company Name *</label>
                                                        <input type="text" className="form-control" name="companyName" value={formData.companyName} onChange={handleFormChange} placeholder="e.g., Your Company Inc." required />
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="form-label">Company Logo</label>
                                                        {(templateData?.companyLogo || user?.companyLogo) && !formData.companyLogo && (
                                                            <p className="mt-2">Current Logo: <img src={templateData?.companyLogo || user?.companyLogo} alt="Current company logo" style={{ maxWidth: '100px', display: 'block' }} /></p>
                                                        )}
                                                        <div class="upload-files-container">
                                                            <div class="drag-file-area">
                                                            <span class="material-icons-outlined upload-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload w-8 h-8 text-muted-foreground" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg></span>
                                                            
                                                            <label class="label"><span class="browse-files"> <input type="file" name="companyLogo" onChange={handleFormChange} class="default-file-input"/> <span class="browse-files-text">Upload File Here</span></span> </label>
                                                            <h3 class="dynamic-message">JPG, PNG IMG ONLY 5MB</h3>
                                                            <span class="cannot-upload-message"> <span class="material-icons-outlined">error</span> Please select a file first <span class="material-icons-outlined cancel-alert-button">cancel</span> </span>
                                                            <div class="file-block">
                                                            <div class="file-info"> <span class="material-icons-outlined file-icon"><i class="la la-file-import"></i></span> <span class="file-name"> </span> | <span class="file-size">  </span> </div>
                                                            <span class="material-icons remove-file-icon"><i class="la la-trash"></i></span>
                                                            <div class="progress-bar"> </div>
                                                            </div>
                                                            <button type="button" class="upload-button" style={{ width: 0, opacity: 0, height: 0, padding: 0, margin: 0 }}> Upload </button>
                                                            </div>                        
                                                        </div>
                                                    </div>
                                                    <div class="form-group">
                                                        <label class="form-label">About Us Logo</label>
                                                        {(templateData?.aboutUsLogo) && !formData.aboutUsLogo && (
                                                            <p className="mt-2">Current Logo: <img src={templateData?.aboutUsLogo} alt="Current about us logo" style={{ maxWidth: '100px', display: 'block' }} /></p>
                                                        )}
                                                        <div class="upload-files-container">
                                                            <div class="drag-file-area">
                                                            <span class="material-icons-outlined upload-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload w-8 h-8 text-muted-foreground" aria-hidden="true"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg></span>
                                                            
                                                            <label class="label"><span class="browse-files"> <input type="file" name="aboutUsLogo" onChange={handleFormChange} class="default-file-input"/> <span class="browse-files-text">Upload File Here</span></span> </label>
                                                            <h3 class="dynamic-message">JPG, PNG IMG ONLY 5MB</h3>
                                                            <span class="cannot-upload-message"> <span class="material-icons-outlined">error</span> Please select a file first <span class="material-icons-outlined cancel-alert-button">cancel</span> </span>
                                                            <div class="file-block">
                                                            <div class="file-info"> <span class="material-icons-outlined file-icon"><i class="la la-file-import"></i></span> <span class="file-name"> </span> | <span class="file-size">  </span> </div>
                                                            <span class="material-icons remove-file-icon"><i class="la la-trash"></i></span>
                                                            <div class="progress-bar"> </div>
                                                            </div>
                                                            <button type="button" class="upload-button" style={{ width: 0, opacity: 0, height: 0, padding: 0, margin: 0 }}> Upload </button>
                                                            </div>                        
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>About Us Description</label>
                                                        <CKEditor
                                                            editor={ClassicEditor}
                                                            data={formData.aboutUsDescription}
                                                            onChange={(event, editor) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    aboutUsDescription: editor.getData()
                                                                }));
                                                            }}
                                                            config={{
                                                                toolbar: [
                                                                    'bold',
                                                                    'italic',
                                                                    'underline',
                                                                    'link',
                                                                    'bulletedList',
                                                                    'numberedList',
                                                                    'undo',
                                                                    'redo',
                                                                    'fontColor',           // Add text color
                                                                    'fontBackgroundColor'  // Add background color
                                                                ],
                                                                removePlugins: [
                                                                    'EasyImage',
                                                                    'ImageUpload',
                                                                    'ImageToolbar',
                                                                    'ImageCaption',
                                                                    'MediaEmbed',
                                                                    'CKFinder'
                                                                ]
                                                            }}
                                                        />


                                                    </div>

                                                    <div className="d-flex justify-content-between">
                                                        <div className="form-group">
                                                            <label>Main Background Color</label>
                                                            <input type="color" className="form-control" name="mainBgColor" value={formData.mainBgColor} onChange={handleFormChange} />
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Left Card Background</label>
                                                            <input type="color" className="form-control" name="leftCardBgColor" value={formData.leftCardBgColor} onChange={handleFormChange} />
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Right Card Background</label>
                                                            <input type="color" className="form-control" name="rightCardBgColor" value={formData.rightCardBgColor} onChange={handleFormChange} />
                                                        </div>

                                                    </div>
                                                    <div className="d-flex justify-content-between">


                                                        <div className="form-group">
                                                            <label>Text Color</label>
                                                            <input
                                                                type="color"
                                                                className="form-control"
                                                                name="textColor"
                                                                value={formData.textColor}
                                                                onChange={handleFormChange}
                                                            />
                                                        </div>

                                                        <div className="form-group">
                                                            <label>Subtext Color</label>
                                                            <input
                                                                type="color"
                                                                className="form-control"
                                                                name="subTextColor"
                                                                value={formData.subTextColor}
                                                                onChange={handleFormChange}
                                                            />
                                                        </div>

                                                    </div>
                                                </div>
                                                <div className="newoffertemplate-tab-footer btn-right">
                                                    <button type="button" className="btn btn-send" onClick={() => setFormData(prev => ({ ...prev, ...defaultColors }))}>
                                                        Reset Colors
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="newoffertemplate-col-right" style={{ width: isFullPreview ? '100%' : '63%' }}>
                                    <div className="newoffertemplate-righttop">
                                        <h4>{t('OffersTemplatesCreatePage.livePreviewTitle')}</h4><span>{iframeWidth}</span>
                                    </div>
                                    <div className="newoffertemplate-previewmain">
                                        <div className="newoffertemplate-preview" style={{ display: 'flex', justifyContent: 'center', overflow: 'scroll' }}>
                                            <div className="carddesign emailcard p-4" style={{ backgroundColor: formData.mainBgColor }}>
                                                <section className="navpublic" style={{ width: iframeWidth }}>

                                                    <div className="container">
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="logo">
                                                                    <a href="#">
                                                                        {previewCompanyLogo && (
                                                                            <img
                                                                                src={previewCompanyLogo}
                                                                                className="img-fluid"
                                                                                alt={`${formData.companyName || 'Company'} logo`}
                                                                            />
                                                                        )}
                                                                    </a>
                                                                </div>
                                                                <div className="companyname text-center">
                                                                    <h6 style={{ color: formData.textColor }} >{formData.companyName || 'Your Company Name'}</h6>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-7">
                                                                <div className="carddesign" style={{ backgroundColor: formData.leftCardBgColor }}>
                                                                    <div className="offer-title">
                                                                        <h1 className="tilbud-title" style={{ color: formData.textColor }}>Your Quote</h1>
                                                                    </div>
                                                                    <div className="intro">
                                                                        <p style={{ color: formData.subTextColor }}>Thank you for your interest in our services. Below is a tailored quote for you.</p>
                                                                        <p className="muted" style={{ color: formData.subTextColor }}>Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
                                                                    </div>
                                                                    <div className="items">
                                                                        <div className="item">
                                                                            <input type="checkbox" className="form-check-input" checked="" />
                                                                            <div>
                                                                                <div className="title" style={{ color: formData.textColor }}>Vinduespudsning – Standard</div>
                                                                                <div className="desc" style={{ color: formData.subTextColor }}>Interior &amp; exterior every 8 weeks.</div>
                                                                            </div>
                                                                            <div className="price" style={{ color: formData.textColor }}>225,00 kr</div>
                                                                        </div>

                                                                        <div className="item">
                                                                            <input type="checkbox" className="form-check-input" />
                                                                            <div>
                                                                                <div className="title" style={{ color: formData.textColor }}>Solcelle-rens (tilvalg)</div>
                                                                                <div className="desc" style={{ color: formData.subTextColor }}>Gentle cleaning including after-wipe.</div>
                                                                            </div>
                                                                            <div className="price" style={{ color: formData.textColor }}>349,00 kr</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="totals">
                                                                        <div className="totalsrow" style={{ color: formData.textColor }}><span>Subtotal</span><strong style={{ color: formData.textColor }}>723,00 kr</strong></div>
                                                                        <div className="totalsrow" style={{ color: formData.textColor }}><span>VAT (25%)</span><strong style={{ color: formData.textColor }}>180,75 kr</strong></div>
                                                                        <div className="totalsrow" style={{ color: formData.textColor }}><span style={{ fontWeight: 700 }}>Total</span><strong style={{ fontSize: '16px', color: formData.textColor }}>903,75 kr</strong></div>
                                                                    </div>
                                                                    <div className="publicbottom">
                                                                        <div className="publicbottom-heading">
                                                                            <h2 className="card-title" style={{ color: formData.textColor }}>Terms</h2>
                                                                            <p style={{ color: formData.subTextColor }}>This quote is valid for 30 days. Payment terms: net 8 days unless otherwise agreed.</p>
                                                                        </div>
                                                                        <div className="terms-row">
                                                                            <input id="acceptTerms" type="checkbox" className="form-check-input" />
                                                                            <label for="acceptTerms" style={{ color: formData.textColor }}>I accept the <a href="#" target="_blank" rel="noopener" style={{ color: formData.subTextColor }}>Terms &amp; Conditions</a>.</label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mb-4 form-group">
                                                                        <label htmlFor="customerNotes" className="form-label">Notes for us (optional):</label>
                                                                        <textarea
                                                                            id="customerNotes"
                                                                            className="form-control customerNotes text-white"
                                                                            rows="3"
                                                                        ></textarea>
                                                                    </div>
                                                                    <div className="modalfooter">
                                                                        <button className="btn btn-add">Accept Quote</button>
                                                                        <button className="btn btn-send">Ask a Question</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-5">
                                                                <div className="carddesign" style={{ backgroundColor: formData.rightCardBgColor }}>
                                                                    <div className="about-media">
                                                                        <a href="#">
                                                                            <img
                                                                                src={previewAboutUsLogo || "assets/images/blog3.jpg"}
                                                                                className="img-fluid"
                                                                                alt="About us logo"
                                                                            />
                                                                        </a>

                                                                    </div>
                                                                    <div className="publicbottom-heading">
                                                                        <h2 className="card-title" style={{ color: formData.textColor }}>About Us</h2>
                                                                        <div
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: formData.aboutUsDescription || "About Us Description will appear here..."
                                                                            }}
                                                                        />
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </>
        );
    }




};

export default OffersTemplatesEditPage;
