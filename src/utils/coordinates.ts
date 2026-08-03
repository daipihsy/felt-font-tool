import { MIN_SIZE_RATIO, MAX_SIZE_RATIO } from './constants'

/**
 * Pure coordinate math shared by the on-screen preview and the full-resolution
 * export. Keeping this in one place guarantees the exported image matches what
 * the user sees, regardless of device or preview scale.
 *
 * Convention:
 *  - text centre X = xRatio * width, Y = yRatio * height
 *  - text size (px) = sizeRatio * min(width, height)  [shorter side]
 */

export function referenceDimension(width: number, height: number): number {
  return Math.min(width, height)
}

export function fontSizePx(width: number, height: number, sizeRatio: number): number {
  return sizeRatio * referenceDimension(width, height)
}

export function sizeRatioFromPx(width: number, height: number, sizePx: number): number {
  const ref = referenceDimension(width, height)
  return ref <= 0 ? 0 : sizePx / ref
}

export function centerXPx(width: number, xRatio: number): number {
  return xRatio * width
}

export function centerYPx(height: number, yRatio: number): number {
  return yRatio * height
}

export function xRatioFromPx(width: number, xPx: number): number {
  return width <= 0 ? 0.5 : xPx / width
}

export function yRatioFromPx(height: number, yPx: number): number {
  return height <= 0 ? 0.5 : yPx / height
}

export function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function clampSizeRatio(value: number): number {
  return Math.min(MAX_SIZE_RATIO, Math.max(MIN_SIZE_RATIO, value))
}

export interface FitRect {
  offsetX: number
  offsetY: number
  drawWidth: number
  drawHeight: number
}

/** Rectangle a "contain" (fit inside, preserve aspect) image occupies. */
export function fitRect(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number
): FitRect {
  if (imageW <= 0 || imageH <= 0 || containerW <= 0 || containerH <= 0) {
    return { offsetX: 0, offsetY: 0, drawWidth: containerW, drawHeight: containerH }
  }
  const imageAspect = imageW / imageH
  const containerAspect = containerW / containerH
  let drawWidth: number
  let drawHeight: number
  if (containerAspect > imageAspect) {
    drawHeight = containerH
    drawWidth = drawHeight * imageAspect
  } else {
    drawWidth = containerW
    drawHeight = drawWidth / imageAspect
  }
  return {
    offsetX: (containerW - drawWidth) / 2,
    offsetY: (containerH - drawHeight) / 2,
    drawWidth,
    drawHeight,
  }
}

/**
 * Lay out characters horizontally with an extra pixel gap between them. Returns
 * the total advance width and each character's left x (relative to 0). Pure, so
 * it can be unit-tested independently of a real canvas.
 */
export function layoutChars(
  charWidths: number[],
  letterSpacingPx: number
): { totalWidth: number; positions: number[] } {
  const positions: number[] = []
  let x = 0
  for (let i = 0; i < charWidths.length; i++) {
    positions.push(x)
    x += charWidths[i]
    if (i < charWidths.length - 1) x += letterSpacingPx
  }
  return { totalWidth: x, positions }
}
