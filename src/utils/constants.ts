import type { TextOverlayState } from '../types'

export const BUILTIN_FONT_ID = 'playwrite_nz_guides'
export const BUILTIN_FONT_FAMILY = 'PlaywriteNZGuides'
export const BUILTIN_FONT_DISPLAY_NAME = 'Playwrite NZ Guides'
export const BUILTIN_FONT_URL = 'fonts/PlaywriteNZGuides-Regular.ttf'

// Text size expressed as a ratio of the image's shorter side.
export const MIN_SIZE_RATIO = 0.02
export const MAX_SIZE_RATIO = 0.5
export const DEFAULT_SIZE_RATIO = 0.08

// Friendly slider integer = ratio * 1000.
export const SLIDER_MIN = 20
export const SLIDER_MAX = 500

export const MIN_LETTER_SPACING = -0.1
export const MAX_LETTER_SPACING = 0.5

/** Longest side used for the on-screen preview bitmap (keeps memory sane). */
export const PREVIEW_MAX_DIMENSION = 2048

/** Hard cap for the export canvas longer side; beyond this we warn the user. */
export const EXPORT_MAX_DIMENSION = 8192

export const MAX_FONT_BYTES = 30 * 1024 * 1024 // 30 MB

export const THEME_COLOR = '#F5F1E8'

export const DEFAULT_OVERLAY: TextOverlayState = {
  text: '',
  fontId: BUILTIN_FONT_ID,
  color: '#000000',
  letterSpacing: 0,
  centerXRatio: 0.5,
  centerYRatio: 0.5,
  fontSizeRatio: DEFAULT_SIZE_RATIO,
}
