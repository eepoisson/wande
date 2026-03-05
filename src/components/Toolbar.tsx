import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import './Toolbar.css'

export type ToolId =
  | 'select'
  | 'hand'
  | 'pencil'
  | 'shape'
  | 'text'
  | 'sticky'
  | 'arrow'
  | 'eraser'
  | 'mindmap'
  | 'image'

interface ToolDef {
  id: ToolId
  icon: string
  label: string
  shortcut?: string
}

const TOOLS: ToolDef[] = [
  { id: 'select',  icon: '↖', label: '选择',   shortcut: 'V' },
  { id: 'hand',    icon: '✋', label: '平移',   shortcut: 'H' },
  { id: 'pencil',  icon: '✏️', label: '画笔',   shortcut: 'P' },
  { id: 'shape',   icon: '⬜', label: '形状',   shortcut: 'R' },
  { id: 'text',    icon: 'T',  label: '文字',   shortcut: 'T' },
  { id: 'sticky',  icon: '📝', label: '便签',   shortcut: 'S' },
  { id: 'arrow',   icon: '↗', label: '箭头',   shortcut: 'A' },
  { id: 'eraser',  icon: '◻', label: '橡皮',   shortcut: 'E' },
  { id: 'mindmap', icon: '◉', label: '思维导图', shortcut: 'M' },
]

const DIVIDER_AFTER: ToolId[] = ['hand', 'arrow']

interface ToolbarProps {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<ToolId | null>(null)

  const handleKey = useCallback(
    (e: React.KeyboardEvent, tool: ToolDef) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToolChange(tool.id)
      }
    },
    [onToolChange],
  )

  return (
    <motion.div
      className="toolbar glass"
      initial={{ y: 16, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.1 }}
      role="toolbar"
      aria-label="绘图工具栏"
    >
      {TOOLS.map((tool) => (
        <ToolbarGroup key={tool.id} showDivider={DIVIDER_AFTER.includes(tool.id)}>
          <ToolButton
            tool={tool}
            isActive={activeTool === tool.id}
            isHovered={hoveredTool === tool.id}
            onActivate={() => onToolChange(tool.id)}
            onHover={(h) => setHoveredTool(h ? tool.id : null)}
            onKeyDown={(e) => handleKey(e, tool)}
          />
        </ToolbarGroup>
      ))}

      {/* Floating label tooltip */}
      <AnimatePresence>
        {hoveredTool && (
          <ToolTooltip
            tool={TOOLS.find((t) => t.id === hoveredTool)!}
            toolIndex={TOOLS.findIndex((t) => t.id === hoveredTool)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function ToolbarGroup({
  children,
  showDivider,
}: {
  children: React.ReactNode
  showDivider: boolean
}) {
  return (
    <>
      {children}
      {showDivider && <div className="toolbar-divider" aria-hidden="true" />}
    </>
  )
}

interface ToolButtonProps {
  tool: ToolDef
  isActive: boolean
  isHovered: boolean
  onActivate: () => void
  onHover: (hovered: boolean) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

function ToolButton({
  tool,
  isActive,
  onActivate,
  onHover,
  onKeyDown,
}: ToolButtonProps) {
  return (
    <motion.button
      className={`tool-btn ${isActive ? 'tool-btn--active' : ''}`}
      onClick={onActivate}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onKeyDown={onKeyDown}
      aria-label={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
      aria-pressed={isActive}
      whileHover={{ scale: 1.10 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Active indicator pill */}
      {isActive && (
        <motion.span
          className="tool-btn__bg"
          layoutId="activeTool"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <span className="tool-btn__icon" aria-hidden="true">
        {tool.icon}
      </span>
    </motion.button>
  )
}

function ToolTooltip({ tool, toolIndex }: { tool: ToolDef; toolIndex: number }) {
  const TOOL_SIZE = 44
  const DIVIDER_COUNT = toolIndex > 1 ? (toolIndex > 7 ? 2 : toolIndex > 5 ? 2 : toolIndex > 1 ? 1 : 0) : 0
  const topOffset = 8 + toolIndex * TOOL_SIZE + DIVIDER_COUNT * 20

  return (
    <motion.div
      className="tool-tooltip"
      style={{ top: topOffset + TOOL_SIZE / 2 - 16 }}
      initial={{ opacity: 0, x: -6, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -4, scale: 0.94 }}
      transition={{ duration: 0.12 }}
    >
      <span>{tool.label}</span>
      {tool.shortcut && (
        <kbd className="tool-tooltip__kbd">{tool.shortcut}</kbd>
      )}
    </motion.div>
  )
}
