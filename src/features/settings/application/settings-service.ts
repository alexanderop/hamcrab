import { defaults, type Preferences } from '../domain/preferences'
import type { PreferencesStore } from './ports'

export function createSettingsService(store: PreferencesStore) {
  return {
    load() {
      try {
        return { preferences: store.read(), storageUnavailable: false }
      } catch {
        return { preferences: { ...defaults }, storageUnavailable: true }
      }
    },
    update(current: Preferences, change: Partial<Preferences>) {
      try {
        const preferences = { ...store.read(), ...change }
        store.write(preferences)
        return { preferences, storageUnavailable: false }
      } catch {
        return {
          preferences: { ...current, ...change },
          storageUnavailable: true,
        }
      }
    },
    subscribe: (listener: () => void) => store.subscribe(listener),
  }
}
export type SettingsService = ReturnType<typeof createSettingsService>
