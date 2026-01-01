"use client";

import React, { useEffect } from "react";
import ChatLayout from "../_components/ChatLayout";
import { useChat } from "../_hooks/useChat";
import "../_style/chat.css";

const ChatApp = () => {
  const {
    selectedUserId,
    users,
    isMobileView,
    loadUsers,
    createNewUser,
    handleUserSelect,
    handleUserSwitch,
  } = useChat();

  // Load initial users
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <ChatLayout
      isMobileView={isMobileView}
      selectedUserId={selectedUserId}
      users={users}
      onUserSelect={handleUserSelect}
      onCreateUser={createNewUser}
      onUserSwitch={handleUserSwitch}
      onBackToUsers={() => handleUserSelect(null)}
    />
  );
};

export default ChatApp;