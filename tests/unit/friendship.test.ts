import { describe, expect, it } from 'vitest'
import {
  advancePet,
  careForPet,
  createPet as createEgg,
  type PetSnapshot,
} from '../../src/features/pet/domain/pet'
import { friendshipView } from '../../src/features/pet/domain/friendship'
import { parseSavedPet } from '../../src/features/pet/adapters/saved-pet-schema'
import { InvalidPetDataError } from '../../src/features/pet/application/ports'

const createPet = (time: number): PetSnapshot => ({
  ...createEgg(time),
  lifecycle: { stage: 'adult' as const },
})
const day = 86_400_000
const noon = 6 * day + day / 2
const legacy = {
  version: 1,
  name: 'Old friend',
  fullness: 65,
  happiness: 78,
  energy: 72,
  sleeping: false,
  careCount: 0,
  createdAt: noon,
  updatedAt: noon,
}

describe('friendship', () => {
  it.each([
    [0, 1, 'ribbon', 10],
    [9, 1, 'ribbon', 1],
    [10, 2, 'strawberry', 20],
    [29, 2, 'strawberry', 1],
    [30, 3, 'ball', 30],
    [59, 3, 'ball', 1],
    [60, 4, 'flower', 40],
    [99, 4, 'flower', 1],
  ] as const)('describes %i points', (points, level, reward, remaining) => {
    const pet = createPet(noon)
    const view = friendshipView({ friendship: { ...pet.friendship, points } })
    expect(view).toMatchObject({ points, level, next: { reward, remaining } })
    expect(view.unlocked).toHaveLength(level - 1)
  })
  it('caps points and still completes a wish at maximum friendship', () => {
    const pet = createPet(noon)
    const result = careForPet(
      { ...pet, friendship: { ...pet.friendship, points: 99 } },
      { type: 'feed', food: 'doener' },
      noon,
    )
    expect(result.pet.friendship).toMatchObject({
      points: 100,
      daily: { wishCompleted: true },
    })
    expect(friendshipView(result.pet)).toMatchObject({
      level: 5,
      next: null,
      wish: { rewardPoints: 0 },
    })
    const tomorrow = advancePet(result.pet, noon + day)
    const completed = careForPet(
      { ...tomorrow, energy: 50 },
      { type: 'play' },
      noon + day,
    )
    expect(completed.pet.friendship).toMatchObject({
      points: 100,
      daily: { wishCompleted: true },
    })
  })
  it('awards useful feeding twice and completes the wish exactly once', () => {
    const before = createPet(noon)
    let pet = { ...before, fullness: 0 }
    for (let count = 0; count < 12; count++)
      pet = careForPet(pet, { type: 'feed', food: 'augustiner' }, noon).pet
    expect(pet.friendship).toEqual({
      points: 14,
      daily: { day: 6, feed: 2, play: 0, pet: 0, wishCompleted: true },
    })
    expect(pet.careCount).toBe(12)
    expect(before.friendship.points).toBe(0)
  })
  it('completes a full-meter wish without awarding ordinary care points', () => {
    const full = { ...createPet(noon), fullness: 100 }
    const result = careForPet(full, { type: 'feed', food: 'doener' }, noon)
    expect(result.pet.friendship).toEqual({
      points: 6,
      daily: { day: 6, feed: 0, play: 0, pet: 0, wishCompleted: true },
    })
    expect(
      careForPet(result.pet, { type: 'feed', food: 'doener' }, noon).pet
        .friendship.points,
    ).toBe(6)
    const happy = { ...createPet(noon + day), happiness: 100 }
    expect(
      careForPet(happy, { type: 'play' }, noon + day).pet.friendship,
    ).toMatchObject({ points: 6, daily: { play: 0, wishCompleted: true } })
  })
  it('caps play and cuddles and does not reward sleep toggles', () => {
    let pet = { ...createPet(noon), happiness: 0 }
    for (let count = 0; count < 4; count++)
      pet = careForPet(pet, { type: 'play' }, noon).pet
    for (let count = 0; count < 20; count++) {
      pet = careForPet(pet, { type: 'pet' }, noon).pet
      pet = careForPet(pet, { type: 'sleep' }, noon).pet
      pet = careForPet(pet, { type: 'wake' }, noon).pet
    }
    expect(pet.friendship).toEqual({
      points: 12,
      daily: { day: 6, feed: 0, play: 2, pet: 1, wishCompleted: false },
    })
  })
  it('resets daily allowances at UTC midnight without resetting points', () => {
    const before = careForPet(
      createPet(7 * day - 1),
      { type: 'feed', food: 'doener' },
      7 * day - 1,
    ).pet
    const after = advancePet(before, 7 * day)
    expect(after.friendship).toEqual({
      points: 10,
      daily: { day: 7, feed: 0, play: 0, pet: 0, wishCompleted: false },
    })
    expect(friendshipView(after).wish.action).toBe('play')
    expect(advancePet(after, 30 * day).friendship.points).toBe(10)
  })
  it('keeps a persisted future-day award when the clock rolls back', () => {
    const future = parseSavedPet(
      careForPet(createPet(noon + day), { type: 'play' }, noon + day).pet,
    )
    const replay = careForPet(future, { type: 'play' }, noon)
    expect(replay.pet.friendship).toEqual(future.friendship)
    expect(replay.pet.updatedAt).toBe(noon + day)
    expect(friendshipView(replay.pet).wish).toMatchObject({
      action: 'play',
      complete: true,
    })
  })
  it('rejects locked strawberries and rejected care earns no wish or points', () => {
    const pet = createPet(noon)
    expect(careForPet(pet, { type: 'feed', food: 'strawberry' }, noon)).toEqual(
      { pet, accepted: false, message: 'foodLocked' },
    )
    expect(
      careForPet(
        { ...pet, sleeping: true },
        { type: 'feed', food: 'doener' },
        noon,
      ).pet.friendship.points,
    ).toBe(0)
    const unlocked = { ...pet, friendship: { ...pet.friendship, points: 30 } }
    expect(
      careForPet(unlocked, { type: 'feed', food: 'strawberry' }, noon),
    ).toMatchObject({
      accepted: true,
      message: 'strawberry',
      pet: { fullness: 75, happiness: 90 },
    })
    expect(friendshipView(unlocked).availableFoods).toContain('strawberry')
    expect(friendshipView(pet).availableFoods).toEqual([
      'franzbroetchen',
      'doener',
      'augustiner',
    ])
  })
})

