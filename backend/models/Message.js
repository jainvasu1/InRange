const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Accept both "message" and "text"
  message: {
    type: String
  },
  text: {
    type: String
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  // For read receipts
  read: {
    type: Boolean,
    default: false
  }
});

// Ensure whichever field is provided becomes "message"
MessageSchema.pre("save", function (next) {
  if (!this.message && this.text) {
    this.message = this.text;
  }
  if (!this.text && this.message) {
    this.text = this.message;
  }
  next();
});

module.exports = mongoose.model("Message", MessageSchema);
