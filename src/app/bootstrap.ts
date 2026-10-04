import { createPetService } from '../features/pet'
import { createSettingsService } from '../features/settings'
import { createDexiePetRepository } from '../features/pet/adapters/dexie-pet-repository'
import { createLocalPreferencesStore } from '../features/settings/adapters/local-preferences-store'
import { createBrowserPwa } from '../features/pwa/adapters/browser-pwa'
import type { Services } from './services'

export function createServices() {
  const persistence = createDexiePetRepository('pinchy')
  const pwa = createBrowserPwa()
  const services: Services = {
    pwa: pwa.service,
    pet: createPetService(persistence.repository, { now: () => Date.now() }),
    settings: createSettingsService(
      createLocalPreferencesStore(window, 'hamcrab.settings.v1'),
    ),
  }
  return {
    services,
    dispose() {
      persistence.close()
      pwa.dispose()
    },
  }
}
