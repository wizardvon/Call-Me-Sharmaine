interface TimerRingProps {
  current: number
  total: number
}

export function TimerRing({ current, total }: TimerRingProps) {
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="timer-ring">
      <svg viewBox="0 0 160 160" className="timer-svg">
        <circle className="timer-ring__track" cx="80" cy="80" r={radius} />
        <circle
          className="timer-ring__progress"
          cx="80"
          cy="80"
          r={radius}
          style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="timer-ring__label">
        <span>{current}</span>
      </div>
    </div>
  )
}
