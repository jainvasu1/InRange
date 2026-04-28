const mongoose = require('mongoose');

const PreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    lookingFor: {
      type: String,
      default: ""
    },

    currentHostel: {
      type: String,
      default: ""
    },

    hostelPreference: {
      type: String,
      default: ""
    },

    preferredGender: {
      type: String,
      default: ""
    },

    department: {
      type: String,
      default: ""
    },

    yearOfStudy: {
      type: String,
      default: ""
    },

    seaterType: {
      type: String,
      default: ""
    },

    hobbies: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Preferences", PreferencesSchema);
