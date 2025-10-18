interface BarberProgressProps {
  value: number // 0-100
}

export function BarberProgress({ value }: BarberProgressProps) {
  // Color changes based on progress
  const getColors = () => {
    if (value < 33) return { from: '#ef4444', to: '#dc2626' } // Red
    if (value < 66) return { from: '#f59e0b', to: '#d97706' } // Amber
    return { from: '#22c55e', to: '#16a34a' } // Green
  }

  const colors = getColors()
  const isComplete = value >= 100

  return (
    <div className="relative h-6 w-full overflow-hidden rounded-full border-2 border-gray-700 bg-gray-900">
      {/* Progress fill with barber pole animation */}
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(value, 100)}%`,
          background: `repeating-linear-gradient(
            45deg,
            ${colors.from},
            ${colors.from} 10px,
            ${colors.to} 10px,
            ${colors.to} 20px
          )`,
          backgroundSize: '40px 40px',
          animation: `barber-scroll ${isComplete ? '0.3s' : '1s'} linear infinite`,
        }}
      />

      {/* Glow effect when complete */}
      {isComplete && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
        {Math.round(value)}%
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes barber-scroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 40px 0;
          }
        }
      `}</style>
    </div>
  )
}
