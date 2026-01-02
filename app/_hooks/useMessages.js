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

  useEffect(() => {
    if (!selectedUserId || messages.length === 0 || isLoading) return;

    const saveMessagesToStorage = () => {
      try {
        const savedData = localStorage.getItem(storageKey);
        let allMessages = savedData ? JSON.parse(savedData) : [];

        allMessages = allMessages.filter(
          (msg) => msg.userId !== selectedUserId
        );

        const messagesToSave = messages
          .filter((msg) => !msg.isOptimistic && !msg.sendingIndicator)
          .map((msg) => ({
            ...msg,
            savedAt: msg.savedAt || new Date().toISOString(),
          }));

        allMessages = [...allMessages, ...messagesToSave];

        if (allMessages.length > 1000) {
          allMessages = allMessages.slice(-1000);
        }

        localStorage.setItem(storageKey, JSON.stringify(allMessages));
      } catch (error) {
        error
      }
    };

    saveMessagesToStorage();
  }, [messages, selectedUserId, storageKey, isLoading]);

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
      error
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId, storageKey, formatTime, currentUser?.name]);

  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      const newMessages = [...prev, message];
      return newMessages;
    });
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const updated = { ...msg, ...updates };
          return updated;
        }
        return msg;
      })
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
      error;
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

  const saveMessages = useCallback(() => {
    if (!selectedUserId || messages.length === 0 || isLoading) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      let allMessages = savedData ? JSON.parse(savedData) : [];

      allMessages = allMessages.filter((msg) => msg.userId !== selectedUserId);

      const messagesToSave = messages
        .filter((msg) => !msg.isOptimistic && !msg.sendingIndicator)
        .map((msg) => ({
          ...msg,
          savedAt: msg.savedAt || new Date().toISOString(),
        }));

      allMessages = [...allMessages, ...messagesToSave];

      if (allMessages.length > 1000) {
        allMessages = allMessages.slice(-1000);
      }

      localStorage.setItem(storageKey, JSON.stringify(allMessages));

    } catch (error) {
      error
    }
  }, [selectedUserId, messages, storageKey, isLoading]);

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
