"use client";

import React, { useState } from "react";
import UserListHeader from "../_components/UserListHeader";
import UserSearch from "../_components/UserSearch";
import UsersContainer from "../_components/UsersContainer";
import "../_style/userList.css";

const UserList = ({ onUserSelect, selectedUserId, onCreateUser, users }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.id && user.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="user-list">
      <UserListHeader 
        userCount={users.length} 
        onCreateUser={onCreateUser} // This should work now
      />
      <UserSearch 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
      />
      <UsersContainer
        filteredUsers={filteredUsers}
        selectedUserId={selectedUserId}
        onUserSelect={onUserSelect}
        onCreateUser={onCreateUser}
      />
    </div>
  );
};

export default UserList;