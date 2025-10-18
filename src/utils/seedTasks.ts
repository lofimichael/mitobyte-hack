import type { Task, ObjectType, Priority } from '@/types/tasks'

interface DemoTaskTemplate {
  title: string
  description: string
  priority: Priority
  strength: number  // Task difficulty/size (1-10)
}

const DEMO_TASKS: DemoTaskTemplate[] = [
  // Priority 1 tasks (easiest to pick up) - Low strength (1-2)
  {
    title: '💧 HYDRATION CHECK',
    description: 'ACQUIRE WATER. STAY HYDRATED. WE WINNING.',
    priority: 1,
    strength: 1  // Tiny - instant pickup
  },
  {
    title: '🔥 INBOX ZERO SPEEDRUN',
    description: 'Clear 3 emails. PRODUCTIVITY UNLOCKED.',
    priority: 1,
    strength: 1  // Tiny - instant pickup
  },
  {
    title: '📱 NOTIFICATIONS = DELETED',
    description: 'Clear your phone. FOCUS MODE ACTIVATED.',
    priority: 1,
    strength: 2  // Small
  },

  // Priority 2 tasks - Low-medium strength (2-4)
  {
    title: '💪 25 PUSHUPS NO EXCUSES',
    description: 'Drop and give me 25. BUILD DIFFERENT.',
    priority: 2,
    strength: 3
  },
  {
    title: '☕ COFFEE ACQUIRED',
    description: 'Fuel up. Caffeine = unlimited power.',
    priority: 2,
    strength: 2
  },

  // Priority 3 tasks (medium) - Medium strength (4-6)
  {
    title: '🎯 DEEP WORK: 45 MIN SESSION',
    description: 'Phone away. No distractions. LOCK IN.',
    priority: 3,
    strength: 5  // Medium
  },
  {
    title: '📚 LEARN NEW TECH STACK',
    description: 'Level up your skills. STAY AHEAD.',
    priority: 3,
    strength: 4
  },
  {
    title: '🧠 MORNING ROUTINE DOMINATION',
    description: 'Wake up. Win the day before 9am.',
    priority: 3,
    strength: 4
  },

  // Priority 4 tasks - High strength (6-8)
  {
    title: '🏋️ GYM SESSION COMPLETED',
    description: 'Hit the weights. DISCIPLINE = FREEDOM.',
    priority: 4,
    strength: 7  // Large
  },
  {
    title: '🚀 SHIP THAT FEATURE',
    description: 'Deploy to production. MAKE IT LIVE.',
    priority: 4,
    strength: 6
  },

  // Priority 5 tasks (hardest) - Massive strength (8-10)
  {
    title: '👑 CRUSH ENTIRE TODO LIST',
    description: 'Clear every single task. UNSTOPPABLE.',
    priority: 5,
    strength: 10  // MASSIVE - endgame challenge
  },
  {
    title: '⚡ 10X YOUR OUTPUT',
    description: 'Peak performance. LEGENDARY STATUS.',
    priority: 5,
    strength: 9  // Huge
  }
]

const OBJECT_TYPES: ObjectType[] = [
  'paperclip',
  'pen',
  'mouse',
  'stapler',
  'mug',
  'notebook',
  'keyboard',
  'monitor'
]

function getRandomObjectType(): ObjectType {
  return OBJECT_TYPES[Math.floor(Math.random() * OBJECT_TYPES.length)]!
}

function getRandomSpawnPoint(): [number, number, number] {
  // Spawn in a MASSIVE 50x50 area on the desk surface, but not too close to origin (safe zone)
  const SPAWN_AREA_SIZE = 50 // Huge rolling area for epic scale
  const SAFE_ZONE_RADIUS = 8 // Don't spawn within 8 units of ball spawn point [0, 0, 0]
  let x: number, z: number

  // Keep generating random points until we find one outside the safe zone
  do {
    x = (Math.random() - 0.5) * SPAWN_AREA_SIZE
    z = (Math.random() - 0.5) * SPAWN_AREA_SIZE
  } while (Math.sqrt(x * x + z * z) < SAFE_ZONE_RADIUS)

  const y = 2 // Above the desk surface
  return [x, y, z]
}

export function generateDemoTasks(): Task[] {
  return DEMO_TASKS.map((template, index) => ({
    id: crypto.randomUUID(),
    title: template.title,
    description: template.description,
    priority: template.priority,
    completed: false,
    objectType: getRandomObjectType(),
    position: getRandomSpawnPoint(),
    createdAt: Date.now(),
    // New kanban fields
    status: 'in-progress' as const,  // All tasks spawn in 3D world immediately - LET'S GOOOO!
    dependsOn: [],  // No dependencies for demo tasks (keep it simple)
    section: template.priority <= 2 ? 'Quick Wins' : template.priority === 3 ? 'Major Work' : 'Big Projects',
    strength: template.strength  // Task difficulty/size (1-10)
  }))
}

export function seedDemoTasks(): void {
  const tasks = generateDemoTasks()
  localStorage.setItem('katamari-tasks', JSON.stringify(tasks))
  localStorage.setItem('katamari-ball-size', '1.0')
  localStorage.setItem('katamari-stats', JSON.stringify({
    totalCompleted: 0,
    highScore: 0,
    startTime: Date.now(),
    sessionsPlayed: 0,
    totalXP: 0
  }))
}
