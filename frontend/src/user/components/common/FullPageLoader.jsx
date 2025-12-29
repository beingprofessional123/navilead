// src/components/common/FullPageLoader.jsx
import React from "react";

const FullPageLoader = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default FullPageLoader;
