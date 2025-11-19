import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const QuotePreviewPage = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const leadId = query.get('leadId');
    const { authToken } = useContext(AuthContext);
    const [template, setTemplate] = useState([]);
    const [htmlCode, setHtmlCode] = useState('');
    const navigate = useNavigate();
    const iframeRef = useRef(null);
    const [iframeWidth, setIframeWidth] = useState('100%'); // default desktop
    const [loading, setLoading] = useState(true);

    const quoteData = location.state?.quoteData;

    // Initial logging
    useEffect(() => {
        console.log('Quote Data from state:', quoteData);
    }, [quoteData]);

    // Fetch user template
    const fetchUserTemplate = async () => {
        try {
            const response = await api.get('/offers-templates', {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.data && response.data.length > 0) {
                const activeTemplate = response.data.find(tmpl => tmpl.status === 'active');
                setTemplate(activeTemplate);
                setHtmlCode(activeTemplate.htmlCode);
            } else {
                setTemplate([]);
            }
        } catch (error) {
            console.error("Error fetching user template:", error);
            if (error.response && error.response.status === 404) {
                toast.info("No template found. Please create one.");
            } else {
                toast.error("Failed to load template");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authToken) {
            fetchUserTemplate();
        }
    }, [authToken]);

    // Apply CSS for iframe
    useEffect(() => {
        const mainStyle = document.createElement('link');
        mainStyle.rel = 'stylesheet';
        mainStyle.href = '/assets/css/offerstyle.css';
        document.head.appendChild(mainStyle);
        return () => document.head.removeChild(mainStyle);
    }, []);

    // State for selected services (required always selected)
    const [selectedServices, setSelectedServices] = useState(
        quoteData?.services
            ?.filter(s => s.name && s.description && s.pricePerUnit > 0)
            .map(s => ({
                ...s,
                selected: s.isRequired ? true : false
            }))
    );

    const toggleService = (id) => {
        setSelectedServices(prev =>
            prev.map(s =>
                s.id === id
                    ? { ...s, selected: s.isRequired ? true : !s.selected }
                    : s
            )
        );
    };

    const calculateTotals = (services) => {
        const subtotal = services.filter(s => s.selected || s.isRequired)
            .reduce((sum, s) => sum + Number(s.pricePerUnit), 0);
        const vat = subtotal * 0.25;
        const total = subtotal + vat;
        return { subtotal, vat, total };
    };

    // Bind HTML in iframe and update totals dynamically
    useEffect(() => {
        if (!iframeRef.current || !htmlCode || !quoteData) return;
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(htmlCode);
        doc.close();

        const timeout = setTimeout(() => {
            // === Bind Title & Description ===
            const titleEl = doc.getElementById('QuotesTitle');
            const descEl = doc.getElementById('QuotesDescription');
            if (titleEl) titleEl.innerText = quoteData.title || "Untitled Quote";
            if (descEl) descEl.innerText = quoteData.description || "";

            // === Bind Services ===
            const servicesContainer = doc.getElementById('mulipleserverdivmain');
            const serviceTemplate = doc.getElementById('mulipleserverdivrepated');

            if (servicesContainer && serviceTemplate) {
                servicesContainer.innerHTML = '';

                quoteData.services
                    .filter(s => s.name && s.description && s.pricePerUnit > 0)
                    .forEach(service => {
                        const serviceDiv = serviceTemplate.cloneNode(true);
                        serviceDiv.style.display = 'grid';

                        const title = serviceDiv.querySelector('#mulipleserverdivtitle');
                        const desc = serviceDiv.querySelector('#mulipleserverdivdiscription');
                        const price = serviceDiv.querySelector('#mulipleserverdivPrice');
                        const checkbox = serviceDiv.querySelector('.service-checkbox');

                        if (title) title.innerText = service.name;
                        if (desc) desc.innerText = service.description;
                        if (price) price.innerText = `${service.pricePerUnit} kr`;

                        if (checkbox) {
                            checkbox.checked = service.isRequired || service.selected;
                            if (!service.isRequired) {
                                checkbox.addEventListener('change', () => {
                                    service.selected = checkbox.checked;
                                    const totals = calculateTotals(quoteData.services);
                                    const subtotalEl = doc.getElementById('Subtotalprice');
                                    const vatEl = doc.getElementById('vatprice');
                                    const totalEl = doc.getElementById('totalprice');
                                    if (subtotalEl) subtotalEl.innerText = totals.subtotal.toFixed(2) + " kr";
                                    if (vatEl) vatEl.innerText = totals.vat.toFixed(2) + " kr";
                                    if (totalEl) totalEl.innerText = totals.total.toFixed(2) + " kr";
                                });
                            }
                        }

                        servicesContainer.appendChild(serviceDiv);
                    });
            }

            // === Bind Totals ===
            const totals = calculateTotals(quoteData.services);
            const subtotalEl = doc.getElementById('Subtotalprice');
            const vatEl = doc.getElementById('vatprice');
            const totalEl = doc.getElementById('totalprice');
            const subtotalLabelEl = doc.getElementById('Subtotaltext');
            const vatLabelEl = doc.getElementById('vattext');
            const totalLabelEl = doc.getElementById('totaltext');

            if (subtotalLabelEl) subtotalLabelEl.innerText = "Subtotal";
            if (vatLabelEl) vatLabelEl.innerText = "VAT (25%)";
            if (totalLabelEl) totalLabelEl.innerText = "Total";

            if (subtotalEl) subtotalEl.innerText = totals.subtotal.toFixed(2) + " kr";
            if (vatEl) vatEl.innerText = totals.vat.toFixed(2) + " kr";
            if (totalEl) totalEl.innerText = totals.total.toFixed(2) + " kr";

            // === Bind Terms ===
            const termsTitleEl = doc.getElementById('termstext');
            const termsDescEl = doc.getElementById('termsDescription');
            if (termsTitleEl) termsTitleEl.innerText = "Terms";
            if (termsDescEl) termsDescEl.innerText = quoteData.terms || "";

        }, 50);

        return () => clearTimeout(timeout);

    }, [htmlCode, quoteData, iframeWidth]);

    const totals = calculateTotals(selectedServices);



    if (template.type === 'Custom' && template.status === 'active') {
        return (
            <>
                <div className="mainbody newoffertemplatespage">
                    <div className="container-fluid">
                        <MobileHeader />
                        <div className="newoffertop-bg">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="newoffertop-left">
                                        <button onClick={() => navigate(`/leads/${leadId}`)} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>  {t('leadViewPage.backToLeads')}</button>
                                        <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageViewCTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.customTag')}</div></h3>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="newoffertop-right">
                                        <ul className="newoffertop-system">
                                            <li className={iframeWidth === '100%' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('100%')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-monitor" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></button></li>
                                            <li className={iframeWidth === '768px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('768px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tablet" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></button></li>
                                            <li className={iframeWidth === '375px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('375px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-smartphone" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg></button></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="newoffertemplate-row">
                            <div className="newoffertemplate-col-right" style={{ width: '100%' }}>
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
    if (template.type === 'Default' && template.status === 'active') {

        return (
            <>
                <div className="mainbody newoffertemplatespage">
                    <div className="container-fluid">
                        <MobileHeader />
                        <div className="newoffertop-bg">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="newoffertop-left">
                                        <button type='button' onClick={() => navigate(`/leads/${leadId}`)} className="btn btn-add"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>{t('leadViewPage.backToLeads')}</button>
                                        <h3><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>{t('OffersTemplatesCreatePage.pageViewSTitle')}<div className="status status7">{t('OffersTemplatesCreatePage.standardTag')}</div></h3>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="newoffertop-right">
                                        <ul className="newoffertop-system">
                                            <li className={iframeWidth === '100%' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('100%')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-monitor" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></button></li>
                                            <li className={iframeWidth === '768px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('768px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tablet" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></button></li>
                                            <li className={iframeWidth === '375px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('375px')}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-smartphone" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg></button></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="newoffertemplate-row">
                            <div className="newoffertemplate-col-right" style={{ width: '100%' }}>
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
                                                                    <img
                                                                        src={template.companyLogo ? template.companyLogo : "/assets/images/logo.svg"}
                                                                        className="img-fluid"
                                                                        alt={`${template.companyName || "Company"} logo`}
                                                                    />
                                                                </a>

                                                            </div>
                                                            <div className="companyname text-center">
                                                                <h6 style={{ color: template.textColor }} >{template.companyName || 'NaviLead PRO'}</h6>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-7">
                                                            <div className="carddesign" style={{ backgroundColor: template.leftCardBgColor }}>
                                                                <div className="offer-title">
                                                                    <h1 className="tilbud-title" style={{ color: template.textColor }}> {quoteData?.title || "Untitled Quote"}</h1>
                                                                </div>
                                                                <div className="intro">
                                                                    <p style={{ color: template.subTextColor }}>{quoteData?.description || "Untitled Quote"}</p>
                                                                    <p className="muted" style={{ color: template.subTextColor }}>Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
                                                                </div>
                                                                <div className="items">
                                                                    {quoteData?.services
                                                                        ?.filter(service =>
                                                                            service.name?.trim() !== "" &&
                                                                            service.description?.trim() !== "" &&
                                                                            Number(service.pricePerUnit) > 0
                                                                        ).length > 0 ? (

                                                                        quoteData.services
                                                                            .filter(service =>
                                                                                service.name?.trim() !== "" &&
                                                                                service.description?.trim() !== "" &&
                                                                                Number(service.pricePerUnit) > 0
                                                                            )
                                                                            .map((service, index) => (
                                                                                <div className="item" key={index}>

                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="form-check-input"
                                                                                        defaultChecked={service.isRequired}
                                                                                        disabled={service.isRequired}
                                                                                        onChange={() => toggleService(service.id)}
                                                                                    />

                                                                                    <div>
                                                                                        <div className="title" style={{ color: template.textColor }}>
                                                                                            {service.name}
                                                                                        </div>

                                                                                        <div className="desc" style={{ color: template.subTextColor }}>
                                                                                            {service.description}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="price" style={{ color: template.textColor }}>
                                                                                        {`${service.total || service.pricePerUnit} kr`}
                                                                                    </div>

                                                                                </div>
                                                                            ))

                                                                    ) : (
                                                                        <p style={{ color: template.subTextColor }}>No valid services added.</p>
                                                                    )}
                                                                </div>

                                                                <div className="totals">
                                                                    <div className="totalsrow" style={{ color: template.textColor }}>
                                                                        <span>Subtotal</span>
                                                                        <strong style={{ color: template.textColor }}>
                                                                            {totals.subtotal.toFixed(2)}
                                                                        </strong>
                                                                    </div>

                                                                    <div className="totalsrow" style={{ color: template.textColor }}>
                                                                        <span>VAT (25%)</span>
                                                                        <strong style={{ color: template.textColor }}>
                                                                            {totals.vat.toFixed(2)}
                                                                        </strong>
                                                                    </div>

                                                                    <div className="totalsrow" style={{ color: template.textColor }}>
                                                                        <span style={{ fontWeight: 700 }}>Total</span>
                                                                        <strong style={{ fontSize: '16px', color: template.textColor }}>
                                                                            {totals.total.toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                </div>

                                                                <div className="publicbottom">
                                                                    <div className="publicbottom-heading">
                                                                        <h2 className="card-title" style={{ color: template.textColor }}>
                                                                            Terms
                                                                        </h2>

                                                                        <p
                                                                            style={{ color: template.subTextColor, whiteSpace: "pre-line" }}
                                                                        >
                                                                            {quoteData.terms}
                                                                        </p>
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
                                                                            src={template.aboutUsLogo || `${process.env.REACT_APP_URL}/assets/images/blog3.jpg`}
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

export default QuotePreviewPage;