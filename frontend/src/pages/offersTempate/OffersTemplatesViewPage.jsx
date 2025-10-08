import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";


const OffersTemplatesViewPage = () => {
    const { t } = useTranslation();
    const { authToken, user } = useContext(AuthContext);
    const { templatetype, templateid } = useParams();
    const [template, setTemplate] = useState([]);
    const [htmlCode, setHtmlCode] = useState('');
    const navigate = useNavigate();
    const iframeRef = useRef(null);
    const [iframeWidth, setIframeWidth] = useState('100%'); // default desktop
    const [isFullPreview, setIsFullPreview] = useState(false);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(htmlCode);
            doc.close();
        }
    }, [htmlCode]);

    const fetchTemplate = async (templateid) => {
        try {
            const response = await api.get(`/offers-templates/${templateid}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setTemplate(response.data); // <--- sets templateData once fetched
            setHtmlCode(response.data.htmlCode);
        } catch (error) {
            console.error("Error fetching template:", error);
            toast.error("Failed to fetch template");
        }
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

    useEffect(() => {
        if (authToken && templateid) {
            fetchTemplate(templateid);
        }
    }, [authToken, templateid]);


    if (template.type === 'Custom' && templatetype === 'Custom') {
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
                                        <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageViewCTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.customTag')}</div></h3>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="newoffertop-right">
                                        <ul className="newoffertop-system">
                                            <li className={iframeWidth === '100%' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('100%')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-monitor" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></Link></li>
                                            <li className={iframeWidth === '768px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('768px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tablet" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></Link></li>
                                            <li className={iframeWidth === '375px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('375px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-smartphone" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg></Link></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="newoffertemplate-row">
                            <div className="newoffertemplate-col-right" style={{ width:'100%'}}>
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
    if (template.type === 'Default' && templatetype === 'Default') {
        
        return (
            <>
              <div className="mainbody newoffertemplatespage">
                    <div className="container-fluid">
                        <MobileHeader />
                            <div className="newoffertop-bg">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="newoffertop-left">
                                            <button type='button' onClick={() => navigate('/templatesoffers')} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>{t('OffersTemplatesCreatePage.backToTemplatesBtn')}</button>
                                            <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageViewSTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.standardTag')}</div></h3>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="newoffertop-right">
                                            <ul className="newoffertop-system">
                                                <li className={iframeWidth === '100%' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('100%')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-monitor" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></Link></li>
                                                <li className={iframeWidth === '768px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('768px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tablet" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></Link></li>
                                                <li className={iframeWidth === '375px' ? 'active' : ''}><Link to="#" onClick={() => setIframeWidth('375px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-smartphone" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg></Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="newoffertemplate-row">
                                <div className="newoffertemplate-col-right" style={{ width:'100%' }}>
                                    <div className="newoffertemplate-righttop">
                                        <h4>{t('OffersTemplatesCreatePage.livePreviewTitle')}</h4><span>{iframeWidth}</span>
                                    </div>
                                    <div className="newoffertemplate-previewmain">
                                        <div className="newoffertemplate-preview" style={{ display: 'flex', justifyContent: 'center', overflow: 'scroll' }}>
                                            <div className="carddesign emailcard p-4" style={{ backgroundColor: template.mainBgColor }}>
                                                <section className="navpublic" style={{ width: iframeWidth }}>

                                                    <div className="container">
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="logo">
                                                                    <a href="#">
                                                                        {template.companyLogo && (
                                                                            <img
                                                                                src={template.companyLogo}
                                                                                className="img-fluid"
                                                                                alt={`${template.companyName || 'Company'} logo`}
                                                                            />
                                                                        )}
                                                                    </a>
                                                                </div>
                                                                <div className="companyname text-center">
                                                                    <h6 style={{ color: template.textColor }} >{template.companyName || 'Your Company Name'}</h6>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-7">
                                                                <div className="carddesign" style={{ backgroundColor: template.leftCardBgColor }}>
                                                                    <div className="offer-title">
                                                                        <h1 className="tilbud-title" style={{ color: template.textColor }}>Your Quote</h1>
                                                                    </div>
                                                                    <div className="intro">
                                                                        <p style={{ color: template.subTextColor }}>Thank you for your interest in our services. Below is a tailored quote for you.</p>
                                                                        <p className="muted" style={{ color: template.subTextColor }}>Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
                                                                    </div>
                                                                    <div className="items">
                                                                        <div className="item">
                                                                            <input type="checkbox" className="form-check-input" checked="" />
                                                                            <div>
                                                                                <div className="title" style={{ color: template.textColor }}>Vinduespudsning – Standard</div>
                                                                                <div className="desc" style={{ color: template.subTextColor }}>Interior &amp; exterior every 8 weeks.</div>
                                                                            </div>
                                                                            <div className="price" style={{ color: template.textColor }}>225,00 kr</div>
                                                                        </div>

                                                                        <div className="item">
                                                                            <input type="checkbox" className="form-check-input" />
                                                                            <div>
                                                                                <div className="title" style={{ color: template.textColor }}>Solcelle-rens (tilvalg)</div>
                                                                                <div className="desc" style={{ color: template.subTextColor }}>Gentle cleaning including after-wipe.</div>
                                                                            </div>
                                                                            <div className="price" style={{ color: template.textColor }}>349,00 kr</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="totals">
                                                                        <div className="totalsrow" style={{ color: template.textColor }}><span>Subtotal</span><strong style={{ color: template.textColor }}>723,00 kr</strong></div>
                                                                        <div className="totalsrow" style={{ color: template.textColor }}><span>VAT (25%)</span><strong style={{ color: template.textColor }}>180,75 kr</strong></div>
                                                                        <div className="totalsrow" style={{ color: template.textColor }}><span style={{ fontWeight: 700 }}>Total</span><strong style={{ fontSize: '16px', color: template.textColor }}>903,75 kr</strong></div>
                                                                    </div>
                                                                    <div className="publicbottom">
                                                                        <div className="publicbottom-heading">
                                                                            <h2 className="card-title" style={{ color: template.textColor }}>Terms</h2>
                                                                            <p style={{ color: template.subTextColor }}>This quote is valid for 30 days. Payment terms: net 8 days unless otherwise agreed.</p>
                                                                        </div>
                                                                        <div className="terms-row">
                                                                            <input id="acceptTerms" type="checkbox" className="form-check-input" />
                                                                            <label for="acceptTerms" style={{ color: template.textColor }}>I accept the <a href="#" target="_blank" rel="noopener" style={{ color: template.subTextColor }}>Terms &amp; Conditions</a>.</label>
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
                                                                <div className="carddesign" style={{ backgroundColor: template.rightCardBgColor }}>
                                                                    <div className="about-media">
                                                                        <a href="#">
                                                                            <img
                                                                                src={template.aboutUsLogo || "assets/images/blog3.jpg"}
                                                                                className="img-fluid"
                                                                                alt="About us logo"
                                                                            />
                                                                        </a>

                                                                    </div>
                                                                    <div className="publicbottom-heading">
                                                                        <h2 className="card-title" style={{ color: template.textColor }}>About Us</h2>
                                                                        <div
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: template.aboutUsDescription || "About Us Description will appear here..."
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
                    </div>
                </div>
            </>
        );
    }


};

export default OffersTemplatesViewPage;