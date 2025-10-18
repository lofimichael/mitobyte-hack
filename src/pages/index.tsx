import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Katamari game
    router.replace('/katamari')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">🎮</div>
        <p className="text-lg text-muted-foreground">Loading Katamari To-Do List...</p>
      </div>
    </div>
  )
}