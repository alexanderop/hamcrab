import { z } from 'zod'

const meter = z.number().finite().min(0).max(100)

export const petSnapshotSchema = z
  .object({
    version: z.literal(1),
    name: z.literal('Pinchy'),
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

export type PetSnapshot = z.infer<typeof petSnapshotSchema>
export type CareAction = 'feed' | 'play' | 'sleep' | 'wake' | 'pet'
export type CareMessage =
  CareAction | 'sleeping' | 'tired' | 'alreadySleeping' | 'alreadyAwake'
export type CareResult = {
  pet: PetSnapshot
  accepted: boolean
  message: CareMessage
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))

export function createPet(now: number): PetSnapshot {
  return {
    version: 1,
    name: 'Pinchy',
    fullness: 65,
    happiness: 78,
    energy: 72,
    sleeping: false,
    careCount: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function advancePet(pet: PetSnapshot, now: number): PetSnapshot {
  const hours = Math.min(24, Math.max(0, now - pet.updatedAt) / 3_600_000)
  return {
    ...pet,
    fullness: clamp(pet.fullness - 4 * hours),
    happiness: clamp(pet.happiness - 3 * hours),
    energy: clamp(pet.energy + (pet.sleeping ? 20 : -5) * hours),
    updatedAt: Math.max(pet.updatedAt, now),
  }
}

export function careForPet(
  snapshot: PetSnapshot,
  action: CareAction,
  now: number,
): CareResult {
  const pet = advancePet(snapshot, now)
  if (pet.sleeping && action !== 'wake' && action !== 'sleep') {
    return {
      pet,
      accepted: false,
      message: 'sleeping',
    }
  }
  if (action === 'play' && pet.energy < 10) {
    return {
      pet,
      accepted: false,
      message: 'tired',
    }
  }
  if (
    (action === 'sleep' && pet.sleeping) ||
    (action === 'wake' && !pet.sleeping)
  ) {
    return {
      pet,
      accepted: false,
      message: pet.sleeping ? 'alreadySleeping' : 'alreadyAwake',
    }
  }
  const cared = { ...pet, careCount: pet.careCount + 1 }
  switch (action) {
    case 'feed':
      return {
        pet: { ...cared, fullness: clamp(pet.fullness + 20) },
        accepted: true,
        message: 'feed',
      }
    case 'play':
      return {
        pet: {
          ...cared,
          happiness: clamp(pet.happiness + 15),
          energy: clamp(pet.energy - 10),
        },
        accepted: true,
        message: 'play',
      }
    case 'pet':
      return {
        pet: { ...cared, happiness: clamp(pet.happiness + 5) },
        accepted: true,
        message: 'pet',
      }
    case 'sleep':
      return {
        pet: { ...cared, sleeping: true },
        accepted: true,
        message: 'sleep',
      }
    case 'wake':
      return {
        pet: { ...cared, sleeping: false },
        accepted: true,
        message: 'wake',
      }
  }
}
