import React from "react";
import UserList from "../chat/UserList";
import MessageContainer from "../chat/MessageContainer";
import WelcomeScreen from "./WelcomeScreen";
import MobileNavigation from "./MobileNavigation";
import "../_style/ChatLayout.css";

const ChatLayout = ({
  isMobileView,
  selectedUserId,
  users,
  onUserSelect,
  onCreateUser,
  onUserSwitch,
  onBackToUsers,
}) => {
  if (isMobileView) {
    return (
      <div className="mobile-chat-layout">
        {selectedUserId ? (
          <div className="mobile-chat-view">
            <MobileNavigation onBack={onBackToUsers} />
            <MessageContainer
              selectedUserId={selectedUserId}
              onUserSwitch={onUserSwitch}
              users={users}
            />
          </div>
        ) : (
          <UserList
            onUserSelect={onUserSelect}
            selectedUserId={selectedUserId}
            onCreateUser={onCreateUser}
            users={users}
          />
        )}
      </div>
    );
  }

  return (
    <div className="desktop-chat-layout">
      <div className="sidebar">
        <UserList
          onUserSelect={onUserSelect}
          selectedUserId={selectedUserId}
          onCreateUser={onCreateUser}
          users={users}
        />
      </div>
      <div className="main-chat">
        {selectedUserId ? (
          <MessageContainer
            selectedUserId={selectedUserId}
            onUserSwitch={onUserSwitch}
            users={users}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
