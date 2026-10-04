import { createPetService } from '../features/pet'
import { createSettingsService } from '../features/settings'
import { createDexiePetRepository } from '../features/pet/adapters/dexie-pet-repository'
import { createLocalPreferencesStore } from '../features/settings/adapters/local-preferences-store'
import type { Services } from './services'

export function createServices() {
  const persistence = createDexiePetRepository('pinchy')
  const services: Services = {
    pet: createPetService(persistence.repository, { now: () => Date.now() }),
    settings: createSettingsService(
      createLocalPreferencesStore(window, 'hamcrab.settings.v1'),
    ),
  }
  return { services, dispose: persistence.close }
}
