import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import FullPageLoader from '../components/common/FullPageLoader';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';
import { useTranslation } from 'react-i18next';
import OfferHtmlRenderer from './OfferHtmlRenderer';

const OfferPage = () => {
  const { id } = useParams();
  const { t: translate } = useTranslation();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [isOfferExpired, setIsOfferExpired] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [offerTemplate, setOfferTemplate] = useState('');
  const [AcceptedOffer, setAcceptedOffer] = useState('');


  const fetchOffer = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/offers/${id}`);
      const fetchedOffer = response.data;
      setOfferTemplate(fetchedOffer.offerTemplate);

      const createdAtDate = new Date(fetchedOffer.createdAt);
      const validUntilDate = new Date(createdAtDate);
      validUntilDate.setDate(createdAtDate.getDate() + fetchedOffer.validDays);
      const currentDate = new Date();

      if (currentDate > validUntilDate) {
        setIsOfferExpired(true);
        toast.error("This offer has expired.");
        toast.error(translate('api.offers.offerExpired'));
      }

      const initialSelectedServices = new Set();
      const processedServices = fetchedOffer.services.map(service => {
        const templateService = fetchedOffer.pricingTemplate?.services.find(ts => ts.name === service.name);
        // We use the template's isRequired property
        const isRequired = templateService?.isRequired || false;

        if (isRequired) {
          initialSelectedServices.add(service.id);
        }

        return {
          ...service,
          isRequired: isRequired,
        };
      });

      if (fetchedOffer.status?.name === 'Accepted') {
        setAcceptTerms(true);
        setAcceptedOffer(fetchedOffer.acceptedOffers);
        setCustomerNotes(fetchedOffer.acceptedOffers.rememberNotes);
        const acceptedServices = JSON.parse(fetchedOffer.acceptedOffers.chosenServices);
        acceptedServices.forEach(service => initialSelectedServices.add(service.id));
      }

      setOffer({ ...fetchedOffer, services: processedServices });
      setSelectedServiceIds(initialSelectedServices);
    } catch (err) {
      console.error("Error fetching offer:", err);
      const errorMessageKey = err.response?.data?.message || 'api.offers.internalServerError';
      toast.error(translate(errorMessageKey, { id: id })); // Pass id for dynamic message
      setOffer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id]);

  const calculateSubtotal = (servicesToCalculate) => {
    if (!servicesToCalculate) return 0;
    return servicesToCalculate.reduce((sum, service) => {
      if (selectedServiceIds.has(service.id)) {
        const price = parseFloat(service.price) || 0;
        const quantity = parseFloat(service.quantity) || 1;
        const discount = parseFloat(service.discount) || 0;
        const discountedPrice = price * (1 - discount / 100);
        return sum + (quantity * discountedPrice);
      }
      return sum;
    }, 0);
  };

  const currentSubtotal = calculateSubtotal(offer?.services);
  const vatRate = 0.25;
  const vat = currentSubtotal * vatRate;
  const totalWithVat = (currentSubtotal * (1 - (offer?.overallDiscount || 0) / 100)) + vat;

  const handleItemToggle = (serviceId, isRequired) => {
    // Prevent unchecking if the service is required
    if (isRequired) return;

    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleAcceptQuote = async () => {
    if (!acceptTerms) {
      toast.error(translate('api.offers.termsNotAccepted')); // Translated
      return;
    }
    if (!offer) {
      toast.error(translate('api.offers.noOfferData')); // Translated
      return;
    }
    if (isOfferExpired) {
      toast.error(translate('api.offers.offerExpiredError')); // Translated
      return;
    }
    if (offer.status?.name === 'Accepted') {
      toast.info(translate('api.offers.offerAlreadyAccepted')); // Translated
      return;
    }

    const chosenServices = offer.services
      .filter(service => selectedServiceIds.has(service.id))
      .map(({ id, name, description, price, quantity, discount }) => ({
        id, name, description, price, quantity, discount,
      }));

    try {
      setLoading(true);
      const payload = {
        quoteId: offer.id,
        chosenServices: JSON.stringify(chosenServices),
        totalPrice: totalWithVat,
        rememberNotes: customerNotes.trim(),
      };
      await api.put('/offers/accept-offer', payload);
      toast.success("Offer accepted successfully! Our team has been notified and the lead status is now 'Won'.");
      fetchOffer();
    } catch (error) {
      console.error("Error accepting offer:", error);
      const errorMessageKey = error.response?.data?.message || 'api.offers.offerAcceptFailed';
      toast.error(translate(errorMessageKey));
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (isOfferExpired) {
      toast.error(translate('api.offers.offerExpiredQuestion')); // Translated
      return;
    }
    if (offer?.status?.name === 'Accepted') {
      toast.info(translate('api.offers.offerAlreadyAcceptedQuestion')); // Translated
      return;
    }
    if (offer?.status?.name === 'In Dialogue') {
      toast.info(translate('api.offers.questionAlreadySent')); // Translated
      return;
    }

    const { value: question } = await Swal.fire({
      title: translate('offerPage.askQuestionModalTitle'), // Translated
      input: 'textarea',
      inputPlaceholder: translate('offerPage.askQuestionInputPlaceholder'), // Translated
      showCancelButton: true,
      confirmButtonText: translate('offerPage.sendQuestionButton'), // Now using the new, specific translation key
      cancelButtonText: translate('emailSmsPage.cancel'), // Reusing cancel button translation
      customClass: {
        popup: 'swal2-dark'
      },
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return translate('offerPage.askQuestionInputValidator'); // Translated
        }
        return null;
      }
    });

    if (question) {
      if (!offer) {
        toast.error(translate('api.offers.noOfferData')); // Translated
        return;
      }

      try {
        setLoading(true);
        const payload = {
          quoteId: offer.id,
          question: question.trim(),
        };
        const response = await api.post('/offers/asked-question', payload);
        toast.success(translate(response.data.message)); // Translated API message
        fetchOffer();
      } catch (error) {
        console.error("Error asking question:", error);
        const errorMessageKey = error.response?.data?.message || 'api.offers.questionSendFailed';
        toast.error(translate(errorMessageKey)); // Translated error message
      } finally {
        setLoading(false);
      }
    }
  };


  const interactionDisabled = offer?.status?.name === 'Accepted' || offer?.status?.name === 'In Dialogue' || isOfferExpired;

  if (loading) {
    return <FullPageLoader />;
  }

  if (!offer) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">{translate('offerPage.offerNotFoundTitle')}</h1> {/* Translated */}
        <p className='text-danger'>{translate('offerPage.offerNotFoundMessage', { id: id })}</p> {/* Translated */}
      </div>
    );
  }

  const { title, description, terms, services } = offer;

  return (
    <>
      {offerTemplate?.htmlCode && offerTemplate?.customHtml ? (
       <OfferHtmlRenderer
        offer={offer}
        htmlCode={offerTemplate.htmlCode}
        handleAcceptQuote={handleAcceptQuote}
        handleAskQuestion={handleAskQuestion}
        interactionDisabled={interactionDisabled}
        acceptTerms={acceptTerms}
        setAcceptTerms={setAcceptTerms}
        selectedServiceIds={selectedServiceIds}
        setSelectedServiceIds={setSelectedServiceIds}
        customerNotes={customerNotes}
        setCustomerNotes={setCustomerNotes}
        AcceptedOffer={AcceptedOffer}
      />


      ) : (
        <>
          <section className="navpublic" style={{ backgroundColor: offerTemplate.mainBgColor }}>
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="logo">
                    <Link to="#"><img src={offerTemplate?.companyLogo || offer.users?.companyLogo || "/assets/images/logo.svg"} className="img-fluid" alt="" /></Link>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="companyname text-center">
                    <h5 style={{ color: offerTemplate.textColor }}>{offerTemplate?.companyName || "NaviLead"}</h5>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-7">
                  <div className="carddesign" style={{ backgroundColor: offerTemplate.leftCardBgColor }}>
                    <div className="offer-title d-flex justify-content-between align-items-center">
                      <h1 className="tilbud-title" style={{ color: offerTemplate.textColor }}>{translate('offerPage.offerTitle', { title: title })}</h1>
                      {offer.status && (
                        <div className={`badge ${offer.status.name === "Accepted" ? "bg-success" : ""} ${offer.status.name === "In Dialogue" ? "bg-warning text-dark" : ""} ${offer.status.name === "Viewed by customer" ? "bg-info" : ""}`}>
                          <span>
                            {offer.status.name === "Viewed by customer"
                              ? translate('offerPage.offerViewedBadge') // Translated
                              : offer.status.name === "Accepted"
                                ? translate('offerPage.offerAcceptedBadge') // Translated
                                : translate('offerPage.offerStatusBadge', { statusName: offer.status.name })} {/* Translated */}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="intro">
                      <p style={{ color: offerTemplate.textColor }}>{translate('offerPage.introDescription', { description: description })}</p> {/* Translated */}
                      <p className="muted" style={{ color: offerTemplate.subTextColor }}>{translate('offerPage.introMutedText')}</p> {/* Translated */}
                    </div>
                    <div className="items">
                      {services.map(service => (
                        <div className="item" key={service.id}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedServiceIds.has(service.id)}
                            onChange={() => handleItemToggle(service.id, service.isRequired)}
                            disabled={interactionDisabled || service.isRequired}
                          />
                          <div>
                            <div className="title" style={{ color: offerTemplate.textColor }}>{service.name}</div>
                            <div className="desc" style={{ color: offerTemplate.subTextColor }}>{service.description}</div>
                          </div>
                          <div className="price" style={{ color: offerTemplate.textColor }}>{service.price} {offer.pricingTemplate?.currency?.symbol}</div>
                        </div>
                      ))}
                    </div>
                    <div className="totals">
                      <div className="totalsrow">
                        <span style={{ color: offerTemplate.textColor }}>{translate('offerPage.subtotal')}</span>
                        <strong style={{ color: offerTemplate.textColor }}>{currentSubtotal} {offer.pricingTemplate?.currency?.symbol}</strong>
                      </div>
                      <div className="totalsrow">
                        <span style={{ color: offerTemplate.textColor }}>{translate('offerPage.vat', { vatRate: vatRate * 100 })}</span> {/* Translated */}
                        <strong style={{ color: offerTemplate.textColor }}>{vat} {offer.pricingTemplate?.currency?.symbol}</strong>
                      </div>
                      {offer.overallDiscount > 0 && (
                        <div className="totalsrow">
                          <span style={{ color: offerTemplate.textColor }}>{translate('offerPage.discount', { overallDiscount: offer.overallDiscount })}</span> {/* Translated */}
                          <strong style={{ color: offerTemplate.textColor }}>-{currentSubtotal * offer.overallDiscount / 100} {offer.pricingTemplate?.currency?.symbol}</strong>
                        </div>
                      )}
                      <div className="totalsrow">
                        <span style={{ color: offerTemplate.textColor, fontWeight: 700 }}>{translate('offerPage.total')}</span> {/* Translated */}
                        <strong style={{ fontSize: '16px', color: offerTemplate.textColor }}>{totalWithVat} {offer.pricingTemplate?.currency?.symbol}</strong>
                      </div>
                    </div>
                    <div className="publicbottom">
                      <div className="publicbottom-heading">
                        <h2 className="card-title" style={{ color: offerTemplate.textColor }}>{translate('offerPage.termsTitle')}</h2> {/* Translated */}
                        <p style={{ color: offerTemplate.subTextColor }}>{terms}</p>
                      </div>
                      <div className="terms-row">
                        <input
                          id="acceptTerms"
                          type="checkbox"
                          className="form-check-input"
                          checked={acceptTerms}
                          onChange={() => setAcceptTerms(!acceptTerms)}
                          disabled={interactionDisabled}
                        />
                        <label htmlFor="acceptTerms" style={{ color: offerTemplate.textColor }}>I accept the <Link href="#" target="_blank" rel="noopener" style={{ color: offerTemplate.subTextColor }}>Terms & Conditions</Link>.</label>
                      </div>
                      <div className="mb-4 form-group">
                        <label htmlFor="customerNotes" className="form-label">{translate('offerPage.notesLabel')}</label>
                        <textarea
                          id="customerNotes"
                          className="form-control customerNotes text-white"
                          rows="3"
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          disabled={interactionDisabled}
                        ></textarea>
                      </div>
                    </div>
                    <div className="modalfooter">
                      <button className="btn btn-add" onClick={handleAcceptQuote} disabled={interactionDisabled}>
                        {interactionDisabled ? translate('offerPage.offerAcceptedButton') : translate('offerPage.acceptQuoteButton')} {/* Translated */}
                      </button>
                      <button className="btn btn-send" onClick={handleAskQuestion} disabled={interactionDisabled}>
                        {translate('offerPage.askQuestionButton')} {/* Translated */}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-5" >
                  <div className="carddesign" style={{ backgroundColor: offerTemplate.rightCardBgColor }}>
                    <div className="about-media">
                      <Link href="#"><img src={offerTemplate?.aboutUsLogo || "/assets/images/blog3.jpg"} className="img-fluid" alt="" /></Link>
                    </div>
                    <div className="publicbottom-heading">
                      <h2 className="card-title">{translate('offerPage.aboutUsTitle')}</h2> {/* Translated */}
                      <div dangerouslySetInnerHTML={{
                        __html: offerTemplate.aboutUsDescription || "About Us Description will appear here..."
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default OfferPage;