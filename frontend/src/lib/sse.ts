import { useEffect, useState, useCallback } from 'react'
import type { RefundRequest } from './api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function useSSE() {
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [connected, setConnected] = useState(false)

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'init') {
        setRequests(data.requests)
      } else if (data.type === 'new_request') {
        setRequests(prev => {
          const exists = prev.some(r => r.id === data.request.id)
          if (exists) return prev
          return [data.request, ...prev]
        })
      } else if (data.type === 'update_request') {
        setRequests(prev =>
          prev.map(r => (r.id === data.request.id ? { ...r, ...data.request } : r))
        )
      }
    } catch {
      // ignore malformed events
    }
  }, [])

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE.replace('/api', '')}/events`)

    eventSource.onopen = () => setConnected(true)
    eventSource.onmessage = handleEvent
    eventSource.onerror = () => setConnected(false)

    return () => {
      eventSource.close()
      setConnected(false)
    }
  }, [handleEvent])

  return { requests, connected }
}
