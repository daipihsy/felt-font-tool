export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * Try to share the image via the Web Share API (system sheet -> WeChat, QQ,
 * mail, ...). Falls back to a download when file sharing is unsupported.
 */
export async function shareOrDownload(blob: Blob, fileName: string): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: 'image/png' })
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data?: ShareData) => Promise<void>
  }

  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: '毛毡排字助手' })
      return 'shared'
    } catch (e) {
      // AbortError => user cancelled the share sheet.
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Any other failure: fall back to download.
      downloadBlob(blob, fileName)
      return 'downloaded'
    }
  }

  downloadBlob(blob, fileName)
  return 'downloaded'
}

/** Trigger a browser download of a blob (Android Chrome friendly). */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
