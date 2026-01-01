class WebSocketManager {
  constructor() {
    this.ws = null;
    this.subscribers = new Map(); // userId -> { onMessage, onStatusChange }
    this.userStatuses = new Map(); // userId -> { isConnected, lastSeen }
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.serverUrl = "wss://ws.postman-echo.com/raw"; // Working server
  }

  // Subscribe a user to WebSocket events
  subscribe(userId, callbacks) {
    this.subscribers.set(userId, callbacks);
    console.log(`User ${userId} subscribed to WebSocket`);

    // Update user status
    this.userStatuses.set(userId, {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      lastSeen: new Date().toISOString(),
    });

    // Notify subscriber of current status
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange(this.ws?.readyState === WebSocket.OPEN);
    }

    // Connect if not already connected
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => this.unsubscribe(userId);
  }

  // Unsubscribe a user
  unsubscribe(userId) {
    this.subscribers.delete(userId);
    this.userStatuses.delete(userId);
    console.log(`User ${userId} unsubscribed from WebSocket`);

    // Close connection if no users left
    if (this.subscribers.size === 0 && this.ws) {
      this.disconnect();
    }
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.userStatuses.entries())
      .filter(([_, status]) => status.isConnected)
      .map(([userId]) => userId);
  }

  // Connect to WebSocket server
  connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connecting or connected");
      return;
    }

    this.isConnecting = true;
    console.log(`Connecting to WebSocket: ${this.serverUrl}`);

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected successfully");
        this.isConnecting = false;

        // Notify all subscribers
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

      this.ws.onclose = (event) => {
        console.log(
          `WebSocket closed: ${event.code} ${event.reason || "No reason"}`
        );
        this.isConnecting = false;

        // Notify all subscribers
        this.subscribers.forEach((callbacks, userId) => {
          this.userStatuses.set(userId, {
            isConnected: false,
            lastSeen: new Date().toISOString(),
          });
          if (callbacks.onStatusChange) {
            callbacks.onStatusChange(false);
          }
        });

        // Attempt to reconnect after 3 seconds if there are subscribers
        if (this.subscribers.size > 0) {
          this.reconnectTimeout = setTimeout(() => {
            console.log("🔄 Attempting to reconnect...");
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        console.log("📨 WebSocket message received:", event.data);

        try {
          const parsedData = JSON.parse(event.data);

          // Route message to appropriate user based on userId
          if (parsedData.userId && this.subscribers.has(parsedData.userId)) {
            const callbacks = this.subscribers.get(parsedData.userId);
            if (callbacks.onMessage) {
              callbacks.onMessage(parsedData);
            }
          } else {
            // Broadcast to all if no specific userId
            this.subscribers.forEach((callbacks) => {
              if (callbacks.onMessage) {
                callbacks.onMessage(parsedData);
              }
            });
          }
        } catch (error) {
          // Handle non-JSON messages - broadcast to all
          this.subscribers.forEach((callbacks) => {
            if (callbacks.onMessage) {
              callbacks.onMessage({ content: event.data });
            }
          });
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.isConnecting = false;
    }
  }

  // Send message for a specific user
  send(message, userId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected. Message not sent:", message);

      // Try to reconnect
      if (!this.isConnecting) {
        this.connect();

        // Try to send after connection is established
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageWithUserId = {
              ...(typeof message === "string" ? JSON.parse(message) : message),
              userId: userId,
            };
            this.ws.send(JSON.stringify(messageWithUserId));
          }
        }, 1000);
      }
      return false;
    }

    try {
      // Add userId to message for routing
      const messageWithUserId = {
        ...(typeof message === "string" ? JSON.parse(message) : message),
        userId: userId,
        timestamp: new Date().toISOString(),
      };

      console.log(`📤 Sending message for user ${userId}:`, messageWithUserId);
      this.ws.send(JSON.stringify(messageWithUserId));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }

  // Disconnect WebSocket
  disconnect() {
    console.log("Disconnecting WebSocket...");

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnected");
      this.ws = null;
    }

    this.isConnecting = false;

    // Update all user statuses
    this.subscribers.forEach((callbacks, userId) => {
      this.userStatuses.set(userId, {
        isConnected: false,
        lastSeen: new Date().toISOString(),
      });
      if (callbacks.onStatusChange) {
        callbacks.onStatusChange(false);
      }
    });

    console.log("WebSocket disconnected");
  }

  // Get connection state
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

  // Get number of connected users
  getConnectedUsersCount() {
    return Array.from(this.userStatuses.values()).filter(
      (status) => status.isConnected
    ).length;
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();
