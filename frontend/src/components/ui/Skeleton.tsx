// Animated waveform indicator shown while processing audio
export function Waveform({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights = {
    sm: [8, 12, 16, 20, 16, 12, 8],
    md: [12, 18, 24, 32, 24, 18, 12],
    lg: [16, 24, 36, 48, 36, 24, 16],
  }
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {heights[size].map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{ height: h, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

// Skeleton loaders
export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 rounded ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton h-5 w-32 rounded mb-3" />
      <div className="skeleton h-8 w-20 rounded mb-2" />
      <div className="skeleton h-4 w-48 rounded" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[rgba(190,160,255,0.06)]">
      <div className="skeleton h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  )
}
