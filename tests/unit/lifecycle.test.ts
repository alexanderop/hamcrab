import { expect, it } from 'vitest'
import {
  advancePet,
  careForPet,
  createPet,
  hatchPet,
  type CareAction,
} from '../../src/features/pet/domain/pet'
import {
  dayLength,
  rewardGrowth,
} from '../../src/features/pet/domain/lifecycle'
const now = 20_000 * dayLength
const baby = () => hatchPet(createPet(now), now).pet
it('keeps an egg safe through absence and rejects ordinary care', () => {
  const egg = createPet(now)
  expect(advancePet(egg, now + 20 * dayLength)).toEqual(egg)
  for (const action of [
    { type: 'pet' },
    { type: 'sleep' },
    { type: 'wake' },
    { type: 'play' },
    { type: 'feed', food: 'doener' },
  ] satisfies CareAction[]) {
    expect(careForPet(egg, action, now)).toEqual({
      pet: egg,
      accepted: false,
      message: 'egg',
    })
  }
})
it('hatches once without points or care and starts time at the visit', () => {
  const egg = createPet(now)
  const result = hatchPet(egg, now + dayLength)
  expect(result).toMatchObject({
    hatched: true,
    pet: {
      lifecycle: { stage: 'baby', careDays: [] },
      updatedAt: now + dayLength,
      careCount: 0,
      friendship: { points: 0 },
    },
  })
  expect(hatchPet(result.pet, now + 2 * dayLength)).toEqual({
    pet: result.pet,
    hatched: false,
  })
})
it('grows on ten distinct meaningful days, including gaps, independently of friendship cap', () => {
  let pet = { ...baby(), friendship: { ...baby().friendship, points: 100 } }
  for (let day = 0; day < 9; day++) {
    pet = careForPet(pet, { type: 'pet' }, now + day * 2 * dayLength).pet
    pet = careForPet(pet, { type: 'pet' }, now + day * 2 * dayLength).pet
  }
  expect(pet.lifecycle).toEqual({
    stage: 'baby',
    careDays: [20000, 20002, 20004, 20006, 20008, 20010, 20012, 20014, 20016],
  })
  expect(advancePet(pet, now + 100 * dayLength).lifecycle).toEqual(
    pet.lifecycle,
  )
  expect(
    careForPet(pet, { type: 'pet' }, now + 20 * dayLength).pet.lifecycle,
  ).toEqual({ stage: 'adult' })
})
it.each([
  [{ type: 'feed', food: 'doener' }, { fullness: 85 }, 0],
  [{ type: 'feed', food: 'doener' }, { fullness: 84 }, 1],
  [{ type: 'play' }, { happiness: 90 }, 0],
  [{ type: 'play' }, { happiness: 89 }, 1],
  [{ type: 'pet' }, { happiness: 100 }, 1],
  [{ type: 'sleep' }, {}, 0],
  [{ type: 'wake' }, { sleeping: true }, 0],
  [{ type: 'play' }, { energy: 9 }, 0],
  [{ type: 'pet' }, { sleeping: true }, 0],
] satisfies [CareAction, object, number][])(
  'counts only useful accepted care %j',
  (action, meters, count) => {
    expect(
      careForPet({ ...baby(), ...meters }, action, now).pet.lifecycle,
    ).toEqual({ stage: 'baby', careDays: count ? [20000] : [] })
  },
)
it('does not duplicate credits after a clock reversal and revisit', () => {
  const first = careForPet(baby(), { type: 'pet' }, now + dayLength).pet
  const reversed = careForPet(first, { type: 'pet' }, now).pet
  expect(
    careForPet(reversed, { type: 'pet' }, now + dayLength).pet.lifecycle,
  ).toEqual({ stage: 'baby', careDays: [20001] })
  expect(
    rewardGrowth({ stage: 'baby', careDays: [20000, 20002] }, 20001),
  ).toEqual({ stage: 'baby', careDays: [20000, 20001, 20002] })
})
