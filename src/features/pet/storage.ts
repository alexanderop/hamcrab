import Dexie, { type Table } from 'dexie'
import {
  careForPet,
  createPet,
  petNameSchema,
  petSnapshotSchema,
  type CareAction,
  type PetSnapshot,
} from './domain'

export class InvalidPetDataError extends Error {
  constructor() {
    super(
      'Der gespeicherte Spielstand ist nicht lesbar. Er wurde nicht verändert.',
    )
  }
}

const database = new Dexie('pinchy')
database.version(1).stores({ pets: '' })
const pets: Table<unknown, string> = database.table('pets')
const petKey = 'pinchy'

function parsePet(value: unknown): PetSnapshot {
  const result = petSnapshotSchema.safeParse(value)
  if (!result.success) throw new InvalidPetDataError()
  return result.data
}

export async function loadPet(): Promise<PetSnapshot> {
  return database.transaction('rw', pets, async () => {
    const existing = await pets.get(petKey)
    if (existing !== undefined) return parsePet(existing)
    const pet = createPet(Date.now())
    await pets.put(pet, petKey)
    return pet
  })
}

export async function saveCare(action: CareAction) {
  return database.transaction('rw', pets, async () => {
    const existing = await pets.get(petKey)
    const snapshot =
      existing === undefined ? createPet(Date.now()) : parsePet(existing)
    const result = careForPet(snapshot, action, Date.now())
    if (result.accepted || existing === undefined)
      await pets.put(result.pet, petKey)
    return result
  })
}

export async function savePetName(name: string): Promise<PetSnapshot> {
  const validName = petNameSchema.parse(name)
  return database.transaction('rw', pets, async () => {
    const existing = await pets.get(petKey)
    const snapshot =
      existing === undefined ? createPet(Date.now()) : parsePet(existing)
    const renamed = { ...snapshot, name: validName }
    await pets.put(renamed, petKey)
    return renamed
  })
}
