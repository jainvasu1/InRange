// backend/routes/profile.js

const express = require("express");
const router = express.Router();

// always use your auth.js file
const auth = require("../middleware/auth");

const multer = require("multer");

// Controllers
const {
  updateProfile,
  getMyProfile,
  savePreferences,
  getMatches
} = require("../controllers/profileController");

// Multer memory storage for Base64 image conversion (5 MB limit, images only)
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

const handleUpload = (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE"
        ? "Image too large. Max 5 MB."
        : err.message || "Upload failed";
      return res.redirect("/profile.html?error=" + encodeURIComponent(msg));
    }
    next();
  });
};
// -----------------------------------
// ROUTES
// -----------------------------------

// Update or create profile (with image upload)
router.post(
  "/update",
  auth,
  handleUpload,
  updateProfile
);


// Activate Premium (Test Mode)
// Activate Premium (Test Mode)
router.post('/activate-premium', async (req, res) => {
  try {
      if (!req.session.userId) {
          return res.status(401).json({ message: "Not logged in" });
      }

      const { plan } = req.body;

      // Example: 30 days premium
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      const user = await User.findByIdAndUpdate(
          req.session.userId,
          {
              isPremium: true,
              premiumPlan: plan || "Basic",
              premiumExpiryDate: expiry,
              premiumBoostScore: 20
          },
          { new: true }
      );

      res.json({
          message: "Premium Activated Successfully",
          premiumExpiryDate: user.premiumExpiryDate
      });

  } catch (error) {
      console.error("Premium activation error:", error);
      res.status(500).json({ message: "Server error" });
  }
});

// Get logged-in user's profile
router.get("/me", auth, getMyProfile);

// Save user preferences
router.post("/preferences", auth, savePreferences);

// Load matches
router.get("/matches", auth, getMatches);

module.exports = router;
