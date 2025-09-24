import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { useTranslation } from "react-i18next"; // Import useTranslation

const PricingTemplateModal = ({ show, onHide, template, onSave }) => {
    const { authToken ,user } = useContext(AuthContext);
    const { t: translate } = useTranslation(); // Initialize the translation hook

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        terms: '',
        currencyId: user.currency,
        choiceType: 'multiple',
        services: [],
    });
    const [currencies, setCurrencies] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await api.get('/currencies');
                // Ensure IDs are numbers
                const currenciesData = response.data.map(c => ({ ...c, id: Number(c.id) }));
                setCurrencies(currenciesData);

                if (!template && !formData.currencyId && currenciesData.length > 0) {
                    setFormData(prev => ({ ...prev, currencyId: currenciesData[0].id }));
                }
            } catch (error) {
                console.error("Error fetching currencies:", error);
                toast.error(translate('api.currencies.fetchError')); // Translated
            }
        };
        fetchCurrencies();
    }, [translate]);

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                title: template.title,
                description: template.description || '',
                terms: template.terms || '',
                currencyId: template.currencyId,
                choiceType: template.choiceType,
                services: template.services.map(s => ({ ...s, id: s.id || Date.now() + Math.random() })),
            });
        } else {
            setFormData({
                name: '',
                title: '',
                description: '',
                terms: '',
                currencyId: user.currency || (currencies.length > 0 ? currencies[0].id : 1), // Use user currency first
                choiceType: 'multiple',
                services: [{ name: '', description: '', price: 0, quantity: 1, isRequired: true, id: Date.now() }],
            });
        }
    }, [template, currencies, translate, user.currency ]); // Added translate to dependencies

    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [show]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'currencyId' ? parseInt(value, 10) : value,
        }));
    };

    const handleServiceChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newServices = [...formData.services];
        if (type === 'checkbox') {
            newServices[index][name] = checked;
        } else {
            newServices[index][name] = type === 'number' ? parseFloat(value) : value;
        }
        setFormData(prev => ({ ...prev, services: newServices }));
    };

    const addService = (e) => {
        e.preventDefault();
        setFormData(prev => ({
            ...prev,
            services: [...prev.services, { name: '', description: '', price: 0, quantity: 1, isRequired: true, id: Date.now() + Math.random() }]
        }));
    };

    const removeService = (index, e) => {
        e.preventDefault();
        const newServices = formData.services.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, services: newServices }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const method = template ? 'put' : 'post';
        const url = template ? `/pricing-templates/${template.id}` : '/pricing-templates';
        const actionTextKey = template ? 'updated' : 'created'; // Used for dynamic translation

        try {
            const response = await api[method](url, formData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(translate('api.pricingTemplateModal.saveSuccess', { action: translate(`api.pricingTemplateModal.${actionTextKey}`) })); // Translated
            onSave();
        } catch (error) {
            console.error("Error saving template:", error);
            const actionTextKey = template ? 'update' : 'create'; // Used for dynamic translation
            toast.error(translate('api.pricingTemplateModal.saveError', { action: translate(`api.pricingTemplateModal.${actionTextKey}`) })); // Translated
        } finally {
            setIsSubmitting(false);
        }
    };

    const requiredItemsTotal = formData.services
        .filter(s => s.isRequired)
        .reduce((total, s) => total + (s.price * s.quantity), 0);

    const maximumTotalValue = formData.services.reduce((total, s) => total + (s.price * s.quantity), 0);

    const selectedCurrency = currencies.find(c => c.id === Number(formData.currencyId));
    const currencyCode = selectedCurrency?.code || 'USD';
    const currencySymbol = selectedCurrency?.symbol || '$';

    if (!show) return null;

    return (
        <>
            <div className={`${show ? 'modal-backdrop fade show' : ''}`}></div>
            <div className={`modal modaldesign pricingmodal ${show ? 'd-block' : ''}`} tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden={!show}>
                <div className="modal-dialog" role="document">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h4 className="modal-title">
                                {template ? translate('pricingTemplateModal.editTemplateTitle') : translate('pricingTemplateModal.createTemplateTitle')}
                                <p>{translate('pricingTemplateModal.configureTemplateDescription')}</p>
                            </h4>
                            <button type="button" className="btn-close" onClick={onHide} aria-label={translate('sendQuoteModal.cancel')}> {/* Reusing cancel from sendQuoteModal */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucience-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="formdesign">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label htmlFor="templateName">{translate('pricingTemplateModal.templateNameLabel')}</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="templateName"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder={translate('pricingTemplateModal.templateNamePlaceholder')}
                                                    required
                                                />
                                                <span className="inputnote">{translate('pricingTemplateModal.internalUseNote')}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label htmlFor="currencySelect">{translate('pricingTemplateModal.currencyLabel')}</label>
                                                <div className="inputselect">
                                                    <select
                                                        className="form-select"
                                                        id="currencySelect"
                                                        name="currencyId"
                                                        value={formData.currencyId}
                                                        onChange={handleInputChange}
                                                    >
                                                        {currencies.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.code} ({c.symbol})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="templateTitle">{translate('pricingTemplateModal.titleLabel')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="templateTitle"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder={translate('pricingTemplateModal.titlePlaceholder')}
                                            required
                                        />
                                        <span className="inputnote">{translate('pricingTemplateModal.clientVisibleTitleNote')}</span>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="templateDescription">{translate('pricingTemplateModal.descriptionLabel')}</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            id="templateDescription"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder={translate('pricingTemplateModal.descriptionPlaceholder')}
                                        ></textarea>
                                    </div>

                                    <div className="workflowsadd">
                                        <h2 className="card-title">{translate('pricingTemplateModal.lineItemsTitle')} <p>{translate('pricingTemplateModal.lineItemsDescription')}</p></h2>
                                        <a href="#" className="btn btn-add" onClick={addService}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>{translate('pricingTemplateModal.addLineItemButton')}</a>
                                    </div>

                                    {formData.services.map((service, index) => (
                                        <div className="carddesign lineitemsbox" key={service.id}>
                                            <h2 className="card-title">
                                                {translate('pricingTemplateModal.lineItemHeader', { number: index + 1 })}
                                                {service.isRequired && (
                                                    <span className="status">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock w-3 h-3 mr-1" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                        {translate('pricingTemplateModal.requiredStatus')}
                                                    </span>
                                                )}
                                                <a href="#" className="btn btn-add" onClick={(e) => removeService(index, e)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x m-0" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                                </a>
                                            </h2>
                                            <div className="row lineitemsinputs">
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor={`serviceName-${index}`}>{translate('pricingTemplateModal.serviceNameLabel')}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            id={`serviceName-${index}`}
                                                            name="name"
                                                            value={service.name}
                                                            onChange={(e) => handleServiceChange(index, e)}
                                                            placeholder={translate('pricingTemplateModal.serviceNamePlaceholder')}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor={`servicePrice-${index}`}>{translate('pricingTemplateModal.priceLabel')}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id={`servicePrice-${index}`}
                                                            name="price"
                                                            value={service.price}
                                                            onChange={(e) => handleServiceChange(index, e)}
                                                            placeholder="0"
                                                            required
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor={`serviceQuantity-${index}`}>{translate('pricingTemplateModal.quantityLabel')}</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id={`serviceQuantity-${index}`}
                                                            name="quantity"
                                                            value={service.quantity}
                                                            onChange={(e) => handleServiceChange(index, e)}
                                                            placeholder="1"
                                                            required
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label>{translate('pricingTemplateModal.totalLabel')}</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={`${currencyCode} ${new Intl.NumberFormat('en-US').format(service.price * service.quantity)}`}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="switchbtn itemswitch">
                                                <div className="itemswitchbtn">
                                                    <span className="itemtype">{translate('pricingTemplateModal.itemType')}</span>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            name="isRequired"
                                                            checked={service.isRequired}
                                                            onChange={(e) => handleServiceChange(index, e)}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label><span className="switchbtntext">{service.isRequired ? translate('pricingTemplateModal.requiredText') : translate('pricingTemplateModal.optionalText')}</span>
                                                </div>
                                                <div className="itemswitchtaxt">
                                                    {service.isRequired ? translate('pricingTemplateModal.clientCannotDeselect') : translate('pricingTemplateModal.clientCanDeselect')}
                                                </div>
                                            </div>
                                            <div className="form-group mb-0">
                                                <label htmlFor={`serviceDescription-${index}`}>{translate('pricingTemplateModal.descriptionLabel')}</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    id={`serviceDescription-${index}`}
                                                    name="description"
                                                    value={service.description || ''}
                                                    onChange={(e) => handleServiceChange(index, e)}
                                                    placeholder={translate('pricingTemplateModal.serviceDescriptionPlaceholder')}
                                                ></textarea>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="form-group">
                                        <label htmlFor="termsAndConditions">{translate('pricingTemplateModal.termsAndConditionsLabel')}</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            id="termsAndConditions"
                                            name="terms"
                                            value={formData.terms}
                                            onChange={handleInputChange}
                                            placeholder={translate('pricingTemplateModal.termsAndConditionsPlaceholder')}
                                        ></textarea>
                                    </div>

                                    <div className="row itemrequiredrow">
                                        <div className="col-md-6">
                                            <div className="carddesign itemrequired">
                                                <h4><label>{translate('pricingTemplateModal.requiredItemsTotal')}</label><span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(requiredItemsTotal)}</span></h4>
                                                <p>{translate('pricingTemplateModal.requiredItemsCount', { count: formData.services.filter(s => s.isRequired).length })}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="carddesign itemrmaximum">
                                                <h4><label>{translate('pricingTemplateModal.maximumTotalValue')}</label><span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(maximumTotalValue)}</span></h4>
                                                <p>{translate('pricingTemplateModal.totalItemsCount', { totalCount: formData.services.length, optionalCount: formData.services.filter(s => !s.isRequired).length })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modalfooter btn-right">
                                        <button type="button" className="btn btn-add" onClick={onHide}>{translate('pricingTemplateModal.cancelButton')}</button>
                                        <button
                                            type="submit"
                                            className="btn btn-send"
                                            disabled={isSubmitting || formData.services.length === 0 || formData.services.some(s => !s.name || s.price < 0 || s.quantity < 1)}
                                        >
                                            {isSubmitting ? translate('pricingTemplateModal.savingButton') : (template ? translate('pricingTemplateModal.updateTemplateButton') : translate('pricingTemplateModal.createTemplateButton'))}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PricingTemplateModal;
