"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { webSocketManager } from "../_util/WebSocketManager";
import "../_style/messageContainer.css";

const emojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
const STORAGE_KEY = "chat_messages_v3";
const LOCAL_USER_ID_KEY = "chat_local_user_id";

const MessageContainer = ({ selectedUserId, onUserSwitch, users }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserId, setLocalUserId] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingIntervalsRef = useRef({});

  // Get or create local user ID for reactions
  useEffect(() => {
    const getOrCreateLocalUserId = () => {
      let storedId = localStorage.getItem(LOCAL_USER_ID_KEY);
      if (!storedId) {
        storedId = `local_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        localStorage.setItem(LOCAL_USER_ID_KEY, storedId);
      }
      setLocalUserId(storedId);
      return storedId;
    };
    getOrCreateLocalUserId();
  }, []);

  // Filter function to detect and remove echo server metadata
  const isEchoServerMetadata = useCallback((text) => {
    if (!text || typeof text !== "string") return false;

    const trimmedText = text.trim();
    const echoServerPatterns = [
      /^Request served by/i,
      /^Echo Server$/i,
      /^Request served by [a-f0-9]+$/i,
      /^\d{1,2}:\d{2}\s*[AP]M$/,
      /^\d{1,2}:\d{2}$/,
      /^[a-f0-9]{12,}$/i, // Hexadecimal IDs
    ];

    return echoServerPatterns.some((pattern) => pattern.test(trimmedText));
  }, []);

  // Get current user name
  const currentUser = users.find((user) => user.id === selectedUserId);
  const userName = currentUser
    ? currentUser.name
    : `User ${selectedUserId?.substring(5, 12) || ""}`;

  // Load messages for selected user
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const loadUserMessages = () => {
      setIsLoading(true);
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        let userMessages = [];

        if (savedData) {
          const allMessages = JSON.parse(savedData);
          userMessages = allMessages.filter(
            (msg) => msg.userId === selectedUserId
          );

          // Filter out echo server metadata from saved messages
          userMessages = userMessages.filter((msg) => {
            return !isEchoServerMetadata(msg.text);
          });
        }

        if (userMessages.length > 0) {
          const formattedMessages = userMessages.map((msg) => ({
            ...msg,
            id: msg.id || Date.now() + Math.random(),
            timestamp: formatTime(new Date(msg.savedAt || Date.now())),
            reactions: msg.reactions || {},
            type: msg.type || (msg.sender === "You" ? "sent" : "received"),
            isOptimistic: false,
            sendingIndicator: false,
          }));

          setMessages(formattedMessages);
        } else {
          // Welcome message for new user
          const welcomeMsg = {
            id: Date.now(),
            sender: "System",
            text: `Welcome ${userName}! Start chatting...`,
            timestamp: formatTime(new Date()),
            reactions: {},
            type: "system",
            userId: selectedUserId,
            userName: userName,
            savedAt: new Date().toISOString(),
          };
          setMessages([welcomeMsg]);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        const errorMsg = {
          id: Date.now(),
          sender: "System",
          text: "Failed to load chat history.",
          timestamp: formatTime(new Date()),
          reactions: {},
          type: "system",
          userId: selectedUserId,
          savedAt: new Date().toISOString(),
        };
        setMessages([errorMsg]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserMessages();

    // Setup WebSocket for this user
    setupWebSocket();

    return () => {
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Cleanup all typing intervals
      Object.values(typingIntervalsRef.current).forEach((interval) => {
        clearInterval(interval);
      });
      typingIntervalsRef.current = {};
    };
  }, [selectedUserId, userName, isEchoServerMetadata]);

  // Typing effect for echoed messages
  const startTypingEffect = useCallback((messageId, fullText) => {
    console.log(`Starting typing effect for message ${messageId}: ${fullText}`);

    // Clear any existing typing interval for this message
    if (typingIntervalsRef.current[messageId]) {
      clearInterval(typingIntervalsRef.current[messageId]);
    }

    let currentIndex = 0;
    const typingSpeed = 50;

    // Start the typing interval
    typingIntervalsRef.current[messageId] = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const newText = fullText.substring(0, currentIndex + 1);
            currentIndex++;

            // Check if typing is complete
            if (currentIndex >= fullText.length) {
              // Clear the interval
              clearInterval(typingIntervalsRef.current[messageId]);
              delete typingIntervalsRef.current[messageId];

              // Create the completed message
              const completedMessage = {
                ...msg,
                text: fullText,
                displayText: fullText,
                isTypingEffect: false,
              };

              // Save to storage after typing is complete
              setTimeout(() => {
                saveMessageToStorage(completedMessage);
              }, 100);

              return completedMessage;
            }

            // Update with partially typed text
            return {
              ...msg,
              displayText: newText,
              typingIndex: currentIndex,
              isTypingEffect: true,
            };
          }
          return msg;
        })
      );
    }, typingSpeed);
  }, []);

  // WebSocket setup - UPDATED TO FILTER METADATA
  const setupWebSocket = useCallback(() => {
    if (!selectedUserId) return;

    // Set up WebSocket callbacks
    webSocketManager.setCallbacks({
      onOpen: () => {
        setIsConnected(true);
        console.log(`WebSocket connected for user: ${selectedUserId}`);
      },
      onClose: () => {
        setIsConnected(false);
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      },
      onMessage: (data, userId) => {
        try {
          const parsedData = JSON.parse(data);

          if (parsedData.userId === selectedUserId && parsedData.content) {
            // Check if this is echo server metadata
            if (isEchoServerMetadata(parsedData.content)) {
              console.log("Filtered echo server metadata:", parsedData.content);
              return; // Skip this message
            }

            // Update optimistic message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.isOptimistic && msg.text === parsedData.content
                  ? { ...msg, isOptimistic: false, sendingIndicator: false }
                  : msg
              )
            );

            // Create typing message with unique ID
            const typingMessageId = Date.now() + Math.random();
            const typingMessage = {
              id: typingMessageId,
              sender: "Echo Server",
              text: "", // Final text
              displayText: "", // Text being displayed with typing effect
              timestamp: formatTime(new Date()),
              reactions: {},
              type: "received",
              userId: selectedUserId,
              userName: userName,
              savedAt: new Date().toISOString(),
              isTypingEffect: true, // Flag for typing effect
              fullText: parsedData.content, // Store the full text
            };

            setMessages((prev) => [...prev, typingMessage]);

            // Start typing effect immediately
            startTypingEffect(typingMessageId, parsedData.content);
          }
        } catch (error) {
          // Handle non-JSON messages
          console.log("Raw WebSocket message:", data);

          // If it's a string (echoed message), process it
          if (typeof data === "string" && data.trim()) {
            // Check if this is echo server metadata
            if (isEchoServerMetadata(data)) {
              console.log("Filtered echo server metadata (raw):", data);
              return;
            }

            // Update optimistic message for raw string
            setMessages((prev) =>
              prev.map((msg) =>
                msg.isOptimistic && msg.text === data
                  ? { ...msg, isOptimistic: false, sendingIndicator: false }
                  : msg
              )
            );

            // Create typing message for raw string
            const typingMessageId = Date.now() + Math.random();
            const typingMessage = {
              id: typingMessageId,
              sender: "Echo Server",
              text: "",
              displayText: "",
              timestamp: formatTime(new Date()),
              reactions: {},
              type: "received",
              userId: selectedUserId,
              userName: userName,
              savedAt: new Date().toISOString(),
              isTypingEffect: true,
              fullText: data,
            };

            setMessages((prev) => [...prev, typingMessage]);
            startTypingEffect(typingMessageId, data);
          }
        }
      },
    });

    // Connect WebSocket
    webSocketManager.connect(selectedUserId);
  }, [selectedUserId, userName, startTypingEffect, isEchoServerMetadata]);

  // Save messages to storage
  const saveMessageToStorage = useCallback((message) => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      let allMessages = savedData ? JSON.parse(savedData) : [];

      // Remove any existing message with same ID
      allMessages = allMessages.filter((msg) => msg.id !== message.id);

      const messageToSave = {
        ...message,
        reactions: message.reactions || {},
        savedAt: new Date().toISOString(),
      };

      allMessages.push(messageToSave);

      // Keep only last 1000 messages total
      if (allMessages.length > 1000) {
        allMessages = allMessages.slice(-1000);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allMessages));
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  }, []);

  // Save all messages when they change
  useEffect(() => {
    if (isLoading || !selectedUserId || messages.length === 0) return;

    const saveMessages = () => {
      messages.forEach((message) => {
        if (
          !message.savedAt &&
          !message.isOptimistic &&
          !message.isTypingEffect
        ) {
          saveMessageToStorage(message);
        }
      });
    };

    const saveTimeout = setTimeout(saveMessages, 500);
    return () => clearTimeout(saveTimeout);
  }, [messages, selectedUserId, isLoading, saveMessageToStorage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedUserId || !isConnected) return;

    const optimisticMessage = {
      id: Date.now(),
      sender: "You",
      text: inputMessage,
      timestamp: formatTime(new Date()),
      reactions: {},
      type: "sent",
      isOptimistic: true,
      sendingIndicator: true,
      userId: selectedUserId,
      userName: userName,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send via WebSocket manager
    const messageToSend = JSON.stringify({
      content: inputMessage,
      timestamp: new Date().toISOString(),
      userId: selectedUserId,
      userName: userName,
      isChatMessage: true, // Add flag to identify chat messages
    });

    webSocketManager.send(messageToSend);

    setInputMessage("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setIsTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add or update reaction (only one per user per message)
  const addReaction = useCallback(
    (msgId, emoji) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId) {
            const currentReactions = msg.reactions || {};

            // Check if current user already reacted with this emoji
            if (currentReactions[localUserId] === emoji) {
              // Remove reaction if same emoji
              const { [localUserId]: removed, ...rest } = currentReactions;
              return { ...msg, reactions: rest };
            } else {
              // Add or update user's reaction
              return {
                ...msg,
                reactions: {
                  ...currentReactions,
                  [localUserId]: emoji,
                },
              };
            }
          }
          return msg;
        })
      );
      setShowEmojiPickerFor(null);
    },
    [localUserId]
  );

  const clearUserChat = () => {
    if (!selectedUserId) return;

    const confirmClear = window.confirm("Clear chat history for this user?");

    if (confirmClear) {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const allMessages = JSON.parse(savedData);
          const otherUsersMessages = allMessages.filter(
            (msg) => msg.userId !== selectedUserId
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(otherUsersMessages));
        }

        const welcomeMsg = {
          id: Date.now(),
          sender: "System",
          text: "Chat cleared. Send a new message!",
          timestamp: formatTime(new Date()),
          reactions: {},
          type: "system",
          userId: selectedUserId,
          userName: userName,
          savedAt: new Date().toISOString(),
        };

        setMessages([welcomeMsg]);
      } catch (error) {
        console.error("Failed to clear chat:", error);
      }
    }
  };

  const switchUser = () => {
    if (onUserSwitch) {
      onUserSwitch();
    }
  };

  // Count unique reactions
  const countReactions = (reactions) => {
    if (!reactions || typeof reactions !== "object") return {};

    const counts = {};
    Object.values(reactions).forEach((emoji) => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return counts;
  };

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webSocketManager.disconnect();
      // Cleanup all typing intervals
      Object.values(typingIntervalsRef.current).forEach((interval) => {
        clearInterval(interval);
      });
      typingIntervalsRef.current = {};
    };
  }, []);

  return (
    <div className="message-container">
      <div className="chat-header">
        <div className="header-left">
          <h2>{userName}</h2>
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <div className="status-indicator"></div>
            <span>{isConnected ? "Connected" : "Connecting..."}</span>
          </div>
          <div className="user-info">
            <span className="user-id">
              ID: {selectedUserId?.substring(0, 8)}...
            </span>
            <span className="message-count">
              {
                messages.filter((m) => !m.isOptimistic && m.type !== "system")
                  .length
              }{" "}
              messages
            </span>
            {isLoading && <span className="loading-text">Loading...</span>}
          </div>
        </div>
        <div className="header-right">
          <button
            className="icon-btn"
            onClick={switchUser}
            title="Back to users"
          >
            ←
          </button>
          <button
            className="icon-btn"
            onClick={clearUserChat}
            title="Clear chat"
            disabled={!selectedUserId}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="messages">
        {!selectedUserId ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>Select a user to chat</h3>
          </div>
        ) : isLoading ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <h3>Loading messages...</h3>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No messages yet</h3>
            <p>Send your first message!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const reactionCounts = countReactions(msg.reactions);
            const userReaction = msg.reactions?.[localUserId];

            return (
              <div
                key={msg.id}
                className={`message ${
                  msg.type === "sent"
                    ? "sent"
                    : msg.type === "system"
                    ? "system"
                    : "received"
                } ${msg.isOptimistic ? "optimistic" : ""} ${
                  msg.isTypingEffect ? "typing-message" : ""
                }`}
              >
                <div className="message-sender">{msg.sender}</div>
                <div className="message-content">
                  <div className="message-text">
                    {msg.isTypingEffect ? (
                      <>
                        {msg.displayText || ""}
                        {msg.displayText &&
                          msg.displayText.length <
                            (msg.fullText?.length || 0) && (
                            <span className="typing-cursor">|</span>
                          )}
                      </>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <div className="message-footer">
                    <div className="message-time">{msg.timestamp}</div>
                    {msg.sendingIndicator && (
                      <div className="sending-indicator">
                        <span className="sending-dot"></span>
                        <span className="sending-dot"></span>
                        <span className="sending-dot"></span>
                      </div>
                    )}
                  </div>
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="reactions">
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <span
                          key={emoji}
                          className={`reaction ${
                            userReaction === emoji ? "user-reacted" : ""
                          }`}
                          title={`${count} reaction${count > 1 ? "s" : ""}`}
                        >
                          {emoji} {count > 1 ? count : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.type !== "system" && !msg.isTypingEffect && (
                  <button
                    className="emoji-btn"
                    onClick={() =>
                      setShowEmojiPickerFor(
                        showEmojiPickerFor === msg.id ? null : msg.id
                      )
                    }
                  >
                    {userReaction || "😊"}
                  </button>
                )}

                {showEmojiPickerFor === msg.id && (
                  <div className="emoji-picker">
                    {emojis.map((emoji) => (
                      <span
                        key={emoji}
                        className={`emoji ${
                          userReaction === emoji ? "selected" : ""
                        }`}
                        onClick={() => addReaction(msg.id, emoji)}
                        title={
                          userReaction === emoji
                            ? "Click to remove"
                            : "Click to react"
                        }
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="message received typing-indicator">
            <div className="message-sender">Someone is typing...</div>
            <div className="message-text">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
          disabled={!selectedUserId || !isConnected}
        />
        <button
          onClick={sendMessage}
          disabled={!selectedUserId || !inputMessage.trim() || !isConnected}
          className={!selectedUserId || !isConnected ? "disabled" : ""}
        >
          {isConnected ? "Send" : "Disconnected"}
        </button>
      </div>
    </div>
  );
};

export default MessageContainer;
