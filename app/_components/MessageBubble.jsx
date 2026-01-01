import React from "react";
import MessageReactions from "./MessageReactions";
import EmojiPicker from "./EmojiPicker";
import "../_style/MessageBubble.css";

const MessageBubble = ({
  message,
  localUserId,
  isEmojiPickerOpen,
  onToggleEmojiPicker,
  onAddReaction,
  emojis
}) => {
  const userReaction = message.reactions?.[localUserId];
  const isSystem = message.type === "system";
  const isTypingEffect = message.isTypingEffect;
  
  if (isSystem) {
    return (
      <div className="message system">
        <div className="message-text">{message.text}</div>
        <div className="message-time">{message.timestamp}</div>
      </div>
    );
  }

  return (
    <div className={`message ${message.type} ${message.isOptimistic ? "optimistic" : ""} ${isTypingEffect ? "typing-message" : ""}`}>
      <div className="message-sender">{message.sender}</div>
      <div className="message-content">
        <div className="message-text">
          {isTypingEffect ? (
            <>
              {message.displayText || ""}
              {message.displayText && message.displayText.length < (message.fullText?.length || 0) && (
                <span className="typing-cursor">|</span>
              )}
            </>
          ) : (
            message.text
          )}
        </div>
        <div className="message-footer">
          <div className="message-time">{message.timestamp}</div>
          {message.sendingIndicator && (
            <div className="sending-indicator">
              {[1, 2, 3].map((i) => (
                <span key={i} className="sending-dot" />
              ))}
            </div>
          )}
        </div>
        <MessageReactions 
          reactions={message.reactions} 
          localUserId={localUserId} 
        />
      </div>
      
      {!isTypingEffect && !isSystem && (
        <>
          <button className="emoji-btn" onClick={onToggleEmojiPicker}>
            {userReaction || "😊"}
          </button>
          
          {isEmojiPickerOpen && (
            <EmojiPicker
              emojis={emojis}
              userReaction={userReaction}
              onSelectEmoji={onAddReaction}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MessageBubble;