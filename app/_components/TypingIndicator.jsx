import React from "react";
import "../_style/TypingIndicator.css";

const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <div className="message-sender">Someone is typing...</div>
      <div className="message-text">
        {[1, 2, 3].map((i) => (
          <span key={i} className="dot" />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;