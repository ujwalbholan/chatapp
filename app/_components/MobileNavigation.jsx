import React from "react";
import "../_style/MobileNavigation.css";

const MobileNavigation = ({ onBack }) => {
  return (
    <button className="mobile-back-btn" onClick={onBack}>
      ← Back to Users
    </button>
  );
};

export default MobileNavigation;