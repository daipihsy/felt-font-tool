import { useCallback, useEffect, useRef, useState } from 'react'
import type { FontMeta, ScreenName, TextOverlayState } from './types'
import { DEFAULT_OVERLAY, BUILTIN_FONT_ID } from './utils/constants'
import { HomeScreen } from './components/HomeScreen'
import { EditorScreen } from './components/EditorScreen'
import { FullscreenPreview } from './components/FullscreenPreview'
import { FontManager } from './components/FontManager'
import { HelpScreen } from './components/HelpScreen'
import { AboutScreen } from './components/AboutScreen'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'
import {
  initFonts,
  listFonts,
  familyFor,
  fontExists,
  importFont,
  deleteFont,
  renameFont,
  setDefaultFont,
  FontImportError,
} from './services/fontService'
import { decodeForEditing, isSupportedImageType } from './services/imageService'
import { exportPng, ExportError } from './services/imageExportService'
import { shareOrDownload, downloadBlob } from './services/shareService'
import {
  getDraft,
  getDraftImage,
  saveDraft,
  saveDraftImage,
  clearDraft as clearDraftDb,
} from './services/indexedDbService'
import { buildFileName } from './utils/fileName'
import { normalizeOverlay, resolveFontId } from './utils/draft'
import { isWeChatBrowser, supportsCoreFeatures } from './utils/env'
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate'
import { usePwaInstall } from './hooks/usePwaInstall'

interface EditorImage {
  blob: Blob
  preview: ImageBitmap
  width: number
  height: number
  fileName: string
}

