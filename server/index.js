import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import messagesRoutes from "./routes/MessagesRoute.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import practiceZoneRoutes from "./routes/PracticeZoneRoutes.js"; // New import
import setupSocket from "./socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT;
const databaseURL = process.env.DATABSE_URL;

// CORS configuration
app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Static file serving
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);
app.use("/api/practice-zone", practiceZoneRoutes); // New route

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Server setup
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Socket.io setup
setupSocket(server);

// Database connection
mongoose
  .connect(databaseURL)
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log(err.message);
  });

export default app;