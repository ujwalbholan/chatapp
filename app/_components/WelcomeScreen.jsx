import React from "react";
import "../_style/WelcomeScreen.css";

const WelcomeScreen = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon">💬</div>
      <h2>Welcome to WebSocket Chat</h2>
      <p>Select a user from the sidebar to start chatting</p>
      <p className="welcome-hint">
        Messages are automatically saved and echoed back
      </p>
    </div>
  );
};

export default WelcomeScreen;
