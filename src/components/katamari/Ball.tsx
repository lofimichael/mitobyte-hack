import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, type RapierRigidBody } from '@react-three/rapier'
import { useAtom } from 'jotai'
import { ballSizeAtom, sortByAtom } from '@/store/katamari'
import * as THREE from 'three'

interface BallProps {
  onPositionChange?: (position: THREE.Vector3) => void
  isPaused?: boolean
  cameraRotation?: number  // Camera rotation angle for relative controls
}

export function Ball({ onPositionChange, isPaused = false, cameraRotation = 0 }: BallProps) {
  const ballRef = useRef<RapierRigidBody>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [ballSize] = useAtom(ballSizeAtom)
  const [sortBy] = useAtom(sortByAtom)
  const previousPausedRef = useRef(isPaused)

  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
  })

  // Reposition ball when sorting is activated
  useEffect(() => {
    if (!ballRef.current) return
    if (sortBy === 'none') return

    // Move ball to viewing position (in front of the sorted line)
    ballRef.current.setTranslation({ x: 0, y: 3, z: 5 }, true)
    ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }, [sortBy])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Physics-based movement
  useFrame(() => {
    if (!ballRef.current) return

    const pos = ballRef.current.translation()

    // Boundary checking - DYNAMIC bounds that expand with ball size!
    const baseSize = 100
    const expansion = ballSize * 5
    const worldSize = baseSize + expansion
    const BOUNDS = worldSize / 2 - 2 // Stay slightly inside walls
    const MIN_Y = -5 // Fell off the world

    if (pos.y < MIN_Y || Math.abs(pos.x) > BOUNDS || Math.abs(pos.z) > BOUNDS) {
      // Teleport back to spawn point
      ballRef.current.setTranslation({ x: 0, y: 2, z: 0 }, true)
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // Zero velocity when pause state changes
    if (isPaused !== previousPausedRef.current) {
      ballRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      ballRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
      previousPausedRef.current = isPaused
    }

    // Don't apply movement if paused (dialog open)
    if (!isPaused) {
      // Build movement vector in camera-relative space
      let forwardBack = 0
      let leftRight = 0
      const force = 0.5 * ballSize // Force scales with size

      if (keys.current.w) forwardBack += force  // Forward (away from camera)
      if (keys.current.s) forwardBack -= force  // Back (toward camera)
      if (keys.current.a) leftRight -= force    // Left
      if (keys.current.d) leftRight += force    // Right

      // Transform to world space using camera rotation
      // Camera right: (cos(θ), 0, -sin(θ)), Camera forward: (-sin(θ), 0, -cos(θ))
      // World impulse = right * leftRight + forward * forwardBack
      const rotatedX = leftRight * Math.cos(cameraRotation) - forwardBack * Math.sin(cameraRotation)
      const rotatedZ = -leftRight * Math.sin(cameraRotation) - forwardBack * Math.cos(cameraRotation)

      const impulse = { x: rotatedX, y: 0, z: rotatedZ }

      if (keys.current.space) {
        impulse.y = 5 // Jump
        keys.current.space = false // Prevent continuous jumping
      }

      // Apply impulse for movement
      if (impulse.x !== 0 || impulse.y !== 0 || impulse.z !== 0) {
        ballRef.current.applyImpulse(impulse, true)
      }
    }

    // Emit position for camera follow
    if (onPositionChange) {
      onPositionChange(new THREE.Vector3(pos.x, pos.y, pos.z))
    }
  })

  return (
    <RigidBody
      ref={ballRef}
      mass={ballSize * 2}
      restitution={0.2}  // Less bouncy for smoother control
      friction={0.8}
      linearDamping={0.5}
      angularDamping={0.5}
      position={[0, 2, 0]}
    >
      {/* Manual ball collider that scales with ball size */}
      <BallCollider args={[ballSize * 0.5]} />

      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[ballSize * 0.5, 32, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </RigidBody>
  )
}
