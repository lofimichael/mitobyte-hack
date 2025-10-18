import { useAtom } from 'jotai'
import { tasksAtom, ballSizeAtom, statsAtom } from '@/store/katamari'

export function useGameControls() {
  const [tasks, setTasks] = useAtom(tasksAtom)
  const [, setBallSize] = useAtom(ballSizeAtom)
  const [stats, setStats] = useAtom(statsAtom)

  const resetGame = () => {
    // Reset ball size
    setBallSize(1.0)

    // Mark all tasks as incomplete
    setTasks(tasks.map(t => ({ ...t, completed: false })))

    // Reset session stats but keep high score
    setStats({
      ...stats,
      startTime: Date.now(),
      sessionsPlayed: stats.sessionsPlayed + 1
    })
  }

  const clearAllTasks = () => {
    setTasks([])
    setBallSize(1.0)
    setStats({
      totalCompleted: 0,
      highScore: 0,
      startTime: Date.now(),
      sessionsPlayed: 0,
      totalXP: 0
    })
  }

  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.completed))
  }

  return {
    resetGame,
    clearAllTasks,
    clearCompleted
  }
}
