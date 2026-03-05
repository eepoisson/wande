import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toolbar, ToolId } from './Toolbar'
import { useLocalBoard, updateBoardMeta, BoardMeta } from '../hooks/useLocalBoard'
import './BoardCanvas.css'

interface BoardCanvasProps {
  meta: BoardMeta
  onBack: () => void
}

export function BoardCanvas({ meta, onBack }: BoardCanvasProps) {
  const [activeTool, setActiveTool] = useState<ToolId>('select')
  const [zoom, setZoom] = useState(100)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(meta.title)
  const { autoSave } = useLocalBoard(meta.id)
  const canvasRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  /* ── Title editing ─────────────────────────────────────────────────────── */
  const commitTitle = useCallback(async () => {
    setEditingTitle(false)
    const trimmed = title.trim() || '未命名白板'
    setTitle(trimmed)
    await updateBoardMeta(meta.id, { title: trimmed })
  }, [meta.id, title])

  useEffect(() => {
    if (editingTitle) titleRef.current?.select()
  }, [editingTitle])

  /* ── Keyboard shortcuts ────────────────────────────────────────────────── */
  useEffect(() => {
    const map: Record<string, ToolId> = {
      v: 'select', h: 'hand', p: 'pencil', r: 'shape',
      t: 'text', s: 'sticky', a: 'arrow', e: 'eraser', m: 'mindmap',
    }
    const handler = (ev: KeyboardEvent) => {
      if (editingTitle) return
      if (ev.target instanceof HTMLInputElement) return
      const tool = map[ev.key.toLowerCase()]
      if (tool) setActiveTool(tool)
      if (ev.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingTitle, onBack])

  /* ── Scroll-to-zoom ────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => Math.min(400, Math.max(25, z - e.deltaY * 0.5)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  /* ── Simulate data change for autosave demo ─────────────────────────────── */
  const handleCanvasInteraction = useCallback(() => {
    autoSave({ tool: activeTool, zoom, ts: Date.now() })
  }, [activeTool, zoom, autoSave])

  return (
    <motion.div
      className="board-canvas-root"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <motion.header
        className="board-topbar glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28, delay: 0.05 }}
      >
        {/* Back button */}
        <motion.button
          className="topbar-back"
          onClick={onBack}
          aria-label="返回主页"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.92 }}
          title="返回 (Esc)"
        >
          ‹ 返回
        </motion.button>

        {/* Editable title */}
        <div className="topbar-title-wrap">
          <AnimatePresence mode="wait">
            {editingTitle ? (
              <motion.input
                key="input"
                ref={titleRef}
                className="topbar-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') {
                    setTitle(meta.title)
                    setEditingTitle(false)
                  }
                }}
                initial={{ opacity: 0, scaleX: 0.9 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              />
            ) : (
              <motion.button
                key="label"
                className="topbar-title"
                onClick={() => setEditingTitle(true)}
                title="点击重命名"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {title}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Zoom indicator */}
        <div className="topbar-zoom" aria-label={`当前缩放 ${zoom}%`}>
          <button
            className="zoom-btn"
            onClick={() => setZoom((z) => Math.max(25, z - 10))}
            aria-label="缩小"
          >−</button>
          <span className="zoom-val">{zoom}%</span>
          <button
            className="zoom-btn"
            onClick={() => setZoom((z) => Math.min(400, z + 10))}
            aria-label="放大"
          >+</button>
          <button
            className="zoom-btn zoom-reset"
            onClick={() => setZoom(100)}
            aria-label="重置缩放"
            title="重置 100%"
          >⌖</button>
        </div>
      </motion.header>

      {/* ── Canvas area ─────────────────────────────────────────────────── */}
      <div
        className="wande-canvas-area"
        ref={canvasRef}
        onClick={handleCanvasInteraction}
        role="main"
        aria-label="白板画布"
      >
        {/* Drawnix whiteboard placeholder */}
        <DrawnixEmbed zoom={zoom} activeTool={activeTool} />
      </div>

      {/* ── Left Toolbar ────────────────────────────────────────────────── */}
      <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <StatusBar activeTool={activeTool} zoom={zoom} />
    </motion.div>
  )
}

/* ── Drawnix Embed placeholder ─────────────────────────────────────────────── */
function DrawnixEmbed({ zoom, activeTool }: { zoom: number; activeTool: ToolId }) {
  return (
    <motion.div
      className="drawnix-embed"
      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
      animate={{ cursor: cursorForTool(activeTool) }}
    >
      {/* 实际集成时替换为 <Drawnix /> 组件 */}
      <div className="drawnix-placeholder">
        <motion.div
          className="drawnix-placeholder__inner"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.2 }}
        >
          <span className="drawnix-placeholder__icon">✦</span>
          <p className="drawnix-placeholder__text">白板已就绪</p>
          <p className="drawnix-placeholder__hint">
            当前工具：<strong>{activeTool}</strong> · Ctrl/⌘ + 滚轮缩放
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

function cursorForTool(tool: ToolId): string {
  switch (tool) {
    case 'hand': return 'grab'
    case 'pencil': return 'crosshair'
    case 'eraser': return 'cell'
    case 'text': return 'text'
    default: return 'default'
  }
}

/* ── Status Bar ────────────────────────────────────────────────────────────── */
function StatusBar({ activeTool, zoom }: { activeTool: ToolId; zoom: number }) {
  return (
    <motion.div
      className="status-bar"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      <span className="status-bar__item">工具：{activeTool}</span>
      <span className="status-bar__divider" aria-hidden="true" />
      <span className="status-bar__item">缩放：{zoom}%</span>
      <span className="status-bar__divider" aria-hidden="true" />
      <span className="status-bar__item status-bar__saved">✓ 已自动保存</span>
    </motion.div>
  )
}
