// Shared domain types.

/** Normalized text overlay state. All spatial values are ratios relative to the
 * ORIGINAL image so the layout never drifts across screen sizes / reloads. */
export interface TextOverlayState {
  text: string
  fontId: string
  /** CSS color string, e.g. "#000000". */
  color: string
  /** Letter spacing in em units (shared by CSS preview and canvas export). */
  letterSpacing: number
  /** Text centre X as a fraction of image width (0..1). */
  centerXRatio: number
  /** Text centre Y as a fraction of image height (0..1). */
  centerYRatio: number
  /** Font size as a fraction of the image's shorter side. */
  fontSizeRatio: number
}

/** Font metadata (without the raw bytes). */
export interface FontMeta {
  id: string
  displayName: string
  originalFileName: string
  /** CSS font-family name used to render this font. */
  familyName: string
  isBuiltIn: boolean
  hash?: string
  createdAt: number
}

/** A font as persisted in IndexedDB (imported fonts include their bytes). */
export interface StoredFont extends FontMeta {
  data: ArrayBuffer
}

/** The autosaved draft (image bytes are stored separately in IndexedDB). */
export interface DraftState {
  overlay: TextOverlayState
  imageFileName: string | null
  imageWidth: number | null
  imageHeight: number | null
  updatedAt: number
}

export type ScreenName = 'home' | 'editor' | 'fonts' | 'help' | 'about'
