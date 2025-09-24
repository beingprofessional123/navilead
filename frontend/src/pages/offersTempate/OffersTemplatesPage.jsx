import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import MobileHeader from '../../components/common/MobileHeader';
import { toast } from 'react-toastify';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Link } from 'react-router-dom';

const OffersTemplatesPage = () => {
    const { authToken, user } = useContext(AuthContext);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCustom, setIsCustom] = useState(false);
    const defaultColors = {
        mainBgColor: '#101418',  // main page background
        leftCardBgColor: '#101418',  // left card (form)
        rightCardBgColor: '#101418', // right card (preview)
        textColor: '#ccffff',
        subTextColor: '#8cd9d9',
    };
    const [formData, setFormData] = useState({
        title: '',
        companyName: user?.companyName || '',
        companyLogo: null, // This will only hold a new file, not a URL
        aboutUsLogo: null,
        aboutUsDescription: '',
        htmlCode: '',
        ...defaultColors,
    });

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/offerstyle.css'; // path relative to public/
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link); // cleanup when page unmounts
        };
    }, []);

    const fetchUserTemplate = async () => {
        try {
            const response = await api.get('/offers-templates', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (response.data && response.data.length > 0) {
                const templateData = response.data[0]; // ✅ first object in array
                setTemplate(templateData);
                setFormData({
                    title: templateData.title || '',
                    companyName: templateData.companyName || user?.companyName || '',
                    aboutUsDescription: templateData.aboutUsDescription || '',
                    companyLogo: null,
                    aboutUsLogo: null,
                    mainBgColor: templateData.mainBgColor,  // main page background
                    leftCardBgColor: templateData.leftCardBgColor,  // left card (form)
                    rightCardBgColor: templateData.rightCardBgColor, // right card (preview)
                    textColor: templateData.textColor,
                    subTextColor: templateData.subTextColor,
                });
                setIsCustom(templateData.customHtml);
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

    const handleFormChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title);
        formDataToSend.append("companyName", formData.companyName);
        formDataToSend.append("aboutUsDescription", formData.aboutUsDescription);
        formDataToSend.append("mainBgColor", formData.mainBgColor);
        formDataToSend.append("leftCardBgColor", formData.leftCardBgColor);
        formDataToSend.append("rightCardBgColor", formData.rightCardBgColor);
        formDataToSend.append("textColor", formData.textColor);
        formDataToSend.append("subTextColor", formData.subTextColor);

        if (formData.companyLogo) {
            formDataToSend.append("companyLogo", formData.companyLogo);
        }
        if (formData.aboutUsLogo) {
            formDataToSend.append("aboutUsLogo", formData.aboutUsLogo);
        }

        try {
            let response;
            if (template) {
                response = await api.put(`/offers-templates/${template.id}`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                toast.success("Template updated successfully!");
            }
            if (response.data && response.data.length > 0) {
                const templateData = response.data[0]; // ✅ first object in array
                setTemplate(templateData);
                setFormData({
                    title: templateData.title || '',
                    companyName: templateData.companyName || user?.companyName || '',
                    aboutUsDescription: templateData.aboutUsDescription || '',
                    companyLogo: templateData.companyLogo || null,
                    aboutUsLogo: templateData.aboutUsLogo || null,
                });
            }
        } catch (error) {
            console.error("Error saving template:", error);
            toast.error("Failed to save template");
        }
    };

    useEffect(() => {
        if (authToken) {
            fetchUserTemplate();
        }
    }, [authToken]);

    // Updated logic to show the preview from the user's default data
    const previewCompanyLogo = formData.companyLogo
        ? URL.createObjectURL(formData.companyLogo)
        : template?.companyLogo
            ? template.companyLogo
            : user?.companyLogo || null;


    const previewAboutUsLogo = formData.aboutUsLogo
        ? URL.createObjectURL(formData.aboutUsLogo)
        : (template?.aboutUsLogo || null);

    if (loading) {
        return <p>Loading template...</p>;
    }

    const handleToggle = async () => {
        const newValue = !isCustom; // toggle value
        setIsCustom(newValue);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("customHtml", newValue); // Pass true/false to backend

            await api.put(`/offers-templates/${template.id}`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Template updated to " + (newValue ? "Custom" : "Default"));
        } catch (err) {
            console.error("Error updating template:", err);
            toast.error("Failed to update template");
        }
    };


    return (
        <>
            <style>
                {`
        .code-snippet {
            padding: 5px;
            border-left: 3px solid #007bff;
            user-select: none; /* prevents selecting text in snippet */
        }
        `}
            </style>

            <div className="mainbody">
                <div className="container-fluid">
                    <MobileHeader />
                    <div className="row top-row">
                        <div className="col-md-6">
                            <div className="dash-heading">
                                <h2>Offers Templates</h2>
                                <p>Customize your primary offer template. Only you can see and edit this.</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="dashright">
                                {isCustom && (
                                    <Link to={`/customize-templates`} className="btn btn-send"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>Customize</Link>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        {/* Left side: Edit Form */}
                        <div className="col-md-4">
                            <div className="carddesign">
                                <div className='d-flex justify-content-between align-items-center'>
                                    <h4 className="mb-4">Edit Template</h4>
                                    <div className="form-check form-switch mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="customToggle"
                                            checked={isCustom}
                                            onChange={handleToggle}
                                        />
                                        <label className="form-check-label" htmlFor="customToggle">
                                            {isCustom ? "Custom" : "Default"}
                                        </label>
                                    </div>
                                </div>
                                <div className="formdesign">
                                    <form onSubmit={handleSaveTemplate}>
                                        <div className="form-group">
                                            <label>Template Title *</label>
                                            <input type="text" className="form-control" name="title" value={formData.title} onChange={handleFormChange} placeholder="e.g., Complete Website Solution" required />
                                            <span className="inputnote">This title will be shown to clients</span>
                                        </div>
                                        <div className="form-group">
                                            <label>Company Name *</label>
                                            <input type="text" className="form-control" name="companyName" value={formData.companyName} onChange={handleFormChange} placeholder="e.g., Your Company Inc." required />
                                        </div>
                                        <div className="form-group">
                                            <label>Company Logo</label>
                                            {(template?.companyLogo || user?.companyLogo) && !formData.companyLogo && (
                                                <p className="mt-2">Current Logo: <img src={template?.companyLogo || user?.companyLogo} alt="Current company logo" style={{ maxWidth: '100px', display: 'block' }} /></p>
                                            )}
                                            <input type="file" className="form-control" name="companyLogo" onChange={handleFormChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>About Us Logo</label>
                                            {(template?.aboutUsLogo) && !formData.aboutUsLogo && (
                                                <p className="mt-2">Current Logo: <img src={template?.aboutUsLogo} alt="Current about us logo" style={{ maxWidth: '100px', display: 'block' }} /></p>
                                            )}
                                            <input type="file" className="form-control" name="aboutUsLogo" onChange={handleFormChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>About Us Description</label>
                                            <CKEditor
                                                editor={ClassicEditor}
                                                data={formData.aboutUsDescription}
                                                onChange={(event, editor) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        aboutUsDescription: editor.getData()
                                                    }));
                                                }}
                                                config={{
                                                    toolbar: [
                                                        'bold',
                                                        'italic',
                                                        'underline',
                                                        'link',
                                                        'bulletedList',
                                                        'numberedList',
                                                        'undo',
                                                        'redo',
                                                        'fontColor',           // Add text color
                                                        'fontBackgroundColor'  // Add background color
                                                    ],
                                                    removePlugins: [
                                                        'EasyImage',
                                                        'ImageUpload',
                                                        'ImageToolbar',
                                                        'ImageCaption',
                                                        'MediaEmbed',
                                                        'CKFinder'
                                                    ]
                                                }}
                                            />


                                        </div>

                                        <div className="d-flex justify-content-between">
                                            <div className="form-group">
                                                <label>Main Background Color</label>
                                                <input type="color" className="form-control" name="mainBgColor" value={formData.mainBgColor} onChange={handleFormChange} />
                                            </div>

                                            <div className="form-group">
                                                <label>Left Card Background</label>
                                                <input type="color" className="form-control" name="leftCardBgColor" value={formData.leftCardBgColor} onChange={handleFormChange} />
                                            </div>

                                            <div className="form-group">
                                                <label>Right Card Background</label>
                                                <input type="color" className="form-control" name="rightCardBgColor" value={formData.rightCardBgColor} onChange={handleFormChange} />
                                            </div>

                                        </div>
                                        <div className="d-flex justify-content-between">


                                            <div className="form-group">
                                                <label>Text Color</label>
                                                <input
                                                    type="color"
                                                    className="form-control"
                                                    name="textColor"
                                                    value={formData.textColor}
                                                    onChange={handleFormChange}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Subtext Color</label>
                                                <input
                                                    type="color"
                                                    className="form-control"
                                                    name="subTextColor"
                                                    value={formData.subTextColor}
                                                    onChange={handleFormChange}
                                                />
                                            </div>

                                        </div>
                                        <div className="modalfooter btn-right">
                                            <button type="button" className="btn btn-send" onClick={() => setFormData(prev => ({ ...prev, ...defaultColors }))}>
                                                Reset Colors
                                            </button>
                                            <button type="submit" className="btn btn-send" disabled={!formData.title || !formData.companyName}>
                                                {template ? "Update Template" : "Create Template"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Right side: Live Preview */}
                        <div className="col-md-8">
                            <div className="carddesign">
                                <h4 className="mb-4">Template Preview</h4>
                                <div className="carddesign emailcard p-4" style={{ backgroundColor: formData.mainBgColor }}>
                                    <section className="navpublic">

                                        <div className="container">
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="logo">
                                                        <a href="#">
                                                            {previewCompanyLogo && (
                                                                <img
                                                                    src={previewCompanyLogo}
                                                                    className="img-fluid"
                                                                    alt={`${formData.companyName || 'Company'} logo`}
                                                                />
                                                            )}
                                                        </a>
                                                    </div>
                                                    <div className="companyname text-center">
                                                        <h6 style={{ color: formData.textColor }} >{formData.companyName || 'Your Company Name'}</h6>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-7">
                                                    <div className="carddesign" style={{ backgroundColor: formData.leftCardBgColor }}>
                                                        <div className="offer-title">
                                                            <h1 className="tilbud-title" style={{ color: formData.textColor }}>Your Quote</h1>
                                                        </div>
                                                        <div className="intro">
                                                            <p style={{ color: formData.subTextColor }}>Thank you for your interest in our services. Below is a tailored quote for you.</p>
                                                            <p className="muted" style={{ color: formData.subTextColor }}>Please review the details below and approve the quote if satisfactory. Contact us with any questions.</p>
                                                        </div>
                                                        <div className="items">
                                                            <div className="item">
                                                                <input type="checkbox" className="form-check-input" checked="" />
                                                                <div>
                                                                    <div className="title" style={{ color: formData.textColor }}>Vinduespudsning – Standard</div>
                                                                    <div className="desc" style={{ color: formData.subTextColor }}>Interior &amp; exterior every 8 weeks.</div>
                                                                </div>
                                                                <div className="price" style={{ color: formData.textColor }}>225,00 kr</div>
                                                            </div>

                                                            <div className="item">
                                                                <input type="checkbox" className="form-check-input" />
                                                                <div>
                                                                    <div className="title" style={{ color: formData.textColor }}>Solcelle-rens (tilvalg)</div>
                                                                    <div className="desc" style={{ color: formData.subTextColor }}>Gentle cleaning including after-wipe.</div>
                                                                </div>
                                                                <div className="price" style={{ color: formData.textColor }}>349,00 kr</div>
                                                            </div>
                                                        </div>
                                                        <div className="totals">
                                                            <div className="totalsrow" style={{ color: formData.textColor }}><span>Subtotal</span><strong style={{ color: formData.textColor }}>723,00 kr</strong></div>
                                                            <div className="totalsrow" style={{ color: formData.textColor }}><span>VAT (25%)</span><strong style={{ color: formData.textColor }}>180,75 kr</strong></div>
                                                            <div className="totalsrow" style={{ color: formData.textColor }}><span style={{ fontWeight: 700 }}>Total</span><strong style={{ fontSize: '16px', color: formData.textColor }}>903,75 kr</strong></div>
                                                        </div>
                                                        <div className="publicbottom">
                                                            <div className="publicbottom-heading">
                                                                <h2 className="card-title" style={{ color: formData.textColor }}>Terms</h2>
                                                                <p style={{ color: formData.subTextColor }}>This quote is valid for 30 days. Payment terms: net 8 days unless otherwise agreed.</p>
                                                            </div>
                                                            <div className="terms-row">
                                                                <input id="acceptTerms" type="checkbox" className="form-check-input" />
                                                                <label for="acceptTerms" style={{ color: formData.textColor }}>I accept the <a href="#" target="_blank" rel="noopener" style={{ color: formData.subTextColor }}>Terms &amp; Conditions</a>.</label>
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
                                                    <div className="carddesign" style={{ backgroundColor: formData.rightCardBgColor }}>
                                                        <div className="about-media">
                                                            <a href="#">
                                                                <img
                                                                    src={previewAboutUsLogo || "assets/images/blog3.jpg"}
                                                                    className="img-fluid"
                                                                    alt="About us logo"
                                                                />
                                                            </a>

                                                        </div>
                                                        <div className="publicbottom-heading">
                                                            <h2 className="card-title" style={{ color: formData.textColor }}>About Us</h2>
                                                            <div
                                                                dangerouslySetInnerHTML={{
                                                                    __html: formData.aboutUsDescription || "About Us Description will appear here..."
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
        </>
    );
};

export default OffersTemplatesPage;