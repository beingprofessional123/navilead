import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AddPaymentMethodModal from './AddPaymentMethodModal';

const BillingPaymentTab = ({ paymentMethods, setPaymentMethods }) => {
  const { t } = useTranslation();
  const { authToken,user } = useContext(AuthContext);

  const [billingInfo, setBillingInfo] = useState({
    companyName: '',
    cvrNumber: '',
    address: '',
    cityPostalCode: '',
    emailNotifications: false,
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Prefill billing form
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      const billingCard = paymentMethods[0];
      setBillingInfo({
        companyName: billingCard.companyName || user.companyName,
        cvrNumber: billingCard.cvrNumber || '',
        address: billingCard.address || '',
        cityPostalCode: billingCard.cityPostalCode || '',
        emailNotifications: billingCard.emailNotifications || false,
        isDefault: billingCard.isDefault || false,
        id: billingCard.id || null
      });
    }
  }, [paymentMethods]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBillingInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const billingPayload = {
        companyName: billingInfo.companyName,
        cvrNumber: billingInfo.cvrNumber,
        address: billingInfo.address,
        cityPostalCode: billingInfo.cityPostalCode,
        emailNotifications: billingInfo.emailNotifications,
        isDefault: billingInfo.isDefault,
      };

      let response;
      if (billingInfo.id) {
        response = await api.put(`/paymentMethods/${billingInfo.id}?type=form`, billingPayload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success('Billing info updated successfully!');
      } else {
        response = await api.post(`/paymentMethods?type=form`, billingPayload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success('Billing info added successfully!');
      }

      const updatedPaymentMethods = billingInfo.id
        ? paymentMethods.map(m => m.id === billingInfo.id ? response.data : m)
        : [...paymentMethods, response.data];

      setPaymentMethods(updatedPaymentMethods);
      setBillingInfo(prev => ({ ...prev, id: response.data.id }));

    } catch (err) {
      console.error(err);
      toast.error('Failed to save billing info.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal for new or edit card
  const handleNewPaymentMethod = (card = null) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  // Handle modal success
  const handleModalSuccess = (updatedCard) => {
    setPaymentMethods(prev =>
      editingCard
        ? prev.map(m => (m.id === updatedCard.id ? updatedCard : m))
        : [...prev, updatedCard]
    );
    setIsModalOpen(false);
  };

  return (
    <div id="menu3" className="tab-pane fade">
      <div className="planactive-heading">
        <div>
          <h2 className="card-title">{t('paymentMethods.title')}</h2>
          <p>{t('paymentMethods.subtitle')}</p>
        </div>
        {/* {(!paymentMethods || paymentMethods.length === 0) && (
          <Link to="" className="btn btn-send" onClick={(e) => { e.preventDefault(); handleNewPaymentMethod(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
              <path d="M5 12h14"></path><path d="M12 5v14"></path>
            </svg>{t('paymentMethods.addCardButton')}
          </Link>
        )} */}
      </div>

      {/* Payment Methods List */}
      <div className="row">
        {paymentMethods.map(method => (
          <div className="col-md-6" key={method.id}>
            <div className="carddesign paymentmethodsbg">
              <div className="paymentmethodscard">
                <span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card" aria-hidden="true">
                    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                    <line x1="2" x2="22" y1="10" y2="10"></line>
                  </svg>
                </span>
                <div className="paymentmethodscard-desc">
                  <h4>**** **** **** {method.cardNumber.slice(-4)}</h4>
                  <p>{t('paymentMethods.expires')} {method.expiryDate}</p>
                </div>
              </div>
              <div className="paymentmethods-action">
                {method.isDefault && <div className="status status7">{t('paymentMethods.standard')}</div>}
                <button className="btn btn-add" onClick={(e) => { e.preventDefault(); handleNewPaymentMethod(method); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen m-0" aria-hidden="true">
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Billing Settings */}
      <div className="carddesign billingsettings">
        <form onSubmit={handleBillingSubmit}>
          <div className="planactive-heading">
            <div>
              <h2 className="card-title">{t('billingSettings.title')}</h2>
            </div>
            <button type="submit" className="btn btn-send" disabled={isSubmitting}>{t('button.save')}</button>
          </div>
          <div className="formdesign">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>{t('billingSettings.companyName')}</label>
                  <input type="text" className="form-control" name="companyName" value={billingInfo.companyName} onChange={handleChange} />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>{t('billingSettings.cvrNumber')}</label>
                  <input type="text" className="form-control" name="cvrNumber" value={billingInfo.cvrNumber} onChange={handleChange}/>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>{t('billingSettings.address')}</label>
                  <input type="text" className="form-control" name="address" value={billingInfo.address} onChange={handleChange}/>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>{t('billingSettings.cityPostalCode')}</label>
                  <input type="text" className="form-control" name="cityPostalCode" value={billingInfo.cityPostalCode} onChange={handleChange}/>
                </div>
              </div>
            </div>
            <div className="planactive-heading mb-0">
              <div>
                <h2 className="card-title">{t('emailNotifications.title')}</h2>
                <p>{t('emailNotifications.subtitle')}</p>
              </div>
              <div className="switchbtn">
                <label className="switch">
                  <input type="checkbox" name="emailNotifications" checked={billingInfo.emailNotifications} onChange={handleChange} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Add/Edit Payment Method Modal */}
      <AddPaymentMethodModal
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={editingCard}
      />
    </div>
  );
};

export default BillingPaymentTab;
