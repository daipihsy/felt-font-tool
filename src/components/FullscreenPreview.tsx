import { useCallback, useEffect, useRef, useState } from 'react'
import type { TextOverlayState } from '../types'
import { drawScene } from '../services/canvasRender'
import { fitRect } from '../utils/coordinates'

interface FullscreenPreviewProps {
  image: ImageBitmap
  overlay: TextOverlayState
  fontFamily: string
  onExit: () => void
}

export function FullscreenPreview({
  image,
  overlay,
  fontFamily,
  onExit,
}: FullscreenPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showBack, setShowBack] = useState(true)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const rect = fitRect(vw, vh, image.width, image.height)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const displayW = Math.max(1, Math.round(rect.drawWidth))
    const displayH = Math.max(1, Math.round(rect.drawHeight))
    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`
    canvas.width = Math.round(displayW * dpr)
    canvas.height = Math.round(displayH * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Never show the selection border in preview.
    drawScene(ctx, displayW, displayH, image, overlay, fontFamily, {
      showSelection: false,
    })
  }, [image, overlay, fontFamily])

  useEffect(() => {
    // Try real fullscreen; fall back silently to the fixed overlay.
    const el = rootRef.current
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (document.fonts?.load) {
      document.fonts.load(`32px "${fontFamily}"`, overlay.text || 'M').then(() => {
        if (!cancelled) redraw()
      }).catch(() => {})
    }
    redraw()
    return () => {
      cancelled = true
    }
  }, [redraw, fontFamily, overlay.text])

  useEffect(() => {
    const onResize = () => redraw()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [redraw])

  return (
    <div
      className="fullscreen"
      ref={rootRef}
      onClick={() => setShowBack((v) => !v)}
    >
      <canvas ref={canvasRef} />
      {showBack && (
        <button
          className="fullscreen-back"
          onClick={(e) => {
            e.stopPropagation()
            onExit()
          }}
        >
          返回编辑
        </button>
      )}
    </div>
  )
}
