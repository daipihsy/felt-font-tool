import type { StoredFont, DraftState } from '../types'

// A tiny promise-based IndexedDB wrapper. All user data (imported fonts, draft
// image, draft state) lives here, on-device only.

const DB_NAME = 'felt-font-tool'
const DB_VERSION = 1
const STORE_FONTS = 'fonts'
const STORE_KV = 'kv' // draft, settings, draft image blob

const KEY_DRAFT = 'draft'
const KEY_DRAFT_IMAGE = 'draftImage'
const KEY_DEFAULT_FONT = 'defaultFontId'

let dbPromise: Promise<IDBDatabase> | null = null

/** Whether IndexedDB is usable in this browser. */
export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB 不可用'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_FONTS)) {
        db.createObjectStore(STORE_FONTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('打开数据库失败'))
  })
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = run(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error ?? new Error('数据库操作失败'))
      })
  )
}

// --- Fonts ---------------------------------------------------------------

export function putFont(font: StoredFont): Promise<void> {
  return tx(STORE_FONTS, 'readwrite', (s) => s.put(font)).then(() => undefined)
}

export function getAllFonts(): Promise<StoredFont[]> {
  return tx<StoredFont[]>(STORE_FONTS, 'readonly', (s) => s.getAll())
}

export function deleteFontFromDb(id: string): Promise<void> {
  return tx(STORE_FONTS, 'readwrite', (s) => s.delete(id)).then(() => undefined)
}

// --- Key/value (draft, settings) ----------------------------------------

function kvGet<T>(key: string): Promise<T | undefined> {
  return tx<T | undefined>(STORE_KV, 'readonly', (s) => s.get(key))
}
function kvPut(key: string, value: unknown): Promise<void> {
  return tx(STORE_KV, 'readwrite', (s) => s.put(value, key)).then(() => undefined)
}
function kvDelete(key: string): Promise<void> {
  return tx(STORE_KV, 'readwrite', (s) => s.delete(key)).then(() => undefined)
}

export function saveDraft(draft: DraftState): Promise<void> {
  return kvPut(KEY_DRAFT, draft)
}
export function getDraft(): Promise<DraftState | undefined> {
  return kvGet<DraftState>(KEY_DRAFT)
}
export function saveDraftImage(blob: Blob): Promise<void> {
  return kvPut(KEY_DRAFT_IMAGE, blob)
}
export function getDraftImage(): Promise<Blob | undefined> {
  return kvGet<Blob>(KEY_DRAFT_IMAGE)
}
export function clearDraft(): Promise<void> {
  return Promise.all([kvDelete(KEY_DRAFT), kvDelete(KEY_DRAFT_IMAGE)]).then(
    () => undefined
  )
}

export function getDefaultFontId(): Promise<string | undefined> {
  return kvGet<string>(KEY_DEFAULT_FONT)
}
export function setDefaultFontIdInDb(id: string): Promise<void> {
  return kvPut(KEY_DEFAULT_FONT, id)
}
