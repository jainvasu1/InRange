// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ------------------------------------------
// POST /auth/signup
// ------------------------------------------
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, confirm_password } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirm_password) {
      return res.redirect('/signup.html?error=missing');
    }

    // Password mismatch
    if (password !== confirm_password) {
      return res.redirect('/signup.html?error=password_mismatch');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect('/signup.html?error=email_exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // After signup → redirect to login page
    return res.redirect('/login.html?success=registered');
  } catch (error) {
    console.error(error);
    return res.redirect('/signup.html?error=server');
  }
};

// ------------------------------------------
// POST /auth/login
// ------------------------------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.redirect('/login.html?error=missing');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect('/login.html?error=invalid');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect('/login.html?error=invalid');
    }

    // Create JWT
    const token = generateToken(user._id);

    // Store token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true only in HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Redirect to dashboard
    return res.redirect('/dashboard.html');
  } catch (error) {
    console.error(error);
    return res.redirect('/login.html?error=server');
  }
};

// ------------------------------------------
// GET /auth/logout
// ------------------------------------------
exports.logoutUser = async (req, res) => {
  res.clearCookie('token');
  return res.redirect('/login.html');
};
