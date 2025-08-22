import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const MobileHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const body = document.body; // or document.getElementById("addclass")
        if (menuOpen) {
            body.classList.add("open");
        } else {
            body.classList.remove("open");
        }
    }, [menuOpen]);

    return (
        <div className="mobileheader">
            <div className="mobilelogo">
                <Link to="#">
                    <img src="/assets/images/logo.svg" className="img-fluid" alt="" />
                </Link>
            </div>
            <div className="menuicon" id="menuicon">
                <button className="btn btn-add" onClick={() => setMenuOpen(!menuOpen)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-menu m-0"
                        aria-hidden="true"
                    >
                        <path d="M4 12h16"></path>
                        <path d="M4 18h16"></path>
                        <path d="M4 6h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MobileHeader;
