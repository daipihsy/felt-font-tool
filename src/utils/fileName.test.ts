import { describe, it, expect } from 'vitest'
import { buildFileName, sanitize } from './fileName'

describe('buildFileName', () => {
  const date = new Date(2026, 7, 3, 19, 30) // 2026-08-03 19:30

  it('includes the sanitized name and timestamp', () => {
    expect(buildFileName('Charlie', date)).toBe('Charlie_排版预览_20260803-1930.png')
  })
  it('omits the name when text is empty', () => {
    expect(buildFileName('', date)).toBe('排版预览_20260803-1930.png')
    expect(buildFileName('   ', date)).toBe('排版预览_20260803-1930.png')
  })
  it('keeps Chinese names', () => {
    expect(buildFileName('小白', date)).toBe('小白_排版预览_20260803-1930.png')
  })
})

describe('sanitize', () => {
  it('removes characters illegal in file names', () => {
    expect(sanitize('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij')
  })
  it('trims and limits length', () => {
    expect(sanitize('  hi  ')).toBe('hi')
    expect(sanitize('x'.repeat(100)).length).toBe(40)
  })
})
