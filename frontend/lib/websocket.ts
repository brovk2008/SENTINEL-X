/**
 * SafetyOS WebSocket Manager
 * Handles real-time connection with exponential backoff reconnection logic
 */

type EventListener = (data: unknown) => void;

class SafetyOSWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private minDelay = 1000;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isConnecting = false;
  private messageQueue: unknown[] = [];

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      // Use environment variable if available, fall back to current window hostname
      const runtimeWindow = typeof window !== "undefined"
        ? (window as Window & { NEXT_PUBLIC_WS_URL?: string })
        : undefined;
      const wsUrl = runtimeWindow?.NEXT_PUBLIC_WS_URL
        ? runtimeWindow.NEXT_PUBLIC_WS_URL
        : process.env.NEXT_PUBLIC_WS_URL 
        ? process.env.NEXT_PUBLIC_WS_URL 
        : `ws://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8000/ws/live`;
      this.url = wsUrl.endsWith('/ws/live') ? wsUrl : `${wsUrl}/ws/live`;
    }
  }

  /**
   * Connect to WebSocket server with automatic reconnection on failure
   */
  connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("✅ SafetyOS WebSocket connected");
        this.isConnecting = false;
        this.reconnectDelay = this.minDelay; // Reset on successful connect
        
        // Drain message queue
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          this.ws?.send(JSON.stringify(msg));
        }

        // Emit connection event
        this.emit("connected", { timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type || "message";
          this.emit(eventType, data);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.emit("error", { error: error.toString() });
      };

      this.ws.onclose = () => {
        console.warn("WebSocket closed. Attempting reconnection...");
        this.isConnecting = false;
        this.ws = null;
        this.emit("disconnected", { timestamp: new Date().toISOString() });
        
        // Exponential backoff reconnection
        setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
          console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
          this.connect();
        }, this.reconnectDelay);
      };
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      this.isConnecting = false;
      
      // Retry with exponential backoff
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
        this.connect();
      }, this.reconnectDelay);
    }
  }

  /**
   * Send data over WebSocket (queued if not connected)
   */
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message for later delivery
      this.messageQueue.push(data);
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: string, handler: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(eventType: string, data: unknown): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in WebSocket handler for ${eventType}:`, e);
        }
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current queue size (messages waiting to be sent)
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }
}

// Singleton instance
let wsInstance: SafetyOSWebSocket | null = null;

export function getSafetyOSWebSocket(): SafetyOSWebSocket {
  if (!wsInstance) {
    wsInstance = new SafetyOSWebSocket();
  }
  return wsInstance;
}

// Export for convenience
export const safetyWS = getSafetyOSWebSocket();
