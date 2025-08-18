import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext'; // Assuming AuthContext provides authToken
import api from '../../utils/api'; // Assuming an API utility for requests

const PricingTemplateModal = ({ show, onHide, template, onSave }) => {
    // Access authentication token from AuthContext
    const { authToken } = useContext(AuthContext);
    // State to hold the form data for the template and its services
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        terms: '',
        currencyId: 1, // Default currency ID
        choiceType: 'multiple', // Default choice type for services
        services: [], // Array to hold individual line items (services)
    });
    // State to store the list of available currencies fetched from the API
    const [currencies, setCurrencies] = useState([]);
    // State to manage the submission process (e.g., to disable button)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Effect to fetch available currencies when the modal component mounts
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const response = await api.get('/currencies');
                setCurrencies(response.data); // Update currencies state
                // If this is a new template and no currency is set, default to the first fetched currency
                if (!template && !formData.currencyId && response.data.length > 0) {
                    setFormData(prev => ({ ...prev, currencyId: response.data[0].id }));
                }
            } catch (error) {
                console.error("Error fetching currencies:", error);
                toast.error('Failed to fetch currencies.');
            }
        };
        fetchCurrencies();
    }, []); // Empty dependency array means this runs only once on mount

    // Effect to populate form data when 'template' prop changes (for editing)
    useEffect(() => {
        if (template) {
            // If a template object is provided (editing an existing template)
            setFormData({
                name: template.name,
                title: template.title,
                description: template.description || '', // Use empty string if null/undefined
                terms: template.terms || '', // Use empty string if null/undefined
                currencyId: template.currencyId,
                choiceType: template.choiceType,
                // Map existing services, ensuring each has a unique 'id' for React list keys
                services: template.services.map(s => ({ ...s, id: s.id || Date.now() + Math.random() })),
            });
        } else {
            // If no template object (creating a new template)
            setFormData({
                name: '',
                title: '',
                description: '',
                terms: '',
                currencyId: currencies.length > 0 ? currencies[0].id : 1, // Set default to first currency or 1
                choiceType: 'multiple',
                // Initialize with one empty service line item
                services: [{ name: '', description: '', price: 0, quantity: 1, isRequired: true, id: Date.now() }],
            });
        }
    }, [template, currencies]); // Re-run effect if 'template' or 'currencies' change

    // Effect to manage body scroll behavior when the modal is shown/hidden
    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open'); // Add class to body to prevent scrolling
        } else {
            document.body.classList.remove('modal-open'); // Remove class when modal is hidden
        }
        // Cleanup function: ensures class is removed if component unmounts while modal is open
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [show]); // Re-run effect if 'show' prop changes

    // Handler for changes in the main template input fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'currencyId' ? parseInt(value, 10) : value, // convert currencyId to number
        }));
    };


    // Handler for changes in individual service line item fields
    const handleServiceChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newServices = [...formData.services];
    if (type === 'checkbox') {
        newServices[index][name] = checked; // boolean ✅
    } else {
        newServices[index][name] = type === 'number' ? parseFloat(value) : value; // number or string
    }
    setFormData(prev => ({ ...prev, services: newServices }));
    };



    // Function to add a new empty service line item to the form
    const addService = (e) => {
        e.preventDefault(); // Prevent default link behavior
        setFormData(prev => ({
            ...prev,
            services: [...prev.services, { name: '', description: '', price: 0, quantity: 1, isRequired: true, id: Date.now() + Math.random() }]
        }));
    };

    // Function to remove a service line item from the form
    const removeService = (index, e) => {
        e.preventDefault(); // Prevent default link behavior
        // Filter out the service at the specified index
        const newServices = formData.services.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, services: newServices }));
    };

    // Handler for form submission (creates or updates a template)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setIsSubmitting(true); // Set submitting status to true

        const method = template ? 'put' : 'post'; // Determine HTTP method (PUT for edit, POST for new)
        const url = template ? `/pricing-templates/${template.id}` : '/pricing-templates'; // Determine API endpoint

        try {
            // Make API call to save the template data
            await api[method](url, formData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            toast.success(`Template ${template ? 'updated' : 'created'} successfully!`);
            onSave(); // Call the onSave callback passed from the parent component
        } catch (error) {
            console.error("Error saving template:", error);
            // Display error message from API if available, otherwise generic
            toast.error(`Failed to ${template ? 'update' : 'create'} template.`);
        } finally {
            setIsSubmitting(false); // Reset submitting status
        }
    };

    // Calculate total price for all required services
    const requiredItemsTotal = formData.services
        .filter(s => s.isRequired) // Filter for required services
        .reduce((total, s) => total + (s.price * s.quantity), 0); // Sum their total price

    // Calculate the maximum possible total value (sum of all services)
    const maximumTotalValue = formData.services.reduce((total, s) => total + (s.price * s.quantity), 0);

    // Determine the currency code and symbol for display
    const selectedCurrency = currencies.find(c => c.id === formData.currencyId);
    const currencyCode = selectedCurrency?.code || 'USD';
    const currencySymbol = selectedCurrency?.symbol || '$';

    // If 'show' prop is false, do not render the modal
    if (!show) return null;

    return (
        // Modal overlay and container. 'show d-block' classes are added to display it.
        <div className={`modal fade modaldesign pricingmodal ${show ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden={!show}>
            <div className="modal-dialog" role="document">
                <div className="modal-content">

                    {/* Modal Header */}
                    <div className="modal-header">
                        <h4 className="modal-title">
                            {template ? 'Edit Pricing Template' : 'Create Pricing Template'} {/* Dynamic title */}
                            <p>Configure your template with required and optional line items that clients can customize.</p>
                        </h4>
                        {/* Close button for the modal */}
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body">
                        <div className="formdesign">
                            <form onSubmit={handleSubmit}>
                                {/* Template Name and Currency Selection Row */}
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label htmlFor="templateName">Template Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="templateName"
                                                name="name" // Matches formData key
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Website Development Package"
                                                required // HTML5 required attribute
                                            />
                                            <span className="inputnote">Internal use</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label htmlFor="currencySelect">Currency</label>
                                            <div className="inputselect">
                                                <select
                                                    className="form-select"
                                                    id="currencySelect"
                                                    name="currencyId" // Matches formData key
                                                    value={formData.currencyId}
                                                    onChange={handleInputChange}
                                                >
                                                    {/* Populate currency options dynamically */}
                                                    {currencies.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.code} ({c.symbol})
                                                        </option>
                                                    ))}
                                                </select>
                                                {/* Chevron icon for dropdown */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down size-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Template Title Field */}
                                <div className="form-group">
                                    <label htmlFor="templateTitle">Title *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="templateTitle"
                                        name="title" // Matches formData key
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Complete Website Solution"
                                        required
                                    />
                                    <span className="inputnote">This title will be shown to clients</span>
                                </div>

                                {/* Template Description Field */}
                                <div className="form-group">
                                    <label htmlFor="templateDescription">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        id="templateDescription"
                                        name="description" // Matches formData key
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description of this template..."
                                    ></textarea>
                                </div>

                                {/* Line Items Section Header and Add Button */}
                                <div class="workflowsadd">
                                    <h2 class="card-title">Line Items <p>Configure services and mark them as required or optional for clients</p></h2>
                                    <a href="#" class="btn btn-add" onClick={addService}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Add Line Item</a>
                                </div>


                                {/* Dynamic Rendering of Line Items */}
                                {formData.services.map((service, index) => (
                                    <div className="carddesign lineitemsbox" key={service.id}> {/* Unique key for each service */}
                                        <h2 className="card-title">
                                            Line Item {index + 1}
                                            {service.isRequired && ( // Conditionally show 'Required' status
                                                <span className="status">
                                                    {/* Lock icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock w-3 h-3 mr-1" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    Required
                                                </span>
                                            )}
                                            {/* Button to remove this specific line item */}
                                            <a href="#" className="btn btn-add" onClick={(e) => removeService(index, e)}>
                                                {/* X icon for remove */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x m-0" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                            </a>
                                        </h2>
                                        <div className="row lineitemsinputs">
                                            {/* Service Name */}
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor={`serviceName-${index}`}>Service Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id={`serviceName-${index}`}
                                                        name="name"
                                                        value={service.name}
                                                        onChange={(e) => handleServiceChange(index, e)}
                                                        placeholder="e.g., Complete Website Solution"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {/* Service Price */}
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor={`servicePrice-${index}`}>Price *</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id={`servicePrice-${index}`}
                                                        name="price"
                                                        value={service.price}
                                                        onChange={(e) => handleServiceChange(index, e)}
                                                        placeholder="0"
                                                        required
                                                        min="0" // Ensure price is non-negative
                                                    />
                                                </div>
                                            </div>
                                            {/* Service Quantity */}
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor={`serviceQuantity-${index}`}>Quantity</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id={`serviceQuantity-${index}`}
                                                        name="quantity"
                                                        value={service.quantity}
                                                        onChange={(e) => handleServiceChange(index, e)}
                                                        placeholder="1"
                                                        required
                                                        min="1" // Ensure quantity is at least 1
                                                    />
                                                </div>
                                            </div>
                                            {/* Service Total (Read-only) */}
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label>Total</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={`${currencyCode} ${new Intl.NumberFormat('en-US').format(service.price * service.quantity)}`}
                                                        readOnly // Make this input read-only
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Required/Optional Switch for Service */}
                                        <div className="switchbtn itemswitch">
                                            <div className="itemswitchbtn">
                                                <span className="itemtype">Item Type:</span>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        name="isRequired"
                                                        checked={service.isRequired}
                                                        onChange={(e) => handleServiceChange(index, e)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label><span className="switchbtntext">{service.isRequired ? 'Required' : 'Optional'}</span>
                                            </div>
                                            <div className="itemswitchtaxt">Clients {service.isRequired ? 'cannot' : 'can'} deselect this item</div>
                                        </div>
                                        {/* Service Description */}
                                        <div className="form-group mb-0">
                                            <label htmlFor={`serviceDescription-${index}`}>Description</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                id={`serviceDescription-${index}`}
                                                name="description"
                                                value={service.description || ''}
                                                onChange={(e) => handleServiceChange(index, e)}
                                                placeholder="Service description..."
                                            ></textarea>
                                        </div>
                                    </div>
                                ))}

                                {/* Terms and Conditions Field */}
                                <div className="form-group">
                                    <label htmlFor="termsAndConditions">Terms and Conditions</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        id="termsAndConditions"
                                        name="terms" // Matches formData key
                                        value={formData.terms}
                                        onChange={handleInputChange}
                                        placeholder="Standard terms and conditions for this template..."
                                    ></textarea>
                                </div>

                                {/* Totals Section (Required Items Total and Maximum Total Value) */}
                                <div className="row itemrequiredrow">
                                    <div className="col-md-6">
                                        <div className="carddesign itemrequired">
                                            <h4><label>Required Items Total:</label><span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(requiredItemsTotal)}</span></h4>
                                            <p>{formData.services.filter(s => s.isRequired).length} required item(s)</p>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="carddesign itemrmaximum">
                                            <h4><label>Maximum Total Value:</label><span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(maximumTotalValue)}</span></h4>
                                            <p>{formData.services.length} total item(s) ({formData.services.filter(s => !s.isRequired).length} optional)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer with Action Buttons */}
                                <div className="modalfooter btn-right">
                                    <button type="button" className="btn btn-add" onClick={onHide}>Cancel</button>
                                    <button
                                        type="submit"
                                        className="btn btn-send"
                                        disabled={isSubmitting || formData.services.length === 0 || formData.services.some(s => !s.name || s.price < 0 || s.quantity < 1)}
                                    >
                                        {isSubmitting ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingTemplateModal;