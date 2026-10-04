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
  recordCare,
  neutralDay,
  lifecycleView,
  chooseAdultVariant,
  type Lifecycle,
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
      lifecycle: { stage: 'baby', days: [] },
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
    days: [20000, 20002, 20004, 20006, 20008, 20010, 20012, 20014, 20016].map(
      (day) => ({ ...neutralDay(day), cuddled: true }),
    ),
  })
  expect(advancePet(pet, now + 100 * dayLength).lifecycle).toEqual(
    pet.lifecycle,
  )
  expect(
    careForPet(pet, { type: 'pet' }, now + 20 * dayLength).pet.lifecycle,
  ).toEqual({
    stage: 'adult',
    identity: { status: 'chosen', variant: 'cuddly' },
  })
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
      lifecycleView(
        careForPet({ ...baby(), ...meters }, action, now).pet.lifecycle,
      ).careDays,
    ).toEqual(count)
  },
)
it('does not duplicate credits after a clock reversal and revisit', () => {
  const first = careForPet(baby(), { type: 'pet' }, now + dayLength).pet
  const reversed = careForPet(first, { type: 'pet' }, now).pet
  expect(
    careForPet(reversed, { type: 'pet' }, now + dayLength).pet.lifecycle,
  ).toEqual({ stage: 'baby', days: [{ ...neutralDay(20001), cuddled: true }] })
  expect(
    recordCare({ stage: 'baby', days: [20000, 20002].map(neutralDay) }, 20001, {
      type: 'pet',
    }),
  ).toEqual({
    stage: 'baby',
    days: [
      neutralDay(20000),
      { ...neutralDay(20001), cuddled: true },
      neutralDay(20002),
    ],
  })
})

it('caps daily experiences and rewards rotation rather than repeated meals', () => {
  let life: Lifecycle = { stage: 'baby', days: [] }
  life = recordCare(life, 1, { type: 'feed', food: 'doener' })
  life = recordCare(life, 1, { type: 'feed', food: 'doener' })
  life = recordCare(life, 2, { type: 'feed', food: 'doener' })
  expect(lifecycleView(life).scores).toEqual({
    gourmet: 1,
    whirlwind: 0,
    cuddly: 0,
  })
  life = recordCare(life, 2, { type: 'feed', food: 'franzbroetchen' })
  life = recordCare(life, 2, { type: 'feed', food: 'augustiner' })
  life = recordCare(life, 2, { type: 'play' })
  life = recordCare(life, 2, { type: 'play' })
  life = recordCare(life, 2, { type: 'pet' })
  expect(lifecycleView(life)).toMatchObject({
    careDays: 2,
    scores: { gourmet: 2, whirlwind: 1, cuddly: 1 },
  })
})
it('includes the tenth experience, offers only tied forms and keeps a choice permanent', () => {
  const days = Array.from({ length: 9 }, (_, i) => ({
    ...neutralDay(i),
    played: true,
    cuddled: i < 8,
  }))
  const grown = recordCare({ stage: 'baby', days }, 9, { type: 'pet' })
  expect(grown).toEqual({
    stage: 'adult',
    identity: { status: 'pending', options: ['whirlwind', 'cuddly'] },
  })
  expect(chooseAdultVariant(grown, 'gourmet')).toBe(grown)
  const chosen = chooseAdultVariant(grown, 'whirlwind')
  expect(chosen).toEqual({
    stage: 'adult',
    identity: { status: 'chosen', variant: 'whirlwind' },
  })
  expect(chooseAdultVariant(chosen, 'cuddly')).toBe(chosen)
  expect(recordCare(chosen, 10, { type: 'pet' })).toBe(chosen)
})
it('does not invent preferences for old care dates', () => {
  expect(
    lifecycleView({ stage: 'baby', days: [1, 2, 3].map(neutralDay) }).scores,
  ).toEqual({ gourmet: 0, whirlwind: 0, cuddly: 0 })
})
it.each(['gourmet', 'whirlwind', 'cuddly'] as const)(
  'develops %s from its useful experiences without changing care benefits',
  (variant) => {
    let life: Lifecycle = { stage: 'baby', days: [] }
    for (let day = 0; day < 10; day++)
      life = recordCare(
        life,
        day,
        variant === 'gourmet'
          ? { type: 'feed', food: day % 2 ? 'doener' : 'franzbroetchen' }
          : { type: variant === 'whirlwind' ? 'play' : 'pet' },
      )
    expect(life).toEqual({
      stage: 'adult',
      identity: { status: 'chosen', variant },
    })
    const regular = careForPet(
      {
        ...baby(),
        lifecycle: {
          stage: 'adult',
          identity: {
            status: 'pending',
            options: ['gourmet', 'whirlwind', 'cuddly'],
          },
        },
      },
      { type: 'pet' },
      now,
    ).pet
    const selected = careForPet(
      { ...baby(), lifecycle: life },
      { type: 'pet' },
      now,
    ).pet
    expect({ ...selected, lifecycle: regular.lifecycle }).toEqual(regular)
  },
)
