// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/roomie-radarDB';
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // mongoose 6+ doesn't need useCreateIndex/useFindAndModify options
    });
    console.log('✅ MongoDB connected:', mongoURI);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);
    process.exit(1); // exit process with failure
  }
};

module.exports = connectDB;
