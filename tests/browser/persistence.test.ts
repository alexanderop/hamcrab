import { afterEach, expect, it } from 'vitest'
import Dexie from 'dexie'
import { createDexiePetRepository } from '../../src/features/pet/adapters/dexie-pet-repository'
import { createPetService } from '../../src/features/pet/application/pet-service'
import { InvalidPetDataError } from '../../src/features/pet/application/ports'
import { createPet } from '../../src/features/pet/domain/pet'
import { createLocalPreferencesStore } from '../../src/features/settings/adapters/local-preferences-store'
import { defaults } from '../../src/features/settings/domain/preferences'

const now = 1_800_000_000_000
const cleanup: (() => void | Promise<unknown>)[] = []
afterEach(async () => {
  for (const dispose of cleanup.reverse()) await dispose()
  cleanup.length = 0
})
function database() {
  const name = `hamcrab-test-${crypto.randomUUID()}`
  const first = createDexiePetRepository(name)
  const second = createDexiePetRepository(name)
  const raw = new Dexie(name)
  raw.version(1).stores({ pets: '' })
  cleanup.push(async () => {
    first.close()
    second.close()
    raw.close()
    await Dexie.delete(name)
  })
  return {
    first: createPetService(first.repository, { now: () => now }),
    second: createPetService(second.repository, { now: () => now }),
    raw,
    repository: first.repository,
  }
}

it('serializes care and rename across independent IndexedDB connections', async () => {
  const { first, second } = database()
  await Promise.all([
    first.care({ type: 'feed', food: 'doener' }),
    second.care({ type: 'play' }),
    first.rename('Milo'),
  ])
  expect(await second.load()).toMatchObject({
    name: 'Milo',
    fullness: 95,
    happiness: 98,
    energy: 62,
    careCount: 2,
  })
})
it('reads legacy version-1 saves and round-trips a renamed sleeping companion', async () => {
  const { first, second, raw } = database()
  await raw.table('pets').put({ ...createPet(now), sleeping: true }, 'pinchy')
  await first.rename('Schlummer')
  expect(await second.load()).toEqual({
    ...createPet(now),
    name: 'Schlummer',
    sleeping: true,
  })
})
it.each([
  { broken: true },
  { ...createPet(now), fullness: 101 },
  { ...createPet(now), updatedAt: now - 1 },
  { ...createPet(now), version: 2 },
  { ...createPet(now), name: ' ' },
])('preserves invalid data on load, care and rename: %j', async (corrupt) => {
  const { first, raw } = database()
  await raw.table('pets').put(corrupt, 'pinchy')
  await expect(first.load()).rejects.toBeInstanceOf(InvalidPetDataError)
  await expect(first.care({ type: 'play' })).rejects.toBeInstanceOf(
    InvalidPetDataError,
  )
  await expect(first.rename('Nemo')).rejects.toBeInstanceOf(InvalidPetDataError)
  expect(await raw.table('pets').get('pinchy')).toEqual(corrupt)
})
it('does not commit a failed transaction or rejected care', async () => {
  const { first, repository, raw } = database()
  await first.care({ type: 'sleep' })
  const stored = await raw.table('pets').get('pinchy')
  await expect(
    repository.transact(() => {
      throw new Error('aborted')
    }),
  ).rejects.toThrow('aborted')
  await expect(
    repository.transact(() => ({
      value: null,
      save: { ...createPet(now), energy: -1 },
    })),
  ).rejects.toBeInstanceOf(InvalidPetDataError)
  expect((await first.care({ type: 'feed', food: 'doener' })).accepted).toBe(
    false,
  )
  expect(await raw.table('pets').get('pinchy')).toEqual(stored)
})
it('round-trips real localStorage and falls back safely for invalid preferences', () => {
  const key = `settings-${crypto.randomUUID()}`
  cleanup.push(() => localStorage.removeItem(key))
  const store = createLocalPreferencesStore(window, key)
  expect(store.read()).toEqual(defaults)
  store.write({ ...defaults, language: 'de', caseColor: 'ocean' })
  expect(createLocalPreferencesStore(window, key).read()).toEqual({
    ...defaults,
    language: 'de',
    caseColor: 'ocean',
  })
  for (const raw of ['{', '{"language":"xx"}', 'null']) {
    localStorage.setItem(key, raw)
    expect(store.read()).toEqual(defaults)
    expect(localStorage.getItem(key)).toBe(raw)
  }
})
