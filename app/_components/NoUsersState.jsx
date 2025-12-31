import React from "react";
import "../_style/NoUsersState.css";

const NoUsersState = ({ onCreateUser }) => {
  return (
    <div className="no-users">
      <p>No users found</p>
      <button onClick={onCreateUser} className="start-chat-btn">
        Start New Chat
      </button>
    </div>
  );
};

export default NoUsersState;