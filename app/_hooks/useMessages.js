import { useState, useCallback, useEffect } from "react";

export const useMessages = (selectedUserId, users, storageKey) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = users.find((user) => user.id === selectedUserId);

  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const loadMessages = useCallback(() => {
    if (!selectedUserId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const savedData = localStorage.getItem(storageKey);
      let userMessages = [];

      if (savedData) {
        const allMessages = JSON.parse(savedData);
        userMessages = allMessages.filter(
          (msg) => msg.userId === selectedUserId
        );
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
        const welcomeMsg = {
          id: Date.now(),
          sender: "System",
          text: `Welcome ${currentUser?.name || "User"}! Start chatting...`,
          timestamp: formatTime(new Date()),
          reactions: {},
          type: "system",
          userId: selectedUserId,
          userName: currentUser?.name,
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
  }, [selectedUserId, storageKey, formatTime, currentUser?.name]);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );
  }, []);

  const clearMessages = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const allMessages = JSON.parse(savedData);
        const otherUsersMessages = allMessages.filter(
          (msg) => msg.userId !== selectedUserId
        );
        localStorage.setItem(storageKey, JSON.stringify(otherUsersMessages));
      }

      const welcomeMsg = {
        id: Date.now(),
        sender: "System",
        text: "Chat cleared. Send a new message!",
        timestamp: formatTime(new Date()),
        reactions: {},
        type: "system",
        userId: selectedUserId,
        userName: currentUser?.name,
        savedAt: new Date().toISOString(),
      };

      setMessages([welcomeMsg]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  }, [selectedUserId, storageKey, formatTime, currentUser?.name]);

  const addReaction = useCallback((messageId, emoji, localUserId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const currentReactions = msg.reactions || {};

          if (currentReactions[localUserId] === emoji) {
            const { [localUserId]: removed, ...rest } = currentReactions;
            return { ...msg, reactions: rest };
          } else {
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
  }, []);

  // Auto-save messages when they change
  const saveMessages = useCallback(() => {
    if (!selectedUserId || messages.length === 0 || isLoading) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      let allMessages = savedData ? JSON.parse(savedData) : [];

      // Remove old messages for this user
      allMessages = allMessages.filter((msg) => msg.userId !== selectedUserId);

      // Add current messages (excluding optimistic ones)
      const messagesToSave = messages
        .filter((msg) => !msg.isOptimistic)
        .map((msg) => ({
          ...msg,
          savedAt: msg.savedAt || new Date().toISOString(),
        }));

      allMessages = [...allMessages, ...messagesToSave];

      // Keep only last 1000 messages total
      if (allMessages.length > 1000) {
        allMessages = allMessages.slice(-1000);
      }

      localStorage.setItem(storageKey, JSON.stringify(allMessages));
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  }, [selectedUserId, messages, storageKey, isLoading]);

  // Save messages when they change (debounced)
  useEffect(() => {
    const timer = setTimeout(saveMessages, 500);
    return () => clearTimeout(timer);
  }, [saveMessages]);

  return {
    messages,
    isLoading,
    currentUser,
    loadMessages,
    addMessage,
    updateMessage,
    clearMessages,
    addReaction,
    saveMessages,
  };
};
