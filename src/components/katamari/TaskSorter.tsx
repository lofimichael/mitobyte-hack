import { useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { tasksAtom, sortByAtom } from '@/store/katamari'

/**
 * Invisible component that watches for sort changes and physically rearranges
 * tasks in the 3D world into a sorted line formation
 */
export function TaskSorter() {
  const [tasks, setTasks] = useAtom(tasksAtom)
  const [sortBy] = useAtom(sortByAtom)
  const inProgressCountRef = useRef(0)

  useEffect(() => {
    // Get only in-progress tasks (the ones visible in 3D world)
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress')
    const currentCount = inProgressTasks.length

    // Only rearrange if:
    // 1. There's an active sort AND
    // 2. Either sortBy changed OR new tasks were added to in-progress
    const shouldRearrange = sortBy !== 'none' &&
      (currentCount > 0) &&
      (currentCount !== inProgressCountRef.current)

    inProgressCountRef.current = currentCount

    if (!shouldRearrange && sortBy === 'none') return
    if (currentCount === 0) return

    // Sort tasks based on option
    let sortedTasks = [...inProgressTasks]

    if (sortBy === 'alpha') {
      sortedTasks.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === 'priority') {
      sortedTasks.sort((a, b) => b.priority - a.priority) // High to low
    } else if (sortBy === 'tag') {
      sortedTasks.sort((a, b) => (a.section || '').localeCompare(b.section || ''))
    } else if (sortBy === 'strength') {
      sortedTasks.sort((a, b) => a.strength - b.strength) // Low to high (easiest first)
    }

    // Calculate line formation positions
    const SPACING = 4 // Units between tasks
    const START_X = -(sortedTasks.length * SPACING) / 2 // Center the line
    const Y = 2 // Desk height
    const Z = 10 // In front of ball's starting position

    // Update task positions to form a line
    const updatedTasks = tasks.map(task => {
      const sortedIndex = sortedTasks.findIndex(t => t.id === task.id)

      // Only update in-progress tasks
      if (sortedIndex === -1) return task

      // Calculate new position in the line
      const newX = START_X + (sortedIndex * SPACING)
      const newPosition: [number, number, number] = [newX, Y, Z]

      return {
        ...task,
        position: newPosition
      }
    })

    setTasks(updatedTasks)
  }, [sortBy]) // Only trigger on sort option change

  return null // This component has no visual output
}
