// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { sha256Hex } from './hashing'

function bytes(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer
}

describe('sha256Hex (duplicate-font detection)', () => {
  it('matches the known digest of the empty input', async () => {
    const hash = await sha256Hex(new ArrayBuffer(0))
    expect(hash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    )
  })

  it('produces identical hashes for identical bytes', async () => {
    const a = await sha256Hex(bytes('the same font bytes'))
    const b = await sha256Hex(bytes('the same font bytes'))
    expect(a).toBe(b)
  })

  it('produces different hashes for different bytes', async () => {
    const a = await sha256Hex(bytes('font one'))
    const b = await sha256Hex(bytes('font two'))
    expect(a).not.toBe(b)
  })
})
