import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadCast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket, req) => {
    socket.isAlive = true;
    socket.on("pong", () => (socket.isAlive = true));
    sendJson(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  server.on("upgrade", async (req, socket, head) => {
    if (!wsArcjet) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      return;
    }

    try {
      const decision = await wsArcjet.protect(req);

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
        } else {
          socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        }
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } catch (e) {
      console.error("WS upgrade error: ", e);
      socket.destroy();
    }
  });

  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive === false) return client.terminate();
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match) {
    broadCast(wss, { type: "match_created", data: match });
  }

  return { broadcastMatchCreated };
}
