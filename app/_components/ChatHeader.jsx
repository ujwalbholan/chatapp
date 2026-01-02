import React from "react";
import "../_style/ChatHeader.css";

const ChatHeader = ({
  userName,
  userId,
  messageCount,
  isConnected,
  connectionStatus,
  isLoading,
  onSwitchUser,
  onClearChat,
}) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <h2>{userName}</h2>
        <div
          className={`connection-status ${
            isConnected ? "connected" : "disconnected"
          }`}
        >
          <div className="status-indicator"></div>
          <span>{connectionStatus}</span>
        </div>
        <div className="user-info">
          <span className="user-id">ID: {userId?.substring(0, 8)}...</span>
          <span className="message-count">{messageCount} messages</span>
          {isLoading && <span className="loading-text">Loading...</span>}
        </div>
      </div>
      <div className="header-right">
        <button
          className="icon-btn"
          onClick={onSwitchUser}
          title="Back to users"
          aria-label="Back to users"
        >
          ←
        </button>
        <button
          className="icon-btn"
          onClick={onClearChat}
          title="Clear chat"
          aria-label="Clear chat"
          disabled={isLoading}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
