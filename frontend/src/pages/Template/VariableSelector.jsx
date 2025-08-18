import React from "react";

const VariableSelector = ({ activeTab, setActiveTab, variableCategories, insertVariable }) => {

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="carddesign emailmodaltab">
            <div className="emailmodaltab-heading">
                <h3>Available Variables</h3>
                <p>Click on a variable to insert it into your content</p>
            </div>

            {/* Tabs */}
            <ul class="nav nav-tabs" role="tablist">
                {Object.keys(variableCategories).map((category) => (
                    <li className="nav-item" key={category}>
                        <a className={`nav-link ${activeTab === category ? "active" : ""}`} data-bs-toggle="tab" href={`#${category}`} onClick={() => handleTabClick(category)}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </a>
                    </li>
                ))}
            </ul>
            {/* Tab Content */}
            <div className="tab-content">
                {Object.entries(variableCategories).map(([category, variables]) => (
                    <div key={category} className={`tab-pane ${activeTab === category ? "active" : "fade"}`} >
                        <ul className="emailmodal-tab-ul">
                            {variables.map((variable, idx) => (
                                <li key={idx}>
                                    <li>
                                        <div class="emailmodal-tab-list">
                                            <div class="emailmodal-tab-list-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user w-3 h-3" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            </div>
                                            <div class="emailmodal-tab-list-desc">
                                                <h4>{variable.name}{" "} <button class="copybtn btn btn-add" type="button" onClick={() => insertVariable(variable.variable)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy w-3 h-3" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></button></h4>
                                                <p>{variable.description}</p>
                                                <div class="badge">{variable.variable}</div>
                                            </div>
                                        </div>
                                    </li>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VariableSelector;
