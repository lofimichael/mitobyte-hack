import { useTasks } from '@/hooks/useTasks'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DependencyPickerProps {
  selectedDependencies: string[]
  onDependenciesChange: (dependencies: string[]) => void
  excludeTaskId?: string  // Don't show this task (when editing)
}

export function DependencyPicker({
  selectedDependencies,
  onDependenciesChange,
  excludeTaskId
}: DependencyPickerProps) {
  const { tasks } = useTasks()

  // Only show tasks that aren't done and aren't the current task
  const availableTasks = tasks.filter(
    t => t.status !== 'done' && t.id !== excludeTaskId
  )

  const handleToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      onDependenciesChange([...selectedDependencies, taskId])
    } else {
      onDependenciesChange(selectedDependencies.filter(id => id !== taskId))
    }
  }

  if (availableTasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        No tasks available for dependencies
      </div>
    )
  }

  return (
    <ScrollArea className="h-[200px] rounded-md border p-4">
      <div className="space-y-3">
        {availableTasks.map(task => (
          <div key={task.id} className="flex items-start space-x-3">
            <Checkbox
              id={`dep-${task.id}`}
              checked={selectedDependencies.includes(task.id)}
              onCheckedChange={(checked) => handleToggle(task.id, checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`dep-${task.id}`}
                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {task.title}
              </Label>
              {task.description && (
                <p className="text-xs text-muted-foreground">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
