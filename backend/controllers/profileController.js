const User = require("../models/User");
const Profile = require("../models/Profile");
const Preferences = require("../models/Preferences");
const calculateCompatibility = require("../utils/compatibilityEngine");
// -----------------------------
// Convert multer file to Base64
// -----------------------------
function fileBufferToDataUrl(file) {
  if (!file || !file.mimetype || !file.buffer) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

// ------------------------------------------------------
// POST /api/profile/update
// ------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    console.log("BODY DATA:", req.body);
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const {
      fullName,
      birthDate,
      gender,
      course,
      yearOfStudy,
      permanentAddress,
      contactNumber,
      instagramLink,
      linkedinLink,
      bio,
      budget,
      cleanliness,
      sleepSchedule,
      foodPreference,
      locationPreference
    } = req.body;

    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (gender) updateData.gender = gender;
    if (course) updateData.course = course;
    if (yearOfStudy) updateData.yearOfStudy = yearOfStudy; 
    if (permanentAddress) updateData.permanentAddress = permanentAddress;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (bio) updateData.bio = bio;
    updateData.budget = budget;
    updateData.cleanliness = cleanliness;
    updateData.sleepSchedule = sleepSchedule;
    updateData.foodPreference = foodPreference;
    updateData.locationPreference = locationPreference;
    updateData.socialLinks = {
      instagram: instagramLink?.trim() || "",
      linkedin: linkedinLink?.trim() || ""
    };

    const uploadedImage = fileBufferToDataUrl(req.file);
    if (uploadedImage) {
      updateData.profilePicture = uploadedImage;
    }

    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(userId, { profile: profile._id });

    return res.redirect("/profile_view.html?updated=1");

  } catch (err) {
    console.error("Profile Update Error:", err);
    return res.status(500).json({ error: "Server Error during profile update." });
  }
};

// ------------------------------------------------------
// GET /api/profile/me
// ------------------------------------------------------
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const profile = await Profile.findOne({ user: userId }).lean();

    if (!profile) {
      return res.json({
        user: userId,
        fullName: "",
        birthDate: null,
        gender: "",
        course: "",
        permanentAddress: "",
        contactNumber: "",
        socialLinks: { instagram: "", linkedin: "" },
        bio: "",
        profilePicture: ""
      });
    }

    return res.json(profile);
  } catch (err) {
    console.error("Fetch Profile Error:", err);
    res.status(500).json({ error: "Server Error fetching profile." });
  }
};

// ------------------------------------------------------
// POST /api/profile/preferences
// ------------------------------------------------------
exports.savePreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      lookingFor,
      currentHostel,
      hostelPreference,
      preferredGender,
      department,
      yearOfStudy,
      seaterType,
      hobbies
    } = req.body;

    let preferences = await Preferences.findOne({ user: userId });
    if (!preferences) {
      preferences = new Preferences({ user: userId });
    }

    preferences.lookingFor = lookingFor || "";
    preferences.currentHostel = currentHostel || "";
    preferences.hostelPreference = hostelPreference || "";
    preferences.preferredGender = preferredGender || "";
    preferences.department = department || "";
    preferences.yearOfStudy = yearOfStudy || "";
    preferences.seaterType = seaterType || "";
    preferences.hobbies = hobbies ? [hobbies] : [];
    await preferences.save();
    await User.findByIdAndUpdate(userId, { preferences: preferences._id });

    return res.redirect("/matches.html");

  } catch (err) {
    console.error("Save Preferences Error:", err);
    return res.redirect("/preferences.html?error=1");
  }
};

// ------------------------------------------------------
// GET /api/profile/matches
// ------------------------------------------------------

function generateAIExplanation(myProfile, theirProfile, breakdown) {

  const positives = [];
  const concerns = [];

  function compare(field, label) {
    if (!myProfile[field] || !theirProfile[field]) return;

    if (myProfile[field] === theirProfile[field]) {
      positives.push(label);
    } else {
      concerns.push(label);
    }
  }

  compare("cleanliness", "cleanliness habits");
  compare("sleepSchedule", "sleep schedule");
  compare("foodPreference", "food preferences");
  compare("locationPreference", "location preference");
  compare("budget", "budget expectations");

  let message = `You and ${theirProfile.fullName || "this user"} are a ${breakdown.lifestyleScore}% lifestyle match. `;

  if (positives.length) {
    message += `You both align well in ${positives.join(", ")}. `;
  }

  if (concerns.length) {
    message += `There might be some differences in ${concerns.join(", ")}, but they can be managed with communication.`;
  }

  if (breakdown.premiumBoost) {
    message += ` This profile is more visible due to premium status.`;
  }

  return message;
}

