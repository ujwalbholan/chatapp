import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "../_style/MessagesArea.css";

const MessagesArea = ({
  messages,
  localUserId,
  showEmojiPickerFor,
  onToggleEmojiPicker,
  onAddReaction,
  emojis
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="messages-area">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          localUserId={localUserId}
          isEmojiPickerOpen={showEmojiPickerFor === message.id}
          onToggleEmojiPicker={() => onToggleEmojiPicker(showEmojiPickerFor === message.id ? null : message.id)}
          onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
          emojis={emojis}
        />
      ))}
      <div ref={messagesEndRef} className="messages-end" />
    </div>
  );
};

export default MessagesArea;