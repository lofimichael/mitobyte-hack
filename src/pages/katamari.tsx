import { useEffect } from 'react'
import { KatamariCanvas } from '@/components/katamari/KatamariCanvas'
import { HUD } from '@/components/katamari/HUD'
import { HorizontalKanbanBar } from '@/components/katamari/HorizontalKanbanBar'
import { seedDemoTasks } from '@/utils/seedTasks'

export default function KatamariPage() {
  // Auto-clear localStorage and seed fresh data on every load (for safety/testing)
  useEffect(() => {
    localStorage.clear()
    seedDemoTasks()
    // Note: No reload needed since we just seeded
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-sky-200 to-sky-50">
      {/* Three.js 3D Scene */}
      <KatamariCanvas />

      {/* UI Overlay */}
      <HUD />

      {/* Horizontal Bottom Kanban Bar (main UI) */}
      <HorizontalKanbanBar />
    </div>
  )
}
