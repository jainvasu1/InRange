// Convert preference string to numeric scale (1-3)
function normalizePreference(value, type) {

    const maps = {
        budget: { Low: 1, Medium: 2, High: 3 },
        cleanliness: { "Very Clean": 3, Moderate: 2, Messy: 1 },
        sleepSchedule: { "Early Sleeper": 1, Flexible: 2, "Night Owl": 3 },
        foodPreference: { Vegetarian: 1, "Non-Vegetarian": 2, Vegan: 3 },
        locationPreference: { "Near Campus": 1, "City Center": 2, Suburbs: 3 }
    };

    if (!value || !maps[type]) return 0;

    return maps[type][value] || 0;
}

// Calculate compatibility score between two profiles
function calculateCompatibility(userA, userB) {

    let score = 0;
    let total = 0;

    const fields = [
        "budget",
        "cleanliness",
        "sleepSchedule",
        "foodPreference",
        "locationPreference"
    ];

    fields.forEach(field => {

        const valA = normalizePreference(userA[field], field);
        const valB = normalizePreference(userB[field], field);

        if (valA && valB) {
            const difference = Math.abs(valA - valB);

            const fieldScore = 3 - difference; 
            score += fieldScore;
            total += 3;
        }
    });

    if (total === 0) return 0;

    return Math.round((score / total) * 100);
}

// ✅ EXPORT THIS
module.exports = calculateCompatibility;