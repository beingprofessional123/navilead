import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify'; // Import toast for notifications
import api from '../utils/api'; // Assuming you have an api utility for requests


const OfferPage = () => {
  const { id } = useParams(); // Get the offer ID (quoteId) from the URL
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set()); // To track selected optional services
  const [isOfferExpired, setIsOfferExpired] = useState(false); // New state for offer expiration
  const [customerNotes, setCustomerNotes] = useState(''); // State for customer's notes

  useEffect(() => {
    const fetchOffer = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/offers/${id}`);
        const fetchedOffer = response.data;

        // Check offer expiration
        const createdAtDate = new Date(fetchedOffer.createdAt);
        const validUntilDate = new Date(createdAtDate);
        validUntilDate.setDate(createdAtDate.getDate() + fetchedOffer.validDays);
        const currentDate = new Date();

        if (currentDate > validUntilDate) {
          setIsOfferExpired(true);
          toast.error("This offer has expired.");
          setOffer(fetchedOffer); // Still set offer data even if expired for display
          setLoading(false);
          return;
        }

        // Initialize selected services based on backend's pricingTemplate.services 'isRequired' or quote's default 'selected'
        const initialSelectedServices = new Set();
        const processedServices = fetchedOffer.services.map(service => ({
          ...service,
          // If pricingTemplate has services, check if they are required. Otherwise, assume default selected state from the quote.
          selected: service.isRequired !== undefined ? service.isRequired : true // Default to true if not explicitly set
        }));

        processedServices.forEach(service => {
          if (service.selected) {
            initialSelectedServices.add(service.id);
          }
        });

        // If the offer is already accepted, pre-fill customerNotes and disable related fields
        if (fetchedOffer.status && fetchedOffer.status.name === 'Accepted' && fetchedOffer.rememberNotes) {
          setCustomerNotes(fetchedOffer.rememberNotes);
          setAcceptTerms(true); // Assuming terms were accepted if offer is accepted
        }


        setOffer({ ...fetchedOffer, services: processedServices });
        setSelectedServiceIds(initialSelectedServices);

      } catch (err) {
        console.error("Error fetching offer:", err);
        const errorMessage = err.response?.data?.message || 'Failed to load offer. It might not exist or has expired.';
        toast.error(errorMessage);
        setOffer(null); // Set offer to null to show "Not Found" message
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOffer();
    }
  }, [id]);


  const calculateSubtotal = (servicesToCalculate) => {
    if (!servicesToCalculate) return 0;
    return servicesToCalculate.reduce((sum, service) => {
      if (selectedServiceIds.has(service.id)) { // Only sum selected services
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
  const vat = currentSubtotal * 0.25; // Assuming 25% VAT
  const totalWithVat = currentSubtotal * (1 - (offer?.overallDiscount || 0) / 100) + vat; // Apply overall discount, then add VAT


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(value);
  };

  const handleItemToggle = (serviceId) => {
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

    // Filter for chosen services based on selection
    const chosenServices = offer.services
      .filter(service => selectedServiceIds.has(service.id))
      .map(({ id, name, description, price, quantity, discount }) => ({
        id, name, description, price, quantity, discount
      }));

    try {
      setLoading(true);
      const payload = {
        quoteId: offer.id,
        chosenServices: JSON.stringify(chosenServices), // Stringify complex array for backend
        totalPrice: totalWithVat, // Send the final calculated total
        rememberNotes: customerNotes.trim(), // Send customer's notes
      };
      await api.put('/offers/accept-offer', payload);
      toast.success("Offer accepted successfully!");
     // eslint-disable-next-line no-undef
     fetchOffer(); // Refresh offer data after acceptance
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
    const question = prompt("Please type your question:");
    if (!question || question.trim() === "") {
      toast.info("Question cannot be empty.");
      return;
    }
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
      toast.success("Your question has been sent successfully!");
    } catch (error) {
      console.error("Error asking question:", error);
      const errorMessage = error.response?.data?.message || 'Failed to send question.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Loading Offer...</h1>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Offer Not Found!</h1>
        <p>The offer with ID "{id}" could not be loaded or has expired.</p>
      </div>
    );
  }

  // Determine if interaction should be disabled (offer accepted or expired)
  const interactionDisabled = offer.status.name === 'Accepted' || isOfferExpired;


  return (
    <>
      <style>
        {`
        *,*::before,*::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.45;
          color: #0e0f10;
          background: #f7f7f8;
        }
        .header {
          background: #0e0f10; color: #fff; padding: 14px 20px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo { display:flex; align-items:center; gap:10px; font-weight:600; }
        .logo .mark { height:28px; width:28px; border-radius:6px; background:#fff; display:inline-block; }
        .container {
          max-width: 1100px; margin: 24px auto; padding: 0 16px;
          display: grid; grid-template-columns: 1.25fr 0.9fr; gap: 20px;
        }
        @media (max-width: 900px) { .container { grid-template-columns: 1fr; } }
        .card {
          background: #fff; border: 1px solid #e9eaee; border-radius: 14px; padding: 18px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .offer-title { display:flex; align-items:baseline; justify-content:space-between; gap:14px; margin-bottom:12px; }
        h1 { font-size: 22px; line-height: 1.2; margin: 0; }
        .badge { font-size:12px; padding:4px 8px; border-radius:999px; background:#eef6ff; color:#0a66c2; border:1px solid #d8eaff; white-space:nowrap; }
        .intro p { margin: 8px 0; color:#2e3138; }
        .muted { color:#585b63; font-size:14px; }
        .items { margin: 10px 0 2px; }
        .item { display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:start; padding:12px 10px; border-radius:10px; border:1px solid #ececf0; margin-bottom:10px; }
        .item .title { font-weight:600; }
        .item .desc { color:#585b63; font-size:14px; margin-top:2px; }
        .price { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .totals { border-top:1px dashed #e1e2e6; margin-top:12px; padding-top:12px; display:grid; gap:6px; }
        .row { display:flex; align-items:baseline; justify-content:space-between; }
        .h2 { margin: 12px 0 8px; font-size: 18px; }
        .cta { display:grid; gap:10px; margin-top:14px; }
        .btn { appearance:none; -webkit-appearance:none; border:none; padding:12px 14px; border-radius:10px; font-weight:600; cursor:pointer; transition: transform .02s, box-shadow .2s; }
        .btn:active { transform: translateY(1px); }
        .btn-primary { background:#00a36c; color:#fff; }
        .btn-primary:hover { box-shadow:0 6px 16px rgba(0,163,108,.25); }
        .btn-secondary { background:#eef0f3; color:#0e0f10; }
        .about-media img { width:100%; height:auto; border-radius:12px; display:block; }
        .richtext p { margin:10px 0; color:#2e3138; }
        .footer { color:#686b73; font-size:13px; text-align:center; padding:28px 16px 40px; }
        .small { font-size:12px; color:#666; }
        .terms-row{display:flex;align-items:flex-start;gap:8px;margin-top:6px;font-size:14px;color:#2e3138}
        .terms-row input[type="checkbox"]{transform: translateY(2px);}
        .btn-disabled{opacity:.55; cursor:not-allowed}
        `}
      </style>
      <header className="header" role="banner">
        <div className="logo">
          <span className="mark" aria-hidden="true"></span>
          <span>Navilead</span>
        </div>
        <div className="small">Offer number #{offer.id}</div>
      </header>

      <main className="container" role="main">
        {/* LEFT: Offer */}
        <section className="card" aria-labelledby="tilbud-title">
          <div className="offer-title">
            <h1 id="tilbud-title">{offer.title}</h1>
            {offer.status && <div className="badge">{offer.status.name}</div>}
          </div>

          {/* Intro */}
          <div className="intro">
            <p>{offer.description}</p> {/* Using offer.description from backend */}
            <p className="muted">Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
          </div>

          {/* Items */}
          <div className="items">
            {offer.services.map(service => (
              <div className="item" key={service.id}>
                <input
                  type="checkbox"
                  checked={selectedServiceIds.has(service.id)}
                  onChange={() => handleItemToggle(service.id)}
                  disabled={interactionDisabled} // Disable toggling if accepted or expired
                />
                <div>
                  <div className="title">{service.name}</div>
                  <div className="desc">{service.description}</div>
                </div>
                <div className="price">
                  {formatCurrency((service.price || 0) * (service.quantity || 1) * (1 - (service.discount || 0) / 100))}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="totals">
            <div className="row"><span>Subtotal</span><strong>{formatCurrency(currentSubtotal)}</strong></div>
            {offer.overallDiscount > 0 && (
              <div className="row">
                <span>Overall Discount ({offer.overallDiscount}%)</span>
                <strong>- {formatCurrency(currentSubtotal * (offer.overallDiscount / 100))}</strong>
              </div>
            )}
            <div className="row"><span>VAT (25%)</span><strong>{formatCurrency(vat)}</strong></div>
            <div className="row"><span style={{ fontWeight: 700 }}>Total</span><strong style={{ fontSize: '18px' }}>{formatCurrency(totalWithVat)}</strong></div>
          </div>

          {/* Customer Notes Textarea */}
          <div className="form-group mb-3" style={{ marginTop: '20px' }}>
            <label htmlFor="customerNotes" className="h2" style={{ marginBottom: '8px', display: 'block' }}>Your Notes (Optional)</label>
            <textarea
              id="customerNotes"
              className="form-control"
              rows="3"
              placeholder="Add any notes or special requests here..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              disabled={interactionDisabled} // Disable if accepted or expired
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                resize: 'vertical'
              }}
            ></textarea>
          </div>

          {/* Terms under totals */}
          <section className="terms-inside" aria-labelledby="betingelser-left">
            <h2 id="betingelser-left" className="h2">Terms</h2>
            <p className="muted">
              {offer.terms}
            </p>
          </section>

          <div className="terms-row">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={interactionDisabled} // Disable if accepted or expired
            />
            <label htmlFor="acceptTerms">I accept the <a href="#" target="_blank" rel="noopener">Terms & Conditions</a>.</label>
          </div>
          {/* CTAs */}
          <div className="cta">
            <button
              className={`btn btn-primary ${!acceptTerms || loading || interactionDisabled ? 'btn-disabled' : ''}`}
              type="button"
              onClick={handleAcceptQuote}
              disabled={!acceptTerms || loading || interactionDisabled}
            >
              {loading ? 'Processing...' : (offer.status.name === 'Accepted' ? 'Offer Accepted' : 'Accept Quote')}
            </button>
            <button
              className={`btn btn-secondary ${loading || interactionDisabled ? 'btn-disabled' : ''}`}
              type="button"
              onClick={handleAskQuestion}
              disabled={loading || interactionDisabled}
            >
              {loading ? 'Sending...' : 'Ask a Question'}
            </button>
          </div>
        </section>

        {/* RIGHT: About us with image + free text */}
        <aside>
          <section className="card" aria-labelledby="om-os">
            <div className="about-media">
              {/* This image URL will need to be fetched dynamically or configured */}
              <img src="https://placehold.co/600x400/FFF/000?text=About+Us+Image" alt="About Us billede" />
            </div>
            <h2 id="om-os" className="h2">About Us</h2>
            <div className="richtext" dangerouslySetInnerHTML={{ __html: offer.aboutUsContent || `<p>
<b>About Our Company:</b> We are a dedicated service provider focused on delivering top-quality results and exceptional customer experiences. Our mission is to make every interaction with us professional, friendly, and hassle-free.<br />

<b>Our Commitment:</b> We take pride in our attention to detail and reliability. Whether we are working at your home or business, we treat every project with care and respect.<br />

<b>Experienced Team:</b> Our skilled team members are carefully selected and trained to uphold our high standards, ensuring consistent results for all our clients.<br />

<b>Value You Can Trust:</b> We offer competitive rates without compromising on quality. Our clients trust us for dependable service that exceeds expectations.<br />

<b>Clear Communication:</b> We believe in open and honest communication, so you always know what to expect when working with us.</p>` }}></div>
          </section>

          {/* New Section for Customer's Acceptance Notes */}
          {offer.rememberNotes && (
            <section className="card mt-4" aria-labelledby="customer-notes-title">
              <h2 id="customer-notes-title" className="h2">Customer's Acceptance Notes</h2>
              <p className="muted">{offer.rememberNotes}</p>
            </section>
          )}

          {isOfferExpired && (
            <section className="card mt-4" style={{ backgroundColor: '#fee2e2', borderColor: '#ef4444', color: '#dc2626' }}>
              <h2 className="h2" style={{ color: '#dc2626' }}>Offer Expired</h2>
              <p>This offer has expired and can no longer be accepted or questioned.</p>
            </section>
          )}

        </aside>
      </main>

      <footer className="footer" role="contentinfo">
        © 2025 Navilead · CVR 12345678 · <a href="#" target="_blank" rel="noopener">Website</a>
      </footer>
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
};

export default OfferPage;