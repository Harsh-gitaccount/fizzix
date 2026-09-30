type EventName =
  | 'Sim Start'
  | 'Preset Used'
  | 'Quiz Complete'
  | 'Quiz Answer'
  | 'Screenshot'
  | 'Share Link'
  | 'Tool Used'

interface EventProps {
  topic?: string
  preset?: string
  correct?: boolean
  score?: number
  tool?: string
  difficulty?: string
}

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean> }) => void
  }
}

export function trackEvent(name: EventName, props?: EventProps) {
  try {
    window.plausible?.(name, { props: props as Record<string, string | number | boolean> })
  } catch {
    // Analytics unavailable
  }
}
