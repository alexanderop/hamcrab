import type { PetSnapshot } from '../../src/features/pet/domain/pet'
import type { PetRepository } from '../../src/features/pet/application/ports'

/** Deterministic service-test dependency; production transaction proof lives in Browser Mode. */
export function memoryPetRepository(initial?: PetSnapshot): PetRepository {
  let stored = initial
  return {
    async transact(change) {
      const result = change(
        stored === undefined ? undefined : structuredClone(stored),
      )
      if (result.save !== undefined) stored = structuredClone(result.save)
      return result.value
    },
  }
}
