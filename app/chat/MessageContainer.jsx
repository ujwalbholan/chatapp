"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const unsubscribeRef = useRef(null);

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
    saveMessages, 
  } = useMessages(selectedUserId, users, STORAGE_KEY);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages();
    }
  }, [selectedUserId, loadMessages]);

  useEffect(() => {
    if (!selectedUserId) return;


    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    pendingMessagesRef.current.clear();

    unsubscribeRef.current = webSocketManager.subscribe(selectedUserId, {
      onMessage: (data) => {

        if (data && data.content) {
          const pendingMessageId = data.originalMessageId || data.messageId;
          const pending = pendingMessageId
            ? pendingMessagesRef.current.get(pendingMessageId)
            : null;

          if (pending) {
            updateMessage(pending.messageId, {
              isOptimistic: false,
              sendingIndicator: false,
              sent: true,
            });

            pendingMessagesRef.current.delete(pendingMessageId);

            setTimeout(() => {
              saveMessages();
            }, 100);
          }

          if (data.content && (data.sender !== "You" || data.echoed)) {
            const echoMessage = {
              id: Date.now() + Math.random(),
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

            setTimeout(() => {
              saveMessages();
            }, 100);
          }
        }
      },

      onStatusChange: (connected) => {
        console.log(
          `📡 Connection status: ${connected ? "Connected" : "Disconnected"}`
        );
        setIsConnected(connected);
        setConnectedUsersCount(webSocketManager.getConnectedUsersCount());

        if (
          connected &&
          messages.filter((m) => m.type === "system").length === 0
        ) {
          const welcomeMsg = {
            id: Date.now(),
            sender: "System",
            text: "Connected to WebSocket server. Your messages will be echoed back.",
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

          addMessage(welcomeMsg);
        }
      },
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      pendingMessagesRef.current.clear();
    };
  }, [selectedUserId, addMessage, updateMessage, messages, saveMessages]);

  const handleSendMessage = useCallback(
    (content) => {
      if (!content.trim() || !selectedUserId) {
        return;
      }

      const messageId = Date.now();
      console.log(`📤 Sending message: "${content}" (ID: ${messageId})`);

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

      pendingMessagesRef.current.set(messageId, {
        messageId,
        content,
        timestamp: new Date(),
      });

      const messageData = {
        content: content,
        originalMessageId: messageId,
        userId: selectedUserId,
        userName:
          currentUser?.name || `User ${selectedUserId?.substring(5, 12)}`,
        type: "chat",
        timestamp: new Date().toISOString(),
      };

      const success = webSocketManager.send(
        JSON.stringify(messageData),
        selectedUserId
      );

      if (!success) {
        updateMessage(messageId, {
          sendingIndicator: false,
          isOptimistic: false,
          text: `${content} (Failed to send - check connection)`,
          failed: true,
        });

        pendingMessagesRef.current.delete(messageId);

        setTimeout(() => {
          saveMessages();
        }, 100);
      }
    },
    [selectedUserId, currentUser?.name, addMessage, updateMessage, saveMessages]
  );

  const handleClearChat = () => {
    if (window.confirm("Clear chat history for this user?")) {
      clearMessages();
      pendingMessagesRef.current.clear();
    }
  };

  const getLocalUserId = useCallback(() => {
    let storedId = localStorage.getItem("chat_local_user_id");
    if (!storedId) {
      storedId = `local_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("chat_local_user_id", storedId);
    }
    return storedId;
  }, []);

  const handleAddReaction = useCallback(
    (messageId, emoji) => {
      const localUserId = getLocalUserId();
      addReaction(messageId, emoji, localUserId);

      setTimeout(() => {
        saveMessages();
      }, 100);
    },
    [addReaction, getLocalUserId, saveMessages]
  );

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
        localUserId={getLocalUserId()} 
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
