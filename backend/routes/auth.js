// backend/routes/auth.js
const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser
} = require('../controllers/authController');

// Signup Route
router.post('/signup', registerUser);

// Login Route
router.post('/login', loginUser);

// Logout Route
router.get('/logout', logoutUser);

module.exports = router;
