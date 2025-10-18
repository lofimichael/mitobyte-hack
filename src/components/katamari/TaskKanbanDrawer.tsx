import { useState, useMemo } from 'react'
import { CheckSquare, Plus, Trash2, ArrowUpDown, Filter } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanColumn } from './KanbanColumn'
import { CreateTaskDialog } from './CreateTaskDialog'
import type { Task } from '@/types/tasks'

interface TaskKanbanDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SortOption = 'none' | 'alpha' | 'priority' | 'tag'
type FilterOption = 'all' | 'priority-high' | 'priority-low'

export function TaskKanbanDrawer({ open, onOpenChange }: TaskKanbanDrawerProps) {
  const { todoTasks, inProgressTasks, doneTasks } = useTasks()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('none')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const handleClearStorage = () => {
    if (confirm('Clear all tasks and reset? This cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

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
    }

    return filtered
  }

  const sortedTodoTasks = useMemo(() => sortAndFilterTasks(todoTasks), [todoTasks, sortBy, filterBy])
  const sortedInProgressTasks = useMemo(() => sortAndFilterTasks(inProgressTasks), [inProgressTasks, sortBy, filterBy])
  const sortedDoneTasks = useMemo(() => sortAndFilterTasks(doneTasks), [doneTasks, sortBy, filterBy])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="fixed left-4 top-4 z-50 gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Tasks
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {todoTasks.length + inProgressTasks.length}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Task Board</SheetTitle>
          <SheetDescription>
            Manage your quests and roll them up in the Katamari world
          </SheetDescription>
        </SheetHeader>

        {/* Create Task Button */}
        <div className="py-4">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Task
          </Button>
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex gap-2 py-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="flex-1">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No sorting</SelectItem>
              <SelectItem value="alpha">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="priority">Priority (High-Low)</SelectItem>
              <SelectItem value="tag">By Tag</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="flex-1">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="priority-high">High priority (4-5)</SelectItem>
              <SelectItem value="priority-low">Low priority (1-2)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)] pr-4">
          <div className="space-y-6 py-4">
            {/* To Do Column */}
            <KanbanColumn
              title="To Do"
              status="todo"
              tasks={sortedTodoTasks}
              count={sortedTodoTasks.length}
            />

            {/* In Progress Column */}
            <KanbanColumn
              title="In Progress"
              status="in-progress"
              tasks={sortedInProgressTasks}
              count={sortedInProgressTasks.length}
            />

            {/* Done Column */}
            <KanbanColumn
              title="Done"
              status="done"
              tasks={sortedDoneTasks}
              count={sortedDoneTasks.length}
            />

            {/* Developer Tools Section */}
            <div className="pt-6">
              <Separator className="mb-4" />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Developer Tools
                </h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearStorage}
                  className="w-full gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All Data & Reload
                </Button>
                <p className="text-xs text-muted-foreground">
                  Resets all tasks, ball size, and stats. Useful for testing.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </SheetContent>
    </Sheet>
  )
}
