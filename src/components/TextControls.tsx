import { useState } from 'react'
import type { FontMeta, TextOverlayState } from '../types'
import {
  SLIDER_MIN,
  SLIDER_MAX,
  MIN_LETTER_SPACING,
  defaultLetterSpacingFor,
  MAX_LETTER_SPACING,
} from '../utils/constants'
import { clampSizeRatio } from '../utils/coordinates'

interface TextControlsProps {
  overlay: TextOverlayState
  fonts: FontMeta[]
  exporting: boolean
  onChange: (patch: Partial<TextOverlayState>, autosave?: boolean) => void
  onCenterH: () => void
  onCenterV: () => void
  onResetPosition: () => void
  onClearText: () => void
  onDownload: () => void
  onShare: () => void
}

const COLOR_PRESETS: { label: string; value: string }[] = [
  { label: '黑色', value: '#000000' },
  { label: '白色', value: '#ffffff' },
  { label: '深灰', value: '#4a4a4a' },
  { label: '暖棕', value: '#8a5a34' },
]

export function TextControls({
  overlay,
  fonts,
  exporting,
  onChange,
  onCenterH,
  onCenterV,
  onResetPosition,
  onClearText,
  onDownload,
  onShare,
}: TextControlsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const sliderValue = Math.round(overlay.fontSizeRatio * 1000)
  const presetSelected = COLOR_PRESETS.some(
    (p) => p.value.toLowerCase() === overlay.color.toLowerCase()
  )

  return (
    <div className="controls">
      <div className="field">
        <label className="field-label" htmlFor="name-input">
          输入名字
        </label>
        <input
          id="name-input"
          className="text-input"
          type="text"
          value={overlay.text}
          placeholder="例如：Charlie"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="font-select">
          选择字体
        </label>
        <select
          id="font-select"
          className="text-input"
          value={overlay.fontId}
          onChange={(e) =>
            onChange({
              fontId: e.target.value,
              letterSpacing: defaultLetterSpacingFor(e.target.value),
            })
          }
        >
          {fonts.map((f) => (
            <option key={f.id} value={f.id}>
              {f.displayName}
              {f.isBuiltIn ? '（内置）' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="size-slider">
          文字大小
        </label>
        <input
          id="size-slider"
          className="slider"
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={sliderValue}
          onChange={(e) => onChange({ fontSizeRatio: clampSizeRatio(Number(e.target.value) / 1000) })}
          onPointerUp={() => onChange({}, true)}
        />
      </div>

      <div className="field">
        <span className="field-label">文字颜色</span>
        <div className="color-row">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.value}
              className={`swatch${
                overlay.color.toLowerCase() === p.value.toLowerCase() ? ' selected' : ''
              }`}
              style={{ background: p.value }}
              aria-label={p.label}
              onClick={() => onChange({ color: p.value })}
            />
          ))}
          <label
            className={`swatch${!presetSelected ? ' selected' : ''}`}
            style={{
              background:
                'conic-gradient(red, orange, yellow, green, blue, violet, red)',
              position: 'relative',
              overflow: 'hidden',
            }}
            aria-label="自定义颜色"
          >
            <input
              type="color"
              value={presetSelected ? '#8a5a34' : overlay.color}
              onChange={(e) => onChange({ color: e.target.value })}
              style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      <button
        className="collapse-header"
        onClick={() => setAdvancedOpen((v) => !v)}
        aria-expanded={advancedOpen}
      >
        <span>字间距（高级设置）</span>
        <span>{advancedOpen ? '收起 ▲' : '展开 ▼'}</span>
      </button>
      {advancedOpen && (
        <div className="field">
          <input
            className="slider"
            type="range"
            min={MIN_LETTER_SPACING}
            max={MAX_LETTER_SPACING}
            step={0.01}
            value={overlay.letterSpacing}
            onChange={(e) => onChange({ letterSpacing: Number(e.target.value) })}
            onPointerUp={() => onChange({}, true)}
            aria-label="字间距"
          />
        </div>
      )}

      <div className="chip-row">
        <button className="chip" onClick={onCenterH}>
          水平居中
        </button>
        <button className="chip" onClick={onCenterV}>
          垂直居中
        </button>
        <button className="chip" onClick={onResetPosition}>
          恢复默认位置
        </button>
        <button className="chip" onClick={onClearText}>
          清空文字
        </button>
      </div>

      <div className="primary-actions">
        <button className="btn btn-primary" onClick={onDownload} disabled={exporting}>
          {exporting ? '生成中…' : '下载高清图片'}
        </button>
        <button className="btn" onClick={onShare} disabled={exporting}>
          分享图片
        </button>
      </div>
    </div>
  )
}
