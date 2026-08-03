import { MAX_FONT_BYTES } from './constants'

const SUPPORTED_EXTENSIONS = ['ttf', 'otf']

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase()
}

export function hasSupportedExtension(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(extensionOf(fileName))
}

export function isSizeInRange(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_FONT_BYTES
}

/** Best-effort sfnt magic-number check (authoritative check is FontFace.load). */
export function looksLikeFont(header: Uint8Array): boolean {
  if (header.length < 4) return false
  const [b0, b1, b2, b3] = header
  if (b0 === 0x00 && b1 === 0x01 && b2 === 0x00 && b3 === 0x00) return true // TrueType
  const tag = String.fromCharCode(b0, b1, b2, b3)
  return tag === 'OTTO' || tag === 'true' || tag === 'typ1' || tag === 'ttcf'
}

/** "MyFont-Regular.ttf" -> "MyFont Regular" */
export function cleanDisplayName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const base = dot < 0 ? fileName : fileName.slice(0, dot)
  const collapsed = base.replace(/[_-]+/g, ' ').trim().replace(/\s+/g, ' ')
  return collapsed || '未命名字体'
}
