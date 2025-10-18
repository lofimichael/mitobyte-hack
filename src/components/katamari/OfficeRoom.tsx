import { RigidBody } from '@react-three/rapier'

interface OfficeRoomProps {
  ballSize: number
}

export function OfficeRoom({ ballSize }: OfficeRoomProps) {
  // Dynamic world expansion - grows with ball size!
  const baseSize = 100
  const expansion = ballSize * 5  // Expand 5 units per ball size
  const worldSize = baseSize + expansion
  const boundaryPosition = worldSize / 2

  return (
    <>
      {/* Single flat surface - DYNAMICALLY EXPANDS with ball! SHINY METALLIC! */}
      <RigidBody type="fixed" friction={0.8} restitution={0.1}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[worldSize, 0.1, worldSize]} />
          <meshStandardMaterial
            color="#94a3b8"  // Lighter slate - chrome-like!
            metalness={0.9}  // Super metallic
            roughness={0.2}  // Very shiny!
            envMapIntensity={1.5}  // Enhanced reflections
          />
        </mesh>
      </RigidBody>

      {/* Desk legs (4 corners) - visual only, no collision */}
      {[
        [-28, -0.5, -28],
        [28, -0.5, -28],
        [-28, -0.5, 28],
        [28, -0.5, 28]
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.4, 0.4, 1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}

      {/* Invisible walls - DYNAMICALLY EXPAND with ball size! */}
      <RigidBody type="fixed">
        {/* North wall */}
        <mesh position={[0, 2, -boundaryPosition]}>
          <boxGeometry args={[worldSize, 4, 0.5]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        {/* South wall */}
        <mesh position={[0, 2, boundaryPosition]}>
          <boxGeometry args={[worldSize, 4, 0.5]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        {/* West wall */}
        <mesh position={[-boundaryPosition, 2, 0]}>
          <boxGeometry args={[0.5, 4, worldSize]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed">
        {/* East wall */}
        <mesh position={[boundaryPosition, 2, 0]}>
          <boxGeometry args={[0.5, 4, worldSize]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>

      {/* Grid helper - DYNAMICALLY SCALES with world size! */}
      <gridHelper args={[worldSize, Math.floor(worldSize / 2), '#666666', '#888888']} position={[0, 0.01, 0]} />
    </>
  )
}
