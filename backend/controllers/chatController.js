const Message = require("../models/Message");

// Generate consistent chatId (same for both users)
function generateChatId(user1, user2) {
  return [user1, user2].sort().join("_");
}

// -------------------------------
// GET CHAT HISTORY
// -------------------------------
exports.getChatHistory = async (req, res) => {
  try {
    const user1 = req.user.id;
    const user2 = req.params.otherId;

    const chatId = generateChatId(user1, user2);

    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Chat History Error:", err);
    res.status(500).json({ error: "Failed to load chat history" });
  }
};
