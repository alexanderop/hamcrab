import { onUnmounted, readonly, ref } from 'vue'
import type { SettingsService } from '../application/settings-service'
import type { Preferences } from '../domain/preferences'

export function useSettings(service: SettingsService) {
  const initial = service.load()
  const preferences = ref(initial.preferences)
  const storageUnavailable = ref(initial.storageUnavailable)

  function load() {
    const result = service.load()
    if (!result.storageUnavailable) preferences.value = result.preferences
    storageUnavailable.value = result.storageUnavailable
  }
  function update(change: Partial<Preferences>) {
    const result = service.update(preferences.value, change)
    preferences.value = result.preferences
    storageUnavailable.value = result.storageUnavailable
  }
  onUnmounted(service.subscribe(load))

  return {
    preferences: readonly(preferences),
    storageUnavailable: readonly(storageUnavailable),
    update,
  }
}
