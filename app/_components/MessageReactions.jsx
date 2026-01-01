import React from "react";
import "../_style/MessageReactions.css";

const MessageReactions = ({ reactions, localUserId }) => {
  const countReactions = () => {
    if (!reactions || typeof reactions !== "object") return {};
    const counts = {};
    Object.values(reactions).forEach((emoji) => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return counts;
  };

  const reactionCounts = countReactions();
  const userReaction = reactions?.[localUserId];

  if (Object.keys(reactionCounts).length === 0) return null;

  return (
    <div className="reactions">
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <span
          key={emoji}
          className={`reaction ${userReaction === emoji ? "user-reacted" : ""}`}
          title={`${count} reaction${count > 1 ? "s" : ""}`}
        >
          {emoji} {count > 1 ? count : ""}
        </span>
      ))}
    </div>
  );
};

export default MessageReactions;