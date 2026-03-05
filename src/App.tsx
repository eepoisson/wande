import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { WelcomeScreen } from './components/WelcomeScreen'
import { BoardCanvas } from './components/BoardCanvas'
import { listBoards, BoardMeta } from './hooks/useLocalBoard'

type AppView = 'welcome' | 'board'

export default function App() {
  const [view, setView] = useState<AppView>('welcome')
  const [activeMeta, setActiveMeta] = useState<BoardMeta | null>(null)
  const [allBoards, setAllBoards] = useState<Map<string, BoardMeta>>(new Map())

  /* Seed board map on mount */
  useEffect(() => {
    listBoards().then((list) => {
      setAllBoards(new Map(list.map((b) => [b.id, b])))
    })
  }, [])

  const openBoard = (boardId: string) => {
    // Try to get meta from cache, or build a stub if missing
    const meta: BoardMeta = allBoards.get(boardId) ?? {
      id: boardId,
      title: '未命名白板',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setActiveMeta(meta)
    setView('board')
  }

  const goHome = () => {
    setView('welcome')
    setActiveMeta(null)
    // Re-sync board list after returning home
    listBoards().then((list) => {
      setAllBoards(new Map(list.map((b) => [b.id, b])))
    })
  }

  return (
    <div className="wande-app">
      <AnimatePresence mode="wait">
        {view === 'welcome' && (
          <WelcomeScreen key="welcome" onOpen={openBoard} />
        )}
        {view === 'board' && activeMeta && (
          <BoardCanvas key="board" meta={activeMeta} onBack={goHome} />
        )}
      </AnimatePresence>
    </div>
  )
}
