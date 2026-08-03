import { describe, it, expect } from 'vitest'
import { normalizeOverlay, resolveFontId } from './draft'
import { DEFAULT_OVERLAY, BUILTIN_FONT_ID } from './constants'

describe('normalizeOverlay (draft restore)', () => {
  it('round-trips a complete overlay unchanged', () => {
    const overlay = {
      text: 'Charlie',
      fontId: 'f_123',
      color: '#ff0000',
      letterSpacing: 0.1,
      centerXRatio: 0.4,
      centerYRatio: 0.6,
      fontSizeRatio: 0.12,
    }
    expect(normalizeOverlay(overlay)).toEqual(overlay)
  })

  it('fills missing fields from defaults', () => {
    const restored = normalizeOverlay({ text: 'Milo' })
    expect(restored.text).toBe('Milo')
    expect(restored.fontId).toBe(DEFAULT_OVERLAY.fontId)
    expect(restored.color).toBe(DEFAULT_OVERLAY.color)
  })

  it('clamps out-of-range positions and sizes', () => {
    const restored = normalizeOverlay({
      centerXRatio: -3,
      centerYRatio: 9,
      fontSizeRatio: 999,
    })
    expect(restored.centerXRatio).toBe(0)
    expect(restored.centerYRatio).toBe(1)
    expect(restored.fontSizeRatio).toBeLessThanOrEqual(0.5)
  })

  it('handles null/undefined input', () => {
    expect(normalizeOverlay(null)).toEqual(DEFAULT_OVERLAY)
    expect(normalizeOverlay(undefined)).toEqual(DEFAULT_OVERLAY)
  })
})

describe('resolveFontId (font-deletion fallback)', () => {
  const exists = (id: string) => id === 'builtin' || id === 'f_keep'
  it('keeps the font when it still exists', () => {
    expect(resolveFontId('f_keep', exists)).toBe('f_keep')
  })
  it('falls back to the built-in font when it was deleted', () => {
    expect(resolveFontId('f_deleted', exists)).toBe(BUILTIN_FONT_ID)
  })
})
