import { pendingAdult } from '../../src/features/pet/domain/lifecycle'
import { describe, expect, it } from 'vitest'
import {
  advancePet,
  careForPet,
  createPet as createEgg,
  type PetSnapshot,
  parsePetName,
  type CareAction,
} from '../../src/features/pet/domain/pet'

const createPet = (time: number): PetSnapshot => ({
  ...createEgg(time),
  lifecycle: pendingAdult(),
})
const now = 1_800_000_000_000

describe('care rules', () => {
  it.each([
    ['franzbroetchen', 85, 78, 72],
    ['doener', 95, 86, 72],
    ['augustiner', 70, 88, 67],
  ] as const)(
    '%s changes the correct needs',
    (food, fullness, happiness, energy) => {
      const before = Object.freeze(createPet(now))
      expect(careForPet(before, { type: 'feed', food }, now)).toEqual({
        accepted: true,
        message: food,
        pet: {
          ...before,
          fullness,
          happiness,
          energy,
          careCount: 1,
          friendship: {
            points: 4,
            daily: { ...before.friendship.daily, feed: 1 },
          },
        },
      })
    },
  )
  it.each<CareAction>([
    { type: 'play' },
    { type: 'pet' },
    { type: 'feed', food: 'doener' },
  ])('rejects active care during sleep: %j', (action) => {
    const pet = {
      ...createPet(now),
      sleeping: true,
      life: {
        ...createPet(now).life,
        sleep: { ...createPet(now).life.sleep, mode: 'manual' as const },
      },
    }
    expect(careForPet(pet, action, now)).toEqual({
      pet,
      accepted: false,
      message: 'sleeping',
    })
  })
  it('allows play at exactly ten energy and refuses below it', () => {
    expect(
      careForPet({ ...createPet(now), energy: 9 }, { type: 'play' }, now)
        .message,
    ).toBe('tired')
    expect(
      careForPet({ ...createPet(now), energy: 10 }, { type: 'play' }, now).pet
        .energy,
    ).toBe(0)
  })
  it('does not count repeated sleep or wake requests', () => {
    const sleeping = careForPet(createPet(now), { type: 'sleep' }, now).pet
    expect(careForPet(sleeping, { type: 'sleep' }, now)).toMatchObject({
      accepted: false,
      message: 'alreadySleeping',
      pet: { careCount: 1 },
    })
    expect(careForPet(createPet(now), { type: 'wake' }, now)).toMatchObject({
      accepted: false,
      message: 'alreadyAwake',
      pet: { careCount: 0 },
    })
  })
  it('caps meters and counts accepted gestures', () => {
    let pet = createPet(now)
    for (let i = 0; i < 30; i++)
      pet = careForPet(pet, { type: 'feed', food: 'augustiner' }, now).pet
    expect(pet).toMatchObject({
      fullness: 100,
      happiness: 100,
      energy: 0,
      careCount: 30,
    })
  })
  it('stroking raises happiness without spending energy', () => {
    expect(careForPet(createPet(now), { type: 'pet' }, now).pet).toMatchObject({
      happiness: 83,
      energy: 72,
      careCount: 1,
    })
  })
})

describe('elapsed time', () => {
  it('accounts for time away', () => {
    expect(advancePet(createPet(now), now + 7_200_000)).toMatchObject({
      fullness: 57,
      happiness: 72,
      energy: 62,
    })
  })
  it('restores energy while sleeping before waking', () => {
    const asleep = careForPet(createPet(now), { type: 'sleep' }, now).pet
    expect(
      careForPet(asleep, { type: 'wake' }, now + 7_200_000).pet,
    ).toMatchObject({
      fullness: 57,
      happiness: 72,
      energy: 100,
      sleeping: false,
    })
  })
  it('never reverses time and limits absence to 24 hours', () => {
    const pet = createPet(now)
    expect(advancePet(pet, now - 1)).toEqual(pet)
    expect(advancePet(pet, now + 48 * 3_600_000)).toMatchObject({
      fullness: 0,
      happiness: 6,
      energy: 0,
      updatedAt: now + 48 * 3_600_000,
    })
  })
})

describe('names', () => {
  it.each(['', '   ', 'a'.repeat(25), 'bad\u0000name'])(
    'rejects %j',
    (name) => {
      expect(parsePetName(name)).toEqual({ success: false })
    },
  )
  it.each(['Krümel', 'Milo & Möhre', 'a'.repeat(24)])(
    'accepts and trims %s',
    (name) => {
      expect(parsePetName(`  ${name}  `)).toEqual({ success: true, data: name })
    },
  )
})
