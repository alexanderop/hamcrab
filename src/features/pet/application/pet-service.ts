import { liveWithPet } from '../domain/life-actions'
import type { LifeCommand } from '../domain/life'
import { chooseAdultVariant, type AdultVariant } from '../domain/lifecycle'
import {
  advancePet,
  careForPet,
  createPet,
  hatchPet,
  parsePetName,
  type CareAction,
} from '../domain/pet'
import type { Clock, PetRepository } from './ports'

export function createPetService(repository: PetRepository, clock: Clock) {
  return {
    life: (command: LifeCommand) =>
      repository.transact((current) => {
        const now = clock.now()
        const result = liveWithPet(current ?? createPet(now), command, now)
        return {
          value: result,
          save:
            result.accepted || current === undefined ? result.pet : undefined,
        }
      }),
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
    hatch: () =>
      repository.transact((current) => {
        const now = clock.now()
        const result = hatchPet(current ?? createPet(now), now)
        return { value: result, save: result.hatched ? result.pet : undefined }
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
    chooseVariant: (variant: AdultVariant) =>
      repository.transact((current) => {
        const now = clock.now()
        const pet = advancePet(current ?? createPet(now), now)
        const lifecycle = chooseAdultVariant(pet.lifecycle, variant)
        const chosen = lifecycle !== pet.lifecycle
        const updated = chosen ? { ...pet, lifecycle } : pet
        return {
          value: { pet: updated, chosen },
          save: chosen ? updated : undefined,
        }
      }),
    rename: (name: string) => {
      const parsed = parsePetName(name)
      if (!parsed.success) return Promise.resolve(null)
      return repository.transact((current) => {
        const now = clock.now()
        const renamed = {
          ...advancePet(current ?? createPet(now), now),
          name: parsed.data,
        }
        return { value: advancePet(renamed, now), save: renamed }
      })
    },
  }
}

export type PetService = ReturnType<typeof createPetService>
