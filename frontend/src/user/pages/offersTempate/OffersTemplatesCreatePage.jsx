import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const OffersTemplatesCreatePage = () => {
    const { t } = useTranslation();
    const { authToken } = useContext(AuthContext);
    const iframeRef = useRef(null);
    const textareaRef = useRef(null);
    const navigate = useNavigate();
    const [iframeWidth, setIframeWidth] = useState('100%'); // default desktop
    const [isFullPreview, setIsFullPreview] = useState(false);
        const defaultHTML = `<!DOCTYPE html>
<html lang="en">

<head>
    <title>Navilead - Quote</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <style type="text/css">

        #offer-html-renderer-root {
            background-color: #101418;
            color: #8cd9d9;
            font-weight: 400;
        }


        .templatebody {
            font-family: 'Poppins', sans-serif;
            font-style: normal;
        }


        .templatebody {
            font-family: 'Poppins', sans-serif;
            background-color: #101418;
            color: #8cd9d9;
            font-weight: 400;
            font-style: normal;
        }

        .templatelogo {
            padding: 20px 0px;
        }

        .templatelogo a {
            width: 200px;
            display: inline-block;
        }

        .template-leftcol {
            background-color: #171f26;
            border: 1px solid #202e3c;
            border-radius: 8.7px;
            padding: 20px;
            margin-bottom: 23px;
        }

        .template-title h1 {
            font-size: 21px;
            margin-bottom: 13px;
            color: #cff;
        }

        .template-title p {
            font-size: 12px;
            margin-bottom: 13px;
            font-weight: 400;
        }

        .service-item {
            gap: 12px;
            align-items: start;
            display: grid;
            grid-template-columns: auto 1fr auto;
            padding: 12px 10px;
            border-radius: 10px;
            border: 1px solid #202e3c;
            margin-bottom: 15px;
        }

        .service-title h3 {
            font-size: 14px;
            font-weight: 400;
            margin-bottom: 3px;
            color: #cff;
        }

        .service-title p {
            font-size: 12px;
            margin-bottom: 0px;
            font-weight: 400;
        }

        .service-price {
            color: #00d4f0;
            font-weight: 500;
            font-size: 15px;
        }

        .servicelist {
            border-top: 1px dashed #202e3c;
            padding: 15px 0px;
            margin-bottom: 15px;
            border-bottom: 1px dashed #202e3c;
        }

        .servicelist ul {
            margin: 0px;
            padding: 0px;
            list-style: none;
        }

        .servicelist ul li {
            font-size: 13px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 7px;
        }

        .servicelist ul li:last-child {
            margin: 0px;
        }

        .servicelist ul li span {
            color: #cff;
        }

        .servicelist ul li strong {
            color: #00d4f0;
            font-weight: 700;
        }

        .servicelist ul li span.totaltext {
            font-size: 16px;
            font-weight: 700;
        }

        .servicelist ul li strong.totalprice {
            font-size: 16px;
            font-weight: 700;
        }

        .publicbottom {
            margin-bottom: 15px;
        }

        .publicbottom h2 {
            color: #cff;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 5px;
        }

        .publicbottom p {
            font-size: 12px;
            margin-bottom: 0px;
            font-weight: 400;
            margin-bottom: 10px;
        }

        .publicbottom .form-check-label {
            font-size: 14px;
            margin-bottom: 0px;
            color: #cff;
        }

        .publicbottom .form-check-label a {
            color: #00d4f0;
        }
        .template-comment {
          display: grid;
        }
        .template-comment label.form-label {
            color: #cff;
            font-size: 14px;
        }

        .template-comment textarea#customerNotestextarea {
            padding: 8px 5px;
            font-size: 12px;
            font-weight: 400;
            line-height: 1.5;
            color: #cff;
            background-color: #1b2632;
            border: 1px solid #171f26;
            border-radius: 8.7px;
            outline: none;
            box-shadow: none;
        }

        .template-btn {
            display: flex;
            gap: 0px 9px;
            justify-content: space-between;
            border-top: 1px solid #202e3c;
            padding-top: 20px;
            margin-top: 20px;
        }

        .template-btn .btn.acceptquote {
            background-color: #00d4f0;
            color: #101418 !important;
        }

        .template-btn .btn {
            padding: 7px 14px;
            color: #cff !important;
            background-color: #101418;
            font-size: 12.25px;
            border: 1px solid #202e3c !important;
            border-radius: 8.7px;
            outline: none !important;
            box-shadow: none !important;
        }

        .template-rightcol {
            background-color: #171f26;
            border: 1px solid #202e3c;
            border-radius: 8.7px;
            padding: 20px;
            margin-bottom: 23px;
        }

        .template-rightcol-img img {
            width: 100%;
            height: auto;
            border-radius: 12px;
            display: block;
            margin-bottom: 20px;
        }

        .template-rightcol-desc h4 {
            color: #cff;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 10px;
        }

        .template-rightcol-desc p {
            font-size: 13px;
            font-weight: 400;
            margin-bottom: 10px;
        }

        .template-rightcol-desc p strong {
            font-weight: 500;
            color: #cff;
        }
    </style>
</head>

<body class="templatebody" id="offer-html-renderer-root">

    <div class="templatelogo text-center">
        <a href="#"><img src="/assets/images/logo.svg" class="img-fluid" alt="Navilead"></a>
    </div>

    <div class="container">
        <div class="row">
            <div class="col-md-7">
                <div class="template-leftcol">
                    <div class="template-title">
                        <h1 id="QuotesTitle">{quotestitle}</h1>
                        <p id="QuotesDescription">{quotesdescription}</p>
                        <p>Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
                    </div>

                    <div class="service-container" id="mulipleserverdivmain">
                        <div class="service-item" id="mulipleserverdivrepated">
                            <input type="checkbox" class="service-checkbox" id="mulipleservercheckbox">
                            <div class="service-title" id="mulipleservercheckboxinnerdiv">
                                <h3 id="mulipleserverdivtitle">{servicetitle}</h3>
                                <p class="service-description" id="mulipleserverdivdiscription">{servicedescription}</p>
                            </div>
                            <div class="text-end">
                                <div class="service-price" id="mulipleserverdivPrice">{serviceprice}</div>
                                <div class="service-discount" id="mulipleserverdivDiscount" style="font-size: 12px; color: #ff6b6b; display:none;">Discount: {servicediscount}%</div>
                                <div class="service-finalprice" id="mulipleserverdivFinalPrice" style="color: #00d4f0; font-weight: 500; font-size: 15px; display:none;">Final: {servicefinalprice}</div>
                            </div>
                        </div>
                    </div>

                    <div class="servicelist">
                        <ul>
                            <li><span id="Subtotaltext">{Subtotaltext}</span><strong id="Subtotalprice">{Subtotalprice}</strong></li>
                            <li><span id="overalldiscounttext">{overalldiscounttext}</span><strong id="overalldiscountprice">{overalldiscountprice}</strong></li>
                            <li><span id="vattext">{vattext}</span><strong id="vatprice">{vatprice}</strong></li>
                            <li><span class="totaltext" id="totaltext">{totaltext}</span><strong class="totalprice" id="totalprice">{totalprice}</strong></li>
                        </ul>
                    </div>

                    <div class="publicbottom">
                        <h2 id="termstext">{termstext}</h2>
                        <p id="termsDescription">{termsDescription}</p>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="acceptTermsCheckbox">
                            <label class="form-check-label" for="acceptTermsCheckbox" id="acceptTermsLabel">
                                I accept the <a href="#" target="_blank" rel="noopener" id="acceptTermsText">Terms & Conditions</a>.
                            </label>
                        </div>
                    </div>

                    <div class="template-comment" id="customerNotesContainer">
                        <label for="customerNotestextarea" class="form-label" id="customerNoteslabel">Notes for us (optional):</label>
                        <textarea class="form-control" rows="3" id="customerNotestextarea" name="text"></textarea>
                    </div>

                    <div class="template-btn">
                        <button class="btn" id="askQuestionBtn">Ask a Question</button>
                        <button class="btn acceptquote" id="acceptQuoteBtn">Accept Quote</button>
                    </div>

                </div>
            </div>

            <div class="col-md-5">
                <div class="template-rightcol">
                    <div class="template-rightcol-img">
                        <img src="/assets/images/blog3.jpg" class="img-fluid" alt="About Us">
                    </div>
                    <div class="template-rightcol-desc">
                        <h4>About Us</h4>
                        <p><strong>About Our Company:</strong> We are a dedicated service provider focused on delivering top-quality results and exceptional customer experiences.</p>
                        <p><strong>Our Commitment:</strong> We take pride in our attention to detail and reliability. Whether we are working at your home or business, we treat every project with care.</p>
                        <p><strong>Experienced Team:</strong> Our skilled team members are carefully selected and trained to uphold our high standards.</p>
                        <p><strong>Value You Can Trust:</strong> We offer competitive rates without compromising on quality.</p>
                        <p><strong>Clear Communication:</strong> We believe in open and honest communication, so you always know what to expect.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

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
            formData.append('type', 'Custom');
            formData.append('status', 'inactive');

            await api.post(`/offers-templates/create`, formData, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Template Created successfully!');
            // navigate('/templatesoffers');
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
                                    <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.customTag')}</div></h3>
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
                                <div className='formdesign'>
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
                            </div>
                            <div className="tab-content">
                                <div id="home" className="tab-pane active">
                                    <div className="formdesign">
                                        <div className="newoffertemplate-tabtop">{t('OffersTemplatesCreatePage.codeEditorNote')}</div>
                                        <div className="newoffertemplate-tabcode-editer">
                                            <div className="form-group">
                                                <textarea
                                                    ref={textareaRef}
                                                    className="form-control textareanew"
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
                                <div className="newoffertemplate-preview" style={{ overflow: 'scroll' }}>
                                    <div className={iframeWidth === '100%' ? 'iframe-desktop' : 'iframe-normalwidth'}>
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
            </div>
        </>
    );
};

export default OffersTemplatesCreatePage;
