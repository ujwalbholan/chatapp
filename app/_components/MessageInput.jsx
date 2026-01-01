import React, { useState, useRef, useEffect } from "react";
import "../_style/MessageInput.css";

const MessageInput = ({ onSendMessage, isConnected, isDisabled, onTyping, onStopTyping }) => {
  const [inputMessage, setInputMessage] = useState("");
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.();
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.();
    }, 2000);
  };

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage("");
      onStopTyping?.();
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="message-input">
      <input
        ref={inputRef}
        type="text"
        value={inputMessage}
        onChange={(e) => {
          setInputMessage(e.target.value);
          handleTyping();
        }}
        onKeyPress={handleKeyPress}
        placeholder={isConnected ? "Type a message..." : "Connecting..."}
        disabled={isDisabled}
      />
      <button
        onClick={handleSend}
        disabled={isDisabled || !inputMessage.trim()}
        className={isDisabled ? "disabled" : ""}
      >
        {isConnected ? "Send" : "Disconnected"}
      </button>
    </div>
  );
};

export default MessageInput;