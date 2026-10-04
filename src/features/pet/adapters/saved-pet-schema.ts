import { z } from 'zod'
import { dayLength, requiredCareDays } from '../domain/lifecycle'
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
const lifecycle = z.discriminatedUnion('stage', [
  z.object({ stage: z.literal('egg') }).strict(),
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
    .strict(),
  z.object({ stage: z.literal('adult') }).strict(),
])
const savedPetSchema = z
  .union([
    z.object({ ...petFields, friendship, lifecycle }).strict(),
    z
      .object({ ...petFields, friendship })
      .strict()
      .transform((pet) => ({ ...pet, lifecycle: { stage: 'adult' as const } })),
    z
      .object(petFields)
      .strict()
      .transform((pet) => ({
        ...pet,
        friendship: createFriendship(pet.updatedAt, pet.careCount),
        lifecycle: { stage: 'adult' as const },
      })),
  ])
  .refine(
    (pet) =>
      pet.updatedAt >= pet.createdAt &&
      pet.friendship.daily.day <= Math.floor(pet.updatedAt / dayLength) &&
      (pet.lifecycle.stage !== 'baby' ||
        pet.lifecycle.careDays.every(
          (day) =>
            day >= Math.floor(pet.createdAt / dayLength) &&
            day <= Math.floor(pet.updatedAt / dayLength),
        )),
  )

export function parseSavedPet(value: unknown): PetSnapshot {
  const result = savedPetSchema.safeParse(value)
  if (!result.success) throw new InvalidPetDataError()
  return result.data
}
