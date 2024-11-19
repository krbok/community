import { Server as SocketIOServer } from "socket.io";
import Message from "./model/MessagesModel.js";
import Channel from "./model/ChannelModel.js";

const setupSocket = (server) => {
  // Socket.io server setup with production configurations
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds ping timeout
    pingInterval: 25000, // 25 seconds ping interval
    connectTimeout: 30000, // 30 seconds connection timeout
    transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
    maxHttpBufferSize: 1e6, // 1 MB max message size
  });

  // In-memory storage
  const userSocketMap = new Map();
  const connectionTimestamps = new Map();

  // Rate limiting configuration
  const MESSAGE_RATE_LIMIT = 30; // messages per minute
  const messageCounters = new Map();

  // Helper function to check rate limit
  const checkRateLimit = (userId) => {
    const now = Date.now();
    const userCounter = messageCounters.get(userId) || { count: 0, timestamp: now };

    if (now - userCounter.timestamp > 60000) {
      // Reset counter after 1 minute
      userCounter.count = 1;
      userCounter.timestamp = now;
    } else if (userCounter.count >= MESSAGE_RATE_LIMIT) {
      return false;
    } else {
      userCounter.count++;
    }

    messageCounters.set(userId, userCounter);
    return true;
  };

  // Helper function for error handling
  const handleError = (socket, error, context) => {
    console.error(`Socket Error in ${context}:`, error);
    socket.emit("error", {
      message: "An error occurred",
      context,
      timestamp: new Date().toISOString(),
    });
  };

  const addChannelNotify = async (channel) => {
    try {
      if (!channel || !channel.members) return;

      const notifications = channel.members.map((member) => {
        const memberSocketId = userSocketMap.get(member.toString());
        if (memberSocketId) {
          return io.to(memberSocketId).emit("new-channel-added", channel);
        }
      });

      await Promise.all(notifications.filter(Boolean));
    } catch (error) {
      console.error("Error in addChannelNotify:", error);
    }
  };

  const sendMessage = async (message, socket) => {
    try {
      if (!checkRateLimit(message.sender)) {
        socket.emit("error", {
          message: "Rate limit exceeded. Please wait before sending more messages.",
        });
        return;
      }

      const [recipientSocketId, senderSocketId] = [
        userSocketMap.get(message.recipient),
        userSocketMap.get(message.sender),
      ];

      const createdMessage = await Message.create(message);
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color")
        .lean()
        .exec();

      const emitPromises = [];
      
      if (recipientSocketId) {
        emitPromises.push(
          io.to(recipientSocketId).emit("receiveMessage", messageData)
        );
      }

      if (senderSocketId) {
        emitPromises.push(
          io.to(senderSocketId).emit("receiveMessage", messageData)
        );
      }

      await Promise.all(emitPromises);
    } catch (error) {
      handleError(socket, error, "sendMessage");
    }
  };

  const sendChannelMessage = async (message, socket) => {
    try {
      if (!checkRateLimit(message.sender)) {
        socket.emit("error", {
          message: "Rate limit exceeded. Please wait before sending more messages.",
        });
        return;
      }

      const { channelId, sender, content, messageType, fileUrl } = message;

      const createdMessage = await Message.create({
        sender,
        recipient: null,
        content,
        messageType,
        timestamp: new Date(),
        fileUrl,
      });

      const [messageData, channel] = await Promise.all([
        Message.findById(createdMessage._id)
          .populate("sender", "id email firstName lastName image color")
          .lean()
          .exec(),
        Channel.findByIdAndUpdate(
          channelId,
          { $push: { messages: createdMessage._id } },
          { new: true }
        ).populate("members admin").lean(),
      ]);

      if (!channel) {
        throw new Error("Channel not found");
      }

      const finalData = { ...messageData, channelId: channel._id };

      const emitPromises = [];

      // Emit to members
      channel.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          emitPromises.push(
            io.to(memberSocketId).emit("recieve-channel-message", finalData)
          );
        }
      });

      // Emit to admin
      const adminSocketId = userSocketMap.get(channel.admin._id.toString());
      if (adminSocketId) {
        emitPromises.push(
          io.to(adminSocketId).emit("recieve-channel-message", finalData)
        );
      }

      await Promise.all(emitPromises);
    } catch (error) {
      handleError(socket, error, "sendChannelMessage");
    }
  };

  const disconnect = (socket) => {
    try {
      console.log("Client disconnected", socket.id);
      const disconnectedUserId = [...userSocketMap.entries()].find(
        ([_, socketId]) => socketId === socket.id
      )?.[0];

      if (disconnectedUserId) {
        userSocketMap.delete(disconnectedUserId);
        connectionTimestamps.delete(disconnectedUserId);
        messageCounters.delete(disconnectedUserId);
      }
    } catch (error) {
      console.error("Error in disconnect handler:", error);
    }
  };

  // Middleware for authentication and connection logging
  io.use((socket, next) => {
    const userId = socket.handshake.query.userId;
    
    if (!userId) {
      return next(new Error("Authentication error"));
    }

    // Store connection timestamp
    connectionTimestamps.set(userId, Date.now());
    next();
  });

  io.on("connection", (socket) => {
    try {
      const userId = socket.handshake.query.userId;
      
      if (userId) {
        // Clean up any existing socket connection for this user
        const existingSocketId = userSocketMap.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
          io.to(existingSocketId).emit("session-expired", {
            message: "New session started from another location",
          });
        }

        userSocketMap.set(userId, socket.id);
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
      }

      // Bind event handlers with socket context
      socket.on("add-channel-notify", addChannelNotify);
      socket.on("sendMessage", (msg) => sendMessage(msg, socket));
      socket.on("send-channel-message", (msg) => sendChannelMessage(msg, socket));
      socket.on("disconnect", () => disconnect(socket));
      
      // Heartbeat mechanism
      socket.on("ping", () => {
        socket.emit("pong");
      });

    } catch (error) {
      handleError(socket, error, "connection");
    }
  });

  // Periodic cleanup of stale connections (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    connectionTimestamps.forEach((timestamp, userId) => {
      if (now - timestamp > 3600000) { // 1 hour
        const socketId = userSocketMap.get(userId);
        if (socketId) {
          io.to(socketId).disconnect(true);
        }
        userSocketMap.delete(userId);
        connectionTimestamps.delete(userId);
        messageCounters.delete(userId);
      }
    });
  }, 300000);

  return io;
};

export default setupSocket;
