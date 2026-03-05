import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { listBoards, createBoard, deleteBoard, BoardMeta } from '../hooks/useLocalBoard'
import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onOpen: (boardId: string) => void
}

export function WelcomeScreen({ onOpen }: WelcomeScreenProps) {
  const [boards, setBoards] = useState<BoardMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBoards().then((list) => {
      setBoards(list)
      setLoading(false)
    })
  }, [])

  const handleNew = async () => {
    const meta = await createBoard()
    onOpen(meta.id)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteBoard(id)
    setBoards((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <motion.div
      className="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background aurora gradient */}
      <div className="welcome__aurora" aria-hidden="true" />

      <motion.div
        className="welcome__card glass"
        initial={{ y: 32, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.05 }}
      >
        {/* Logo + brand */}
        <motion.div
          className="welcome__logo"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.12 }}
        >
          <div className="welcome__logo-icon" aria-hidden="true">✦</div>
        </motion.div>

        <motion.h1
          className="welcome__title"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          Wande
        </motion.h1>
        <motion.p
          className="welcome__subtitle"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.24, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          你的创作白板，像守护 PSD 一样安全
        </motion.p>

        {/* New board CTA */}
        <motion.button
          className="welcome__cta"
          onClick={handleNew}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span>+ 新建白板</span>
        </motion.button>

        {/* Recent boards */}
        {!loading && boards.length > 0 && (
          <motion.div
            className="welcome__recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.36 }}
          >
            <p className="welcome__section-label">最近打开</p>
            <div className="welcome__board-list">
              <AnimatePresence initial={false}>
                {boards.map((b, i) => (
                  <motion.button
                    key={b.id}
                    className="board-card"
                    onClick={() => onOpen(b.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="board-card__preview" aria-hidden="true" />
                    <div className="board-card__info">
                      <span className="board-card__name">{b.title}</span>
                      <span className="board-card__date">
                        {formatDate(b.updatedAt)}
                      </span>
                    </div>
                    <button
                      className="board-card__delete"
                      onClick={(e) => handleDelete(e, b.id)}
                      aria-label={`删除「${b.title}」`}
                      title="删除"
                    >
                      ×
                    </button>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

function formatDate(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
