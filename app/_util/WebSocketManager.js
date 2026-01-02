class WebSocketManager {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.userStatuses = new Map();
    this.reconnectTimeout = null;
    this.isConnecting = false;

    this.serverUrl = "wss://ws.postman-echo.com/raw";

  }

  subscribe(userId, callbacks) {
    if (!userId) {
      return () => {};
    }

    this.subscribers.set(userId, callbacks);

    this.userStatuses.set(userId, {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      lastSeen: new Date().toISOString(),
    });

    if (callbacks.onStatusChange) {
      callbacks.onStatusChange(this.ws?.readyState === WebSocket.OPEN);
    }

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => this.unsubscribe(userId);
  }

  unsubscribe(userId) {
    this.subscribers.delete(userId);
    this.userStatuses.delete(userId);

    if (this.subscribers.size === 0 && this.ws) {
      this.disconnect();
    }
  }

  connect() {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    if (this.subscribers.size === 0) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;

        this.subscribers.forEach((callbacks, userId) => {
          this.userStatuses.set(userId, {
            isConnected: true,
            lastSeen: new Date().toISOString(),
          });
          if (callbacks.onStatusChange) {
            callbacks.onStatusChange(true);
          }
        });
      };

      this.ws.onmessage = (event) => {
        try {
          let messageData;
          try {
            messageData = JSON.parse(event.data);
          } catch {
            messageData = { content: event.data };
          }

          this.subscribers.forEach((callbacks) => {
            if (callbacks.onMessage) {
              callbacks.onMessage(messageData);
            }
          });
        } catch (error) {
          throw new Error(
            "Error processing incoming WebSocket message:",
            error
          );
        }
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.ws = null;

        this.subscribers.forEach((callbacks, userId) => {
          this.userStatuses.set(userId, {
            isConnected: false,
            lastSeen: new Date().toISOString(),
          });
          if (callbacks.onStatusChange) {
            callbacks.onStatusChange(false);
          }
        });

        if (this.subscribers.size > 0) {
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
      };
    } catch (error) {
      this.isConnecting = false;
    }
  }

  send(message, userId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      let messageData;
      try {
        messageData = JSON.parse(message);
      } catch {
        messageData = { content: message };
      }

      const messageWithUser = {
        ...messageData,
        userId: userId,
        timestamp: new Date().toISOString(),
        isFromChatApp: true,
      };

      this.ws.send(JSON.stringify(messageWithUser));
      return true;
    } catch (error) {
      return false;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Disconnected by client");
      this.ws = null;
    }

    this.isConnecting = false;
  }

  getConnectionState() {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }

  getConnectedUsersCount() {
    return Array.from(this.userStatuses.values()).filter(
      (status) => status.isConnected
    ).length;
  }
}

export const webSocketManager = new WebSocketManager();