type DialogState =
  | { type: 'deleteFont'; id: string; name: string }
  | { type: 'clearDraft' }
  | null

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home')
  const [fonts, setFonts] = useState<FontMeta[]>([])
  const [defaultFontId, setDefaultFontId] = useState<string>(BUILTIN_FONT_ID)
  const [failedIds, setFailedIds] = useState<string[]>([])
  const [overlay, setOverlay] = useState<TextOverlayState>(DEFAULT_OVERLAY)
  const [image, setImage] = useState<EditorImage | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [wechatDismissed, setWechatDismissed] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importModeRef = useRef<'new' | 'replace'>('new')
  const imageRef = useRef<EditorImage | null>(null)
  imageRef.current = image
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { needRefresh, updateNow } = useServiceWorkerUpdate()
  const { canInstall, promptInstall } = usePwaInstall()

  const showToast = useCallback((msg: string) => setToast(msg), [])

  // ---- Initial load: fonts + draft presence ----
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await initFonts()
        if (!alive) return
        setFonts(res.fonts)
        setDefaultFontId(res.defaultFontId)
        setFailedIds(res.failedIds)
        setOverlay((o) => ({ ...o, fontId: res.defaultFontId }))
      } catch {
        /* fonts failed; app still runs with fallbacks */
      }
      try {
        const [draft, img] = await Promise.all([getDraft(), getDraftImage()])
        if (alive && draft && img) setHasDraft(true)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // ---- Guard: if current font disappears, fall back to built-in ----
  useEffect(() => {
    if (!fontExists(overlay.fontId)) {
      setOverlay((o) => ({ ...o, fontId: BUILTIN_FONT_ID }))
    }
  }, [fonts, overlay.fontId])

  // ---- Autosave draft (debounced) whenever the overlay/image changes ----
  useEffect(() => {
    if (!image) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void saveDraft({
        overlay,
        imageFileName: image.fileName,
        imageWidth: image.width,
        imageHeight: image.height,
        updatedAt: Date.now(),
      })
    }, 300)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [overlay, image])

  const refreshFonts = useCallback(() => setFonts(listFonts()), [])

  const patchOverlay = useCallback((patch: Partial<TextOverlayState>) => {
    setOverlay((o) => ({ ...o, ...patch }))
  }, [])

  // ---- Image import ----
  const openPicker = (mode: 'new' | 'replace') => {
    importModeRef.current = mode
    fileInputRef.current?.click()
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting same file
    if (!file) return // user cancelled: no error
    if (file.type && !isSupportedImageType(file.type)) {
      showToast('暂不支持这种图片格式，请选择 JPG、PNG 或 WEBP')
      return
    }
    try {
      const decoded = await decodeForEditing(file)
      // Release previous preview bitmap.
      imageRef.current?.preview.close?.()
      const next: EditorImage = {
        blob: file,
        preview: decoded.preview,
        width: decoded.width,
        height: decoded.height,
        fileName: file.name,
      }
      setImage(next)
      if (importModeRef.current === 'new') {
        setOverlay({ ...DEFAULT_OVERLAY, fontId: defaultFontId })
      }
      try {
        await saveDraftImage(file)
      } catch {
        /* storage may be full; editing still works this session */
      }
      setHasDraft(true)
      setScreen('editor')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '图片导入失败')
    }
  }

  // ---- Continue last draft ----
  const continueDraft = async () => {
    try {
      const [draft, img] = await Promise.all([getDraft(), getDraftImage()])
      if (!draft || !img) {
        showToast('没有找到可恢复的草稿')
        setHasDraft(false)
        return
      }
      const decoded = await decodeForEditing(img)
      imageRef.current?.preview.close?.()
      setImage({
        blob: img,
        preview: decoded.preview,
        width: decoded.width,
        height: decoded.height,
        fileName: draft.imageFileName ?? 'image',
      })
      const fontId = resolveFontId(draft.overlay.fontId, fontExists)
      setOverlay(normalizeOverlay({ ...draft.overlay, fontId }))
      setScreen('editor')
    } catch {
      showToast('无法恢复上次的图片，请重新导入')
    }
  }

  // ---- Export / download / share ----
  const makeExport = async (): Promise<Blob | null> => {
    const img = imageRef.current
    if (!img) {
      showToast('请先导入图片')
      return null
    }
    return exportPng(img.blob, overlay, familyFor(overlay.fontId))
  }

  const onDownload = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await makeExport()
      if (!blob) return
      downloadBlob(blob, buildFileName(overlay.text))
      showToast('高清图片已生成，请在浏览器下载记录中查看。')
    } catch (err) {
      showToast(err instanceof ExportError ? err.message : '图片导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  const onShare = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const blob = await makeExport()
      if (!blob) return
      const outcome = await shareOrDownload(blob, buildFileName(overlay.text))
      if (outcome === 'downloaded') {
        showToast('当前浏览器不支持直接分享，图片已为你下载。')
      }
    } catch (err) {
      showToast(err instanceof ExportError ? err.message : '分享失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  // ---- Quick layout actions ----
  const centerH = () => patchOverlay({ centerXRatio: 0.5 })
  const centerV = () => patchOverlay({ centerYRatio: 0.5 })
  const resetPosition = () =>
    patchOverlay({
      centerXRatio: 0.5,
      centerYRatio: 0.5,
      fontSizeRatio: DEFAULT_OVERLAY.fontSizeRatio,
      letterSpacing: DEFAULT_OVERLAY.letterSpacing,
    })
  const clearText = () => patchOverlay({ text: '' })

  // ---- Font management ----
  const onImportFont = async (file: File) => {
    try {
      const meta = await importFont(file)
      refreshFonts()
      showToast(`已导入字体：${meta.displayName}`)
    } catch (err) {
      showToast(err instanceof FontImportError ? err.message : '字体导入失败')
    }
  }

  const requestDeleteFont = (id: string) => {
    const f = fonts.find((x) => x.id === id)
    if (!f || f.isBuiltIn) return
    setDialog({ type: 'deleteFont', id, name: f.displayName })
  }

  const confirmDeleteFont = async (id: string) => {
    await deleteFont(id)
    refreshFonts()
    if (overlay.fontId === id) patchOverlay({ fontId: BUILTIN_FONT_ID })
    if (defaultFontId === id) {
      setDefaultFontId(BUILTIN_FONT_ID)
      void setDefaultFont(BUILTIN_FONT_ID)
    }
    showToast('字体已删除，已切换回内置字体')
  }

  const onRenameFont = async (id: string, name: string) => {
    await renameFont(id, name)
    refreshFonts()
  }

  const onSetDefaultFont = async (id: string) => {
    await setDefaultFont(id)
    setDefaultFontId(id)
    showToast('已设为默认字体')
  }

  const doClearDraft = async () => {
    await clearDraftDb()
    setHasDraft(false)
    showToast('草稿已清除')
  }

  const backHome = () => setScreen('home')

  const unsupported = !supportsCoreFeatures()

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={onFileSelected}
      />

      {needRefresh && (
        <div className="banner">
          <span>工具已更新，点击刷新使用新版本</span>
          <button className="btn btn-primary" onClick={updateNow}>
            刷新
          </button>
        </div>
      )}
      {isWeChatBrowser() && !wechatDismissed && (
        <div className="banner banner-warning">
          <span>
            为了正常下载、分享和添加到桌面，请点击右上角，选择“在浏览器中打开”。
          </span>
          <button className="btn" onClick={() => setWechatDismissed(true)}>
            知道了
          </button>
        </div>
      )}
      {unsupported && (
        <div className="banner banner-warning">
          <span>当前浏览器可能不支持部分功能，建议使用最新版 Chrome 浏览器打开。</span>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          hasDraft={hasDraft}
          canInstall={canInstall}
          onImport={() => openPicker('new')}
          onContinue={continueDraft}
          onFonts={() => setScreen('fonts')}
          onHelp={() => setScreen('help')}
          onAbout={() => setScreen('about')}
          onInstall={promptInstall}
          onClearDraft={() => setDialog({ type: 'clearDraft' })}
        />
      )}

      {screen === 'editor' && image && (
        <EditorScreen
          image={image.preview}
          overlay={overlay}
          fonts={fonts}
          exporting={exporting}
          onChange={patchOverlay}
          onBack={backHome}
          onReplaceImage={() => openPicker('replace')}
          onFullscreen={() => setFullscreen(true)}
          onCenterH={centerH}
          onCenterV={centerV}
          onResetPosition={resetPosition}
          onClearText={clearText}
          onDownload={onDownload}
          onShare={onShare}
        />
      )}
      {screen === 'editor' && !image && (
        <div className="screen editor-empty">
          还没有导入图片。
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => openPicker('new')}>
            导入产品图片
          </button>
          <button className="btn btn-block" style={{ marginTop: 10 }} onClick={backHome}>
            返回首页
          </button>
        </div>
      )}

      {screen === 'fonts' && (
        <FontManager
          fonts={fonts}
          defaultFontId={defaultFontId}
          failedIds={failedIds}
          onBack={backHome}
          onImportFile={onImportFont}
          onDelete={requestDeleteFont}
          onRename={onRenameFont}
          onSetDefault={onSetDefaultFont}
        />
      )}

      {screen === 'help' && <HelpScreen onBack={backHome} />}
      {screen === 'about' && <AboutScreen onBack={backHome} />}

      {fullscreen && image && (
        <FullscreenPreview
          image={image.preview}
          overlay={overlay}
          fontFamily={familyFor(overlay.fontId)}
          onExit={() => setFullscreen(false)}
        />
      )}

      {exporting && <div className="busy">正在生成高清图片…</div>}

      {dialog?.type === 'deleteFont' && (
        <ConfirmDialog
          title="删除字体"
          message={`确认删除字体“${dialog.name}”吗？如果它正在使用，将自动切换回内置字体。`}
          confirmLabel="删除"
          danger
          onConfirm={() => {
            const id = dialog.id
            setDialog(null)
            void confirmDeleteFont(id)
          }}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'clearDraft' && (
        <ConfirmDialog
          title="清除草稿"
          message="清除后无法恢复，确认清除当前草稿吗？"
          confirmLabel="清除"
          danger
          onConfirm={() => {
            setDialog(null)
            void doClearDraft()
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  )
}
