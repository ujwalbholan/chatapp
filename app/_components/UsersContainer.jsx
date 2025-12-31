import React from "react";
import UserItem from "./UserItem";
import NoUsersState from "./NoUsersState";
import "../_style/UsersContainer.css";

const UsersContainer = ({ 
  filteredUsers, 
  selectedUserId, 
  onUserSelect, 
  onCreateUser 
}) => {
  if (filteredUsers.length === 0) {
    return <NoUsersState onCreateUser={onCreateUser} />;
  }

  return (
    <div className="users-container">
      <ul className="users-list">
        {filteredUsers.map((user) => (
          <UserItem
            key={user.id}
            user={user}
            isSelected={selectedUserId === user.id}
            onSelect={() => onUserSelect(user.id)}
          />
        ))}
      </ul>
    </div>
  );
};

export default UsersContainer;