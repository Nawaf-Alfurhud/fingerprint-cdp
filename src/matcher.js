const storage = require('./storage')

async function matchProfile(fingerprintId, signals) {

  const existingProfile = await storage.findProfileByFingerprintId(fingerprintId)

  if (existingProfile) {
    const updatedProfile = await storage.updateProfile(fingerprintId, signals)
    return {
      status:  'returning_visitor',
      profile: updatedProfile
    }
  }

  const newProfile = await storage.createProfile(fingerprintId, signals)
  return {
    status:  'new_visitor',
    profile: newProfile
  }
}

module.exports = { matchProfile }
