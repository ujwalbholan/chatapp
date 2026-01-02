import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import "../_style/MessagesArea.css";

const MessagesArea = ({
  messages,
  localUserId,
  showEmojiPickerFor,
  onToggleEmojiPicker,
  onAddReaction,
  emojis,
  isLoading,
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const effectiveLocalUserId =
    localUserId ||
    (() => {
      let storedId = localStorage.getItem("chat_local_user_id");
      if (!storedId) {
        storedId = `local_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        localStorage.setItem("chat_local_user_id", storedId);
      }
      return storedId;
    })();

  if (isLoading) {
    return (
      <div className="messages-area loading">
        <div className="loading-spinner">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="messages-area">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={`${message.id}-${message.timestamp}`}
            message={message}
            localUserId={effectiveLocalUserId}
            isEmojiPickerOpen={showEmojiPickerFor === message.id}
            onToggleEmojiPicker={() =>
              onToggleEmojiPicker(
                showEmojiPickerFor === message.id ? null : message.id
              )
            }
            onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
            emojis={emojis}
          />
        ))
      )}
      <div ref={messagesEndRef} className="messages-end" />
    </div>
  );
};

export default MessagesArea;
