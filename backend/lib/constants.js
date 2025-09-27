// backend/lib/constants.js
'use strict';

/**
 * Global constants and helpers for session/business rules.
 * - Positions list powers the UI and server validation.
 * - Intro Meeting >= 0.5h minimum billing.
 * - Rounding to nearest 0.25h.
 */

const POSITIONS = [
  'Tutor',
  'Learning Strategist',
  'Intro Meeting (solo)',
  'Intro Meeting (facilitated)',
  'Training',
  'Peer Mentorship',
  'Study Solutions',
  'Coordinator',
  'Program Development',
  'Image Description Specialist',
  'Other'
];

const INTRO_POS = new Set([
  'Intro Meeting (solo)',
  'Intro Meeting (facilitated)'
]);

const TRAINING_POS = new Set(['Training']);

const IDS_POS = new Set(['Image Description Specialist']);

/** Round a number of hours to the nearest quarter hour (0.25). */
function roundQuarter(hours) {
  if (hours == null || !Number.isFinite(hours)) return null;
  return Math.round(hours / 0.25) * 0.25;
}

/** Apply business minimums after rounding (e.g., Intro Meeting >= 0.5h). */
function applyMinRules(position, hours) {
  let h = roundQuarter(hours);
  if (h == null) return null;
  if (INTRO_POS.has(position) && h < 0.5) h = 0.5;
  return h;
}

module.exports = {
  POSITIONS,
  INTRO_POS,
  TRAINING_POS,
  IDS_POS,
  roundQuarter,
  applyMinRules
};
