import { useRef } from 'react'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Html } from '@react-three/drei'
import { OFFICE_OBJECTS, createObjectGeometry } from './geometries'
import type { Task } from '@/types/tasks'

interface TaskObjectProps {
  task: Task
  onCollision: (task: Task) => void
}

export function TaskObject({ task, onCollision }: TaskObjectProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const config = OFFICE_OBJECTS[task.objectType]
  const geometry = createObjectGeometry(task.objectType)

  // Handle collision with ball
  const handleCollision = () => {
    if (task.completed) return
    onCollision(task)
  }

  // Only render tasks that are "in-progress" (spawned in 3D world)
  // Don't render "todo" (not started) or "done" (completed) tasks
  if (task.status !== 'in-progress') {
    return null
  }

  return (
    <group>
      <RigidBody
        ref={rigidBodyRef}
        position={task.position}
        mass={config.mass}
        restitution={0.05}  // Minimal bounce - smooth rolling!
        friction={0.7}
        colliders="hull"
        onCollisionEnter={handleCollision}
      >
        {/* Task object mesh - scales linearly with strength */}
        <mesh castShadow geometry={geometry} scale={config.scale * task.strength}>
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={0.3}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>

        {/* Floating label above task */}
        <Html
          position={[0, 1.5, 0]}
          center
          distanceFactor={8}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: `2px solid ${config.color}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {task.title}
          </div>
        </Html>
      </RigidBody>
    </group>
  )
}
