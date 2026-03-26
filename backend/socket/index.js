const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const Group = require("../models/Group");

function initSocket(httpServer) {
  const port = process.env.SOCKET_PORT || undefined;

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5500",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Auth for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Missing socket auth token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = payload.sub;
      socket.user = { id: userId, role: payload.role };

      // Join rooms for all groups the user belongs to
      const groups = await Group.find({ members: userId }).select("_id");
      for (const g of groups) {
        socket.join(`group_${g._id}`);
      }

      return next();
    } catch (err) {
      return next(new Error("Socket auth failed"));
    }
  });

  io.on("connection", (socket) => {
    // Optional: can send initial state
    socket.on("ping", () => socket.emit("pong"));
  });

  // Keep linter happy about unused var
  void port;

  return io;
}

module.exports = { initSocket };

