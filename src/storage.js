// storage.js
// ----------
// This file handles all database operations.
// Right now we use a simple JSON file as our database.
// This is fine for a mock system.
//
// IMPORTANT: This file is designed so that later we can
// swap the JSON file for real MongoDB without touching
// any other file. The function names and what they return
// will stay exactly the same -- only the internals change.

const fs   = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

// Path to our fake database file
const DB_PATH = path.join(__dirname, '../data/profiles.json')

// -- HELPER: Read the database file --
// Returns the full profiles object, or empty object if file does not exist yet
function readDatabase() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    // File does not exist yet -- return empty database
    return { profiles: [] }
  }
}

// -- HELPER: Write to the database file --
// Takes the full profiles object and saves it to disk
function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

// -- FIND a profile by fingerprint ID --
// Returns the profile object if found, or null if not found
function findProfileByFingerprintId(fingerprintId) {
  const db = readDatabase()

  const profile = db.profiles.find(p => p.fingerprint_id === fingerprintId)

  return profile || null
}

// -- CREATE a new anonymous profile --
// Called when we see a fingerprint ID for the first time
function createProfile(fingerprintId, signals) {
  const db = readDatabase()

  // Build the profile in MongoDB document style
  // Even though we are using JSON, the structure is exactly
  // what we would store in a real MongoDB collection later
  const newProfile = {

    // The unique ID for this profile inside our CDP
    _id: 'CDP-ANON-' + uuidv4().substring(0, 8).toUpperCase(),

    // The fingerprint ID generated from their browser signals
    fingerprint_id: fingerprintId,

    // Timestamps
    created_at: new Date().toISOString(),
    last_seen:  new Date().toISOString(),

    // How many times we have seen this device
    visit_count: 1,

    // Identities array -- same structure we designed in the CDP section
    // Later we can add email, user_id etc when the user logs in
    identities: [
      {
        type:     'fingerprint_id',
        value:    fingerprintId,
        platform: 'web',
        active:   true
      }
    ],

    // Traits -- human readable summary of who this device belongs to
    // Derived from the raw signals
    traits: {
      browser:  extractBrowser(signals.user_agent),
      os:       signals.platform       || 'unknown',
      timezone: signals.timezone       || 'unknown',
      screen:   signals.screen_width && signals.screen_height
                  ? signals.screen_width + 'x' + signals.screen_height
                  : 'unknown',
      language: signals.language       || 'unknown',
      gpu:      signals.webgl_renderer || 'unknown',
    },

    // The raw signals exactly as collected
    // This is what we use for matching on future visits
    signals: signals,

    // Signal history -- every time this device visits we store
    // the signals here. Useful for tracking how signals change over time.
    // Also needed for PDPL deletion (we know exactly what to delete)
    signal_history: []
  }

  // Add the new profile to the database and save
  db.profiles.push(newProfile)
  writeDatabase(db)

  return newProfile
}

// -- UPDATE an existing profile --
// Called when we recognise a returning visitor
function updateProfile(fingerprintId, signals) {
  const db = readDatabase()

  const index = db.profiles.findIndex(p => p.fingerprint_id === fingerprintId)

  if (index === -1) return null

  // Move current signals to history before updating
  // This keeps a record of how their signals have changed over time
  db.profiles[index].signal_history.push({
    recorded_at: db.profiles[index].last_seen,
    signals:     db.profiles[index].signals
  })

  // Update the profile with fresh data
  db.profiles[index].last_seen   = new Date().toISOString()
  db.profiles[index].visit_count = db.profiles[index].visit_count + 1
  db.profiles[index].signals     = signals

  // Update traits in case anything changed (e.g. timezone)
  db.profiles[index].traits.browser  = extractBrowser(signals.user_agent)
  db.profiles[index].traits.os       = signals.platform       || 'unknown'
  db.profiles[index].traits.timezone = signals.timezone       || 'unknown'
  db.profiles[index].traits.language = signals.language       || 'unknown'
  db.profiles[index].traits.gpu      = signals.webgl_renderer || 'unknown'

  writeDatabase(db)

  return db.profiles[index]
}

// -- GET all profiles --
// Used by the /api/profiles endpoint so we can see everything in the database
function getAllProfiles() {
  const db = readDatabase()
  return db.profiles
}

// -- HELPER: Extract browser name from user agent string --
// User agent strings are messy. This gives us a clean readable name.
function extractBrowser(userAgent) {
  if (!userAgent) return 'unknown'
  if (userAgent.includes('Chrome'))  return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari'))  return 'Safari'
  if (userAgent.includes('Edge'))    return 'Edge'
  return 'Other'
}

// Make all functions available to other files
module.exports = {
  findProfileByFingerprintId,
  createProfile,
  updateProfile,
  getAllProfiles
}
