import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessagesRoute.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import practiceZoneRoutes from "./routes/PracticeZoneRoutes.js";
import setupSocket from "./socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8747;

// Middleware for CORS configuration
const cors = require('cors');

const allowedOrigins = ['https://community-iq5w.vercel.app'];

app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Parse JSON requests and cookies
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);
app.use("/api/practice-zone", practiceZoneRoutes);

// Error handling middleware for logging and response
app.use((err, req, res, next) => {
  console.error("Error details:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Server setup
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Set up Socket.io
setupSocket(server);

// Database connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABSE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB Connection Successful");
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    setTimeout(connectDB, 5000); // Retry connection every 5 seconds
  }
};

connectDB();

export default app;
