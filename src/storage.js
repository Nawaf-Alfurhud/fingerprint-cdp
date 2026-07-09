const fs   = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const DB_PATH  = path.join(__dirname, '../data/profiles.json')
const DATA_DIR = path.join(__dirname, '../data')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readDatabase() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return { profiles: [] }
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

function findProfileByFingerprintId(fingerprintId) {
  const db = readDatabase()
  return db.profiles.find(p => p.fingerprint_id === fingerprintId) || null
}

function createProfile(fingerprintId, signals) {
  const db = readDatabase()
  const newProfile = {
    _id:            'CDP-ANON-' + uuidv4().substring(0, 8).toUpperCase(),
    fingerprint_id: fingerprintId,
    created_at:     new Date().toISOString(),
    last_seen:      new Date().toISOString(),
    visit_count:    1,
    identities: [
      { type: 'fingerprint_id', value: fingerprintId, platform: 'web', active: true }
    ],
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
    signals:        signals,
    signal_history: []
  }
  db.profiles.push(newProfile)
  writeDatabase(db)
  return newProfile
}

function updateProfile(fingerprintId, signals) {
  const db    = readDatabase()
  const index = db.profiles.findIndex(p => p.fingerprint_id === fingerprintId)
  if (index === -1) return null

  db.profiles[index].signal_history.push({
    recorded_at: db.profiles[index].last_seen,
    signals:     db.profiles[index].signals
  })

  db.profiles[index].last_seen      = new Date().toISOString()
  db.profiles[index].visit_count    = db.profiles[index].visit_count + 1
  db.profiles[index].signals        = signals
  db.profiles[index].traits.browser  = extractBrowser(signals.user_agent)
  db.profiles[index].traits.os       = signals.platform       || 'unknown'
  db.profiles[index].traits.timezone = signals.timezone       || 'unknown'
  db.profiles[index].traits.language = signals.language       || 'unknown'
  db.profiles[index].traits.gpu      = signals.webgl_renderer || 'unknown'

  writeDatabase(db)
  return db.profiles[index]
}

function getAllProfiles() {
  const db = readDatabase()
  return db.profiles
}

function extractBrowser(userAgent) {
  if (!userAgent) return 'unknown'
  if (userAgent.includes('Chrome'))  return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari'))  return 'Safari'
  if (userAgent.includes('Edge'))    return 'Edge'
  return 'Other'
}

module.exports = {
  findProfileByFingerprintId,
  createProfile,
  updateProfile,
  getAllProfiles
}
