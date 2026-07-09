const { MongoClient } = require('mongodb')
const { v4: uuidv4 }  = require('uuid')

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://fingerprintadmin:N1bTj33diZ5Zq0tq@fingerprint-cdp.ewy8hyl.mongodb.net/?appName=fingerprint-cdp'
const DB_NAME   = 'fingerprint_cdp'
const COL_NAME  = 'profiles'

// Keep one connection open and reuse it
let client     = null
let collection = null

async function getCollection() {
  if (collection) return collection
  client     = new MongoClient(MONGO_URI)
  await client.connect()
  collection = client.db(DB_NAME).collection(COL_NAME)
  console.log('Connected to MongoDB Atlas')
  return collection
}

async function findProfileByFingerprintId(fingerprintId) {
  const col = await getCollection()
  return await col.findOne({ fingerprint_id: fingerprintId }) || null
}

async function createProfile(fingerprintId, signals) {
  const col = await getCollection()
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
  await col.insertOne(newProfile)
  return newProfile
}

async function updateProfile(fingerprintId, signals) {
  const col = await getCollection()
  const profile = await col.findOne({ fingerprint_id: fingerprintId })
  if (!profile) return null

  await col.updateOne(
    { fingerprint_id: fingerprintId },
    {
      $set: {
        last_seen:            new Date().toISOString(),
        signals:              signals,
        'traits.browser':     extractBrowser(signals.user_agent),
        'traits.os':          signals.platform       || 'unknown',
        'traits.timezone':    signals.timezone       || 'unknown',
        'traits.language':    signals.language       || 'unknown',
        'traits.gpu':         signals.webgl_renderer || 'unknown',
      },
      $inc: { visit_count: 1 },
      $push: {
        signal_history: {
          recorded_at: profile.last_seen,
          signals:     profile.signals
        }
      }
    }
  )
  return await col.findOne({ fingerprint_id: fingerprintId })
}

async function getAllProfiles() {
  const col = await getCollection()
  return await col.find({}).toArray()
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
