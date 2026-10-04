import { z } from 'zod'
import { parsePetName, type PetSnapshot } from '../domain/pet'
import { InvalidPetDataError } from '../application/ports'

const meter = z.number().finite().min(0).max(100)
const savedPetSchema = z
  .object({
    version: z.literal(1),
    name: z
      .string()
      .trim()
      .refine((name) => parsePetName(name).success),
    fullness: meter,
    happiness: meter,
    energy: meter,
    sleeping: z.boolean(),
    careCount: z.number().int().nonnegative(),
    createdAt: z.number().finite().nonnegative(),
    updatedAt: z.number().finite().nonnegative(),
  })
  .strict()
  .refine((pet) => pet.updatedAt >= pet.createdAt)

export function parseSavedPet(value: unknown): PetSnapshot {
  const result = savedPetSchema.safeParse(value)
  if (!result.success) throw new InvalidPetDataError()
  return result.data
}
