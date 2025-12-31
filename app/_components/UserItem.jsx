import React from "react";
import UserAvatar from "./UserAvatar";
import "../_style/UserItem.css";

const UserItem = ({ user, isSelected, onSelect }) => {
  const getLastSeen = (lastActivity) => {
    if (!lastActivity) return "Never";
    const now = new Date();
    const last = new Date(lastActivity);
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getUserStatus = (lastActivity) => {
    if (!lastActivity) return "offline";
    const last = new Date(lastActivity);
    const now = new Date();
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5 ? "online" : "offline";
  };

  const status = getUserStatus(user.lastActivity);
  const lastSeen = getLastSeen(user.lastActivity);
  const displayName = user.name || `User ${user.id?.substring(5, 12)}`;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <li
      className={`user-item ${isSelected ? "active" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-label={`Select chat with ${displayName}`}
    >
      <UserAvatar 
        initials={initials} 
        status={status} 
        name={displayName}
      />
      
      <div className="user-info">
        <div className="user-header">
          <span className="username" title={displayName}>
            {displayName}
          </span>
          <span className="last-seen" title={user.lastActivity}>
            {lastSeen}
          </span>
        </div>

        <div className="user-preview">
          <span className="last-message" title={user.lastMessage}>
            {user.lastMessage && user.lastMessage.length > 30
              ? user.lastMessage.substring(0, 30) + "..."
              : user.lastMessage || "No messages"}
          </span>
          {user.messageCount > 0 && (
            <span className="message-count" aria-label={`${user.messageCount} messages`}>
              {user.messageCount}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

export default UserItem;