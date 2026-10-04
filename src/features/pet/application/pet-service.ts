import {
  advancePet,
  careForPet,
  createPet,
  parsePetName,
  type CareAction,
} from '../domain/pet'
import type { Clock, PetRepository } from './ports'

export function createPetService(repository: PetRepository, clock: Clock) {
  return {
    initial: () => createPet(clock.now()),
    load: () =>
      repository.transact((current) => {
        const now = clock.now()
        const pet = current ?? createPet(now)
        return {
          value: advancePet(pet, now),
          save: current === undefined ? pet : undefined,
        }
      }),
    care: (action: CareAction) =>
      repository.transact((current) => {
        const now = clock.now()
        const result = careForPet(current ?? createPet(now), action, now)
        return {
          value: result,
          save:
            result.accepted || current === undefined ? result.pet : undefined,
        }
      }),
    rename: (name: string) => {
      const parsed = parsePetName(name)
      if (!parsed.success) return Promise.resolve(null)
      return repository.transact((current) => {
        const now = clock.now()
        const renamed = { ...(current ?? createPet(now)), name: parsed.data }
        return { value: advancePet(renamed, now), save: renamed }
      })
    },
  }
}

export type PetService = ReturnType<typeof createPetService>
