import React from "react";
import "../_style/EmptyState.css";

const EmptyState = ({ type = "no-messages" }) => {
  const getContent = () => {
    switch (type) {
      case "select-user":
        return {
          icon: "👤",
          title: "Select a user to chat",
        };
      case "loading":
        return {
          icon: null,
          title: "Loading messages...",
        };
      case "no-messages":
      default:
        return {
          icon: "💬",
          title: "No messages yet",
          description: "Send your first message!",
        };
    }
  };

  const content = getContent();

  return (
    <div className="empty-state">
      {content.icon ? (
        <div className="empty-icon">{content.icon}</div>
      ) : (
        <div className="loading-spinner"></div>
      )}
      <h3>{content.title}</h3>
      {content.description && <p>{content.description}</p>}
    </div>
  );
};

export default EmptyState;