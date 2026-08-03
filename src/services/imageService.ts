import { PREVIEW_MAX_DIMENSION } from '../utils/constants'

export interface EditingImage {
  /** Downscaled bitmap for fast preview redraws. Caller closes on replace. */
  preview: ImageBitmap
  /** Natural (EXIF-oriented) dimensions of the original image. */
  width: number
  height: number
}

/**
 * Decode an image blob for EDITING: returns only a downscaled preview bitmap
 * (to keep memory low) plus the original natural dimensions. The full-resolution
 * bitmap is decoded separately, on demand, at export time.
 * Throws a Chinese-message Error on failure.
 */
export async function decodeForEditing(source: Blob): Promise<EditingImage> {
  const full = await decodeFull(source)
  const width = full.width
  const height = full.height
  try {
    const preview = await makePreviewBitmap(full)
    return { preview, width, height }
  } finally {
    // We only needed `full` to derive the preview; release it now.
    full.close?.()
  }
}

/** Decode the full-resolution, EXIF-oriented bitmap. Caller must close(). */
export async function decodeFull(source: Blob): Promise<ImageBitmap> {
  let full: ImageBitmap
  try {
    full = await createImageBitmap(source, { imageOrientation: 'from-image' })
  } catch {
    full = await decodeViaImgElement(source)
  }
  if (full.width <= 0 || full.height <= 0) {
    full.close?.()
    throw new Error('图片已损坏或格式不支持')
  }
  return full
}

async function makePreviewBitmap(full: ImageBitmap): Promise<ImageBitmap> {
  const { width, height } = full
  const longest = Math.max(width, height)
  if (longest <= PREVIEW_MAX_DIMENSION) {
    return createImageBitmap(full)
  }
  const scale = PREVIEW_MAX_DIMENSION / longest
  const pw = Math.max(1, Math.round(width * scale))
  const ph = Math.max(1, Math.round(height * scale))
  try {
    return await createImageBitmap(full, {
      resizeWidth: pw,
      resizeHeight: ph,
      resizeQuality: 'high',
    })
  } catch {
    const canvas = document.createElement('canvas')
    canvas.width = pw
    canvas.height = ph
    const ctx = canvas.getContext('2d')
    if (!ctx) return createImageBitmap(full)
    ctx.drawImage(full, 0, 0, pw, ph)
    return createImageBitmap(canvas)
  }
}

function decodeViaImgElement(source: Blob): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => {
      createImageBitmap(img)
        .then((bmp) => {
          URL.revokeObjectURL(url)
          resolve(bmp)
        })
        .catch(() => {
          URL.revokeObjectURL(url)
          reject(new Error('图片无法解码'))
        })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片已损坏或格式不支持'))
    }
    img.src = url
  })
}

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function isSupportedImageType(type: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(type)
}
