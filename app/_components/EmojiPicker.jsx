import React from "react";
import "../_style/EmojiPicker.css";

const EmojiPicker = ({ emojis, userReaction, onSelectEmoji }) => {
  return (
    <div className="emoji-picker">
      {emojis.map((emoji) => (
        <span
          key={emoji}
          className={`emoji ${userReaction === emoji ? "selected" : ""}`}
          onClick={() => onSelectEmoji(emoji)}
          title={userReaction === emoji ? "Click to remove" : "Click to react"}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

export default EmojiPicker;