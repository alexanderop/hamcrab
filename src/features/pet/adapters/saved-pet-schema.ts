import { z } from 'zod'
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
const savedPetSchema = z
  .union([
    z.object({ ...petFields, friendship }).strict(),
    z
      .object(petFields)
      .strict()
      .transform((pet) => ({
        ...pet,
        friendship: createFriendship(pet.updatedAt, pet.careCount),
      })),
  ])
  .refine(
    (pet) =>
      pet.updatedAt >= pet.createdAt &&
      pet.friendship.daily.day <= Math.floor(pet.updatedAt / 86_400_000),
  )

export function parseSavedPet(value: unknown): PetSnapshot {
  const result = savedPetSchema.safeParse(value)
  if (!result.success) throw new InvalidPetDataError()
  return result.data
}
