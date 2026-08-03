import { useCallback, useEffect, useRef, useState } from 'react'
import type { TextOverlayState } from '../types'
import { drawScene } from '../services/canvasRender'
import { fitRect, clampRatio, clampSizeRatio } from '../utils/coordinates'

interface ImageCanvasProps {
  image: ImageBitmap
  overlay: TextOverlayState
  fontFamily: string
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  onOverlayChange: (patch: Partial<TextOverlayState>) => void
  onGestureEnd: () => void
}

const TAP_THRESHOLD = 8 // px of movement below which a gesture counts as a tap

type GestureMode = 'none' | 'drag' | 'pinch'

interface GestureState {
  mode: GestureMode
  moved: boolean
  startX: number
  startY: number
  startCenterX: number
  startCenterY: number
  startDist: number
  startSizeRatio: number
}

export function ImageCanvas({
  image,
  overlay,
  fontFamily,
  selected,
  onSelectedChange,
  onOverlayChange,
  onGestureEnd,
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const displayRef = useRef({ width: 0, height: 0 })
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gesture = useRef<GestureState>({
    mode: 'none',
    moved: false,
    startX: 0,
    startY: 0,
    startCenterX: 0.5,
    startCenterY: 0.5,
    startDist: 0,
    startSizeRatio: 0.08,
  })
  const [fontTick, setFontTick] = useState(0)

  // Keep the latest overlay/props in refs so gesture handlers stay stable.
  const overlayRef = useRef(overlay)
  overlayRef.current = overlay

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    if (cw <= 0 || ch <= 0) return

    const rect = fitRect(cw, ch, image.width, image.height)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const displayW = Math.max(1, Math.round(rect.drawWidth))
    const displayH = Math.max(1, Math.round(rect.drawHeight))
    displayRef.current = { width: displayW, height: displayH }

    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`
    const backingW = Math.round(displayW * dpr)
    const backingH = Math.round(displayH * dpr)
    if (canvas.width !== backingW || canvas.height !== backingH) {
      canvas.width = backingW
      canvas.height = backingH
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawScene(ctx, displayW, displayH, image, overlay, fontFamily, {
      showSelection: selected && overlay.text.trim().length > 0,
      dpr,
    })
  }, [image, overlay, fontFamily, selected])

  // Ensure the font is loaded, then redraw (handles the reload race).
  useEffect(() => {
    let cancelled = false
    if (typeof document !== 'undefined' && document.fonts?.load) {
      document.fonts
        .load(`32px "${fontFamily}"`, overlayRef.current.text || 'M')
        .then(() => {
          if (!cancelled) setFontTick((t) => t + 1)
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [fontFamily])

  // Redraw on any relevant change.
  useEffect(() => {
    redraw()
  }, [redraw, fontTick])

  // Redraw on container resize / orientation change.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => redraw())
    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw])

  // ---- Pointer gestures ----
  const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y)

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const rect = canvas.getBoundingClientRect()
    pointers.current.set(e.pointerId, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    const ov = overlayRef.current

    if (pointers.current.size === 1) {
      const p = pointers.current.get(e.pointerId)!
      gesture.current = {
        mode: 'drag',
        moved: false,
        startX: p.x,
        startY: p.y,
        startCenterX: ov.centerXRatio,
        startCenterY: ov.centerYRatio,
        startDist: 0,
        startSizeRatio: ov.fontSizeRatio,
      }
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      gesture.current = {
        ...gesture.current,
        mode: 'pinch',
        moved: true,
        startDist: distanceBetween(pts[0], pts[1]) || 1,
        startSizeRatio: ov.fontSizeRatio,
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointers.current.set(e.pointerId, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    const { width, height } = displayRef.current
    const g = gesture.current

    if (g.mode === 'pinch' && pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values())
      const dist = distanceBetween(pts[0], pts[1]) || 1
      const scale = dist / g.startDist
      onOverlayChange({ fontSizeRatio: clampSizeRatio(g.startSizeRatio * scale) })
      return
    }

    if (g.mode === 'drag') {
      const p = pointers.current.get(e.pointerId)!
      const dx = p.x - g.startX
      const dy = p.y - g.startY
      if (Math.hypot(dx, dy) > TAP_THRESHOLD) g.moved = true
      if (g.moved) {
        const nx = clampRatio(g.startCenterX + (width > 0 ? dx / width : 0))
        const ny = clampRatio(g.startCenterY + (height > 0 ? dy / height : 0))
        onOverlayChange({ centerXRatio: nx, centerYRatio: ny })
      }
    }
  }

  const endPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const wasTap = gesture.current.mode === 'drag' && !gesture.current.moved
    pointers.current.delete(e.pointerId)

    if (pointers.current.size === 0) {
      if (wasTap) {
        // Toggle the lightweight selection state.
        onSelectedChange(!selected)
      } else {
        onGestureEnd()
      }
      gesture.current.mode = 'none'
    } else if (pointers.current.size === 1) {
      // Dropped from pinch to single finger: restart as a drag from here.
      const remaining = Array.from(pointers.current.entries())[0]
      const ov = overlayRef.current
      gesture.current = {
        mode: 'drag',
        moved: true,
        startX: remaining[1].x,
        startY: remaining[1].y,
        startCenterX: ov.centerXRatio,
        startCenterY: ov.centerYRatio,
        startDist: 0,
        startSizeRatio: ov.fontSizeRatio,
      }
      onGestureEnd()
    }
  }

  return (
    <div className="editor-stage" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="editor-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      />
    </div>
  )
}
