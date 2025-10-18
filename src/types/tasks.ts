export type ObjectType = 'paperclip' | 'stapler' | 'mug' | 'pen' | 'monitor' | 'keyboard' | 'mouse' | 'notebook'

export type Priority = 1 | 2 | 3 | 4 | 5

export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  completed: boolean
  objectType: ObjectType
  position: [number, number, number]
  createdAt: number

  // Kanban fields
  status: TaskStatus
  dependsOn: string[]  // Array of task IDs this task depends on
  section?: string     // Optional grouping/category
  strength: number     // Task difficulty/size (1-10)
}

export interface GameStats {
  totalCompleted: number
  highScore: number
  startTime: number
  sessionsPlayed: number
  totalXP: number  // XP earned from completing tasks
}

export interface ObjectConfig {
  name: ObjectType
  color: string
  mass: number
  minSize: number
  scale: number
}
