import { lifeSchema } from './life-schema'
import { createLife, syncInventory } from '../domain/life'
import { growingStage } from '../domain/lifecycle'
import { z } from 'zod'
import {
  adultVariants,
  neutralDay,
  pendingAdult,
  dayLength,
  requiredCareDays,
} from '../domain/lifecycle'
import { parsePetName, type PetSnapshot } from '../domain/pet'
import { createFriendship } from '../domain/friendship'
import { InvalidPetDataError } from '../application/ports'

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const meter = z.number().finite().min(0).max(100)
const petFields = {
  version: z.literal(1),
  name: z
    .string()
    .trim()
    .refine((name) => parsePetName(name).success),
  fullness: meter,
  happiness: meter,
  energy: meter,
  sleeping: z.boolean(),
  careCount: integer,
  createdAt: integer,
  updatedAt: integer,
}
const friendship = z
  .object({
    points: integer.max(100),
    daily: z
      .object({
        day: integer,
        feed: integer.max(2),
        play: integer.max(2),
        pet: integer.max(1),
        wishCompleted: z.boolean(),
      })
      .strict(),
  })
  .strict()
const variant = z.enum(adultVariants)
const identity = z.discriminatedUnion('status', [
  z.object({ status: z.literal('chosen'), variant }).strict(),
  z
    .object({
      status: z.literal('pending'),
      options: z
        .tuple([variant, variant])
        .rest(variant)
        .refine(
          (options) =>
            options.length <= 3 &&
            options.every(
              (option, index) =>
                index === 0 ||
                adultVariants.indexOf(option) >
                  adultVariants.indexOf(options[index - 1]!),
            ),
        ),
    })
    .strict(),
])
const day = z
  .object({
    day: integer,
    foods: z
      .array(z.enum(['franzbroetchen', 'doener', 'augustiner', 'strawberry']))
      .max(4)
      .refine((foods) => new Set(foods).size === foods.length),
    played: z.boolean(),
    cuddled: z.boolean(),
  })
  .strict()
const currentLifecycle = z.union([
  z.object({ stage: z.literal('egg') }).strict(),
  z
    .object({
      stage: z.enum(['baby', 'child', 'teen']),
      days: z
        .array(day)
        .max(requiredCareDays - 1)
        .refine((days) =>
          days.every(
            (day, index) => index === 0 || day.day > days[index - 1]!.day,
          ),
        ),
    })
    .strict(),
  z.object({ stage: z.literal('adult'), identity }).strict(),
])
const lifecycle = z.union([
  currentLifecycle,
  z
    .object({
      stage: z.literal('baby'),
      careDays: z
        .array(integer)
        .max(requiredCareDays - 1)
        .refine((days) =>
          days.every((day, index) => index === 0 || day > days[index - 1]!),
        ),
    })
    .strict()
    .transform((old) => ({
      stage: growingStage(old.careDays.length),
      days: old.careDays.map(neutralDay),
    })),
  z
    .object({ stage: z.literal('adult') })
    .strict()
    .transform(pendingAdult),
])
const historicalPetSchema = z
  .union([
    z.object({ ...petFields, friendship, lifecycle }).strict(),
    z
      .object({ ...petFields, friendship })
      .strict()
      .transform((pet) => ({ ...pet, lifecycle: pendingAdult() })),
    z
      .object(petFields)
      .strict()
      .transform((pet) => ({
        ...pet,
        friendship: createFriendship(pet.updatedAt, pet.careCount),
        lifecycle: pendingAdult(),
      })),
  ])
  .refine(
    (pet) =>
      pet.updatedAt >= pet.createdAt &&
      pet.friendship.daily.day <= Math.floor(pet.updatedAt / dayLength) &&
      (pet.lifecycle.stage === 'egg' ||
        pet.lifecycle.stage === 'adult' ||
        pet.lifecycle.days.every(
          (day) =>
            day.day >= Math.floor(pet.createdAt / dayLength) &&
            day.day <= Math.floor(pet.updatedAt / dayLength),
        )),
  )

const currentPetSchema = z
  .object({
    ...petFields,
    friendship,
    lifecycle: currentLifecycle,
    life: lifeSchema,
  })
  .strict()
  .refine(
    (pet) =>
      pet.updatedAt >= pet.createdAt &&
      pet.friendship.daily.day <= Math.floor(pet.updatedAt / dayLength) &&
      pet.sleeping === (pet.life.sleep.mode !== 'awake') &&
      ((pet.life.sleep.mode !== 'nap' &&
        !(pet.life.sleep.mode === 'manual' && pet.life.routine.enabled)) ||
        pet.life.sleep.until > pet.updatedAt) &&
      pet.life.visits.every(
        (day) =>
          day >= Math.floor(pet.createdAt / dayLength) &&
          day <= Math.floor(pet.updatedAt / dayLength),
      ) &&
      pet.life.album.every((entry) => entry.movedOutAt <= pet.createdAt) &&
      (pet.lifecycle.stage === 'egg' ||
        pet.lifecycle.stage === 'adult' ||
        (pet.lifecycle.stage === growingStage(pet.lifecycle.days.length) &&
          pet.lifecycle.days.every(
            (day) =>
              day.day >= Math.floor(pet.createdAt / dayLength) &&
              day.day <= Math.floor(pet.updatedAt / dayLength),
          ))) &&
      (pet.life.equipment.outfit !== 'ribbon' ||
        pet.life.owned.ribbon ||
        pet.friendship.points >= 10) &&
      (pet.life.equipment.toy !== 'ball' ||
        pet.life.owned.ball ||
        pet.friendship.points >= 60) &&
      (pet.life.equipment.decoration !== 'flower' ||
        pet.life.owned.flower ||
        pet.friendship.points >= 100),
  )

export function parseSavedPet(value: unknown): PetSnapshot {
  if (typeof value === 'object' && value !== null && 'life' in value) {
    const result = currentPetSchema.safeParse(value)
    if (!result.success) throw new InvalidPetDataError()
    return result.data
  }
  const result = historicalPetSchema.safeParse(value)
  if (!result.success) throw new InvalidPetDataError()
  const pet = result.data
  const lifecycle =
    pet.lifecycle.stage === 'baby' ||
    pet.lifecycle.stage === 'child' ||
    pet.lifecycle.stage === 'teen'
      ? { ...pet.lifecycle, stage: growingStage(pet.lifecycle.days.length) }
      : pet.lifecycle
  return {
    ...pet,
    lifecycle,
    life: syncInventory(
      createLife(pet.updatedAt, pet.sleeping),
      pet.friendship.points,
    ),
  }
}
