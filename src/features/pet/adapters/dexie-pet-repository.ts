import Dexie, { type Table } from 'dexie'
import type { PetRepository } from '../application/ports'
import { parseSavedPet } from './saved-pet-schema'

export function createDexiePetRepository(databaseName: string) {
  const database = new Dexie(databaseName)
  database.version(1).stores({ pets: '' })
  const pets: Table<unknown, string> = database.table('pets')
  const petKey = 'pinchy'

  const repository: PetRepository = {
    transact: (change) =>
      database.transaction('rw', pets, async () => {
        const raw = await pets.get(petKey)
        const current = raw === undefined ? undefined : parseSavedPet(raw)
        const result = change(current)
        if (result.save !== undefined)
          await pets.put(parseSavedPet(result.save), petKey)
        return result.value
      }),
  }

  return { repository, close: () => database.close() }
}
