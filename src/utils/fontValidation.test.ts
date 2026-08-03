import { describe, it, expect } from 'vitest'
import {
  hasSupportedExtension,
  extensionOf,
  isSizeInRange,
  looksLikeFont,
  cleanDisplayName,
} from './fontValidation'
import { MAX_FONT_BYTES } from './constants'

describe('extension checks', () => {
  it('accepts ttf and otf case-insensitively', () => {
    expect(hasSupportedExtension('MyFont.ttf')).toBe(true)
    expect(hasSupportedExtension('MyFont.OTF')).toBe(true)
    expect(hasSupportedExtension('MyFont.Ttf')).toBe(true)
  })
  it('rejects other extensions and missing extension', () => {
    expect(hasSupportedExtension('image.png')).toBe(false)
    expect(hasSupportedExtension('noext')).toBe(false)
    expect(extensionOf('a.b.woff2')).toBe('woff2')
  })
})

describe('size checks', () => {
  it('rejects empty and oversized files', () => {
    expect(isSizeInRange(0)).toBe(false)
    expect(isSizeInRange(1)).toBe(true)
    expect(isSizeInRange(MAX_FONT_BYTES)).toBe(true)
    expect(isSizeInRange(MAX_FONT_BYTES + 1)).toBe(false)
  })
})

describe('font magic-number sniffing', () => {
  it('recognises TrueType (0x00010000)', () => {
    expect(looksLikeFont(new Uint8Array([0x00, 0x01, 0x00, 0x00]))).toBe(true)
  })
  it('recognises OpenType (OTTO)', () => {
    expect(looksLikeFont(new Uint8Array([0x4f, 0x54, 0x54, 0x4f]))).toBe(true)
  })
  it('rejects non-font headers and too-short buffers', () => {
    expect(looksLikeFont(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false) // PNG
    expect(looksLikeFont(new Uint8Array([0x00, 0x01]))).toBe(false)
  })
})

describe('display name cleanup', () => {
  it('turns a file name into a friendly name', () => {
    expect(cleanDisplayName('MyFont-Regular.ttf')).toBe('MyFont Regular')
    expect(cleanDisplayName('My_Handwriting-Bold.otf')).toBe('My Handwriting Bold')
    expect(cleanDisplayName('plain.ttf')).toBe('plain')
  })
  it('falls back for empty names', () => {
    expect(cleanDisplayName('.ttf')).toBe('未命名字体')
  })
})
