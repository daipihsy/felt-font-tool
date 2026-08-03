/** Lightweight environment checks for the Android-first UI hints. */

export function isWeChatBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /MicroMessenger/i.test(navigator.userAgent)
}

export function supportsFileShare(): boolean {
  try {
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean }
    if (!nav.canShare || typeof navigator.share !== 'function') return false
    // Probe with a tiny dummy file.
    const f = new File([new Uint8Array([0])], 't.png', { type: 'image/png' })
    return nav.canShare({ files: [f] })
  } catch {
    return false
  }
}

export function supportsCoreFeatures(): boolean {
  return (
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof createImageBitmap === 'function' &&
    typeof FontFace === 'function'
  )
}
