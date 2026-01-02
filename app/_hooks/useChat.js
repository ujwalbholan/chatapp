import { useState, useEffect, useCallback } from "react";

export const useChat = () => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadUsers = useCallback(() => {
    try {
      const savedData = localStorage.getItem("chat_messages_v3");
      if (savedData) {
        const messages = JSON.parse(savedData);
        const userMap = new Map();

        messages.forEach((msg) => {
          if (msg.userId && !userMap.has(msg.userId)) {
            const userMessages = messages.filter(
              (m) => m.userId === msg.userId
            );
            const lastMessage = userMessages[userMessages.length - 1];

            let userName =
              msg.userName || `User ${msg.userId.substring(5, 12)}`;

            userMap.set(msg.userId, {
              id: msg.userId,
              name: userName,
              lastMessage: lastMessage?.text || "No messages yet",
              lastActivity: lastMessage?.savedAt || new Date().toISOString(),
              messageCount: userMessages.length,
            });
          }
        });

        const usersArray = Array.from(userMap.values()).sort(
          (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
        );
        setUsers(usersArray);
      }
    } catch (error) {
      return error;
    }

  }, []);

  const createNewUser = useCallback(() => {
    try {
      const newUserId = `user_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const userName = `User ${Math.floor(Math.random() * 1000)}`;

      const savedData = localStorage.getItem("chat_messages_v3");
      let allMessages = savedData ? JSON.parse(savedData) : [];

      const welcomeMessage = {
        id: Date.now(),
        sender: "System",
        text: "Welcome to the chat!",
        timestamp: new Date().toLocaleTimeString(),
        type: "system",
        reactions: [],
        userId: newUserId,
        userName: userName,
        savedAt: new Date().toISOString(),
        originalTimestamp: new Date().toISOString(),
      };

      allMessages.push(welcomeMessage);
      localStorage.setItem("chat_messages_v3", JSON.stringify(allMessages));

      const newUser = {
        id: newUserId,
        name: userName,
        lastMessage: "Start chatting...",
        lastActivity: new Date().toISOString(),
        messageCount: 0,
        userName: userName,
      };

      setUsers((prev) => [newUser, ...prev]);

      setSelectedUserId(newUserId);

      return newUser;
    } catch (error) {
      return null;
    }
  }, []);

  return {
    selectedUserId,
    setSelectedUserId,
    users,
    isMobileView,
    loadUsers,
    createNewUser,
    handleUserSelect: setSelectedUserId,
    handleUserSwitch: () => setSelectedUserId(null),
  };
};
