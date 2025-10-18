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
    title: 'Respond to Slack from 3 weeks ago',
    description: 'They probably forgot anyway',
    priority: 1,
    strength: 1  // Tiny - instant pickup
  },
  {
    title: 'Update Jira tickets (lol)',
    description: 'Because management actually checks',
    priority: 1,
    strength: 1  // Tiny - instant pickup
  },
  {
    title: 'Pretend to listen in standup',
    description: 'Nod occasionally',
    priority: 1,
    strength: 2  // Small
  },

  // Priority 2 tasks - Low-medium strength (2-4)
  {
    title: 'Fix bug from 2019 no one wants to touch',
    description: 'The sacred legacy code',
    priority: 2,
    strength: 3
  },
  {
    title: 'Respond to email from last sprint',
    description: 'Better late than never',
    priority: 2,
    strength: 2
  },

  // Priority 3 tasks (medium) - Medium strength (4-6)
  {
    title: 'Understand the legacy codebase',
    description: 'CHALLENGE: IMPOSSIBLE',
    priority: 3,
    strength: 5  // Medium
  },
  {
    title: 'Refactor thing that already works',
    description: 'What could go wrong?',
    priority: 3,
    strength: 4
  },
  {
    title: 'Attend meeting that should be email',
    description: '30 minutes of your life',
    priority: 3,
    strength: 4
  },

  // Priority 4 tasks - High strength (6-8)
  {
    title: 'Debug production issue at 2am',
    description: 'Deploy on Friday vibes',
    priority: 4,
    strength: 7  // Large
  },
  {
    title: 'Explain to PM why estimate was off',
    description: 'Technical difficulties',
    priority: 4,
    strength: 6
  },

  // Priority 5 tasks (hardest) - Massive strength (8-10)
  {
    title: 'Rewrite entire codebase in Rust',
    description: 'Peak productivity',
    priority: 5,
    strength: 10  // MASSIVE - endgame challenge
  },
  {
    title: 'Touch grass',
    description: 'Warning: May cause burnout recovery',
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
