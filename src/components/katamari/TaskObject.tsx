import { useRef } from 'react'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Html } from '@react-three/drei'
import { OFFICE_OBJECTS, createObjectGeometry } from './geometries'
import type { Task } from '@/types/tasks'

// Get color based on task strength (1-10)
function getStrengthColor(strength: number): string {
  // Normalize strength to 0-1 range
  const t = (strength - 1) / 9

  // Color stops: green (easy) -> yellow -> orange -> red -> purple (hard)
  if (t < 0.25) {
    // Strength 1-3: Green to light green
    const localT = t / 0.25
    return interpolateColor('#22c55e', '#84cc16', localT)
  } else if (t < 0.5) {
    // Strength 4-5: Light green to yellow
    const localT = (t - 0.25) / 0.25
    return interpolateColor('#84cc16', '#eab308', localT)
  } else if (t < 0.75) {
    // Strength 6-7: Yellow to orange
    const localT = (t - 0.5) / 0.25
    return interpolateColor('#eab308', '#f97316', localT)
  } else {
    // Strength 8-10: Orange to red to purple
    const localT = (t - 0.75) / 0.25
    if (localT < 0.5) {
      return interpolateColor('#f97316', '#ef4444', localT * 2)
    } else {
      return interpolateColor('#ef4444', '#a855f7', (localT - 0.5) * 2)
    }
  }
}

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)

  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

interface TaskObjectProps {
  task: Task
  onCollision: (task: Task) => void
}

export function TaskObject({ task, onCollision }: TaskObjectProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const config = OFFICE_OBJECTS[task.objectType]
  const geometry = createObjectGeometry(task.objectType)
  const strengthColor = getStrengthColor(task.strength)

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
        {/* Task object mesh - scales with strength (0.8x to 2x) */}
        <mesh castShadow geometry={geometry} scale={config.scale * (0.6667 + task.strength * 0.1333)}>
          <meshStandardMaterial
            color={strengthColor}
            emissive={strengthColor}
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
              border: `2px solid ${strengthColor}`,
              boxShadow: `0 4px 12px ${strengthColor}40`,
            }}
          >
            {task.title}
          </div>
        </Html>
      </RigidBody>
    </group>
  )
}
