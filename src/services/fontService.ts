import type { FontMeta, StoredFont } from '../types'
import { BUILTIN_FONT_ID, BUILTIN_FONT_FAMILY, BUILTIN_FONTS } from '../utils/constants'
import {
  hasSupportedExtension,
  isSizeInRange,
  looksLikeFont,
  cleanDisplayName,
} from '../utils/fontValidation'
import { sha256Hex } from '../utils/hashing'
import {
  putFont,
  getAllFonts,
  deleteFontFromDb,
  getDefaultFontId,
  setDefaultFontIdInDb,
} from './indexedDbService'

interface RegistryEntry {
  meta: FontMeta
  family: string
  face?: FontFace
  hash?: string
}

const registry = new Map<string, RegistryEntry>()

export function familyFor(fontId: string): string {
  return registry.get(fontId)?.family ?? BUILTIN_FONT_FAMILY
}

export function listFonts(): FontMeta[] {
  return Array.from(registry.values())
    .map((e) => e.meta)
    .sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? -1 : 1
      if (a.isBuiltIn) return builtinIndex(a.id) - builtinIndex(b.id)
      return a.createdAt - b.createdAt
    })
}

function builtinIndex(id: string): number {
  return BUILTIN_FONTS.findIndex((d) => d.id === id)
}

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path}`.replace(/([^:])\/\//g, '$1/')
}

export interface InitResult {
  fonts: FontMeta[]
  defaultFontId: string
  failedIds: string[]
}

/** Register the built-in fonts and every imported font from IndexedDB. */
export async function initFonts(): Promise<InitResult> {
  registry.clear()

  // Built-in fonts.
  await Promise.all(
    BUILTIN_FONTS.map(async (def) => {
      const meta: FontMeta = {
        id: def.id,
        displayName: safeLocalGet(def.nameKey) || def.displayName,
        originalFileName: def.fileName,
        familyName: def.family,
        isBuiltIn: true,
        createdAt: 0,
      }
      try {
        const face = new FontFace(def.family, `url("${assetUrl(def.url)}")`)
        await face.load()
        document.fonts.add(face)
        registry.set(def.id, { meta, family: def.family, face })
      } catch {
        // Even if the network/file failed, keep the metadata so the app still runs.
        registry.set(def.id, { meta, family: def.family })
      }
    }),
  )

  // Imported fonts.
  const failedIds: string[] = []
  let stored: StoredFont[] = []
  try {
    stored = await getAllFonts()
  } catch {
    stored = []
  }
  for (const sf of stored) {
    try {
      const face = new FontFace(sf.familyName, sf.data)
      await face.load()
      document.fonts.add(face)
      registry.set(sf.id, {
        meta: stripData(sf),
        family: sf.familyName,
        face,
        hash: sf.hash,
      })
    } catch {
      // Keep a record so the user can see & delete a corrupt font.
      failedIds.push(sf.id)
      registry.set(sf.id, { meta: stripData(sf), family: sf.familyName, hash: sf.hash })
    }
  }

  let defaultFontId = BUILTIN_FONT_ID
  try {
    const saved = await getDefaultFontId()
    if (saved && registry.has(saved)) defaultFontId = saved
  } catch {
    /* ignore */
  }

  return { fonts: listFonts(), defaultFontId, failedIds }
}

export class FontImportError extends Error {}

/** Import a user font file. Throws FontImportError with a Chinese message. */
export async function importFont(file: File): Promise<FontMeta> {
  if (!hasSupportedExtension(file.name)) {
    throw new FontImportError('暂不支持这种字体格式，请选择 TTF 或 OTF 文件')
  }
  if (file.size === 0) {
    throw new FontImportError('字体文件为空，无法导入')
  }
  if (!isSizeInRange(file.size)) {
    throw new FontImportError('字体文件过大，请选择小于 30 MB 的字体')
  }

  let buffer: ArrayBuffer
  try {
    buffer = await file.arrayBuffer()
  } catch {
    throw new FontImportError('字体文件无法读取')
  }

  if (!looksLikeFont(new Uint8Array(buffer.slice(0, 4)))) {
    throw new FontImportError('这个文件不是有效的字体文件')
  }

  const hash = await sha256Hex(buffer)
  for (const entry of registry.values()) {
    if (entry.hash && entry.hash === hash) {
      throw new FontImportError('该字体已经导入')
    }
  }

  const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const familyName = `uf_${id}`

  // Authoritative validity check: can the browser actually load it?
  try {
    const face = new FontFace(familyName, buffer)
    await face.load()
    document.fonts.add(face)

    const meta: FontMeta = {
      id,
      displayName: cleanDisplayName(file.name),
      originalFileName: file.name,
      familyName,
      isBuiltIn: false,
      hash,
      createdAt: Date.now(),
    }
    const storedFont: StoredFont = { ...meta, data: buffer }
    await putFont(storedFont)
    registry.set(id, { meta, family: familyName, face, hash })
    return meta
  } catch (e) {
    if (e instanceof FontImportError) throw e
    throw new FontImportError('这个文件不是有效的字体文件')
  }
}

export async function deleteFont(id: string): Promise<void> {
  const entry = registry.get(id)
  if (!entry || entry.meta.isBuiltIn) return
  if (entry.face) {
    try {
      document.fonts.delete(entry.face)
    } catch {
      /* ignore */
    }
  }
  registry.delete(id)
  try {
    await deleteFontFromDb(id)
  } catch {
    /* ignore */
  }
}

export async function renameFont(id: string, displayName: string): Promise<void> {
  const entry = registry.get(id)
  if (!entry) return
  const name = displayName.trim() || entry.meta.displayName
  entry.meta = { ...entry.meta, displayName: name }
  registry.set(id, entry)

  if (entry.meta.isBuiltIn) {
    const def = BUILTIN_FONTS.find((d) => d.id === id)
    if (def) safeLocalSet(def.nameKey, name)
    return
  }
  try {
    const all = await getAllFonts()
    const sf = all.find((f) => f.id === id)
    if (sf) await putFont({ ...sf, displayName: name })
  } catch {
    /* ignore */
  }
}

export async function setDefaultFont(id: string): Promise<void> {
  if (!registry.has(id)) return
  try {
    await setDefaultFontIdInDb(id)
  } catch {
    /* ignore */
  }
}

export function fontExists(id: string): boolean {
  return registry.has(id)
}

function stripData(sf: StoredFont): FontMeta {
  const { data: _data, ...meta } = sf
  void _data
  return meta
}

function safeLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeLocalSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
