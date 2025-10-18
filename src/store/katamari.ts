import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Task, GameStats } from '@/types/tasks'

export type SortOption = 'none' | 'alpha' | 'priority' | 'tag' | 'strength'

// Tasks storage with localStorage persistence
export const tasksAtom = atomWithStorage<Task[]>('katamari-tasks', [])

// Ball size (grows as tasks are completed)
export const ballSizeAtom = atomWithStorage<number>('katamari-ball-size', 1.0)

// Game statistics
export const statsAtom = atomWithStorage<GameStats>('katamari-stats', {
  totalCompleted: 0,
  highScore: 0,
  startTime: Date.now(),
  sessionsPlayed: 0,
  totalXP: 0
})

// Sort option for physical task arrangement in 3D world
export const sortByAtom = atom<SortOption>('none')

// UI state (not persisted)
export const isSoundEnabledAtom = atomWithStorage<boolean>('katamari-sound-enabled', true)
