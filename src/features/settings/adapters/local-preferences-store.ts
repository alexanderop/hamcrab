import { z } from 'zod'
import { defaults, colors, languages } from '../domain/preferences'
import type { PreferencesStore } from '../application/ports'

const preferencesSchema = z.object({
  language: z.enum(languages),
  caseColor: z.enum(colors),
  costumeColor: z.enum(colors),
})

export function createLocalPreferencesStore(
  host: Window,
  storageKey: string,
): PreferencesStore {
  return {
    read() {
      const raw = host.localStorage.getItem(storageKey)
      if (!raw) return { ...defaults }
      try {
        const result = preferencesSchema.safeParse(JSON.parse(raw))
        return result.success ? result.data : { ...defaults }
      } catch {
        return { ...defaults }
      }
    },
    write(preferences) {
      host.localStorage.setItem(
        storageKey,
        JSON.stringify(preferencesSchema.parse(preferences)),
      )
    },
    subscribe(listener) {
      const sync = (event: StorageEvent) => {
        if (
          event.storageArea === host.localStorage &&
          (event.key === storageKey || event.key === null)
        )
          listener()
      }
      host.addEventListener('storage', sync)
      return () => host.removeEventListener('storage', sync)
    },
  }
}
