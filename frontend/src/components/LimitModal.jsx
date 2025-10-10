import React from "react";

const LimitModal = ({ isOpen, onClose, usedLimit, totalAllowed }) => {
  if (!isOpen) return null;

  return (
    <>

      <div className={`${isOpen ? 'modal-backdrop fade show' : ''}`}></div>
      <div className={`modal modaldesign leadsaddmodal ${isOpen ? 'd-block' : ''}`}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">

            <div className="modal-header">
              <h4 className="modal-title">
                Limit Exceeded
              </h4>
              <button type="button" className="btn-close" onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="mb-3">
                You’ve reached the usage limit for your current plan.
              </p>
              <p>
                <strong>Plan Limit:</strong> {totalAllowed}
              </p>
              <p>
                <strong>Used Qutoa:</strong> {usedLimit}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LimitModal;
