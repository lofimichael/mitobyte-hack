import type { Task, TaskStatus } from '@/types/tasks'
import { TaskCard } from './TaskCard'
import { Separator } from '@/components/ui/separator'

interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: Task[]
  count: number
}

export function KanbanColumn({ title, status, tasks, count }: KanbanColumnProps) {
  const getColumnColor = () => {
    switch (status) {
      case 'todo':
        return 'text-blue-600 dark:text-blue-400'
      case 'in-progress':
        return 'text-amber-600 dark:text-amber-400'
      case 'done':
        return 'text-green-600 dark:text-green-400'
    }
  }

  const getEmptyMessage = () => {
    switch (status) {
      case 'todo':
        return 'No tasks yet. Create one to get started!'
      case 'in-progress':
        return 'No active quests. Move tasks here to spawn them in 3D!'
      case 'done':
        return 'No completed tasks yet. Roll up some quests!'
    }
  }

  return (
    <div className="space-y-3">
      {/* Column Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${getColumnColor()}`}>
          {title}
        </h3>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
          {count}
        </span>
      </div>

      <Separator />

      {/* Task Cards */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {getEmptyMessage()}
          </p>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  )
}
