import type { TextOverlayState } from '../types'
import { DEFAULT_OVERLAY, BUILTIN_FONT_ID } from './constants'
import { clampRatio, clampSizeRatio } from './coordinates'

/**
 * Merge a (possibly partial or legacy) stored overlay onto the defaults and
 * clamp its spatial values. Guarantees a valid, drift-free overlay after a
 * draft restore even if the stored data is missing fields.
 */
export function normalizeOverlay(
  partial: Partial<TextOverlayState> | undefined | null
): TextOverlayState {
  const o: TextOverlayState = { ...DEFAULT_OVERLAY, ...(partial ?? {}) }
  return {
    ...o,
    centerXRatio: clampRatio(o.centerXRatio),
    centerYRatio: clampRatio(o.centerYRatio),
    fontSizeRatio: clampSizeRatio(o.fontSizeRatio),
  }
}

/** Fall back to the built-in font when the requested font no longer exists. */
export function resolveFontId(
  requestedId: string,
  exists: (id: string) => boolean
): string {
  return exists(requestedId) ? requestedId : BUILTIN_FONT_ID
}