function itemCompatibility(val1, val2) {
  if (!val1 || !val2) return 0;
  return val1 === val2 ? 100 : 50;
}

exports.getMatches = async (req, res) => {
  try {
    const userId = req.user._id;

    const myProfile = await Profile.findOne({ user: userId }).lean();
    const myPref = await Preferences.findOne({ user: userId }).lean();

    const allProfiles = await Profile.find({ user: { $ne: userId } })
      .populate("user")
      .lean();

    const matches = [];

    function extractHobbiesFromBio(bio) {
      const keywords = ['reading','painting','drawing','dancing','writing','gossiping','editing','sleeping','resting','hiking','coding','coffee'];
      const found = [];
      const s = (bio||'').toLowerCase();
      keywords.forEach(k => { 
        if (s.includes(k)) 
          found.push(k.charAt(0).toUpperCase()+k.slice(1)); 
      });
      return found;
    }

    for (const theirProfile of allProfiles) {

      const theirPref = await Preferences.findOne({ user: theirProfile.user._id }).lean() || {};

      let score = 0;

      // -----------------------
      // Existing Preference Score
      // -----------------------
      if (myPref) {

        if (!myPref.preferredGender || myPref.preferredGender === theirProfile.gender)
          score += 20;

        const theirDepartment = theirPref.department || theirProfile.course || "N/A";
        if (myPref.department && myPref.department === theirDepartment)
          score += 20;

        const theirYear = theirPref.yearOfStudy || "N/A";
        if (myPref.yearOfStudy && myPref.yearOfStudy === theirYear)
          score += 15;

        if (myPref.seaterType && myPref.seaterType === (theirPref.seaterType || theirProfile.seaterType))
          score += 15;

        const theirHobbies = (Array.isArray(theirPref.hobbies) && theirPref.hobbies.length)
          ? theirPref.hobbies
          : extractHobbiesFromBio(theirProfile.bio || "");

        if (Array.isArray(myPref.hobbies)) {
          const common = myPref.hobbies.filter(h => theirHobbies.includes(h));
          score += common.length * 5;
        }
      }

      // -----------------------
      // NEW: Lifestyle Compatibility Score
      // -----------------------
      let lifestyleScore = 0;

      if (myProfile && theirProfile) {
        lifestyleScore = calculateCompatibility(myProfile, theirProfile);
      }

      // -----------------------
      // FINAL SCORE (Weighted)
      // -----------------------
      let finalScore = Math.round((score * 0.6) + (lifestyleScore * 0.4));

      // Premium Boost
      if (theirProfile.user.isPremium) {
        finalScore += theirProfile.user.premiumBoostScore || 10;
      }

      finalScore = Math.min(finalScore, 100);

      matches.push({
        id: theirProfile.user._id,
        fullName: theirProfile.fullName || "Unknown",
        profilePicture: theirProfile.profilePicture || "",
        department: theirProfile.course || "N/A",
        yearOfStudy: theirProfile.yearOfStudy || "N/A",
        hobbies: extractHobbiesFromBio(theirProfile.bio || ""),
        matchScore: finalScore,
      
        breakdown: {
          preferenceScore: score,
          lifestyleScore: lifestyleScore,
          premiumBoost: theirProfile.user.isPremium ? true : false,
      
          radar: {
            cleanliness: itemCompatibility(myProfile?.cleanliness, theirProfile.cleanliness),
            sleepSchedule: itemCompatibility(myProfile?.sleepSchedule, theirProfile.sleepSchedule),
            foodPreference: itemCompatibility(myProfile?.foodPreference, theirProfile.foodPreference),
            locationPreference: itemCompatibility(myProfile?.locationPreference, theirProfile.locationPreference),
            budget: itemCompatibility(myProfile?.budget, theirProfile.budget)
          }
        },
      
        aiExplanation: generateAIExplanation(myProfile, theirProfile, {
          preferenceScore: score,
          lifestyleScore: lifestyleScore,
          premiumBoost: theirProfile.user.isPremium
        })
      });
    }

    // -----------------------
    // SORT BY MATCH SCORE DESC
    // -----------------------
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ matches });

  } catch (err) {
    console.error("Get Matches Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
