import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useAtom } from 'jotai'
import { tasksAtom, ballSizeAtom } from '@/store/katamari'
import { useTasks } from '@/hooks/useTasks'
import { Ball } from './Ball'
import { TaskObject } from './TaskObject'
import { OfficeRoom } from './OfficeRoom'
import { TaskConfirmDialog } from './TaskConfirmDialog'
import { CameraRig } from './CameraRig'
import { TaskSorter } from './TaskSorter'
import type { Task } from '@/types/tasks'
import * as THREE from 'three'
import { toast } from 'sonner'

export function KatamariCanvas() {
  const [tasks] = useAtom(tasksAtom)
  const [ballSize] = useAtom(ballSizeAtom)
  const { completeTask } = useTasks()
  const [ballPosition, setBallPosition] = useState(new THREE.Vector3(0, 2, 0))
  const [cameraRotation, setCameraRotation] = useState(0)  // Camera rotation for relative controls

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)

  // Grace period: prevent spawn camping by blocking collisions for first 2 seconds
  const [collisionEnabled, setCollisionEnabled] = useState(false)

  useEffect(() => {
    // Enable collisions after grace period
    const timer = setTimeout(() => {
      setCollisionEnabled(true)
    }, 2000) // 2 second grace period

    return () => clearTimeout(timer)
  }, [])

  // Handle task collision - check strength then pause and show dialog
  const handleTaskCollision = (task: Task) => {
    if (!collisionEnabled) return // Grace period active - ignore collisions
    if (dialogOpen) return // Prevent multiple dialogs

    // Check if ball is strong enough to pick up this task
    const ballStrength = Math.floor(ballSize)
    if (ballStrength < task.strength) {
      // TOO WEAK - show denial toast
      toast.error('TOO WEAK', {
        description: 'STACK SMALL WINS FIRST',
        duration: 2000,
        className: 'too-weak-toast'
      })
      return
    }

    // Strong enough - show normal confirmation dialog
    setCurrentTask(task)
    setDialogOpen(true)
  }

  // Handle task completion confirmation
  const handleConfirm = () => {
    if (currentTask) {
      completeTask(currentTask.id)
    }
    setDialogOpen(false)
    setCurrentTask(null)
  }

  // Handle task cancellation
  const handleCancel = () => {
    setDialogOpen(false)
    setCurrentTask(null)
  }

  return (
    <>
      {/* Task Sorter - watches for sort changes and rearranges tasks */}
      <TaskSorter />

      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 60 }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.3} />

        {/* Physics simulation */}
        <Physics gravity={[0, -9.81, 0]} debug={false}>
          <Ball
            onPositionChange={setBallPosition}
            isPaused={dialogOpen}
            cameraRotation={cameraRotation}
          />
          <OfficeRoom ballSize={ballSize} />

          {/* Render all task objects */}
          {tasks.map(task => (
            <TaskObject
              key={task.id}
              task={task}
              onCollision={handleTaskCollision}
            />
          ))}
        </Physics>

        {/* Camera rig - third-person follow camera */}
        <CameraRig
          ballPosition={ballPosition}
          ballSize={ballSize}
          onRotationChange={setCameraRotation}
        />
      </Canvas>

      {/* Confirmation dialog overlay */}
      <TaskConfirmDialog
        task={currentTask}
        open={dialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
