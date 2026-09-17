/** Tunable composite weights — calibrate from labeled X outcomes, not by stuffing tweets into Jev. */
export const WEIGHTS = {
  hook: 0.22,
  specificity: 0.18,
  reply_magnet: 0.22,
  shareability: 0.2,
  dwell_structure: 0.12,
  anti_slop: 0.06,
} as const;

export const SCORE_MAX = 4;

export type DimensionKey = keyof typeof WEIGHTS;
