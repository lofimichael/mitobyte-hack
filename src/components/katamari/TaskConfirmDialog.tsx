import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Task } from '@/types/tasks'

interface TaskConfirmDialogProps {
  task: Task | null
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function TaskConfirmDialog({ task, open, onConfirm, onCancel }: TaskConfirmDialogProps) {
  if (!task) return null

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl border-6 border-amber-500/70 shadow-2xl shadow-amber-500/40 animate-in zoom-in-90 duration-500">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
            🔥 DID YOU COMPLETE THIS? 🔥
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2">
            <div className="rounded-2xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-4 border-4 border-amber-500/30 shadow-xl">
              <div className="text-2xl font-black text-foreground mb-2 text-center drop-shadow-lg">
                {task.title}
              </div>
              {task.description && (
                <div className="mt-2 text-base text-center text-muted-foreground font-semibold">
                  {task.description}
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-muted-foreground">Priority:</span>
                <div className="flex gap-1.5">
                  {Array.from({ length: task.priority }).map((_, i) => (
                    <div key={i} className="h-3 w-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center text-lg font-black text-foreground">
              💪 BE HONEST! ONLY MARK COMPLETE IF YOU ACTUALLY FINISHED IT! 💪
            </div>
            <div className="text-center text-base font-bold text-amber-600 animate-bounce">
              ⚡ NO CHEATING ⚡
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-4 sm:gap-4 mt-4">
          <AlertDialogCancel onClick={onCancel} className="text-lg px-8 py-4 hover:scale-110 transition-transform font-bold border-4">
            ❌ Not Yet
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="text-xl px-10 py-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl shadow-green-500/70 hover:shadow-green-500/90 hover:scale-110 transition-all animate-pulse font-black border-4 border-green-400"
          >
            ✅ YES, COMPLETED! 🎯
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
