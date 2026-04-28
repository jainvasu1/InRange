// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Link to profile & preferences (we create these models next steps)
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
    },

    preferences: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Preferences',
      default: null,
    },

    budget: {
        type: String,
        default: ""
    },
    
    cleanliness: {
        type: String,
        default: ""
    },
    
    sleepSchedule: {
        type: String,
        default: ""
    },
    
    foodPreference: {
        type: String,
        default: ""
    },
    
    locationPreference: {
        type: String,
        default: ""
    },

    isPremium: {
      type: Boolean,
      default: false
    },
    
    premiumExpiryDate: {
      type: Date,
      default: null
    },
    
    premiumPlan: {
      type: String,
      default: null
    },
    
    premiumBoostScore: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
