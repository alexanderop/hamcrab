import type { Preferences } from '../domain/preferences'

export interface PreferencesStore {
  read(): Preferences
  write(preferences: Preferences): void
  subscribe(listener: () => void): () => void
}
