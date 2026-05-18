import { useState, useCallback } from 'react'

export interface AppSettings {
  calendarWeekStart: 0 | 1  // 0=Sun, 1=Mon
}

const STORAGE_KEY = 'app_settings'

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) }
  } catch {}
  return defaultSettings()
}

function defaultSettings(): AppSettings {
  return { calendarWeekStart: 1 }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, updateSettings }
}
