// One-off migration: lowercase + trim all existing user emails.
// Usage:
//   MONGO_URI="<your-atlas-uri>" node scripts/lowercase-emails.js
// Or put MONGO_URI in .env and run: node scripts/lowercase-emails.js

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set. Put it in .env or pass it inline.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection("users");

  const docs = await users.find({}).toArray();
  let changed = 0;
  let skipped = 0;

  for (const u of docs) {
    const original = u.email || "";
    const normalised = original.trim().toLowerCase();
    if (original === normalised) {
      skipped++;
      continue;
    }

    // Skip if a different user already has the lowercase version
    const clash = await users.findOne({ email: normalised, _id: { $ne: u._id } });
    if (clash) {
      console.warn(`SKIP duplicate: "${original}" -> "${normalised}" already taken by ${clash._id}`);
      continue;
    }

    await users.updateOne({ _id: u._id }, { $set: { email: normalised } });
    console.log(`fixed: "${original}" -> "${normalised}"`);
    changed++;
  }

  console.log(`Done. changed=${changed} unchanged=${skipped} total=${docs.length}`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
