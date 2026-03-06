import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../db.js";

let io;

export const initializeSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    process.env.CLIENT_URL,
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["polling", "websocket"], // Try polling first
    allowEIO3: true, // Allow Engine.IO v3 clients
  });

  console.log("📡 Socket.io initialized with CORS origins:", allowedOrigins);

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.warn("Socket connection attempt without token");
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || "trainer-platform",
        audience: process.env.JWT_AUDIENCE || "trainer-users",
      });

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      console.log(`✅ Socket authenticated for user: ${socket.userId}`);
      next();
    } catch (err) {
      console.error("Socket authentication failed:", err.message);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });

    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(
        `User ${socket.userId} joined conversation ${conversationId}`,
      );
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: socket.userId,
        isTyping,
      });
    });

    // Mark messages as read
    socket.on("mark_read", async ({ conversationId }) => {
      try {
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: socket.userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        socket.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          readBy: socket.userId,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.userId}, reason: ${reason}`);
    });
  });

  // Handle server errors
  io.engine.on("connection_error", (err) => {
    console.error("Socket.io connection error:", err.message);
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Helper functions to emit events
// broadcast message event to conversation room only
// participants who have joined the room will receive it
export const emitNewMessage = (conversationId, message, participants = []) => {
  if (io) {
    // Emit only to the conversation room - users in this room will receive it
    // This prevents duplicate messages since users join the room when opening the chat
    io.to(`conversation:${conversationId}`).emit("new_message", message);
  }
};

export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
};
