import { useState } from 'react'
import type { FontMeta, TextOverlayState } from '../types'
import { ImageCanvas } from './ImageCanvas'
import { TextControls } from './TextControls'
import { familyFor } from '../services/fontService'

interface EditorScreenProps {
  image: ImageBitmap
  overlay: TextOverlayState
  fonts: FontMeta[]
  exporting: boolean
  onChange: (patch: Partial<TextOverlayState>, autosave?: boolean) => void
  onBack: () => void
  onReplaceImage: () => void
  onFullscreen: () => void
  onCenterH: () => void
  onCenterV: () => void
  onResetPosition: () => void
  onClearText: () => void
  onDownload: () => void
  onShare: () => void
}

export function EditorScreen(props: EditorScreenProps) {
  const {
    image,
    overlay,
    fonts,
    exporting,
    onChange,
    onBack,
    onReplaceImage,
    onFullscreen,
  } = props
  const [selected, setSelected] = useState(false)

  return (
    <div className="editor">
      <div className="topbar">
        <button className="topbar-btn" onClick={onBack}>
          返回
        </button>
        <button className="topbar-btn" onClick={onReplaceImage}>
          更换图片
        </button>
        <button className="topbar-btn" onClick={onFullscreen}>
          全屏预览
        </button>
      </div>

      <ImageCanvas
        image={image}
        overlay={overlay}
        fontFamily={familyFor(overlay.fontId)}
        selected={selected}
        onSelectedChange={setSelected}
        onOverlayChange={(patch) => onChange(patch)}
        onGestureEnd={() => onChange({}, true)}
      />

      <TextControls
        overlay={overlay}
        fonts={fonts}
        exporting={exporting}
        onChange={onChange}
        onCenterH={props.onCenterH}
        onCenterV={props.onCenterV}
        onResetPosition={props.onResetPosition}
        onClearText={props.onClearText}
        onDownload={props.onDownload}
        onShare={props.onShare}
      />
    </div>
  )
}
