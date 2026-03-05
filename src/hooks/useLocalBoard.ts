/**
 * useLocalBoard — 本地优先的白板数据持久化（IndexedDB via localForage）
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

export interface BoardMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  thumbnail?: string
}

const BOARDS_KEY = 'wande:boards'
const BOARD_DATA_PREFIX = 'wande:board:'

/** 读取所有白板元信息列表 */
export async function listBoards(): Promise<BoardMeta[]> {
  const list = await localforage.getItem<BoardMeta[]>(BOARDS_KEY)
  return list ?? []
}

/** 创建新白板 */
export async function createBoard(title = '未命名白板'): Promise<BoardMeta> {
  const meta: BoardMeta = {
    id: uuidv4(),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const list = await listBoards()
  await localforage.setItem(BOARDS_KEY, [meta, ...list])
  return meta
}

/** 更新白板元信息 */
export async function updateBoardMeta(
  id: string,
  patch: Partial<Omit<BoardMeta, 'id' | 'createdAt'>>,
): Promise<void> {
  const list = await listBoards()
  const updated = list.map((b) =>
    b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b,
  )
  await localforage.setItem(BOARDS_KEY, updated)
}

/** 删除白板 */
export async function deleteBoard(id: string): Promise<void> {
  const list = await listBoards()
  await localforage.setItem(BOARDS_KEY, list.filter((b) => b.id !== id))
  await localforage.removeItem(`${BOARD_DATA_PREFIX}${id}`)
}

/** 保存白板内容（Drawnix 序列化数据） */
export async function saveBoardData(id: string, data: unknown): Promise<void> {
  await localforage.setItem(`${BOARD_DATA_PREFIX}${id}`, data)
  await updateBoardMeta(id, {})
}

/** 读取白板内容 */
export async function loadBoardData(id: string): Promise<unknown | null> {
  return localforage.getItem(`${BOARD_DATA_PREFIX}${id}`)
}

/** React hook: 管理当前打开的白板 */
export function useLocalBoard(boardId: string | null) {
  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!boardId) return
    setLoading(true)
    loadBoardData(boardId).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [boardId])

  /** 防抖自动保存，500ms 后提交 */
  const autoSave = useCallback(
    (newData: unknown) => {
      setData(newData)
      if (!boardId) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveBoardData(boardId, newData)
      }, 500)
    },
    [boardId],
  )

  return { data, loading, autoSave }
}
