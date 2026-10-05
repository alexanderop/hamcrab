import { expect, it } from 'vitest'
import {
  advancePet,
  careForPet,
  createPet,
  hatchPet,
  type PetSnapshot,
} from '../../src/features/pet/domain/pet'
import { liveWithPet } from '../../src/features/pet/domain/life-actions'
import { lifeView, hour } from '../../src/features/pet/domain/life'
import { dayLength, neutralDay } from '../../src/features/pet/domain/lifecycle'
import { parseSavedPet } from '../../src/features/pet/adapters/saved-pet-schema'
import { InvalidPetDataError } from '../../src/features/pet/application/ports'
const start = 20_000 * dayLength
const baby = (now = start) => hatchPet(createPet(now), now).pet
const scheduled = (pet = baby()) =>
  liveWithPet(
    pet,
    {
      type: 'setRoutine',
      enabled: true,
      bedtime: 22,
      wakeHour: 8,
      utcOffsetMinutes: 0,
    },
    pet.updatedAt,
  ).pet

it('exposes a toilet cue, prevents one mess, and bounds absence with recoverable illness', () => {
  const cue = advancePet(baby(), start + 5.5 * hour)
  expect(lifeView(cue).toiletCue).toBe(true)
  const relieved = liveWithPet(cue, { type: 'toilet' }, cue.updatedAt)
  expect(relieved).toMatchObject({ accepted: true, pet: { happiness: 63.5 } })
  expect(advancePet(relieved.pet, start + 6 * hour).life.health.waste).toBe(0)
  const neglected = advancePet(baby(), start + 90 * dayLength)
  expect(neglected.life.health).toMatchObject({ waste: 3, unwell: true })
  const cured = liveWithPet(
    neglected,
    { type: 'medicine' },
    neglected.updatedAt,
  ).pet
  expect(advancePet(cured, cured.updatedAt).life.health).toMatchObject({
    waste: 0,
    unwell: false,
  })
  const asleep = careForPet(
    neglected,
    { type: 'sleep' },
    neglected.updatedAt,
  ).pet
  expect(
    liveWithPet(asleep, { type: 'clean' }, asleep.updatedAt),
  ).toMatchObject({
    accepted: true,
    pet: { sleeping: true, life: { health: { waste: 0, unwell: true } } },
  })
})
it('computes game score from persisted rounds and never rewards retries or cancellation', () => {
  let pet = liveWithPet(baby(), { type: 'startGame' }, start).pet
  const id = pet.life.game!.id
  expect(liveWithPet(pet, { type: 'startGame' }, start).pet.life.game!.id).toBe(
    id,
  )
  expect(
    liveWithPet(
      pet,
      { type: 'guessShell', gameId: id, round: 1, shell: 0 },
      start,
    ).message,
  ).toBe('staleGame')
  for (let round = 0; round < 5; round++) {
    const game = pet.life.game!
    pet = liveWithPet(
      pet,
      { type: 'guessShell', gameId: id, round, shell: game.target },
      start,
    ).pet
  }
  expect(pet).toMatchObject({
    energy: 62,
    happiness: 98,
    careCount: 1,
    life: { game: null, lastGame: { id, score: 5 } },
  })
  expect(
    liveWithPet(
      pet,
      { type: 'guessShell', gameId: id, round: 4, shell: 0 },
      start,
    ),
  ).toEqual({ pet, accepted: false, message: 'staleGame' })
  const next = liveWithPet(pet, { type: 'startGame' }, start).pet
  expect(next.life.game!.id).toBe(id + 1)
  expect(liveWithPet(next, { type: 'cancelGame' }, start).pet).toMatchObject({
    energy: 62,
    careCount: 1,
    life: { game: null, lastGame: { id, score: 5 } },
  })
})
it('preserves selected equipment as rewards unlock and rejects unowned choices', () => {
  expect(
    liveWithPet(
      baby(),
      { type: 'equip', slot: 'outfit', item: 'ribbon' },
      start,
    ).accepted,
  ).toBe(false)
  const chosen = liveWithPet(
    baby(),
    { type: 'equip', slot: 'outfit', item: 'cap' },
    start,
  ).pet
  expect(
    lifeView({ ...chosen, friendship: { ...chosen.friendship, points: 100 } }),
  ).toMatchObject({
    outfit: 'cap',
    toy: 'ball',
    decoration: 'flower',
    owned: { ribbon: true, ball: true, flower: true },
  })
  const pet = {
    ...baby(),
    life: {
      ...baby().life,
      favoriteFood: 'doener' as const,
      favoriteToy: 'shell' as const,
      personality: 'gentle' as const,
    },
  }
  expect(
    careForPet(pet, { type: 'feed', food: 'doener' }, start).pet.happiness,
  ).toBe(86)
  expect(careForPet(pet, { type: 'pet' }, start).pet.happiness).toBe(85)
  const toy = liveWithPet(
    pet,
    { type: 'equip', slot: 'toy', item: 'shell' },
    start,
  ).pet
  expect(careForPet(toy, { type: 'play' }, start).pet.happiness).toBe(95)
})
it('requires three distinct companion days and archives exactly once while resetting the whole generation', () => {
  let pet: PetSnapshot = {
    ...baby(),
    name: 'Milo',
    lifecycle: {
      stage: 'adult',
      identity: { status: 'chosen', variant: 'cuddly' },
    },
    friendship: { ...baby().friendship, points: 100 },
  }
  pet = liveWithPet(
    pet,
    { type: 'equip', slot: 'outfit', item: 'cap' },
    start,
  ).pet
  pet = liveWithPet(pet, { type: 'visitCompanion' }, start).pet
  expect(liveWithPet(pet, { type: 'visitCompanion' }, start).message).toBe(
    'alreadyVisited',
  )
  expect(
    liveWithPet(pet, { type: 'nextGeneration', expectedGeneration: 1 }, start)
      .accepted,
  ).toBe(false)
  pet = liveWithPet(pet, { type: 'visitCompanion' }, start + dayLength).pet
  pet = liveWithPet(pet, { type: 'visitCompanion' }, start + 2 * dayLength).pet
  pet = { ...pet, energy: 70 }
  pet = liveWithPet(pet, { type: 'startGame' }, pet.updatedAt).pet
  const oldId = pet.life.game!.id
  const next = liveWithPet(
    pet,
    { type: 'nextGeneration', expectedGeneration: 1 },
    pet.updatedAt,
  ).pet
  expect(next).toMatchObject({
    name: 'Pinchy',
    fullness: 65,
    happiness: 78,
    energy: 72,
    sleeping: false,
    careCount: 0,
    lifecycle: { stage: 'egg' },
    createdAt: start + 2 * dayLength,
    friendship: {
      points: 100,
      daily: { feed: 0, play: 0, pet: 0, wishCompleted: false },
    },
    life: {
      generation: 2,
      visits: [],
      game: null,
      gameSequence: oldId,
      lastGame: null,
      health: { waste: 0, unwell: false },
      sleep: { mode: 'awake', napDay: -1, overrideUntil: 0, until: 0 },
      equipment: { outfit: 'cap', toy: 'ball', decoration: 'flower' },
      owned: { ribbon: true, ball: true, flower: true },
      album: [
        {
          generation: 1,
          name: 'Milo',
          variant: 'cuddly',
          bornAt: start,
          movedOutAt: start + 2 * dayLength,
        },
      ],
    },
  })
  expect(parseSavedPet(next)).toEqual(next)
  expect(
    liveWithPet(
      next,
      { type: 'nextGeneration', expectedGeneration: 1 },
      next.updatedAt,
    ).accepted,
  ).toBe(false)
})
it('integrates scheduled awake and sleeping intervals identically across refreshes', () => {
  const before = scheduled(baby(start + 20 * hour))
  const single = advancePet(before, start + 34 * hour)
  let stepped = before
  for (let t = 21; t <= 34; t++) stepped = advancePet(stepped, start + t * hour)
  expect(single).toEqual(stepped)
  expect(single).toMatchObject({ energy: 90, sleeping: false })
  expect(advancePet(single, start)).toEqual(single)
  const fixedOffset = liveWithPet(
    baby(start + 20 * hour),
    {
      type: 'setRoutine',
      enabled: true,
      bedtime: 22,
      wakeHour: 8,
      utcOffsetMinutes: 120,
    },
    start + 20 * hour,
  ).pet
  expect(fixedOffset.sleeping).toBe(true)
})
it('waking overrides the current night, then restores the following bedtime', () => {
  const night = scheduled(baby(start + 23 * hour))
  expect(night.sleeping).toBe(true)
  const awake = careForPet(night, { type: 'wake' }, night.updatedAt).pet
  expect(advancePet(awake, start + 25 * hour).sleeping).toBe(false)
  expect(advancePet(awake, start + 46 * hour).life.sleep.mode).toBe('night')
})
it('takes one exhausted nap, wakes automatically, and respects a manual wake', () => {
  const pet = scheduled({ ...baby(start + 12 * hour), energy: 15 })
  const nap = advancePet(pet, start + 13 * hour)
  expect(nap).toMatchObject({
    sleeping: true,
    energy: 10,
    life: { sleep: { mode: 'nap' } },
  })
  expect(advancePet(nap, start + 14 * hour)).toMatchObject({
    sleeping: false,
    energy: 30,
  })
  expect(advancePet(nap, start + 19 * hour)).toMatchObject({
    sleeping: false,
    energy: 5,
  })
  const awake = careForPet(nap, { type: 'wake' }, nap.updatedAt).pet
  expect(advancePet(awake, start + 13.5 * hour).sleeping).toBe(false)
})
it('migrates only absent life and legacy stage journals while rejecting inconsistent current saves', () => {
  const { life: _, ...old } = baby()
  const historical = {
    ...old,
    createdAt: start - 6 * dayLength,
    lifecycle: { stage: 'baby', days: [19995, 19996, 19997].map(neutralDay) },
  }
  expect(parseSavedPet(historical).lifecycle.stage).toBe('child')
  expect(() => parseSavedPet({ ...historical, life: baby().life })).toThrow(
    InvalidPetDataError,
  )
  for (const life of [
    null,
    undefined,
    {},
    { ...baby().life, generation: 2 },
    { ...baby().life, unexpected: true },
  ])
    expect(() => parseSavedPet({ ...baby(), life })).toThrow(
      InvalidPetDataError,
    )
})
it('manual sleep wakes with an enabled routine and remains manual when it is disabled', () => {
  const night = scheduled(baby(start + 21 * hour))
  const asleep = careForPet(night, { type: 'sleep' }, night.updatedAt).pet
  expect(advancePet(asleep, start + 32 * hour)).toMatchObject({
    sleeping: false,
    energy: 100,
  })
  const manual = careForPet(
    baby(start + 21 * hour),
    { type: 'sleep' },
    start + 21 * hour,
  ).pet
  expect(advancePet(manual, start + 32 * hour).sleeping).toBe(true)
})
it('integrates only the final day of an oversized absence without granting extra energy', () => {
  const pet = scheduled(baby(start + 20 * hour))
  const finalDay = { ...pet, updatedAt: start + 20 * hour + 89 * dayLength }
  expect(advancePet(pet, start + 20 * hour + 90 * dayLength).energy).toBe(
    advancePet(finalDay, start + 20 * hour + 90 * dayLength).energy,
  )
})
it('retains every ancestor and inherited selections across successive generations', () => {
  let pet: PetSnapshot = {
    ...baby(),
    friendship: { ...baby().friendship, points: 100 },
  }
  pet = liveWithPet(
    pet,
    { type: 'equip', slot: 'toy', item: 'shell' },
    start,
  ).pet
  pet = liveWithPet(
    pet,
    {
      type: 'setRoutine',
      enabled: true,
      bedtime: 21,
      wakeHour: 7,
      utcOffsetMinutes: 120,
    },
    start,
  ).pet
  for (let generation = 1; generation <= 8; generation++) {
    const time = start + generation * 3 * dayLength
    pet = {
      ...pet,
      name: `Crab ${generation}`,
      lifecycle: {
        stage: 'adult',
        identity: { status: 'chosen', variant: 'whirlwind' },
      },
      updatedAt: time,
      life: {
        ...pet.life,
        visits: [
          Math.floor(time / dayLength) - 2,
          Math.floor(time / dayLength) - 1,
          Math.floor(time / dayLength),
        ],
      },
    }
    pet = liveWithPet(
      pet,
      { type: 'nextGeneration', expectedGeneration: generation },
      time,
    ).pet
    expect(parseSavedPet(pet)).toEqual(pet)
  }
  expect(pet.life.album.map((entry) => entry.name)).toEqual([
    'Crab 1',
    'Crab 2',
    'Crab 3',
    'Crab 4',
    'Crab 5',
    'Crab 6',
    'Crab 7',
    'Crab 8',
  ])
  expect(pet.life).toMatchObject({
    generation: 9,
    equipment: { toy: 'shell' },
    selected: { toy: true },
    routine: { enabled: true, bedtime: 21, wakeHour: 7, utcOffsetMinutes: 120 },
  })
})
it.each([{ stage: 'adult' }, { stage: 'baby', careDays: [] }])(
  'rejects legacy lifecycle shape inside a current life-bearing save %j',
  (lifecycle) => {
    expect(() => parseSavedPet({ ...baby(), lifecycle })).toThrow(
      InvalidPetDataError,
    )
  },
)
it('advances through sub-millisecond exhaustion without looping or storing fractional time', () => {
  const pet = scheduled({
    ...baby(start + 12 * hour),
    energy: 10 + Number.EPSILON * 8,
  })
  const next = advancePet(pet, pet.updatedAt + 1)
  expect(next.sleeping).toBe(true)
  expect(next.life.sleep.until).toBe(pet.updatedAt + 1 + hour)
  expect(parseSavedPet(next)).toEqual(next)
})
it.each([
  { mode: 'nap', until: 0, napDay: -1, overrideUntil: 0 },
  { mode: 'nap', until: start, napDay: 20000, overrideUntil: 0 },
  { mode: 'manual', until: 0, napDay: -1, overrideUntil: 0 },
] as const)('rejects an impossible scheduled sleep state %j', (sleep) => {
  const pet = scheduled(baby(start + 12 * hour))
  expect(() =>
    parseSavedPet({ ...pet, sleeping: true, life: { ...pet.life, sleep } }),
  ).toThrow(InvalidPetDataError)
})
