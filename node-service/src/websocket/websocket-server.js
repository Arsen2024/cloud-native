
const { WebSocketServer, WebSocket } = require("ws");
const { randomUUID } = require("crypto");

class WebSocketServerManager {
  constructor(server) {
    this.clients = new Map();

    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      maxPayload: 1024 * 1024,
    });

    this.wss.on("connection", (ws) => {
      this.handleConnection(ws);
    });

    console.log("WebSocket server is running on /ws");
  }

  handleConnection(ws) {
    const clientId = randomUUID();

    const client = {
      clientId,
      connectedAt: new Date().toISOString(),
      state: "connected",
    };

    this.clients.set(ws, client);

    console.log(`Client connected: ${clientId}`);

    this.send(ws, {
      type: "connected",
      clientId,
      connectedAt: client.connectedAt,
    });

    ws.on("message", (data) => {
      this.handleMessage(ws, data);
    });

    ws.on("close", () => {
      this.handleDisconnect(ws);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error (${clientId}):`, error.message);
    });
  }

  handleMessage(ws, data) {
    const client = this.clients.get(ws);

    if (!client) {
      return;
    }

    let message;

    try {
      message = JSON.parse(data.toString());
    } catch {
      this.send(ws, {
        type: "error",
        message: "Invalid JSON message",
      });
      return;
    }

    if (
      !message ||
      typeof message !== "object" ||
      Array.isArray(message) ||
      message.type !== "message" ||
      typeof message.text !== "string" ||
      !message.text.trim()
    ) {
      this.send(ws, {
        type: "error",
        message: "Invalid message format",
      });
      return;
    }

    console.log(`Message from ${client.clientId}: ${message.text}`);

    this.broadcast({
      type: "message",
      clientId: client.clientId,
      text: message.text,
      timestamp: new Date().toISOString(),
    }, ws);
  }

  broadcast(message, excludedClient = null) {
    const payload = JSON.stringify(message);

    for (const [ws] of this.clients) {
      if (
        ws !== excludedClient &&
        ws.readyState === WebSocket.OPEN
      ) {
        if (ws.bufferedAmount > 1024 * 1024) {
          console.warn("Slow WebSocket client: message skipped");
          continue;
        }

        ws.send(payload);
      }
    }
  }

  
  broadcastProgress(progress) {
    this.broadcast(progress);
  }


  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);

    if (!client) {
      return;
    }

    client.state = "disconnected";

    console.log(`Client disconnected: ${client.clientId}`);

    this.clients.delete(ws);
  }

  getConnectedClients() {
    return Array.from(this.clients.values());
  }

  close() {
    this.wss.close();
  }
}

module.exports = WebSocketServerManager;
