import type { TextOverlayState } from '../types'
import { EXPORT_MAX_DIMENSION } from '../utils/constants'
import { fontSizePx } from '../utils/coordinates'
import { decodeFull } from './imageService'
import { drawScene } from './canvasRender'

export class ExportError extends Error {}

/**
 * Render the final composited image at the ORIGINAL resolution and return a PNG
 * Blob. Never a screenshot: it re-decodes the original image and re-draws the
 * text with canvas so quality is preserved.
 */
export async function exportPng(
  originalBlob: Blob,
  overlay: TextOverlayState,
  fontFamily: string
): Promise<Blob> {
  let full: ImageBitmap
  try {
    full = await decodeFull(originalBlob)
  } catch {
    throw new ExportError('无法读取原始图片，请重新导入后再试')
  }

  const w = full.width
  const h = full.height
  if (Math.max(w, h) > EXPORT_MAX_DIMENSION) {
    full.close?.()
    throw new ExportError('图片尺寸过大，当前手机无法生成原尺寸图片。请先裁剪图片后重试。')
  }

  let canvas: HTMLCanvasElement | null = null
  try {
    // Make sure the font is ready before drawing (handles reload race).
    const sizePx = fontSizePx(w, h, overlay.fontSizeRatio)
    try {
      await document.fonts.load(`${sizePx}px "${fontFamily}"`, overlay.text || 'M')
    } catch {
      /* fall through; drawScene still renders with whatever is available */
    }

    canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ExportError('无法创建画布，当前浏览器可能内存不足')

    drawScene(ctx, w, h, full, overlay, fontFamily, { showSelection: false })

    const blob = await canvasToBlob(canvas)
    if (!blob) throw new ExportError('图片导出失败，请重试')
    return blob
  } catch (e) {
    if (e instanceof ExportError) throw e
    throw new ExportError('图片导出失败，可能是图片过大导致内存不足')
  } finally {
    full.close?.()
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png')
    } catch {
      resolve(null)
    }
  })
}
