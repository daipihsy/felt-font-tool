import { describe, it, expect } from 'vitest'
import {
  fitRect,
  fontSizePx,
  sizeRatioFromPx,
  centerXPx,
  centerYPx,
  xRatioFromPx,
  yRatioFromPx,
  clampRatio,
  clampSizeRatio,
  layoutChars,
} from './coordinates'
import { MIN_SIZE_RATIO, MAX_SIZE_RATIO } from './constants'

describe('fitRect', () => {
  it('letterboxes horizontally when container is wider than the image', () => {
    const r = fitRect(1000, 500, 500, 500) // square image in a wide box
    expect(r.drawHeight).toBe(500)
    expect(r.drawWidth).toBe(500)
    expect(r.offsetX).toBe(250)
    expect(r.offsetY).toBe(0)
  })

  it('letterboxes vertically when container is taller than the image', () => {
    const r = fitRect(500, 1000, 500, 250) // wide image in a tall box
    expect(r.drawWidth).toBe(500)
    expect(r.drawHeight).toBe(250)
    expect(r.offsetY).toBe(375)
  })

  it('fills exactly when aspect ratios match', () => {
    const r = fitRect(400, 200, 800, 400)
    expect(r.drawWidth).toBe(400)
    expect(r.drawHeight).toBe(200)
    expect(r.offsetX).toBe(0)
    expect(r.offsetY).toBe(0)
  })
})

describe('size ratio conversion', () => {
  it('round-trips px <-> ratio using the shorter side', () => {
    const w = 1200
    const h = 800
    const ratio = 0.1
    const px = fontSizePx(w, h, ratio)
    expect(px).toBeCloseTo(80) // 0.1 * min(1200,800)
    expect(sizeRatioFromPx(w, h, px)).toBeCloseTo(ratio)
  })
})

describe('position consistency across image sizes (no drift)', () => {
  it('keeps the same ratio when mapped through different pixel sizes', () => {
    const xRatio = 0.3
    const yRatio = 0.7
    for (const [w, h] of [
      [1000, 800],
      [500, 400],
      [4032, 3024],
    ] as const) {
      const px = centerXPx(w, xRatio)
      const py = centerYPx(h, yRatio)
      expect(xRatioFromPx(w, px)).toBeCloseTo(xRatio)
      expect(yRatioFromPx(h, py)).toBeCloseTo(yRatio)
    }
  })

  it('produces proportionally identical layout at preview vs export scale', () => {
    // Same ratios at two scales => text size scales by the same factor as the image.
    const ratio = 0.08
    const previewSize = fontSizePx(600, 400, ratio) // preview (shorter side 400)
    const exportSize = fontSizePx(3000, 2000, ratio) // original (shorter side 2000)
    expect(exportSize / previewSize).toBeCloseTo(2000 / 400)
  })
})

describe('clamping', () => {
  it('clamps ratios into [0,1]', () => {
    expect(clampRatio(-0.5)).toBe(0)
    expect(clampRatio(1.5)).toBe(1)
    expect(clampRatio(0.42)).toBe(0.42)
  })
  it('clamps size ratio into the allowed band', () => {
    expect(clampSizeRatio(0)).toBe(MIN_SIZE_RATIO)
    expect(clampSizeRatio(99)).toBe(MAX_SIZE_RATIO)
  })
})

describe('layoutChars (letter spacing)', () => {
  it('adds spacing between characters but not after the last one', () => {
    const { totalWidth, positions } = layoutChars([10, 20, 30], 5)
    // widths 10+20+30 = 60, plus 2 gaps of 5 = 70
    expect(totalWidth).toBe(70)
    expect(positions).toEqual([0, 15, 40])
  })
  it('handles a single character with no trailing spacing', () => {
    const { totalWidth, positions } = layoutChars([25], 8)
    expect(totalWidth).toBe(25)
    expect(positions).toEqual([0])
  })
  it('handles empty text', () => {
    const { totalWidth, positions } = layoutChars([], 8)
    expect(totalWidth).toBe(0)
    expect(positions).toEqual([])
  })
})
