/**
 * AvatarCropModal
 *
 * Shows a circular crop preview of the selected image.
 * The user can:
 *  - Drag (mouse or touch) to pan the image up / down / left / right
 *  - Use a slider to zoom from "whole image fits" all the way up to 4× fill
 *
 * Scale semantics
 * ---------------
 *  fillScale  — the image's shortest side exactly fills the 300 px circle.
 *               This is what "100 %" on the slider means.
 *  minScale   — fillScale × 0.25 — lets the user zoom out so the whole image
 *               (and some space around it) is visible in the crop circle.
 *  maxScale   — fillScale × 4   — close-up detail.
 *
 * When "Apply Crop" is pressed the component draws the positioned image onto a
 * 400 × 400 canvas with a circular clip and returns a PNG Blob via onConfirm().
 * No upload happens inside this component.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  /** Raw File chosen by the user */
  file: File
  /** Called with the cropped PNG blob when user confirms */
  onConfirm: (blob: Blob) => void
  /** Called when user cancels */
  onCancel: () => void
}

const PREVIEW_SIZE = 300 // px — diameter of the visible circular preview
const OUTPUT_SIZE  = 400 // px — size of the exported canvas

export function AvatarCropModal({ file, onConfirm, onCancel }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const imgRef       = useRef<HTMLImageElement | null>(null)

  // ── Dynamic scale bounds (set once image loads) ───────────────────────────
  // Stored in refs so they're always fresh in callbacks without causing re-renders.
  const fillScaleRef = useRef(1)   // scale where shortest side fills the circle
  const minScaleRef  = useRef(0.1) // 25 % of fillScale
  const maxScaleRef  = useRef(4)   // 400 % of fillScale

  // ── State ──────────────────────────────────────────────────────────────────
  // offset = translation in *screen pixels* applied on top of the centred position
  const [offset,   setOffset]   = useState({ x: 0, y: 0 })
  const [scale,    setScale]    = useState(1)
  const [ready,    setReady]    = useState(false)
  const [applying, setApplying] = useState(false)

  // ── Drag state (ref — avoids stale closures in global listeners) ───────────
  const drag = useRef({ active: false, startX: 0, startY: 0, startOx: 0, startOy: 0 })

  // ── Load image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img

      // Scale so the shortest side exactly fills the preview circle
      const shortest  = Math.min(img.naturalWidth, img.naturalHeight)
      const fill      = PREVIEW_SIZE / shortest

      fillScaleRef.current = fill
      minScaleRef.current  = fill * 0.25  // show ~4× the area of a tight crop
      maxScaleRef.current  = fill * 4

      setScale(fill)         // start at "fill" (sensible default)
      setOffset({ x: 0, y: 0 })
      setReady(true)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // ── Draw preview ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !canvasRef.current || !imgRef.current) return

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')!
    const img    = imgRef.current
    const S      = PREVIEW_SIZE

    canvas.width  = S
    canvas.height = S
    ctx.clearRect(0, 0, S, S)

    // Circular clip
    ctx.save()
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2)
    ctx.clip()

    // Drawn size at current scale
    const dw = img.naturalWidth  * scale
    const dh = img.naturalHeight * scale

    // Centre position + user pan offset (no clamping — allow empty space)
    const x = (S - dw) / 2 + offset.x
    const y = (S - dh) / 2 + offset.y

    ctx.drawImage(img, x, y, dw, dh)
    ctx.restore()

    // Subtle ring
    ctx.save()
    ctx.beginPath()
    ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth   = 2
    ctx.stroke()
    ctx.restore()
  }, [ready, offset, scale])

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, startOx: offset.x, startOy: offset.y }
  }, [offset])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!drag.current.active) return
      setOffset({
        x: drag.current.startOx + (e.clientX - drag.current.startX),
        y: drag.current.startOy + (e.clientY - drag.current.startY),
      })
    }
    function onUp() { drag.current.active = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // ── Touch drag ─────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    drag.current = { active: true, startX: t.clientX, startY: t.clientY, startOx: offset.x, startOy: offset.y }
  }, [offset])

  useEffect(() => {
    function onMove(e: TouchEvent) {
      if (!drag.current.active) return
      const t = e.touches[0]
      setOffset({
        x: drag.current.startOx + (t.clientX - drag.current.startX),
        y: drag.current.startOy + (t.clientY - drag.current.startY),
      })
    }
    function onEnd() { drag.current.active = false }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend',  onEnd)
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [])

  // ── Zoom — keep the visual centre stable ───────────────────────────────────
  const handleZoom = useCallback((newScale: number) => {
    // Adjust offset so the centre of the preview stays at the same image point
    setOffset(prev => ({
      x: prev.x * (newScale / scale),
      y: prev.y * (newScale / scale),
    }))
    setScale(newScale)
  }, [scale])

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setScale(fillScaleRef.current)
    setOffset({ x: 0, y: 0 })
  }, [])

  // ── Apply crop → canvas → blob ─────────────────────────────────────────────
  const handleApply = useCallback(async () => {
    if (!imgRef.current) return
    setApplying(true)

    const out  = document.createElement('canvas')
    out.width  = OUTPUT_SIZE
    out.height = OUTPUT_SIZE
    const ctx  = out.getContext('2d')!
    const img  = imgRef.current
    const R    = OUTPUT_SIZE / PREVIEW_SIZE // ratio preview → output

    const dw = img.naturalWidth  * scale
    const dh = img.naturalHeight * scale
    const x  = (PREVIEW_SIZE - dw) / 2 + offset.x
    const y  = (PREVIEW_SIZE - dh) / 2 + offset.y

    ctx.save()
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, x * R, y * R, dw * R, dh * R)
    ctx.restore()

    out.toBlob(blob => {
      setApplying(false)
      if (blob) onConfirm(blob)
    }, 'image/png', 0.95)
  }, [offset, scale, onConfirm])

  // ── Slider percentage helpers ──────────────────────────────────────────────
  // Map scale ↔ slider 0–100 on a logarithmic curve so the zoom feels natural
  const scaleToSlider = (s: number) => {
    const lo = Math.log(minScaleRef.current)
    const hi = Math.log(maxScaleRef.current)
    return Math.round(((Math.log(s) - lo) / (hi - lo)) * 100)
  }
  const sliderToScale = (v: number) => {
    const lo = Math.log(minScaleRef.current)
    const hi = Math.log(maxScaleRef.current)
    return Math.exp(lo + (v / 100) * (hi - lo))
  }

  // Percentage relative to fillScale for display
  const displayPct = ready ? Math.round((scale / fillScaleRef.current) * 100) : 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Position Your Photo
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag to reposition · Use the slider to zoom
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex justify-center py-4 bg-gray-950/5 dark:bg-black/20">
          <div
            className="relative select-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: '50%', overflow: 'hidden', cursor: 'grab' }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            {/* Checkerboard — shows empty space when zoomed out */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, #f9fafb 0% 50%)',
                backgroundSize: '16px 16px',
                borderRadius: '50%',
              }}
            />

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="absolute inset-0"
              style={{ borderRadius: '50%', userSelect: 'none' }}
            />

            {ready && (
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
                <div className="rounded-full bg-black/30 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  ↕ Drag to reposition
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zoom</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="rounded-md px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Reset
              </button>
              {/* Show % relative to "fill" — 100 % = face fills the circle */}
              <span className="text-xs text-gray-400 w-12 text-right tabular-nums">{displayPct} %</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Minus — zoom out one step */}
            <button
              onClick={() => handleZoom(Math.max(minScaleRef.current, sliderToScale(scaleToSlider(scale) - 5)))}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Zoom out"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Zm4.5-.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </button>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={ready ? scaleToSlider(scale) : 50}
              onChange={(e) => handleZoom(sliderToScale(Number(e.target.value)))}
              className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-sm"
            />

            {/* Plus — zoom in one step */}
            <button
              onClick={() => handleZoom(Math.min(maxScaleRef.current, sliderToScale(scaleToSlider(scale) + 5)))}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Zoom in"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Zm4.75-2.25a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5V8A.75.75 0 0 1 11.75 8" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Scale hint labels */}
          <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 px-7">
            <span>Wide</span>
            <span>Fill</span>
            <span>Close-up</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!ready || applying}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {applying ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </>
            ) : '✂️ Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}
