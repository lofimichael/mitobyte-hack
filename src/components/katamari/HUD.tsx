import { useAtom } from 'jotai'
import { ballSizeAtom, statsAtom } from '@/store/katamari'
import { useTasks } from '@/hooks/useTasks'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarberProgress } from './BarberProgress'

export function HUD() {
  const [ballSize] = useAtom(ballSizeAtom)
  const [stats] = useAtom(statsAtom)
  const { tasks, incompleteTasks, completedTasks } = useTasks()

  const completionPercentage = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top HUD */}
      <div className="pointer-events-auto flex items-start justify-between gap-4 p-6">
        {/* Ball size indicator + XP + Controls */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Size Section */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Katamari Size
                </div>
                <div className="text-3xl font-bold">
                  {ballSize.toFixed(2)}x
                </div>
                <div className="text-xs text-muted-foreground">
                  High Score: {stats.highScore.toFixed(2)}x
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <span>⚡</span>
                  <span>{(stats.totalXP || 0).toLocaleString()} XP</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t" />

              {/* Controls Section */}
              <div className="text-sm">
                <div className="mb-2 font-medium">Controls</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>WASD - Move</div>
                  <div>Space - Jump</div>
                  <div>Mouse - Rotate camera</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task counter */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-muted-foreground">
                Tasks Progress
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg">
                  {completedTasks.length}/{tasks.length}
                </Badge>
              </div>
              <BarberProgress value={completionPercentage} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Victory message */}
      {tasks.length > 0 && incompleteTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Card className="shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="mb-4 text-4xl">🎉</div>
              <div className="mb-2 text-2xl font-bold">All Tasks Complete!</div>
              <div className="text-muted-foreground">
                Final Size: {ballSize.toFixed(2)}x
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stats.totalCompleted} tasks rolled up
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
