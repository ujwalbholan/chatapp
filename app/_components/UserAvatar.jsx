import React from "react";
import "../_style/UserAvatar.css";

const UserAvatar = ({ initials, status, name }) => {
  return (
    <div className="user-avatar">
      <div className={`avatar ${status}`} aria-label={`${name} is ${status}`}>
        {initials}
      </div>
      <div
        className={`status-indicator ${status}`}
        title={`${name} is ${status}`}
      ></div>
    </div>
  );
};

export default UserAvatar;