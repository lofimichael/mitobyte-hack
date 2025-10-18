import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraRigProps {
  ballPosition: THREE.Vector3
  ballSize: number
  onRotationChange?: (angle: number) => void  // Callback to share rotation angle
}

export function CameraRig({ ballPosition, ballSize, onRotationChange }: CameraRigProps) {
  const { camera, gl } = useThree()
  const targetPosition = useRef(new THREE.Vector3())
  const currentPosition = useRef(new THREE.Vector3())

  // Camera rotation state (middle mouse drag)
  const [rotationAngle, setRotationAngle] = useState(0) // Yaw angle in radians
  const isDragging = useRef(false)
  const previousMouseX = useRef(0)

  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault()
        isDragging.current = true
        previousMouseX.current = e.clientX
        canvas.style.cursor = 'grabbing'
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMouseX.current
        previousMouseX.current = e.clientX

        // Rotate camera based on horizontal mouse movement
        setRotationAngle(prev => prev - deltaX * 0.005) // Adjust sensitivity
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isDragging.current = false
        canvas.style.cursor = 'default'
      }
    }

    // Prevent middle click scroll/paste
    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault()
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('auxclick', handleContextMenu)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('auxclick', handleContextMenu)
    }
  }, [gl])

  useFrame(() => {
    // Calculate desired camera position with orbital rotation
    const distance = 10 + ballSize * 2.5 // Scale distance with ball size
    const height = 5 + ballSize * 2 // Scale height with ball size

    // Calculate orbital position based on rotation angle
    const x = ballPosition.x + distance * Math.sin(rotationAngle)
    const z = ballPosition.z + distance * Math.cos(rotationAngle)
    const y = ballPosition.y + height

    targetPosition.current.set(x, y, z)

    // Smoothly interpolate to target position (lerp for smooth following)
    currentPosition.current.lerp(targetPosition.current, 0.15)  // Increased for less stutter
    camera.position.copy(currentPosition.current)

    // Always look at the ball
    camera.lookAt(ballPosition)

    // Share rotation angle with Ball for camera-relative controls
    if (onRotationChange) {
      onRotationChange(rotationAngle)
    }
  })

  return null
}
