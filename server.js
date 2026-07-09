const express = require('express')
const cors    = require('cors')
const path    = require('path')

const { collectSignals }        = require('./src/collector')
const { generateFingerprintId } = require('./src/fingerprint')
const { matchProfile }          = require('./src/matcher')
const { getAllProfiles }         = require('./src/storage')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.post('/api/identify', async (req, res) => {
  try {
    console.log('\n-- New identification request received --')

    const signals       = collectSignals(req.body)
    const fingerprintId = generateFingerprintId(signals)
    const result        = await matchProfile(fingerprintId, signals)

    res.json({
      fingerprint_id: fingerprintId,
      status:         result.status,
      profile:        result.profile
    })
  } catch (err) {
    console.error('Error in /api/identify:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/profile/:fingerprint_id', async (req, res) => {
  try {
    const { findProfileByFingerprintId } = require('./src/storage')
    const profile = await findProfileByFingerprintId(req.params.fingerprint_id)
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await getAllProfiles()
    console.log('Returning', profiles.length, 'profiles')
    res.json(profiles)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => {
  console.log('========================================')
  console.log('Fingerprint CDP server is running')
  console.log('Open your browser at: http://localhost:' + PORT)
  console.log('========================================')
})
