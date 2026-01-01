"use client";

import React, { useState, useEffect, useCallback,useRef } from "react";
import ChatHeader from "../_components/ChatHeader";
import MessagesArea from "../_components/MessagesArea";
import MessageInput from "../_components/MessageInput";
import EmptyState from "../_components/EmptyState";
import TypingIndicator from "../_components/TypingIndicator";
import { webSocketManager } from "../_util/WebSocketManager";
import { useMessages } from "../_hooks/useMessages";
import { useTypingIndicator } from "../_hooks/useTypingIndicator";
import { STORAGE_KEY, emojis } from "../constants/chat";
import "../_style/messageContainer.css";

const MessageContainer = ({ selectedUserId, onUserSwitch, users }) => {
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsersCount, setConnectedUsersCount] = useState(0);
  const pendingMessagesRef = useRef(new Map());

  const { isTyping, startTyping, stopTyping } = useTypingIndicator();

  const {
    messages,
    isLoading,
    currentUser,
    addMessage,
    updateMessage,
    clearMessages,
    addReaction,
    loadMessages,
  } = useMessages(selectedUserId, users, STORAGE_KEY);

  // Load messages when user changes
  useEffect(() => {
    if (selectedUserId) {
      loadMessages();
    }
  }, [selectedUserId, loadMessages]);

  // Setup WebSocket subscription for this user
  useEffect(() => {
    if (!selectedUserId) return;

    let unsubscribe;

    const setupWebSocket = () => {
      const callbacks = {
        onMessage: (data) => {
          console.log(`WebSocket message for ${selectedUserId}:`, data);

          if (data.content) {
            // Check if this is an echo of a message we sent
            const pendingMessageId = data.originalMessageId || data.messageId;
            const pending = pendingMessagesRef.current.get(pendingMessageId);

            if (pending) {
              // Update optimistic message
              updateMessage(pending.messageId, {
                isOptimistic: false,
                sendingIndicator: false,
              });

              // Remove from pending
              pendingMessagesRef.current.delete(pendingMessageId);
            }

            // Add echo message (if it's an echo, not the original)
            if (data.echoed || data.sender !== "You") {
              const echoMessage = {
                id: Date.now(),
                sender: "Echo Server",
                text: data.content,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
                reactions: {},
                type: "received",
                userId: selectedUserId,
                userName: "Echo Server",
                savedAt: new Date().toISOString(),
              };

              addMessage(echoMessage);
            }
          }
        },

        onStatusChange: (connected) => {
          setIsConnected(connected);
          setConnectedUsersCount(webSocketManager.getConnectedUsersCount());

          if (connected && messages.length <= 1) {
            // Add welcome message when connected
            const welcomeMsg = {
              id: Date.now(),
              sender: "System",
              text: "Connected to WebSocket server. Messages will be echoed back.",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
              reactions: {},
              type: "system",
              userId: selectedUserId,
              savedAt: new Date().toISOString(),
            };

            if (
              !messages.some(
                (m) => m.type === "system" && m.text.includes("Connected")
              )
            ) {
              addMessage(welcomeMsg);
            }
          }
        },
      };

      // Subscribe to WebSocket
      unsubscribe = webSocketManager.subscribe(selectedUserId, callbacks);
    };

    setupWebSocket();

    // Cleanup on unmount or user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      pendingMessagesRef.current.clear();
    };
  }, [selectedUserId, addMessage, updateMessage, messages]);

  const handleSendMessage = useCallback(
    (content) => {
      if (!content.trim() || !selectedUserId) {
        console.log("Cannot send: missing content or user");
        return;
      }

      const messageId = Date.now();
      const optimisticMessage = {
        id: messageId,
        sender: "You",
        text: content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        type: "sent",
        isOptimistic: true,
        sendingIndicator: true,
        userId: selectedUserId,
        userName:
          currentUser?.name || `User ${selectedUserId?.substring(5, 12)}`,
        savedAt: new Date().toISOString(),
      };

      addMessage(optimisticMessage);

      // Store as pending
      pendingMessagesRef.current.set(messageId, {
        messageId,
        content,
        timestamp: new Date(),
      });

      // Prepare message for WebSocket
      const messageData = {
        content: content,
        originalMessageId: messageId,
        userId: selectedUserId,
        userName:
          currentUser?.name || `User ${selectedUserId?.substring(5, 12)}`,
        type: "chat",
        timestamp: new Date().toISOString(),
      };

      // Send via WebSocket
      const success = webSocketManager.send(
        JSON.stringify(messageData),
        selectedUserId
      );

      if (!success) {
        // Mark as failed if couldn't send
        updateMessage(messageId, {
          sendingIndicator: false,
          isOptimistic: false,
          text: `${content} (Failed to send - not connected)`,
          type: "system",
        });

        // Remove from pending
        pendingMessagesRef.current.delete(messageId);
      }
    },
    [selectedUserId, currentUser?.name, addMessage, updateMessage]
  );

  const handleClearChat = () => {
    if (window.confirm("Clear chat history for this user?")) {
      clearMessages();
      pendingMessagesRef.current.clear();
    }
  };

  const handleAddReaction = useCallback(
    (messageId, emoji) => {
      const getLocalUserId = () => {
        let storedId = localStorage.getItem("chat_local_user_id");
        if (!storedId) {
          storedId = `local_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          localStorage.setItem("chat_local_user_id", storedId);
        }
        return storedId;
      };

      const localUserId = getLocalUserId();
      addReaction(messageId, emoji, localUserId);
    },
    [addReaction]
  );

  // Get connection status text
  const getConnectionStatus = () => {
    if (!selectedUserId) return "Select a user";
    if (!isConnected) return "Connecting...";
    return `Connected • ${connectedUsersCount} user${
      connectedUsersCount !== 1 ? "s" : ""
    } online`;
  };

  if (!selectedUserId) {
    return <EmptyState type="select-user" />;
  }

  return (
    <div className="message-container">
      <ChatHeader
        userName={
          currentUser?.name || `User ${selectedUserId?.substring(5, 12)}`
        }
        userId={selectedUserId}
        messageCount={
          messages.filter((m) => !m.isOptimistic && m.type !== "system").length
        }
        isConnected={isConnected}
        connectionStatus={getConnectionStatus()}
        isLoading={isLoading}
        onSwitchUser={onUserSwitch}
        onClearChat={handleClearChat}
      />

      <MessagesArea
        messages={messages}
        showEmojiPickerFor={showEmojiPickerFor}
        onToggleEmojiPicker={setShowEmojiPickerFor}
        onAddReaction={handleAddReaction}
        emojis={emojis}
        isLoading={isLoading}
      />

      {isTyping && <TypingIndicator />}

      <MessageInput
        onSendMessage={handleSendMessage}
        isConnected={isConnected}
        isDisabled={!selectedUserId || !isConnected}
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />
    </div>
  );
};

export default MessageContainer;
