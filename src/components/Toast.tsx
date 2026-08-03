import { useEffect } from 'react'

interface ToastProps {
  message: string
  onDone: () => void
  duration?: number
}

export function Toast({ message, onDone, duration = 2600 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [message, duration, onDone])

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
