import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { Priority } from '@/types/tasks'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const { createTask } = useTasks()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [strength, setStrength] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    // Auto-detect priority from tags (#urgent = 5, #quick = 1)
    let priority: Priority = 3 // default
    const lowerTags = tags.toLowerCase()
    if (lowerTags.includes('#urgent') || lowerTags.includes('#critical')) {
      priority = 5
    } else if (lowerTags.includes('#important')) {
      priority = 4
    } else if (lowerTags.includes('#quick') || lowerTags.includes('#easy')) {
      priority = 1
    } else if (lowerTags.includes('#small')) {
      priority = 2
    }

    createTask(
      title,
      priority,
      undefined, // no description
      [], // no dependencies
      tags || undefined, // tags as section
      strength // task strength
    )

    // Reset form
    setTitle('')
    setTags('')
    setStrength(5)
    onOpenChange(false)

    toast.success('Task created!', {
      description: 'Move it to "In Progress" to spawn in 3D world'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Quick add - just name your task!
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-6">
            <div className="grid gap-2">
              <Label htmlFor="title">What needs to be done? *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Fix auth bug..."
                autoFocus
                className="text-lg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="#frontend #urgent"
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                Use #urgent for high priority, #quick for low priority
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="strength" className="flex items-center gap-2">
                <span className="animate-pulse font-bold text-lg">⚡ STRENGTH</span>
                <span className="ml-auto text-3xl font-black text-primary animate-pulse">
                  {strength}
                </span>
              </Label>
              <Slider
                id="strength"
                min={1}
                max={10}
                step={1}
                value={[strength]}
                onValueChange={(value) => setStrength(value[0]!)}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 (tiny)</span>
                <span>5 (medium)</span>
                <span>10 (MASSIVE)</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} className="gap-2">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
