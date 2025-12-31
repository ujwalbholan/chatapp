// _util/WebSocketManager.js
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; // Reduced attempts
    this.reconnectDelay = 2000; // Increased delay
    this.messageQueue = [];
    this.currentUserId = null;
    this.isReconnecting = false;
    this.callbacks = {
      onMessage: null,
      onOpen: null,
      onClose: null,
      onError: null,
    };
    this.reconnectTimeout = null;
  }

  connect(userId) {
    // If already connecting for this user, do nothing
    if (
      this.currentUserId === userId &&
      this.ws &&
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      console.log(`Already connecting for user: ${userId}`);
      return;
    }

    // Close existing connection if any
    this.disconnect();

    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.currentUserId = userId;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    try {
      console.log(`Connecting WebSocket for user: ${userId}`);
      this.ws = new WebSocket("wss://echo.websocket.org");

      this.ws.onopen = () => {
        console.log(`WebSocket connected for user: ${userId}`);
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        if (this.callbacks.onOpen) this.callbacks.onOpen();

        // Send any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }
      };

      this.ws.onmessage = (event) => {
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(event.data, userId);
        }
      };

      this.ws.onclose = (event) => {
        console.log(
          `WebSocket closed for user: ${userId}`,
          event.code,
          event.reason
        );
        if (this.callbacks.onClose) this.callbacks.onClose();

        // Only attempt reconnect if this is still the current user
        // and it's not a normal closure (code 1000)
        if (
          this.currentUserId === userId &&
          event.code !== 1000 &&
          !this.isReconnecting
        ) {
          this.attemptReconnect(userId);
        }
      };

      this.ws.onerror = (error) => {
        console.error(`WebSocket error for user: ${userId}`, error);
        if (this.callbacks.onError) this.callbacks.onError(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      // Attempt reconnect on creation failure
      this.attemptReconnect(userId);
    }
  }

  attemptReconnect(userId) {
    if (
      this.isReconnecting ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    console.log(
      `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} for user: ${userId}`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      if (this.currentUserId === userId) {
        this.connect(userId);
      }
    }, this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(message);
      } catch (error) {
        console.error("Failed to send message:", error);
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
    }
  }

  disconnect() {
    if (this.ws) {
      // Remove event listeners first
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      // Close the connection
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close(1000, "User switched");
      }

      this.ws = null;
    }

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    // Don't clear currentUserId here - we need to know which user we were connected to
  }

  cleanup() {
    this.disconnect();
    this.currentUserId = null;
    this.messageQueue = [];
    this.callbacks = {
      onMessage: null,
      onOpen: null,
      onClose: null,
      onError: null,
    };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  getCurrentUserId() {
    return this.currentUserId;
  }
}

export const webSocketManager = new WebSocketManager();
