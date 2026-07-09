// matcher.js
// ----------
// This file decides whether an incoming fingerprint ID
// matches an existing profile in our database.
//
// Right now we do EXACT matching only.
// The fingerprint ID is a hash of stable signals --
// if the hash matches, it is the same device.
//
// FUTURE IMPROVEMENT:
// When we add fuzzy matching later, this is the only
// file that needs to change. We will add a similarity
// scoring function here that compares raw signals
// instead of just comparing the hash.

const storage = require('./storage')

function matchProfile(fingerprintId, signals) {

  // Step 1 -- Look for an exact match in the database
  const existingProfile = storage.findProfileByFingerprintId(fingerprintId)

  if (existingProfile) {
    // We have seen this device before
    // Update the profile with the latest signals and return it
    const updatedProfile = storage.updateProfile(fingerprintId, signals)

    return {
      status:  'returning_visitor',  // tells the browser this is a known device
      profile: updatedProfile
    }
  }

  // Step 2 -- No match found
  // This is a new device we have never seen before
  // Create a fresh anonymous profile and return it
  const newProfile = storage.createProfile(fingerprintId, signals)

  return {
    status:  'new_visitor',  // tells the browser this is a new device
    profile: newProfile
  }

  // -- FUZZY MATCHING STUB --
  // When we are ready to add fuzzy matching, the logic goes here.
  // Between step 1 and step 2 we will add:
  //
  // Step 1.5 -- No exact match, try fuzzy match
  //   const candidates = storage.findCandidateProfiles(signals)
  //   const bestMatch  = scoreSimilarity(candidates, signals)
  //   if (bestMatch.score >= 0.75) {
  //     return { status: 'fuzzy_match', profile: bestMatch.profile }
  //   }
  //
  // This stub is here so we remember exactly where to add it later.
}

// Make the function available to other files
module.exports = { matchProfile }
