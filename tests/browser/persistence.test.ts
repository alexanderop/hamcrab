import { pendingAdult } from '../../src/features/pet/domain/lifecycle'
import { afterEach, expect, it } from 'vitest'
import Dexie from 'dexie'
import { createDexiePetRepository } from '../../src/features/pet/adapters/dexie-pet-repository'
import { createPetService } from '../../src/features/pet/application/pet-service'
import { InvalidPetDataError } from '../../src/features/pet/application/ports'
import { createPet as createEgg } from '../../src/features/pet/domain/pet'
import { createLocalPreferencesStore } from '../../src/features/settings/adapters/local-preferences-store'
import { defaults } from '../../src/features/settings/domain/preferences'

const createPet = (time: number) => ({
  ...createEgg(time),
  lifecycle: pendingAdult(),
})
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
  await first.hatch()
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
  const legacy = {
    version: 1,
    name: 'Pinchy',
    fullness: 65,
    happiness: 78,
    energy: 72,
    sleeping: true,
    careCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  await raw.table('pets').put(legacy, 'pinchy')
  expect(await first.load()).toEqual({ ...createPet(now), sleeping: true })
  expect(await raw.table('pets').get('pinchy')).toEqual(legacy)
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
  { ...createPet(now), friendship: null },
  {
    ...createPet(now),
    friendship: { ...createPet(now).friendship, points: 101 },
  },
  {
    ...createPet(now),
    friendship: {
      ...createPet(now).friendship,
      daily: { ...createPet(now).friendship.daily, feed: 3 },
    },
  },
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
  await first.hatch()
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

it('persists legacy progress on care and reloads it through another connection', async () => {
  const { first, second, raw } = database()
  const legacy = {
    version: 1,
    name: 'Milo',
    fullness: 65,
    happiness: 78,
    energy: 72,
    sleeping: false,
    careCount: 9,
    createdAt: now,
    updatedAt: now,
  }
  await raw.table('pets').put(legacy, 'pinchy')
  expect((await first.load()).friendship.points).toBe(26)
  expect(await raw.table('pets').get('pinchy')).toEqual(legacy)
  await first.care({ type: 'pet' })
  expect((await second.load()).friendship.points).toBe(30)
  expect(await raw.table('pets').get('pinchy')).toMatchObject({
    version: 1,
    name: 'Milo',
    careCount: 10,
    friendship: { points: 30 },
  })
})

it('awards one wish bonus when two homes play concurrently', async () => {
  const { first, second, raw } = database()
  await raw.table('pets').put({ ...createPet(now), happiness: 100 }, 'pinchy')
  const results = await Promise.all([
    first.care({ type: 'play' }),
    second.care({ type: 'play' }),
  ])
  expect(results.every((result) => result.accepted)).toBe(true)
  expect((await first.load()).friendship).toMatchObject({
    points: 6,
    daily: { play: 0, wishCompleted: true },
  })
  expect((await second.load()).careCount).toBe(2)
})

it('migrates a friendship-bearing legacy row to adult without rewriting it', async () => {
  const { first, raw } = database()
  const { lifecycle: _, ...legacy } = createPet(now)
  await raw.table('pets').put(legacy, 'pinchy')
  expect(await first.load()).toEqual({
    ...legacy,
    lifecycle: pendingAdult(),
  })
  expect(await raw.table('pets').get('pinchy')).toEqual(legacy)
})
it('serializes hatch and same-day growth across browser connections', async () => {
  const { first, second } = database()
  const results = await Promise.all([first.hatch(), second.hatch()])
  expect(results.filter((result) => result.hatched)).toHaveLength(1)
  expect((await first.load()).careCount).toBe(0)
  await Promise.all([first.care({ type: 'pet' }), second.care({ type: 'pet' })])
  expect((await second.load()).lifecycle).toEqual({
    stage: 'baby',
    days: [
      {
        day: Math.floor(now / 86_400_000),
        foods: [],
        played: false,
        cuddled: true,
      },
    ],
  })
})
it.each([
  null,
  { stage: 'unknown' },
  { stage: 'egg', careDays: [] },
  { stage: 'baby', careDays: [20833, 20833] },
  { stage: 'baby', careDays: [20834] },
  {
    stage: 'baby',
    careDays: Array.from({ length: 10 }, (_, index) => 20824 + index),
  },
])('does not overwrite a present invalid lifecycle %j', async (lifecycle) => {
  const { first, raw } = database()
  const corrupt = { ...createPet(now), lifecycle }
  await raw.table('pets').put(corrupt, 'pinchy')
  await expect(first.load()).rejects.toBeInstanceOf(InvalidPetDataError)
  await expect(first.hatch()).rejects.toBeInstanceOf(InvalidPetDataError)
  await expect(first.care({ type: 'pet' })).rejects.toBeInstanceOf(
    InvalidPetDataError,
  )
  expect(await raw.table('pets').get('pinchy')).toEqual(corrupt)
})

it('preserves an old baby journal and offers every legacy adult a permanent choice', async () => {
  const { first, second, raw } = database()
  const legacy = {
    ...createPet(now),
    lifecycle: { stage: 'baby', careDays: [20833] },
  }
  await raw.table('pets').put(legacy, 'pinchy')
  expect((await first.load()).lifecycle).toEqual({
    stage: 'baby',
    days: [{ day: 20833, foods: [], played: false, cuddled: false }],
  })
  expect(await raw.table('pets').get('pinchy')).toEqual(legacy)
  const adult = {
    ...createPet(now),
    name: 'Milo',
    careCount: 22,
    lifecycle: { stage: 'adult' },
  }
  await raw.table('pets').put(adult, 'pinchy')
  expect((await first.load()).lifecycle).toEqual(pendingAdult())
  const results = await Promise.all([
    first.chooseVariant('whirlwind'),
    second.chooseVariant('cuddly'),
  ])
  expect(results.filter((result) => result.chosen)).toHaveLength(1)
  const winner = results.find((result) => result.chosen)!.pet
  expect(await second.load()).toEqual(winner)
  expect(winner).toMatchObject({
    name: 'Milo',
    careCount: 22,
    updatedAt: now,
    fullness: 65,
  })
  expect((await first.chooseVariant('gourmet')).chosen).toBe(false)
  expect(await first.load()).toEqual(winner)
})
it.each(['gourmet', 'whirlwind', 'cuddly'] as const)(
  'round-trips the %s identity',
  async (variant) => {
    const { first, second, raw } = database()
    await raw.table('pets').put(createPet(now), 'pinchy')
    expect((await first.chooseVariant(variant)).chosen).toBe(true)
    expect((await second.load()).lifecycle).toEqual({
      stage: 'adult',
      identity: { status: 'chosen', variant },
    })
  },
)
it.each([
  { stage: 'adult', identity: { status: 'chosen', variant: 'unknown' } },
  {
    stage: 'adult',
    identity: { status: 'pending', options: ['cuddly', 'gourmet'] },
  },
  {
    stage: 'adult',
    identity: { status: 'pending', options: ['cuddly', 'cuddly'] },
  },
  { stage: 'adult', identity: { status: 'pending', options: ['gourmet'] } },
  {
    stage: 'baby',
    days: [
      {
        day: 20833,
        foods: ['doener', 'doener'],
        played: false,
        cuddled: false,
      },
    ],
  },
  { stage: 'baby', careDays: [], days: [] },
])(
  'rejects malformed explicit variant evidence without legacy fallback %j',
  async (lifecycle) => {
    const { first, raw } = database()
    const corrupt = { ...createPet(now), lifecycle }
    await raw.table('pets').put(corrupt, 'pinchy')
    await expect(first.chooseVariant('gourmet')).rejects.toBeInstanceOf(
      InvalidPetDataError,
    )
    expect(await raw.table('pets').get('pinchy')).toEqual(corrupt)
  },
)
