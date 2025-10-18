import { useAtom } from 'jotai'
import { tasksAtom, ballSizeAtom, statsAtom } from '@/store/katamari'
import type { Task, ObjectType, Priority, TaskStatus } from '@/types/tasks'
import { toast } from 'sonner'

const OBJECT_TYPES: ObjectType[] = ['paperclip', 'stapler', 'mug', 'pen', 'monitor', 'keyboard', 'mouse', 'notebook']

function getRandomObjectType(): ObjectType {
  return OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)]!
}

function getRandomSpawnPoint(): [number, number, number] {
  // Spawn in a 10x10 area on the desk surface
  const x = (Math.random() - 0.5) * 10
  const z = (Math.random() - 0.5) * 10
  const y = 2 // Above the desk surface
  return [x, y, z]
}

export function useTasks() {
  const [tasks, setTasks] = useAtom(tasksAtom)
  const [ballSize, setBallSize] = useAtom(ballSizeAtom)
  const [stats, setStats] = useAtom(statsAtom)

  const createTask = (
    title: string,
    priority: Priority,
    description?: string,
    dependsOn: string[] = [],
    section?: string,
    strength: number = 5  // Default medium difficulty
  ) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      priority,
      completed: false,
      objectType: getRandomObjectType(),
      position: getRandomSpawnPoint(),
      createdAt: Date.now(),
      status: 'todo',      // New tasks start in "To Do"
      dependsOn,           // Dependencies
      section,             // Optional grouping
      strength             // Task difficulty/size (1-10)
    }
    setTasks([...tasks, newTask])
    return newTask
  }

  const completeTask = (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task || task.completed) return

    // Mark task as completed and move to "Done"
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, completed: true, status: 'done' } : t
    ))

    // Grow the ball based on task priority
    const growthFactor = 1 + (task.priority * 0.08)
    const oldSize = ballSize
    const newSize = ballSize * growthFactor
    setBallSize(newSize)

    // Calculate XP: priority * 100 + ballSize bonus
    const xpGained = Math.floor(task.priority * 100 + ballSize * 10)

    // Check for size milestones and show absurd titles
    const milestones = [
      { size: 1.0, title: '🎯 Intern', description: 'You exist!' },
      { size: 1.5, title: '💼 Junior Dev', description: 'Stack Overflow is your friend' },
      { size: 2.5, title: '⚡ Mid-Level', description: 'Imposter syndrome intensifies' },
      { size: 4.0, title: '🔥 Senior Dev', description: 'You actually know things' },
      { size: 6.0, title: '👑 Tech Lead', description: 'Now you review PRs instead of writing code' },
      { size: 10.0, title: '🧙 Principal Engineer', description: 'Meetings are your new reality' },
      { size: 15.0, title: '🚀 CTO', description: 'Somehow you manage people now' },
      { size: 25.0, title: '💎 Elon Musk', description: 'Peak productivity delusion' },
      { size: 40.0, title: '👾 God Emperor of Code', description: 'You have ascended beyond mortal programming' }
    ]

    // Find newly crossed milestone (show after XP toast)
    const crossedMilestone = milestones.find(m => oldSize < m.size && newSize >= m.size)
    if (crossedMilestone) {
      setTimeout(() => {
        toast.success(crossedMilestone.title, {
          description: crossedMilestone.description,
          duration: 4000,
          className: 'milestone-toast'  // Offset below regular toasts
        })
      }, 500) // Delay so it shows after XP toast
    }

    // WE STAY WINNING toast (random hype message)
    setTimeout(() => {
      const winningMessages = [
        '💪 WE STAY WINNING',
        '🔥 UNSTOPPABLE',
        '⚡ PRODUCTIVITY BEAST MODE',
        '🎯 CRUSHING IT',
        '🚀 MOMENTUM ACTIVATED',
        '👑 ABSOLUTE LEGEND',
        '💎 BUILT DIFFERENT'
      ]
      const randomMessage = winningMessages[Math.floor(Math.random() * winningMessages.length)]
      toast.success(randomMessage!, { duration: 2000 })
    }, 500) // Quick delay for visual effect

    // Update stats with XP
    setStats({
      ...stats,
      totalCompleted: stats.totalCompleted + 1,
      highScore: Math.max(stats.highScore, newSize),
      totalXP: stats.totalXP + xpGained
    })
  }

  const updateTaskStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, status: newStatus } : t
    ))
  }

  const canMoveToInProgress = (taskId: string): { can: boolean; blockedBy: string[] } => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return { can: false, blockedBy: [] }

    const blockedBy = task.dependsOn.filter(depId => {
      const depTask = tasks.find(t => t.id === depId)
      return depTask?.status !== 'done'
    })

    return {
      can: blockedBy.length === 0,
      blockedBy
    }
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)
  const getIncompleteTasks = () => tasks.filter(t => !t.completed)
  const getCompletedTasks = () => tasks.filter(t => t.completed)

  return {
    tasks,
    createTask,
    completeTask,
    updateTaskStatus,
    canMoveToInProgress,
    deleteTask,
    getTasksByStatus,
    incompleteTasks: getIncompleteTasks(),
    completedTasks: getCompletedTasks(),
    todoTasks: getTasksByStatus('todo'),
    inProgressTasks: getTasksByStatus('in-progress'),
    doneTasks: getTasksByStatus('done')
  }
}
