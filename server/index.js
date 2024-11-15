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
import helmet from "helmet";
import compression from "compression";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const databaseURL = process.env.DATABSE_URL;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ORIGIN ? process.env.ORIGIN.split(',') : ['https://majdooriclient.vercel.app/auth'];

app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    exposedHeaders: ["set-cookie"],
    maxAge: 86400 // 24 hours
  })
);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static file serving with security headers
app.use("/uploads/profiles", (req, res, next) => {
  res.set({
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Access-Control-Allow-Origin': allowedOrigins[0]
  });
  next();
}, express.static("uploads/profiles"));

app.use("/uploads/files", (req, res, next) => {
  res.set({
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Access-Control-Allow-Origin': allowedOrigins[0]
  });
  next();
}, express.static("uploads/files"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes);
app.use("/api/practice-zone", practiceZoneRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(databaseURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("DB Connection Successful");
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Server setup with graceful shutdown
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Socket.io setup with CORS
setupSocket(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
