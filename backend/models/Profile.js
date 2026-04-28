// backend/models/Profile.js
const mongoose = require('mongoose');

const SocialLinksSchema = new mongoose.Schema({
  instagram: { type: String, default: "" },
  linkedin: { type: String, default: "" }
}, { _id: false });

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    fullName: { type: String, trim: true, default: "" },

    birthDate: { type: Date, default: null },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: ""
    },

    course: { type: String, default: "" },

    yearOfStudy: { type: String, default: "" },

    permanentAddress: { type: String, default: "" },

    contactNumber: { type: String, default: "" },

    socialLinks: { type: SocialLinksSchema, default: () => ({}) },

    bio: { type: String, default: "" },

    profilePicture: { type: String, default: "" }, // stores "data:image/...base64,..."

    budget: { type: String, default: ""},

    cleanliness: { type: String, default: ""},

    sleepSchedule: { type: String, default: ""},

    foodPreference: { type: String, default: ""},

    locationPreference: { type: String, default: ""},
  },
  { timestamps: true }
);

// Optional: index by user for fast lookup (user is unique already)
ProfileSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Profile", ProfileSchema);
