"use client";

import React, { useState, useEffect } from "react";
import ChatLayout from "../_components/ChatLayout";
import { useUsers, useMobileView, useUserCreation } from "../_hooks/chatHooks";
import "../_style/chat.css";

const ChatApp = () => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const isMobileView = useMobileView();
  const { users, loadUsers, createNewUser } = useUsers();
  const { createUser } = useUserCreation({
    onCreate: createNewUser,
    onSelect: setSelectedUserId,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  const handleUserSwitch = () => {
    setSelectedUserId(null);
  };

  return (
    <ChatLayout
      isMobileView={isMobileView}
      selectedUserId={selectedUserId}
      users={users}
      onUserSelect={handleUserSelect}
      onCreateUser={createUser}
      onUserSwitch={handleUserSwitch}
      onBackToUsers={() => setSelectedUserId(null)}
    />
  );
};

export default ChatApp;
