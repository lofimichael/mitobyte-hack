import { useState, useMemo } from 'react'
import { useAtom } from 'jotai'
import { ChevronDown, ChevronUp, Plus, ArrowUpDown, Filter } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { sortByAtom, type SortOption } from '@/store/katamari'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskCard } from './TaskCard'
import { CreateTaskDialog } from './CreateTaskDialog'
import type { Task } from '@/types/tasks'

type FilterOption = 'all' | 'priority-high' | 'priority-low'

export function HorizontalKanbanBar() {
  const { todoTasks, inProgressTasks, doneTasks } = useTasks()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useAtom(sortByAtom)  // Now global state!
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  // Sort and filter tasks
  const sortAndFilterTasks = (tasks: Task[]) => {
    let filtered = [...tasks]

    // Apply filter
    if (filterBy === 'priority-high') {
      filtered = filtered.filter(t => t.priority >= 4)
    } else if (filterBy === 'priority-low') {
      filtered = filtered.filter(t => t.priority <= 2)
    }

    // Apply sort
    if (sortBy === 'alpha') {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'priority') {
      filtered.sort((a, b) => b.priority - a.priority) // High to low
    } else if (sortBy === 'tag') {
      filtered.sort((a, b) => (a.section || '').localeCompare(b.section || ''))
    } else if (sortBy === 'strength') {
      filtered.sort((a, b) => a.strength - b.strength) // Low to high (easiest first)
    }

    return filtered
  }

  const sortedTodoTasks = useMemo(() => sortAndFilterTasks(todoTasks), [todoTasks, sortBy, filterBy])
  const sortedInProgressTasks = useMemo(() => sortAndFilterTasks(inProgressTasks), [inProgressTasks, sortBy, filterBy])
  const sortedDoneTasks = useMemo(() => sortAndFilterTasks(doneTasks), [doneTasks, sortBy, filterBy])

  const totalTasks = todoTasks.length + inProgressTasks.length + doneTasks.length

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="pointer-events-auto fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {/* Collapse/Expand Toggle */}
        <div className="flex items-center justify-between border-b px-4 py-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 gap-1 px-2"
            >
              {isCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="text-xs font-medium">
                Kanban Board ({totalTasks} tasks)
              </span>
            </Button>

            {!isCollapsed && (
              <>
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="h-6 gap-1 px-2"
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-xs">New Task</span>
                </Button>

                {/* Sort/Filter controls */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-6 w-[120px] text-xs">
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" />
                      <SelectValue placeholder="Sort" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sorting</SelectItem>
                    <SelectItem value="alpha">A-Z</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                  <SelectTrigger className="h-6 w-[120px] text-xs">
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tasks</SelectItem>
                    <SelectItem value="priority-high">High (4-5)</SelectItem>
                    <SelectItem value="priority-low">Low (1-2)</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Kanban columns (horizontal layout) */}
        {!isCollapsed && (
          <div className="grid grid-cols-3 gap-4 p-4" style={{ height: '160px' }}>
            {/* TO DO Column */}
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  To Do
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  {sortedTodoTasks.length}
                </span>
              </div>
              <ScrollArea className="flex-1 overflow-auto">
                <div className="space-y-1.5 pr-3">
                  {sortedTodoTasks.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No tasks yet
                    </p>
                  ) : (
                    sortedTodoTasks.map(task => (
                      <TaskCard key={task.id} task={task} compact />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* IN PROGRESS Column */}
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  In Progress
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  {sortedInProgressTasks.length}
                </span>
              </div>
              <ScrollArea className="flex-1 overflow-auto">
                <div className="space-y-1.5 pr-3">
                  {sortedInProgressTasks.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No active quests
                    </p>
                  ) : (
                    sortedInProgressTasks.map(task => (
                      <TaskCard key={task.id} task={task} compact />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* DONE Column */}
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                  Done
                </h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  {sortedDoneTasks.length}
                </span>
              </div>
              <ScrollArea className="flex-1 overflow-auto">
                <div className="space-y-1.5 pr-3">
                  {sortedDoneTasks.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No completed tasks
                    </p>
                  ) : (
                    sortedDoneTasks.map(task => (
                      <TaskCard key={task.id} task={task} compact />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