describe('saved friendship boundary', () => {
  it.each([
    [0, 0],
    [4, 8],
    [5, 10],
    [9, 26],
    [10, 30],
    [14, 54],
    [15, 60],
    [19, 92],
    [20, 100],
    [90, 100],
  ])('preserves legacy %i gestures as %i points', (careCount, points) => {
    expect(parseSavedPet({ ...legacy, careCount })).toEqual({
      ...legacy,
      lifecycle: { stage: 'adult' },
      careCount,
      friendship: {
        points,
        daily: { day: 6, feed: 0, play: 0, pet: 0, wishCompleted: false },
      },
    })
  })
  it.each([
    undefined,
    null,
    { points: 100 },
    { ...createPet(noon).friendship, points: 101 },
    { ...createPet(noon).friendship, points: 0.5 },
    { ...createPet(noon).friendship, extra: true },
    {
      ...createPet(noon).friendship,
      daily: { ...createPet(noon).friendship.daily, feed: 3 },
    },
    {
      ...createPet(noon).friendship,
      daily: { ...createPet(noon).friendship.daily, pet: 2 },
    },
    {
      ...createPet(noon).friendship,
      daily: { ...createPet(noon).friendship.daily, day: 7 },
    },
    {
      ...createPet(noon).friendship,
      daily: { ...createPet(noon).friendship.daily, unexpected: true },
    },
  ])(
    'never treats malformed present friendship as legacy: %j',
    (friendship) => {
      expect(() => parseSavedPet({ ...legacy, friendship })).toThrow(
        InvalidPetDataError,
      )
    },
  )
  it.each(['careCount', 'createdAt', 'updatedAt'])(
    'rejects unsafe %s values',
    (key) => {
      expect(() =>
        parseSavedPet({ ...legacy, [key]: Number.MAX_SAFE_INTEGER + 1 }),
      ).toThrow(InvalidPetDataError)
    },
  )
})
