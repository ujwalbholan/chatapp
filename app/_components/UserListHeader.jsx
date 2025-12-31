import React from "react";
import "../_style/UserListHeader.css";

const UserListHeader = ({ userCount, onCreateUser }) => {
  return (
    <div className="user-list-header">
      <h3>Chat Users ({userCount})</h3>
      <button
        className="new-user-btn"
        onClick={onCreateUser}
        title="Create new user"
        aria-label="Create new user"
      >
        +
      </button>
    </div>
  );
};

export default UserListHeader;