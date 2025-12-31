import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export const useSocket = ({ userId, onMessage, onUsersUpdate, serverUrl }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(serverUrl, {
      query: { userId },
      reconnectionAttempts: 5,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected. Trying to reconnect...");
    });

    socket.on("message", (message) => {
      onMessage && onMessage(message);
    });

    socket.on("onlineUsers", (users) => {
      onUsersUpdate && onUsersUpdate(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl, userId, onMessage, onUsersUpdate]);

  const sendMessage = useCallback(
    (message) => {
      if (socketRef.current && connected) {
        socketRef.current.emit("message", message);
      }
    },
    [connected]
  );

  return { sendMessage, connected };
};
