import type { PetSnapshot } from '../domain/pet'

export type Clock = { now(): number }

export interface PetRepository {
  /** The callback runs against the latest validated snapshot inside one transaction.
   * It must be synchronous and free of I/O. Omit save to leave storage intact. */
  transact<T>(
    change: (current: PetSnapshot | undefined) => {
      value: T
      save?: PetSnapshot
    },
  ): Promise<T>
}

export class InvalidPetDataError extends Error {
  constructor() {
    super(
      'Der gespeicherte Spielstand ist nicht lesbar. Er wurde nicht verändert.',
    )
  }
}
