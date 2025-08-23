// TableLoader.jsx
import React from "react";

const TableLoader = () => {
  return (
    <tr>
      <td colSpan="10" className="text-center py-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </td>
    </tr>
  );
};

export default TableLoader;
