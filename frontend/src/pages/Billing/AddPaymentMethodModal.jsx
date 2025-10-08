import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const AddPaymentMethodModal = ({ isModalOpen, onClose, onSuccess, editData }) => {
  const { t } = useTranslation();
  const { authToken } = useContext(AuthContext);

  console.log(editData);

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
    cardType: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editing, prefill form
  useEffect(() => {
    if (editData) {
      setCardDetails(editData);
    }
  }, [editData]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for expiry date
    if (name === 'expiryDate') {
      // Remove non-digits
      let formatted = value.replace(/[^\d]/g, '');

      // Insert slash after 2 digits
      if (formatted.length > 2) {
        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
      }

      // Limit to 5 characters
      setCardDetails(prev => ({ ...prev, [name]: formatted.slice(0, 5) }));
    } else {
      // Normal handling for other inputs
      setCardDetails(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let response;
      if (editData) {
        // update card
        response = await api.put(`/paymentMethods/${editData.id}?type=model`, cardDetails, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success(t('paymentMethodModal.cardUpdated'));
      } else {
        // add card
        response = await api.post(`/paymentMethods?type=model`, cardDetails, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        toast.success(t('paymentMethodModal.cardAdded'));
      }
      onSuccess(response.data); // send updated card back to parent
    } catch (err) {
      console.error(err);
      toast.error(t('paymentMethodModal.errorSavingCard'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null; // hide if not open
  return (
    <>
      <div className={`${onClose ? 'modal-backdrop fade show' : ''}`}></div>
      <div className={`modal fade modaldesign addpaymentmethod-modal ${isModalOpen ? 'show d-block' : 'd-none'}`} aria-hidden={!isModalOpen}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                {editData ? t('paymentMethodModal.editCardTitle') : t('paymentMethodModal.addCardTitle')}
              </h4>
              <button type="button" className="btn-close" onClick={onClose}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="formdesign">
                  <div className="form-group"><label>{t('paymentMethodModal.cardNumber')}</label><input type="text" name="cardNumber" className="form-control" value={cardDetails.cardNumber} onChange={handleChange} placeholder="****" maxLength="4" required /></div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>{t('paymentMethodModal.expiryDate')}</label>
                        <input type="text" name="expiryDate" className="form-control" value={cardDetails.expiryDate} onChange={handleChange} placeholder="MM/YY" maxLength="5" required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>{t('paymentMethodModal.cvc')}</label>
                        <input type="text" name="cvc" className="form-control" value={cardDetails.cvc} onChange={handleChange} placeholder="CVC" maxLength="4" required />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('paymentMethodModal.cardholderName')}</label>
                    <input type="text" name="cardholderName" className="form-control" value={cardDetails.cardholderName} onChange={handleChange} placeholder={t('paymentMethodModal.cardholderName')} required />
                  </div>
                  <div className="form-group">
                    <label>{t('paymentMethodModal.cardType')}</label>
                    <input type="text" name="cardType" className="form-control" value={cardDetails.cardType} onChange={handleChange} placeholder={t('paymentMethodModal.cardType')} required />
                  </div>
                  <div className="switchbtn">
                    <label className="switch">
                      <input type="checkbox"checked disabled/>
                      <span className="slider round" ></span>
                    </label><span className="switchbtntext">{t('paymentMethodModal.defaultCard')}</span>
                  </div>
                </div>
                <div className="modalfooter btn-right">
                  <button type="button" className="btn btn-add" data-bs-dismiss="modal" onClick={onClose}>{t('button.cancel')}</button>
                  <button type="submit" className="btn btn-send" disabled={isSubmitting}>
                    {isSubmitting ? t('button.save') : editData ? t('button.save') : t('button.addCard')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPaymentMethodModal;



