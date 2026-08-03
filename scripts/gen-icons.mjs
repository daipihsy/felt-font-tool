// Dependency-free PNG icon generator (runs offline, no image libraries).
// Draws the app icon (a picture frame with two "name" lines) at the sizes
// needed for the PWA manifest, plus an Apple touch icon.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

const COLORS = {
  cream: [0xf5, 0xf1, 0xe8, 0xff],
  brown: [0x8a, 0x5a, 0x34, 0xff],
  brownLight: [0xc7, 0x9a, 0x6b, 0xff],
  white: [0xff, 0xff, 0xff, 0xff],
}

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (~c) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  // Raw scanlines with filter byte 0 per row.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function makeIcon(size, { fullBleed }) {
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a
  }
  const rect = (x0, y0, x1, y1, color) => {
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++)
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) set(x, y, color)
  }

  // Background: full-bleed brown for maskable, cream otherwise.
  rect(0, 0, size, size, fullBleed ? COLORS.brown : COLORS.cream)

  const s = size
  // For maskable, keep the "content" inside the central safe zone.
  if (!fullBleed) {
    // outer frame
    rect(0.24 * s, 0.24 * s, 0.76 * s, 0.76 * s, COLORS.brown)
    rect(0.28 * s, 0.28 * s, 0.72 * s, 0.72 * s, COLORS.cream)
  } else {
    rect(0.30 * s, 0.30 * s, 0.70 * s, 0.70 * s, COLORS.white)
    rect(0.335 * s, 0.335 * s, 0.665 * s, 0.665 * s, COLORS.cream)
  }
  // two "name" lines inside the frame
  rect(0.37 * s, 0.44 * s, 0.63 * s, 0.485 * s, COLORS.brown)
  rect(0.37 * s, 0.53 * s, 0.55 * s, 0.565 * s, COLORS.brownLight)

  return encodePng(size, size, buf)
}

const targets = [
  { name: 'icon-192.png', size: 192, fullBleed: false },
  { name: 'icon-512.png', size: 512, fullBleed: false },
  { name: 'icon-maskable-512.png', size: 512, fullBleed: true },
]
for (const t of targets) {
  writeFileSync(resolve(outDir, t.name), makeIcon(t.size, { fullBleed: t.fullBleed }))
  console.log('wrote', t.name)
}
// Apple touch icon (non-maskable, opaque cream bg).
writeFileSync(resolve(__dirname, '../public/apple-touch-icon.png'), makeIcon(180, { fullBleed: false }))
console.log('wrote apple-touch-icon.png')
