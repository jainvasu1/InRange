// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const path = require("path");

// Models
const Message = require("./backend/models/Message");

// Routes
const authRoutes = require("./backend/routes/auth");
const profileRoutes = require("./backend/routes/profile");
const chatRoutes = require("./backend/routes/chat");

// DB Connection
const connectDB = require("./backend/config/db");
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// -------- Middleware --------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files
app.use(express.static(path.join(__dirname, "frontend", "static", "templates")));
app.use(express.static(path.join(__dirname, "frontend", "static")));
app.use("/images", express.static(path.join(__dirname, "frontend", "static", "images")));

// Fix favicon errors
app.get("/favicon.ico", (req, res) => res.status(204).end());

// -------- ROUTES --------
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);

// Serve frontend pages

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'static', 'templates', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'static', 'templates', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'static', 'templates', 'signup.html'));
});

app.get('/preferences', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'static', 'templates', 'preferences.html'));
});

app.get('/matches', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'static', 'templates', 'matches.html'));
});

app.get('/profile_view', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'static', 'templates', 'profile_view.html'));
});

// -------- SOCKET.IO CHAT SYSTEM --------
const onlineUsers = {}; // userId → socketId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register/log in user
  socket.on("registerUser", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // Handle private messages
  socket.on("privateMessage", async ({ recipientId, message }) => {
    try {
      const senderId = Object.keys(onlineUsers).find(
        (uid) => onlineUsers[uid] === socket.id
      );

      if (!senderId) {
        console.log("Sender not found for socket:", socket.id);
        return;
      }

      const chatId = [senderId, recipientId].sort().join("_");

      // Save message in MongoDB
      await Message.create({
        chatId,
        senderId,
        recipientId,
        text: message,
        timestamp: new Date(),
      });

      const recipientSocket = onlineUsers[recipientId];

      // Deliver message in real-time (if receiver online)
      if (recipientSocket) {
        io.to(recipientSocket).emit("newMessage", {
          senderId,
          message,
          timestamp: new Date(),
        });
      }

      // Acknowledge to sender
      socket.emit("messageSent", { message });
    } catch (err) {
      console.error("Socket message error:", err);
    }
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    for (const [userId, sockId] of Object.entries(onlineUsers)) {
      if (sockId === socket.id) {
        delete onlineUsers[userId];
        console.log(`User ${userId} disconnected.`);
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// -------- START SERVER --------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
