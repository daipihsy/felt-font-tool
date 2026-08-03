import type { TextOverlayState } from '../types'
import {
  centerXPx,
  centerYPx,
  fontSizePx,
  layoutChars,
} from '../utils/coordinates'

/** A drawable image source usable by canvas drawImage. */
export type DrawableImage = ImageBitmap | HTMLImageElement | HTMLCanvasElement

export interface TextLayout {
  sizePx: number
  startX: number
  baselineY: number
  totalWidth: number
  boxX: number
  boxY: number
  boxWidth: number
  boxHeight: number
  chars: string[]
  positions: number[]
}

/**
 * Measure the text layout for the given target size (w,h). Uses the SAME math
 * for the on-screen preview and the full-resolution export, so what the user
 * positions is exactly what gets exported (just at a different scale).
 */
export function measureTextLayout(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  overlay: TextOverlayState,
  fontFamily: string
): TextLayout {
  const sizePx = fontSizePx(w, h, overlay.fontSizeRatio)
  ctx.font = `${sizePx}px "${fontFamily}"`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const chars = Array.from(overlay.text)
  const charWidths = chars.map((c) => ctx.measureText(c).width)
  const letterSpacingPx = overlay.letterSpacing * sizePx
  const { totalWidth, positions } = layoutChars(charWidths, letterSpacingPx)

  const metrics = ctx.measureText(overlay.text || 'M')
  const ascent =
    metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || sizePx * 0.8
  const descent =
    metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || sizePx * 0.2

  const cx = centerXPx(w, overlay.centerXRatio)
  const cy = centerYPx(h, overlay.centerYRatio)
  const startX = cx - totalWidth / 2
  const baselineY = cy + (ascent - descent) / 2

  return {
    sizePx,
    startX,
    baselineY,
    totalWidth,
    boxX: startX,
    boxY: baselineY - ascent,
    boxWidth: totalWidth,
    boxHeight: ascent + descent,
    chars,
    positions,
  }
}

export interface DrawOptions {
  showSelection?: boolean
  /** Device pixel ratio the ctx is scaled by (only affects dashed line width). */
  dpr?: number
}

/**
 * Draw the full scene (image + text overlay) into a (w,h) target. The image is
 * stretched to exactly fill (w,h); callers must pass a (w,h) with the same
 * aspect ratio as the image so nothing is distorted.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  image: DrawableImage,
  overlay: TextOverlayState,
  fontFamily: string,
  opts: DrawOptions = {}
): void {
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(image, 0, 0, w, h)

  if (!overlay.text.trim()) return

  const layout = measureTextLayout(ctx, w, h, overlay, fontFamily)

  ctx.fillStyle = overlay.color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  for (let i = 0; i < layout.chars.length; i++) {
    ctx.fillText(layout.chars[i], layout.startX + layout.positions[i], layout.baselineY)
  }

  if (opts.showSelection) {
    const pad = layout.sizePx * 0.08
    ctx.save()
    ctx.strokeStyle = 'rgba(138,90,52,0.9)'
    ctx.lineWidth = Math.max(1, (opts.dpr ?? 1) * 1.5)
    ctx.setLineDash([layout.sizePx * 0.18, layout.sizePx * 0.12])
    ctx.strokeRect(
      layout.boxX - pad,
      layout.boxY - pad,
      layout.boxWidth + pad * 2,
      layout.boxHeight + pad * 2
    )
    ctx.restore()
  }
}
