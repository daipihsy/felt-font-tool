import { useRef, useState } from 'react'
import type { FontMeta } from '../types'
import { familyFor } from '../services/fontService'

interface FontManagerProps {
  fonts: FontMeta[]
  defaultFontId: string
  failedIds: string[]
  onBack: () => void
  onImportFile: (file: File) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onSetDefault: (id: string) => void
}

export function FontManager({
  fonts,
  defaultFontId,
  failedIds,
  onBack,
  onImportFile,
  onDelete,
  onRename,
  onSetDefault,
}: FontManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so re-selecting the same file still fires change.
    e.target.value = ''
    if (file) onImportFile(file)
  }

  return (
    <div className="editor">
      <div className="topbar">
        <button className="topbar-btn" onClick={onBack}>
          返回
        </button>
        <div className="topbar-title">字体管理</div>
        <span style={{ width: 44 }} />
      </div>

      <div className="screen" style={{ overflowY: 'auto' }}>
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => inputRef.current?.click()}
        >
          导入字体
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype,application/octet-stream"
          className="visually-hidden"
          onChange={handleFile}
        />

        <p style={{ color: 'var(--color-text-soft)', fontSize: 'var(--font-sm)', marginTop: 10 }}>
          支持 TTF 和 OTF 字体。字体只保存在当前手机浏览器中。请确认导入的字体允许用于你的实际用途。
        </p>

        <div className="list">
          {fonts.map((font) => {
            const isDefault = font.id === defaultFontId
            const failed = failedIds.includes(font.id)
            return (
              <div key={font.id} className={`font-card${isDefault ? ' active' : ''}`}>
                <div
                  className="font-preview"
                  style={{ fontFamily: `"${familyFor(font.id)}", sans-serif` }}
                >
                  {failed ? '（字体无法加载）' : 'Charlie'}
                </div>
                <div className="font-meta">
                  <span className="font-name">{font.displayName}</span>
                  {font.isBuiltIn && <span className="badge">内置</span>}
                  {isDefault && <span className="badge default">默认</span>}
                </div>
                <div className="font-actions">
                  {!isDefault && (
                    <button className="btn" onClick={() => onSetDefault(font.id)}>
                      设为默认
                    </button>
                  )}
                  <button
                    className="btn"
                    onClick={() => setRenaming({ id: font.id, value: font.displayName })}
                  >
                    改名称
                  </button>
                  {!font.isBuiltIn && (
                    <button className="btn btn-danger" onClick={() => onDelete(font.id)}>
                      删除
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {renaming && (
        <div className="dialog-backdrop" onClick={() => setRenaming(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">修改显示名称</div>
            <input
              className="text-input"
              value={renaming.value}
              autoFocus
              onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
            />
            <div className="dialog-actions">
              <button className="btn" onClick={() => setRenaming(null)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onRename(renaming.id, renaming.value)
                  setRenaming(null)
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
