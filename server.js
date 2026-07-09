// server.js
// ---------
// This is the main backend file.
// It creates the web server and defines all the API routes.
// Think of it as the traffic controller --
// requests come in, it sends them to the right module,
// and sends the response back to the browser.

const express = require('express')
const cors    = require('cors')
const path    = require('path')

// Import our own modules
const { collectSignals }       = require('./src/collector')
const { generateFingerprintId } = require('./src/fingerprint')
const { matchProfile }         = require('./src/matcher')
const { getAllProfiles }        = require('./src/storage')

// Create the Express app
const app  = express()
const PORT = process.env.PORT || 3000

// -- MIDDLEWARE --
// These run on every request before it hits our routes

// cors() allows our browser page to talk to this server
// Without this the browser blocks the request for security reasons
app.use(cors())

// express.json() lets us read JSON from request bodies
app.use(express.json())

// Serve the public folder as static files
// This is how our index.html gets served when you visit localhost:3000
app.use(express.static(path.join(__dirname, 'public')))


// -- ROUTES --

// POST /api/identify
// ------------------
// This is the main route. The browser sends its raw signals here.
// We process them and return a fingerprint ID and full profile.
app.post('/api/identify', (req, res) => {

  console.log('\n-- New identification request received --')

  // Step 1 -- Validate and clean the incoming signals
  const signals = collectSignals(req.body)
  console.log('Signals collected:', Object.keys(signals).length, 'signals')

  // Step 2 -- Generate a fingerprint ID from the stable signals
  const fingerprintId = generateFingerprintId(signals)
  console.log('Fingerprint ID generated:', fingerprintId)

  // Step 3 -- Check if we have seen this device before
  const result = matchProfile(fingerprintId, signals)
  console.log('Match result:', result.status)

  // Step 4 -- Send the result back to the browser
  res.json({
    fingerprint_id: fingerprintId,
    status:         result.status,
    profile:        result.profile
  })
})


// GET /api/profile/:fingerprint_id
// ---------------------------------
// Returns a single profile by fingerprint ID.
// Useful for looking up a specific device.
app.get('/api/profile/:fingerprint_id', (req, res) => {

  const { findProfileByFingerprintId } = require('./src/storage')
  const profile = findProfileByFingerprintId(req.params.fingerprint_id)

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  res.json(profile)
})


// GET /api/profiles
// -----------------
// Returns ALL profiles in the database.
// This lets us see every device that has visited.
app.get('/api/profiles', (req, res) => {
  const profiles = getAllProfiles()
  console.log('Returning', profiles.length, 'profiles')
  res.json(profiles)
})


// GET /
// -----
// Serves the main HTML page.
// Express already handles this via express.static above
// but we add this as a fallback just in case.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})


// -- START THE SERVER --
app.listen(PORT, () => {
  console.log('========================================')
  console.log('Fingerprint CDP server is running')
  console.log('Open your browser at: http://localhost:' + PORT)
  console.log('========================================')
})
