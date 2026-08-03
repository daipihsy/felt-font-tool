/** Build the download file name: "Charlie_排版预览_YYYYMMDD-HHmm.png". */
export function buildFileName(text: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  const safe = sanitize(text)
  return safe
    ? `${safe}_排版预览_${stamp}.png`
    : `排版预览_${stamp}.png`
}

/** Strip characters that are illegal in file names; keep it short. */
export function sanitize(text: string): string {
  return text
    .replace(/[\\/:*?"<>|\r\n\t]+/g, '')
    .trim()
    .slice(0, 40)
}
