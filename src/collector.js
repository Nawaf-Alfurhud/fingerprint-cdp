// collector.js
// ------------
// This file receives the raw signals sent from the browser.
// Its only job is to validate them and return a clean object.
// If a signal is missing, we just skip it -- we never crash
// because a browser didn't support something.

function collectSignals(rawBody) {

  // Start with an empty object, we will fill it in below
  const signals = {}

  // -- BASIC BROWSER SIGNALS --
  // These are almost always available in every browser

  if (rawBody.user_agent)          signals.user_agent          = String(rawBody.user_agent)
  if (rawBody.language)            signals.language            = String(rawBody.language)
  if (rawBody.timezone)            signals.timezone            = String(rawBody.timezone)
  if (rawBody.platform)            signals.platform            = String(rawBody.platform)
  if (rawBody.cookie_enabled)      signals.cookie_enabled      = Boolean(rawBody.cookie_enabled)

  // -- SCREEN SIGNALS --
  // Tells us about the display. Very stable -- only changes if monitor changes.

  if (rawBody.screen_width)        signals.screen_width        = Number(rawBody.screen_width)
  if (rawBody.screen_height)       signals.screen_height       = Number(rawBody.screen_height)
  if (rawBody.color_depth)         signals.color_depth         = Number(rawBody.color_depth)
  if (rawBody.pixel_ratio)         signals.pixel_ratio         = Number(rawBody.pixel_ratio)

  // -- HARDWARE SIGNALS --
  // These are the most stable signals we have on the web.
  // They only change when the user gets a new machine.

  if (rawBody.hardware_concurrency) signals.hardware_concurrency = Number(rawBody.hardware_concurrency)
  if (rawBody.device_memory)        signals.device_memory        = Number(rawBody.device_memory)

  // -- ACTIVE FINGERPRINT SIGNALS --
  // These require the browser to actually do some work (render, process audio).
  // They are more unique but less stable -- browser updates can change them.
  // We still collect them but we weight them lower in matching.

  if (rawBody.canvas_hash)         signals.canvas_hash         = String(rawBody.canvas_hash)
  if (rawBody.webgl_renderer)      signals.webgl_renderer      = String(rawBody.webgl_renderer)
  if (rawBody.webgl_hash)          signals.webgl_hash          = String(rawBody.webgl_hash)
  if (rawBody.audio_hash)          signals.audio_hash          = String(rawBody.audio_hash)

  // -- EXTRA INFO --
  // Not used for matching but useful to store in the profile

  if (rawBody.fonts_detected)      signals.fonts_detected      = Number(rawBody.fonts_detected)
  if (rawBody.do_not_track)        signals.do_not_track        = rawBody.do_not_track

  // Add a timestamp so we know exactly when these signals were collected
  signals.collected_at = new Date().toISOString()

  return signals
}

// Make this function available to other files
module.exports = { collectSignals }
