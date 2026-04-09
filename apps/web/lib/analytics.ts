type EventName = 'quiz_answer' | 'quiz_complete' | 'cta_click' | 'email_submit' | 'whatsapp_click'

interface AnalyticsEvent {
  name: EventName
  properties: Record<string, unknown>
  timestamp: number
}

const eventBuffer: AnalyticsEvent[] = []
let posthogReady = false

declare global {
  interface Window {
    posthog?: { capture: (name: string, props: Record<string, unknown>) => void }
    va?: { track: (name: string, props: Record<string, unknown>) => void }
  }
}

export function track(name: EventName, properties: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const event = { name, properties, timestamp: Date.now() }
  if (posthogReady && window.posthog) {
    window.posthog.capture(name, properties)
  } else {
    eventBuffer.push(event)
    window.va?.track(name, properties)
  }
}

export function flushBuffer() {
  posthogReady = true
  eventBuffer.forEach(({ name, properties }) => {
    window.posthog?.capture(name, properties)
  })
  eventBuffer.length = 0
}
