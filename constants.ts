export const DRAGON_COLORS = {
  SKIN: 0x2E8B57, // Sea Green
  SKIN_DARK: 0x006400, // Dark Green
  HORN: 0xD2B48C, // Tan
  EYE: 0xFFD700, // Gold
  EYE_GLOW: 0xFFA500 // Orange
};

export const FIRE_COLORS = {
  CORE: { r: 1.0, g: 1.0, b: 0.8 }, // White-ish yellow
  MID: { r: 1.0, g: 0.5, b: 0.0 },  // Orange
  OUTER: { r: 0.5, g: 0.0, b: 0.0 }, // Red
  SMOKE: { r: 0.3, g: 0.3, b: 0.3 }  // Grey
};

export const AUDIO_THRESHOLDS = {
  BREATH_START: 0.15, // RMS threshold to detect breath
  BREATH_STOP: 0.10,
  MAX_VOLUME: 0.5   // Value at which we consider input "max" for visual scaling
};

export const GAME_SETTINGS = {
  EPIC_BREATH_THRESHOLD: 4.0, // Seconds to trigger "Epic Fire"
  PARTICLE_SPAWN_RATE: 5 // Particles per frame when breathing
};