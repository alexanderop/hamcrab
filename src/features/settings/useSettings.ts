import { onUnmounted, readonly, ref } from 'vue'
import { defaults, preferencesSchema, type Preferences } from './preferences'

const storageKey = 'hamcrab.settings.v1'

function readPreferences(): Preferences {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return { ...defaults }
  try {
    const result = preferencesSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

export function useSettings() {
  const preferences = ref<Preferences>({ ...defaults })
  const storageUnavailable = ref(false)

  function load() {
    try {
      preferences.value = readPreferences()
      storageUnavailable.value = false
    } catch {
      storageUnavailable.value = true
    }
  }

  function update(change: Partial<Preferences>) {
    try {
      const next = { ...readPreferences(), ...change }
      localStorage.setItem(storageKey, JSON.stringify(next))
      preferences.value = next
      storageUnavailable.value = false
    } catch {
      preferences.value = { ...preferences.value, ...change }
      storageUnavailable.value = true
    }
  }

  function sync(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) load()
  }
  load()
  window.addEventListener('storage', sync)
  onUnmounted(() => window.removeEventListener('storage', sync))

  return {
    preferences: readonly(preferences),
    storageUnavailable: readonly(storageUnavailable),
    update,
  }
}
