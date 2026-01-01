import { useState, useCallback, useEffect } from "react";
import { webSocketManager } from "../_util/WebSocketManager";

export const useWebSocket = (selectedUserId) => {
  const [isConnected, setIsConnected] = useState(false);

  // Subscribe to WebSocket events for this user
  useEffect(() => {
    if (!selectedUserId) return;

    const callbacks = {
      onMessage: (data) => {
        console.log(`Message for user ${selectedUserId}:`, data);
        // Handle incoming messages - this will be used by parent
      },
      onStatusChange: (connected) => {
        setIsConnected(connected);
      },
    };

    // Subscribe this user
    const unsubscribe = webSocketManager.subscribe(selectedUserId, callbacks);

    // Cleanup on unmount or when userId changes
    return () => {
      unsubscribe();
    };
  }, [selectedUserId]);

  // Send message function
  const sendMessage = useCallback(
    (message) => {
      if (!selectedUserId) {
        console.error("Cannot send message: no user selected");
        return false;
      }

      return webSocketManager.send(message, selectedUserId);
    },
    [selectedUserId]
  );

  // Disconnect function (unsubscribes this user)
  const disconnect = useCallback(() => {
    if (selectedUserId) {
      webSocketManager.unsubscribe(selectedUserId);
    }
  }, [selectedUserId]);

  return {
    isConnected,
    sendMessage,
    disconnect,
    getConnectedUsers: () => webSocketManager.getConnectedUsers(),
    getConnectedUsersCount: () => webSocketManager.getConnectedUsersCount(),
  };
};
