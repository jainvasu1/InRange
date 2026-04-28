const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const protect = require("../middleware/auth");

// Route: Get chat history between logged-in user and other user
router.get("/:otherId", protect, chatController.getChatHistory);

module.exports = router;
