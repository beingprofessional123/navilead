import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { useLimit } from "../../context/LimitContext";
import LimitModal from '../../components/LimitModal'; // the modal we created earlier

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
    const { t: translate } = useTranslation(); // Initialize the translation hook
    const { checkLimit, isLimitModalOpen, currentLimit, closeLimitModal, refreshPlan, userPlan, CurrencySave } = useLimit();
    const quoteData = location.state?.quoteData || {};

    useEffect(() => {
        console.log('Quote Data from state:', quoteData);
        refreshPlan();
    }, [quoteData]);

    const getCurrencySymbol = (service = null) => {
        const shouldUseCurrencySave =
            (!quoteData.pricingTemplateId || quoteData.pricingTemplateId === "") &&
            !quoteData?.currency &&
            !service?.currency;

        if (shouldUseCurrencySave && CurrencySave?.symbol) {
            return CurrencySave.symbol;
        }

        if (quoteData?.currency?.symbol) return quoteData.currency.symbol;
        if (service?.currency?.symbol) return service.currency.symbol;
        if (CurrencySave?.symbol) return CurrencySave.symbol;

        return "kr";
    };

    // Fetch user template
    const fetchUserTemplate = async () => {
        try {
            const response = await api.get('/offers-templates', {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.data && response.data.length > 0) {
                const activeTemplate = response.data.find(tmpl => tmpl.status === 'active');
                setTemplate(activeTemplate || {});
                setHtmlCode((activeTemplate && activeTemplate.htmlCode) || '');
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
            getCurrencySymbol();
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

    // Prepare services state: include selected flag and ensure discountPercent default
    const [selectedServices, setSelectedServices] = useState(
        (quoteData?.services || [])
            .filter(s => s.name && s.description && Number(s.pricePerUnit) > 0)
            .map(s => ({
                ...s,
                selected: s.isRequired ? true : Boolean(s.selected),
                discountPercent: s.discountPercent || 0
            }))
    );

    // Keep selectedServices in sync if quoteData changes
    useEffect(() => {
        setSelectedServices(
            (quoteData?.services || [])
                .filter(s => s.name && s.description && Number(s.pricePerUnit) > 0)
                .map(s => ({
                    ...s,
                    selected: s.isRequired ? true : Boolean(s.selected),
                    discountPercent: s.discountPercent || 0
                }))
        );
    }, [quoteData]);

    const toggleService = (id) => {
        setSelectedServices(prev =>
            prev.map(s =>
                s.id === id
                    ? { ...s, selected: s.isRequired ? true : !s.selected }
                    : s
            )
        );
    };

    // Correct totals calculation applying service discounts and overall discount
    const calculateTotals = (services) => {
        // services: array with pricePerUnit, discountPercent, selected/isRequired
        const usedServices = (services || []).filter(s => s.selected || s.isRequired);

        // Subtotal BEFORE overall discount (sum of service final prices after service-level discount)
        const subtotal = usedServices.reduce((sum, s) => {
            const price = Number(s.pricePerUnit) || 0;
            const disc = Number(s.discountPercent) || 0;
            const serviceDiscountAmount = (price * disc) / 100;
            const finalServicePrice = price - serviceDiscountAmount;
            return sum + finalServicePrice;
        }, 0);

        // Overall discount applied on subtotal
        const overallPct = Number(quoteData.overallDiscount) || 0;
        const overallDiscountAmount = subtotal * (overallPct / 100);

        const subtotalAfterDiscount = subtotal - overallDiscountAmount;

        // VAT (25%) applied after overall discount
        const vat = subtotalAfterDiscount * 0.25;

        const total = subtotalAfterDiscount + vat;

        return {
            subtotal,
            overallDiscountAmount,
            subtotalAfterDiscount,
            vat,
            total
        };
    };

    // Bind HTML in iframe and update totals dynamically (also add service discount display inside iframe)
    useEffect(() => {
        if (!iframeRef.current || !htmlCode || !quoteData) return;

        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        doc.open();
        doc.write(htmlCode);
        doc.close();

        const timeout = setTimeout(() => {
            // ---- Title & Description ----
            const titleEl = doc.getElementById('QuotesTitle');
            const descEl = doc.getElementById('QuotesDescription');
            if (titleEl) titleEl.innerText = quoteData.title || "Untitled Quote";
            if (descEl) descEl.innerText = quoteData.description || "";

            // ---- Services Binding ----
            const servicesContainer = doc.getElementById('mulipleserverdivmain');
            const serviceTemplate = doc.getElementById('mulipleserverdivrepated');

            if (servicesContainer && serviceTemplate) {
                servicesContainer.innerHTML = '';

                (quoteData.services || [])
                    .filter(s => s.name && s.description && Number(s.pricePerUnit) > 0)
                    .forEach(service => {
                        const serviceDiv = serviceTemplate.cloneNode(true);
                        serviceDiv.style.display = 'grid';

                        const cSymbol = getCurrencySymbol(service);

                        const title = serviceDiv.querySelector('#mulipleserverdivtitle');
                        const desc = serviceDiv.querySelector('#mulipleserverdivdiscription');
                        const price = serviceDiv.querySelector('#mulipleserverdivPrice');
                        const checkbox = serviceDiv.querySelector('.service-checkbox');
                        const discountEl = serviceDiv.querySelector('.service-discount');
                        const finalEl = serviceDiv.querySelector('.service-finalprice');

                        if (title) title.innerText = service.name;
                        if (desc) desc.innerText = service.description;
                        if (price) price.innerText = `${cSymbol} ${Number(service.pricePerUnit).toFixed(2)}`;

                        // Calculate discount and final price
                        const discPercent = Number(service.discountPercent) || 0;
                        const serviceDiscountAmount = (Number(service.pricePerUnit) * discPercent) / 100;
                        const serviceFinal = Number(service.pricePerUnit) - serviceDiscountAmount;

                        if (discountEl) {
                            if (discPercent > 0) {
                                discountEl.style.display = 'block';
                                discountEl.innerText = `Discount: ${discPercent}%`;
                            } else {
                                discountEl.style.display = 'none';
                            }
                        }

                        if (finalEl) {
                            finalEl.style.display = 'block';
                            finalEl.innerText = `Final: ${cSymbol} ${serviceFinal.toFixed(2)}`;
                        }

                        if (checkbox) {
                            // Set initial checkbox state
                            checkbox.checked = service.isRequired || Boolean(service.selected);

                            if (!service.isRequired) {
                                checkbox.addEventListener('change', () => {
                                    service.selected = checkbox.checked;
                                    const totals = calculateTotals(quoteData.services);
                                    const symbol = getCurrencySymbol();

                                    const subtotalEl = doc.getElementById('Subtotalprice');
                                    const overallDiscEl = doc.getElementById('overalldiscountprice');
                                    const vatEl = doc.getElementById('vatprice');
                                    const totalEl = doc.getElementById('totalprice');

                                    if (subtotalEl) subtotalEl.innerText = `${symbol} ${totals.subtotal.toFixed(2)}`;
                                    if (overallDiscEl) {
                                        if ((quoteData.overallDiscount || 0) > 0) {
                                            overallDiscEl.innerText = `- ${symbol} ${totals.overallDiscountAmount.toFixed(2)}`;
                                        } else {
                                            overallDiscEl.innerText = `${symbol} 0.00`;
                                        }
                                    }
                                    if (vatEl) vatEl.innerText = `${symbol} ${totals.vat.toFixed(2)}`;
                                    if (totalEl) totalEl.innerText = `${symbol} ${totals.total.toFixed(2)}`;
                                });
                            }
                        }

                        servicesContainer.appendChild(serviceDiv);
                    });
            }

            // ---- Totals Binding ----
            const totals = calculateTotals(quoteData.services || []);
            const currencySymbol = getCurrencySymbol();

            const subtotalEl = doc.getElementById('Subtotalprice');
            const overallDiscEl = doc.getElementById('overalldiscountprice');
            const vatEl = doc.getElementById('vatprice');
            const totalEl = doc.getElementById('totalprice');

            const subtotalLabelEl = doc.getElementById('Subtotaltext');
            const overallDiscLabelEl = doc.getElementById('overalldiscounttext'); // Fix
            const vatLabelEl = doc.getElementById('vattext');
            const totalLabelEl = doc.getElementById('totaltext');

            if (subtotalLabelEl) subtotalLabelEl.innerText = "Subtotal";
            if (overallDiscLabelEl) overallDiscLabelEl.innerText = "Discount"; // Or "Overall Discount"
            if (vatLabelEl) vatLabelEl.innerText = "VAT (25%)";
            if (totalLabelEl) totalLabelEl.innerText = "Total";

            if (subtotalEl) subtotalEl.innerText = `${currencySymbol} ${totals.subtotal.toFixed(2)}`;
            if (overallDiscEl) {
                if ((quoteData.overallDiscount || 0) > 0) {
                    overallDiscEl.innerText = `- ${currencySymbol} ${totals.overallDiscountAmount.toFixed(2)}`;
                } else {
                    overallDiscEl.innerText = `${currencySymbol} 0.00`;
                }
            }
            if (vatEl) vatEl.innerText = `${currencySymbol} ${totals.vat.toFixed(2)}`;
            if (totalEl) totalEl.innerText = `${currencySymbol} ${totals.total.toFixed(2)}`;

            // ---- Terms ----
            const termsTitleEl = doc.getElementById('termstext');
            const termsDescEl = doc.getElementById('termsDescription');
            if (termsTitleEl) termsTitleEl.innerText = "Terms";
            if (termsDescEl) termsDescEl.innerText = quoteData.terms || "";

        }, 50);

        return () => clearTimeout(timeout);

    }, [htmlCode, quoteData, iframeWidth]);


    // totals for Default template (using selectedServices)
    const totals = calculateTotals(selectedServices);


    const handleApplyNow = async (e) => {
        e.preventDefault();

        // 🗓️ Ensure plan start date exists
        if (!userPlan?.startDate) {
            toast.error("Plan start date not found");
            return;
        }


        setLoading(true);

        try {
            const notSentStatus = quoteData.quoteStatuses.find(s => s.name === 'Not sent');
            if (!notSentStatus) {
                toast.error(translate('api.quotes.statusLoadError'));
                setLoading(false);
                return;
            }

            // ✅ Use servicesToSave in payload, not newQuoteFormData.services
            const payload = {
                userId: userPlan.userId,
                leadId,
                pricingTemplateId: null,
                title: quoteData.title,
                description: quoteData.description,
                validDays: quoteData.validDays,
                overallDiscount: quoteData.overallDiscount,
                terms: quoteData.terms,
                total: quoteData.total,
                currencyId: quoteData.currency?.id || CurrencySave?.id || null,
                services: quoteData.services.map(service => ({
                    name: service.name,
                    description: service.description,
                    quantity: service.quantity,
                    unit: service.unit,
                    discount: service.discountPercent,
                    price: service.pricePerUnit, // <- fix here
                })),
                statusId: notSentStatus.id,
            };

            console.log(payload);

            const response = await api.post('/quotes', payload, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(translate(response.data.message || 'leadViewPage.quoteSaveSuccess'));
            navigate(`/leads/${leadId}`);
        } catch (err) {
            console.error('Error saving quote:', err);
            const errorMessage = err.response?.data?.message || 'leadViewPage.quoteSaveError';
            toast.error(translate(errorMessage));
        } finally {
            setLoading(false);
        }
    };


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
                                        <button onClick={() => navigate(`/leads/${leadId}`)} className="btn btn-add">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
                                            {t('leadViewPage.backToLeads')}
                                        </button>
                                        <h3>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>
                                            {t('OffersTemplatesCreatePage.pageViewCTitle')}
                                            <div className="status status7">{t('OffersTemplatesCreatePage.customTag')}</div>
                                        </h3>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="newoffertop-right">
                                        <ul className="newoffertop-system">
                                            <li className={iframeWidth === '100%' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('100%')}>Monitor</button></li>
                                            <li className={iframeWidth === '768px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('768px')}>Tablet</button></li>
                                            <li className={iframeWidth === '375px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('375px')}>Mobile</button></li>
                                        </ul>
                                        <Link to="#" onClick={handleApplyNow} className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save" aria-hidden="true"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> {t('OffersTemplatesCreatePage.saveBtn')}</Link>
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
                                        <button type='button' onClick={() => navigate(`/leads/${leadId}`)} className="btn btn-add">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
                                            {t('leadViewPage.backToLeads')}
                                        </button>
                                        <h3>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code" aria-hidden="true"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>
                                            {t('OffersTemplatesCreatePage.pageViewSTitle')}
                                            <div className="status status7">{t('OffersTemplatesCreatePage.standardTag')}</div>
                                        </h3>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="newoffertop-right">
                                        <ul className="newoffertop-system">
                                            <li className={iframeWidth === '100%' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('100%')}>Monitor</button></li>
                                            <li className={iframeWidth === '768px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('768px')}>Tablet</button></li>
                                            <li className={iframeWidth === '375px' ? 'active' : ''}><button className='btn btn-add' onClick={() => setIframeWidth('375px')}>Mobile</button></li>
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

                                                                        (quoteData.services || [])
                                                                            .filter(service =>
                                                                                service.name?.trim() !== "" &&
                                                                                service.description?.trim() !== "" &&
                                                                                Number(service.pricePerUnit) > 0
                                                                            )
                                                                            .map((service, index) => {
                                                                                const disc = Number(service.discountPercent) || 0;
                                                                                const price = Number(service.pricePerUnit) || 0;
                                                                                const serviceDiscountAmount = (price * disc) / 100;
                                                                                const finalPrice = price - serviceDiscountAmount;

                                                                                // find current selection state from selectedServices to allow toggling
                                                                                const sel = selectedServices.find(s => s.id === service.id);
                                                                                const isChecked = sel ? sel.selected : (service.isRequired || false);

                                                                                return (
                                                                                    <div className="item" key={index}>

                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="form-check-input"
                                                                                            checked={isChecked}
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
                                                                                            {/* Original price */}
                                                                                            <div>
                                                                                                {`${getCurrencySymbol(service)} ${price.toFixed(2)}`}
                                                                                            </div>

                                                                                            {/* Discount label */}
                                                                                            {disc > 0 && (
                                                                                                <div style={{ fontSize: "12px", color: template.subTextColor }}>
                                                                                                    Discount: {disc}%
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Final price after service discount */}
                                                                                            <strong style={{ display: "block", fontSize: "12px", color: template.textColor }}>
                                                                                                Final: {getCurrencySymbol(service)} {finalPrice.toFixed(2)}
                                                                                            </strong>
                                                                                        </div>

                                                                                    </div>
                                                                                );
                                                                            })

                                                                    ) : (
                                                                        <p style={{ color: template.subTextColor }}>No valid services added.</p>
                                                                    )}
                                                                </div>

                                                                <div className="totals">
                                                                    <div className="totalsrow" style={{ color: template.textColor }}>
                                                                        <span>Subtotal</span>
                                                                        <strong style={{ color: template.textColor }}>
                                                                            {getCurrencySymbol()} {totals.subtotal.toFixed(2)}
                                                                        </strong>
                                                                    </div>

                                                                    {Number(quoteData.overallDiscount) > 0 && (
                                                                        <div className="totalsrow" style={{ color: template.textColor }}>
                                                                            <span>Overall Discount ({quoteData.overallDiscount}%)</span>
                                                                            <strong>
                                                                                - {getCurrencySymbol()} {totals.overallDiscountAmount.toFixed(2)}
                                                                            </strong>
                                                                        </div>
                                                                    )}

                                                                    <div className="totalsrow" style={{ color: template.textColor }}>
                                                                        <span>VAT (25%)</span>
                                                                        <strong style={{ color: template.textColor }}>
                                                                            {getCurrencySymbol()} {totals.vat.toFixed(2)}
                                                                        </strong>
                                                                    </div>

                                                                    <div className="totalsrow" style={{ color: template.textColor }}>
                                                                        <span style={{ fontWeight: 700 }}>Total</span>
                                                                        <strong style={{ fontSize: '16px', color: template.textColor }}>
                                                                            {getCurrencySymbol()} {totals.total.toFixed(2)}
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
                                                                        <label htmlFor="acceptTerms" style={{ color: template.textColor }}>I accept the <a href="#" target="_blank" rel="noopener" style={{ color: template.subTextColor }}>Terms &amp; Conditions</a>.</label>
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

                {/* Limit Modal */}
                <LimitModal
                    isOpen={isLimitModalOpen}
                    onClose={closeLimitModal}
                    usedLimit={currentLimit.usage}
                    totalAllowed={currentLimit.totalAllowed}
                    currentLimit={currentLimit}
                    userPlan={userPlan}
                />
            </>
        );
    }

    return null;
};

export default QuotePreviewPage;
