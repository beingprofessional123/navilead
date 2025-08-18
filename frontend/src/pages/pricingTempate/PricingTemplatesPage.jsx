import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../context/AuthContext'; // Assuming AuthContext provides authToken
import api from '../../utils/api'; // Assuming an API utility for requests
import PricingTemplateModal from './PricingTemplateModal'; // Import the new modal component

const PricingTemplatesPage = () => {
    // Access authentication token from AuthContext
    const { authToken } = useContext(AuthContext);
    // State to store the list of pricing templates
    const [templates, setTemplates] = useState([]);
    // State to manage loading status while fetching data
    const [loading, setLoading] = useState(true);
    // State to control the visibility of the modal
    const [modalShow, setModalShow] = useState(false);
    // State to hold the data of the template currently being edited (null for new template)
    const [currentTemplate, setCurrentTemplate] = useState(null);

    // Function to fetch pricing templates from the backend API
    const fetchPricingTemplates = async () => {
        // Check if authentication token is available
        if (!authToken) {
            setLoading(false); // Stop loading if no token
            toast.error('Authentication token not found.');
            return;
        }
        setLoading(true); // Start loading before API call
        try {
            // Make GET request to fetch templates
            const response = await api.get('/pricing-templates', {
                headers: { Authorization: `Bearer ${authToken}` }, // Include auth token in headers
            });
            setTemplates(response.data); // Update state with fetched data
        } catch (error) {
            console.error("Error fetching pricing templates:", error);
            toast.error('Failed to fetch pricing templates.');
        } finally {
            setLoading(false); // Stop loading after API call completes (success or failure)
        }
    };

    // useEffect hook to call fetchPricingTemplates when the component mounts or authToken changes
    useEffect(() => {
        fetchPricingTemplates();
    }, [authToken]); // Dependency array: re-run effect if authToken changes

    // Handler to open the modal for creating a new template
    const handleCreateTemplate = () => {
        setCurrentTemplate(null); // Set currentTemplate to null to indicate new creation
        setModalShow(true); // Show the modal
    };

    // Handler to open the modal for editing an existing template
    const handleEditTemplate = (template) => {
        setCurrentTemplate(template); // Set the template data to populate the modal form
        setModalShow(true); // Show the modal
    };

    // Handler to delete a pricing template
    const handleDeleteTemplate = async (templateId) => {
        // Show a confirmation dialog before deleting
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) { // If user confirms deletion
                try {
                    // Make DELETE request to delete the template
                    await api.delete(`/pricing-templates/${templateId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    });
                    toast.success('Template deleted successfully!');
                    fetchPricingTemplates(); // Re-fetch templates to update the list
                } catch (error) {
                    console.error("Error deleting template:", error);
                    toast.error('Failed to delete template.');
                }
            }
        });
    };

    // Callback function passed to the modal, called after successful save (create/edit)
    const handleSaveTemplate = () => {
        fetchPricingTemplates(); // Re-fetch templates to reflect changes
        setModalShow(false); // Hide the modal
    };

    // Display a loading message while data is being fetched
    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="mainbody">
            <div className="container-fluid">
                {/* Top Row: Heading and New Template Button */}
                <div className="row top-row">
                    <div className="col-md-6">
                        <div className="dash-heading">
                            <h2>Pricing Templates</h2>
                            <p>Manage pricing templates for quick quotes</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="dashright">
                            <a href="#" className="btn btn-send" onClick={handleCreateTemplate}>
                                {/* Plus icon for 'New Template' */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus" aria-hidden="true">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5v14"></path>
                                </svg>
                                New Template
                            </a>
                        </div>
                    </div>
                </div>

                {/* Templates Display Row */}
                <div className="row">
                    {templates.length > 0 ? (
                        // Map over the templates array to render each template card
                        templates.map((template) => (
                            <div className="col-md-4" key={template.id}> {/* Unique key for React list rendering */}
                                <div className="carddesign emailcard">
                                    <h2 className="card-title">
                                        {/* File text icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
                                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                                            <path d="M10 9H8"></path>
                                            <path d="M16 13H8"></path>
                                            <path d="M16 17H8"></path>
                                        </svg>
                                        {template.name} {/* Template name */}
                                    </h2>
                                    {/* Display number of services dynamically */}
                                    <p>{template.services ? template.services.length : 0} services</p>
                                    {/* Calculate and display total price, formatted with currency */}
                                    <h4>
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: template.currency?.code || 'USD' // Use template's currency code or default to USD
                                        }).format(
                                            template.services ? template.services.reduce((total, service) => total + (service.price * service.quantity), 0) : 0
                                        )}
                                    </h4>
                                    <div className="pricing-cardbtn">
                                        {/* Edit button: opens modal with template data */}
                                        <a href="#" className="btn btn-add" onClick={() => handleEditTemplate(template)}>Edit</a>
                                        {/* Use button: links to a separate page for using the template */}
                                        <Link to="#" className="btn btn-add">Use</Link>
                                        {/* Delete button: triggers confirmation dialog and deletion */}
                                        <a href="#" className="btn btn-add" onClick={() => handleDeleteTemplate(template.id)}>Delete</a>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Message displayed if no templates are found
                        <div className="col-12 text-center">
                            <p>No pricing templates found. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Conditional rendering of the PricingTemplateModal */}
            {modalShow && (
                <PricingTemplateModal
                    show={modalShow} // Pass true/false to control modal visibility
                    onHide={() => setModalShow(false)} // Callback to hide the modal when closed
                    template={currentTemplate} // Pass currentTemplate for pre-filling edit form
                    onSave={handleSaveTemplate} // Callback to refresh templates after save
                />
            )}
        </div>
    );
};

export default PricingTemplatesPage;