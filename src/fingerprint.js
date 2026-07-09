// fingerprint.js
// --------------
// This file generates a fingerprint ID from the collected signals.
// The key idea: we only hash the STABLE signals.
// Unstable signals (canvas, audio) change with browser updates
// so we do not include them in the hash -- they would cause the
// same device to get a different fingerprint after every update.
// We collect them and store them, but we do not hash them.

const crypto = require('crypto')

// These are the signals we trust to be stable over time.
// Hardware signals first (most stable), software signals last (less stable).
// This order matters -- same signals in same order = same hash every time.
const STABLE_SIGNALS = [
  'timezone',             // changes only if user moves country
  'screen_width',         // changes only if monitor changes
  'screen_height',        // changes only if monitor changes
  'color_depth',          // changes only if monitor changes
  'pixel_ratio',          // changes only if monitor changes
  'hardware_concurrency', // changes only if CPU changes
  'device_memory',        // changes only if RAM changes
  'platform',             // changes only if OS changes
  'language',             // changes only if user changes language
  'webgl_renderer',       // changes only if GPU or driver changes
]

function generateFingerprintId(signals) {

  // Step 1 -- Pull only the stable signals into a new object
  // If a signal is missing (browser did not support it), we use
  // the string "unknown" as a placeholder so the hash is still valid
  const stableValues = {}
  STABLE_SIGNALS.forEach(key => {
    stableValues[key] = signals[key] !== undefined ? signals[key] : 'unknown'
  })

  // Step 2 -- Turn the stable signals object into a single string
  // JSON.stringify gives us a consistent string representation
  const signalString = JSON.stringify(stableValues)

  // Step 3 -- Hash that string using SHA256
  // We take the first 16 characters of the hash as our fingerprint ID.
  // This keeps it short and readable while still being unique enough
  // for our mock system.
  const hash = crypto
    .createHash('sha256')
    .update(signalString)
    .digest('hex')
    .substring(0, 16)

  return hash
}

// Make this function available to other files
module.exports = { generateFingerprintId }
