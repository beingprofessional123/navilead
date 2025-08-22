import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import api from '../utils/api';
import FullPageLoader from '../components/common/FullPageLoader';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';

const OfferPage = () => {
  const { id } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [isOfferExpired, setIsOfferExpired] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');

  const fetchOffer = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/offers/${id}`);
      const fetchedOffer = response.data;

      const createdAtDate = new Date(fetchedOffer.createdAt);
      const validUntilDate = new Date(createdAtDate);
      validUntilDate.setDate(createdAtDate.getDate() + fetchedOffer.validDays);
      const currentDate = new Date();

      if (currentDate > validUntilDate) {
        setIsOfferExpired(true);
        toast.error("This offer has expired.");
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
      }
      if (fetchedOffer.rememberNotes) {
        setCustomerNotes(fetchedOffer.rememberNotes);
      }

      setOffer({ ...fetchedOffer, services: processedServices });
      setSelectedServiceIds(initialSelectedServices);
    } catch (err) {
      console.error("Error fetching offer:", err);
      const errorMessage = err.response?.data?.message || 'Failed to load offer. It might not exist or has expired.';
      toast.error(errorMessage);
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
      toast.error("Please accept the Terms & Conditions to proceed.");
      return;
    }
    if (!offer) {
      toast.error("No offer data available.");
      return;
    }
    if (isOfferExpired) {
      toast.error("This offer has expired and cannot be accepted.");
      return;
    }
    if (offer.status?.name === 'Accepted') {
      toast.info("This offer has already been accepted.");
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
      const errorMessage = error.response?.data?.message || 'Failed to accept offer.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (isOfferExpired) {
      toast.error("This offer has expired. You cannot ask questions about it.");
      return;
    }
    if (offer?.status?.name === 'Accepted') {
      toast.info("This offer has already been accepted. You cannot ask further questions.");
      return;
    }
    if (offer?.status?.name === 'In Dialogue') {
      toast.info("A question has already been sent for this offer. Please wait for a response from our team.");
      return;
    }

    const { value: question } = await Swal.fire({
      title: 'Ask a Question',
      input: 'textarea',
      inputPlaceholder: 'Type your question here...',
      showCancelButton: true,
      customClass: {
        popup: 'swal2-dark'
      },
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'You need to write something!';
        }
      }
    });

    if (question) {
      if (!offer) {
        toast.error("No offer data available.");
        return;
      }

      try {
        setLoading(true);
        const payload = {
          quoteId: offer.id,
          question: question.trim(),
        };
        await api.post('/offers/asked-question', payload);
        toast.success("Your question has been sent successfully! We've updated the lead status to 'In Dialogue' and notified our sales representative.");
        fetchOffer();
      } catch (error) {
        console.error("Error asking question:", error);
        const errorMessage = error.response?.data?.message || 'Failed to send question.';
        toast.error(errorMessage);
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
        <h1 className="text-2xl font-bold mb-4">Offer Not Found!</h1>
        <p>The offer with ID "{id}" could not be loaded or has expired.</p>
      </div>
    );
  }

  const { title, description, terms, services } = offer;

  return (
    <>
      <section className="navpublic">
        <ToastContainer />
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="logo">
                <Link to="#"><img src="/assets/images/logo.svg" className="img-fluid" alt="" /></Link>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-7">
              <div className="carddesign">
                <div className="offer-title d-flex justify-content-between align-items-center">
                  <h1 className="tilbud-title mb-0">{title}</h1>
                  {offer.status && (
                    <div className={`badge ${offer.status.name === "Accepted" ? "bg-success" : ""} ${offer.status.name === "In Dialogue" ? "bg-warning text-dark" : ""} ${offer.status.name === "Viewed by customer" ? "bg-info" : ""}`}>
                      <span>{offer.status.name === "Viewed by customer" ? "Offer is viewed by you" : offer.status.name === "Accepted" ? "This offer is accepted by you" : offer.status.name}</span>
                    </div>
                  )}
                </div>
                <div className="intro">
                  <p>{description}</p>
                  <p className="muted">Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
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
                        <div className="title">{service.name}</div>
                        <div className="desc">{service.description}</div>
                      </div>
                      <div className="price">{service.price} {offer.pricingTemplate?.currency?.symbol}</div>
                    </div>
                  ))}
                </div>
                <div className="totals">
                  <div className="totalsrow">
                    <span>Subtotal</span>
                    <strong>{currentSubtotal} {offer.pricingTemplate?.currency?.symbol}</strong>
                  </div>
                  <div className="totalsrow">
                    <span>VAT ({vatRate * 100}%)</span>
                    <strong>{vat} {offer.pricingTemplate?.currency?.symbol}</strong>
                  </div>
                  {offer.overallDiscount > 0 && (
                    <div className="totalsrow">
                      <span>Discount ({offer.overallDiscount}%)</span>
                      <strong>-{currentSubtotal * offer.overallDiscount / 100} {offer.pricingTemplate?.currency?.symbol}</strong>
                    </div>
                  )}
                  <div className="totalsrow">
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <strong style={{ fontSize: '16px' }}>{totalWithVat} {offer.pricingTemplate?.currency?.symbol}</strong>
                  </div>
                </div>
                <div className="publicbottom">
                  <div className="publicbottom-heading">
                    <h2 className="card-title">Terms</h2>
                    <p>{terms}</p>
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
                    <label htmlFor="acceptTerms">I accept the <Link href="#" target="_blank" rel="noopener">Terms & Conditions</Link>.</label>
                  </div>
                  <div className="mb-4 form-group">
                    <label htmlFor="customerNotes" className="form-label">Notes for us (optional):</label>
                    <textarea
                      id="customerNotes"
                      className="form-control customerNotes"
                      rows="3"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      disabled={interactionDisabled}
                      style={{ background: 'rgb(15, 20, 24)', height: '77px', color: 'white' }}
                    ></textarea>
                  </div>
                </div>
                <div className="modalfooter">
                  <button className="btn btn-add" onClick={handleAcceptQuote} disabled={interactionDisabled}>
                    {interactionDisabled ? 'Offer Accepted' : 'Accept Quote'}
                  </button>
                  <button className="btn btn-send" onClick={handleAskQuestion} disabled={interactionDisabled}>
                    Ask a Question
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-5">
              <div className="carddesign">
                <div className="about-media">
                  <Link href="#"><img src="/assets/images/blog3.jpg" className="img-fluid" alt="" /></Link>
                </div>
                <div className="publicbottom-heading">
                  <h2 className="card-title">About Us</h2>
                  <p><strong>About Our Company:</strong> We are a dedicated service provider focused on delivering top-quality results and exceptional customer experiences. Our mission is to make every interaction with us professional, friendly, and hassle-free.</p>
                  <p><strong>Our Commitment:</strong> We take pride in our attention to detail and reliability. Whether we are working at your home or business, we treat every project with care and respect.</p>
                  <p><strong>Experienced Team:</strong> Our skilled team members are carefully selected and trained to uphold our high standards, ensuring consistent results for all our clients.</p>
                  <p><strong>Value You Can Trust:</strong> We offer competitive rates without compromising on quality. Our clients trust us for dependable service that exceeds expectations.</p>
                  <p><strong>Clear Communication:</strong> We believe in open and honest communication, so you always know what to expect when working with us.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OfferPage;