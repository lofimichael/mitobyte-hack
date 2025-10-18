import { Lock, ArrowRight, Trash2 } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import type { Task } from '@/types/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TaskCardProps {
  task: Task
  compact?: boolean  // New compact mode for horizontal bar
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const { updateTaskStatus, canMoveToInProgress, deleteTask, tasks } = useTasks()

  const handleMoveToInProgress = () => {
    const check = canMoveToInProgress(task.id)

    if (!check.can) {
      const blockedTaskNames = check.blockedBy
        .map(id => tasks.find(t => t.id === id)?.title)
        .filter(Boolean)
        .join(', ')

      toast.error('Task is blocked!', {
        description: `Complete these first: ${blockedTaskNames}`
      })
      return
    }

    updateTaskStatus(task.id, 'in-progress')
    toast.success('Task spawned in 3D world!', {
      description: 'Roll over it to complete the quest'
    })
  }

  const handleDelete = () => {
    deleteTask(task.id)
    toast.success('Task deleted')
  }

  const getPriorityColor = () => {
    if (task.priority <= 2) return 'bg-blue-500'
    if (task.priority === 3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const isBlocked = task.status === 'todo' && !canMoveToInProgress(task.id).can

  // COMPACT MODE (50% smaller for horizontal kanban bar)
  if (compact) {
    return (
      <Card className={`transition-all ${isBlocked ? 'opacity-60' : ''} min-w-[180px]`}>
        <CardContent className="p-2">
          <div className="flex items-center gap-1.5">
            {/* Priority dot */}
            <div
              className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${getPriorityColor()}`}
              title={`Priority: ${task.priority}/5`}
            />

            {/* Title (truncated) */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium leading-tight truncate" title={task.title}>
                {task.title}
              </h4>
            </div>

            {/* Strength badge */}
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0 font-bold">
              ⚡{task.strength}
            </Badge>

            {/* Tag badge (if exists) */}
            {task.section && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
                {task.section.slice(0, 8)}
              </Badge>
            )}

            {/* Action button */}
            {task.status === 'todo' && (
              <Button
                size="sm"
                onClick={handleMoveToInProgress}
                disabled={isBlocked}
                className="h-5 w-5 p-0 flex-shrink-0"
                title={isBlocked ? 'Blocked' : 'Start Quest'}
              >
                {isBlocked ? <Lock className="h-2.5 w-2.5" /> : <ArrowRight className="h-2.5 w-2.5" />}
              </Button>
            )}

            {task.status === 'in-progress' && (
              <span className="text-[10px]" title="In 3D World">🎮</span>
            )}

            {task.status === 'done' && (
              <span className="text-[10px]" title="Completed">✓</span>
            )}

            {/* Delete button (tiny) */}
            {task.status !== 'in-progress' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-5 w-5 p-0 flex-shrink-0"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // REGULAR MODE (unchanged)
  return (
    <Card className={`transition-all ${isBlocked ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium leading-none">{task.title}</h4>
              {task.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
            </div>

            {/* Priority indicator */}
            <div
              className={`h-2 w-2 rounded-full ${getPriorityColor()}`}
              title={`Priority: ${task.priority}/5`}
            />
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Priority {task.priority}
            </Badge>
            <Badge variant="outline" className="text-xs font-bold">
              ⚡ Strength {task.strength}
            </Badge>
            {task.section && (
              <Badge variant="secondary" className="text-xs">
                {task.section}
              </Badge>
            )}
          </div>

          {/* Dependency warning */}
          {isBlocked && (
            <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Blocked by dependencies</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {task.status === 'todo' && (
              <Button
                size="sm"
                onClick={handleMoveToInProgress}
                disabled={isBlocked}
                className="flex-1 gap-2"
              >
                {isBlocked ? (
                  <>
                    <Lock className="h-3 w-3" />
                    Locked
                  </>
                ) : (
                  <>
                    Start Quest
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </Button>
            )}

            {task.status === 'in-progress' && (
              <Badge variant="secondary" className="flex-1 justify-center gap-2">
                🎮 In 3D World - Roll to complete
              </Badge>
            )}

            {task.status === 'done' && (
              <Badge variant="default" className="flex-1 justify-center gap-2 bg-green-600">
                ✓ Completed
              </Badge>
            )}

            {/* Delete button (only for todo/done) */}
            {task.status !== 'in-progress' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
