import { create } from 'zustand'
import type { UndoEntry } from '@/lib/physics/types'

const MAX_ENTRIES = 20

interface UndoStore {
  entries: UndoEntry[]
  pointer: number
  push: (entry: UndoEntry) => void
  undo: () => UndoEntry | null
  redo: () => UndoEntry | null
  canUndo: () => boolean
  canRedo: () => boolean
}

export const useUndoStore = create<UndoStore>((set, get) => ({
  entries: [],
  pointer: -1,
  push: (entry) =>
    set((s) => {
      const entries = s.entries.slice(0, s.pointer + 1)
      entries.push(entry)
      if (entries.length > MAX_ENTRIES) entries.shift()
      return { entries, pointer: entries.length - 1 }
    }),
  undo: () => {
    const s = get()
    if (s.pointer < 1) return null
    set({ pointer: s.pointer - 1 })
    return s.entries[s.pointer - 1]
  },
  redo: () => {
    const s = get()
    if (s.pointer >= s.entries.length - 1) return null
    set({ pointer: s.pointer + 1 })
    return s.entries[s.pointer + 1]
  },
  canUndo: () => get().pointer > 0,
  canRedo: () => get().pointer < get().entries.length - 1,
}))
