import * as THREE from 'three'
import type { ObjectType, ObjectConfig } from '@/types/tasks'

export const OFFICE_OBJECTS: Record<ObjectType, ObjectConfig> = {
  paperclip: {
    name: 'paperclip',
    color: '#3b82f6', // Blue
    mass: 0.3,
    minSize: 1.0,
    scale: 0.6  // 4x bigger - now visible!
  },
  pen: {
    name: 'pen',
    color: '#8b5cf6', // Purple
    mass: 0.4,
    minSize: 1.1,
    scale: 0.8  // 4x bigger
  },
  mouse: {
    name: 'mouse',
    color: '#6366f1', // Indigo
    mass: 0.8,
    minSize: 1.3,
    scale: 1.0  // 4x bigger
  },
  stapler: {
    name: 'stapler',
    color: '#ef4444', // Red
    mass: 1.5,
    minSize: 1.6,
    scale: 1.2  // 4x bigger
  },
  mug: {
    name: 'mug',
    color: '#f59e0b', // Amber
    mass: 1.2,
    minSize: 1.8,
    scale: 1.1  // ~4x bigger
  },
  notebook: {
    name: 'notebook',
    color: '#10b981', // Emerald
    mass: 2.0,
    minSize: 2.2,
    scale: 1.4  // 4x bigger
  },
  keyboard: {
    name: 'keyboard',
    color: '#06b6d4', // Cyan
    mass: 3.5,
    minSize: 2.8,
    scale: 2.0  // 4x bigger
  },
  monitor: {
    name: 'monitor',
    color: '#ec4899', // Pink
    mass: 5.0,
    minSize: 3.5,
    scale: 2.5  // ~4x bigger - MASSIVE monitor!
  }
}

// Create procedural geometries for office objects
export function createObjectGeometry(type: ObjectType): THREE.BufferGeometry {
  switch (type) {
    case 'paperclip':
      // Torus for paperclip shape
      return new THREE.TorusGeometry(0.5, 0.1, 16, 32)

    case 'pen':
      // Thin cylinder for pen
      return new THREE.CylinderGeometry(0.05, 0.05, 1, 8)

    case 'mouse':
      // Rounded box for mouse
      return new THREE.BoxGeometry(0.6, 0.3, 1, 2, 2, 2)

    case 'stapler':
      // Box for stapler
      return new THREE.BoxGeometry(1, 0.4, 0.6)

    case 'mug':
      // Cylinder for coffee mug
      return new THREE.CylinderGeometry(0.4, 0.3, 0.8, 16)

    case 'notebook':
      // Flat box for notebook
      return new THREE.BoxGeometry(0.8, 0.1, 1)

    case 'keyboard':
      // Wide flat box for keyboard
      return new THREE.BoxGeometry(1.5, 0.2, 0.6)

    case 'monitor':
      // Tall box for monitor
      return new THREE.BoxGeometry(1.2, 1, 0.1)

    default:
      return new THREE.BoxGeometry(0.5, 0.5, 0.5)
  }
}

// Get bounding sphere radius for collision detection
export function getObjectRadius(type: ObjectType): number {
  const config = OFFICE_OBJECTS[type]
  const geometry = createObjectGeometry(type)
  geometry.computeBoundingSphere()
  const baseRadius = geometry.boundingSphere?.radius ?? 0.5
  return baseRadius * config.scale
}
