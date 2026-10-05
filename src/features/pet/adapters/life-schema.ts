import { z } from 'zod'
import { parsePetName } from '../domain/pet'
import { shellTarget } from '../domain/life'
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const flags = z
  .object({ ribbon: z.boolean(), ball: z.boolean(), flower: z.boolean() })
  .strict()
export const lifeSchema = z
  .object({
    health: z
      .object({
        waste: integer.max(3),
        nextToiletAt: integer,
        unwell: z.boolean(),
      })
      .strict(),
    personality: z.enum(['curious', 'playful', 'gentle']),
    favoriteFood: z.enum([
      'franzbroetchen',
      'doener',
      'augustiner',
      'strawberry',
    ]),
    favoriteToy: z.enum(['shell', 'ball']),
    equipment: z
      .object({
        outfit: z.enum(['none', 'cap', 'ribbon']),
        toy: z.enum(['none', 'shell', 'ball']),
        decoration: z.enum(['none', 'pebble', 'flower']),
      })
      .strict(),
    selected: z
      .object({
        outfit: z.boolean(),
        toy: z.boolean(),
        decoration: z.boolean(),
      })
      .strict(),
    owned: flags,
    generation: integer.min(1),
    visits: z
      .array(integer)
      .max(3)
      .refine((days) => days.every((day, i) => i === 0 || day > days[i - 1]!)),
    album: z.array(
      z
        .object({
          generation: integer.min(1),
          name: z.string().refine((name) => parsePetName(name).success),
          variant: z.enum(['gourmet', 'whirlwind', 'cuddly']),
          bornAt: integer,
          movedOutAt: integer,
        })
        .strict()
        .refine((entry) => entry.movedOutAt >= entry.bornAt),
    ),
    routine: z
      .object({
        enabled: z.boolean(),
        bedtime: integer.max(23),
        wakeHour: integer.max(23),
        utcOffsetMinutes: z.number().int().min(-840).max(840),
      })
      .strict()
      .refine((routine) => routine.bedtime !== routine.wakeHour),
    sleep: z
      .object({
        mode: z.enum(['awake', 'manual', 'night', 'nap']),
        until: integer,
        overrideUntil: integer,
        napDay: z.number().int().min(-1).max(Number.MAX_SAFE_INTEGER),
      })
      .strict(),
    gameSequence: integer,
    game: z
      .object({
        id: integer.min(1),
        generation: integer.min(1),
        round: integer.max(4),
        score: integer.max(4),
        target: z.union([z.literal(0), z.literal(1), z.literal(2)]),
        lastCorrect: z.boolean().nullable(),
      })
      .strict()
      .nullable(),
    lastGame: z
      .object({ id: integer.min(1), score: integer.max(5) })
      .strict()
      .nullable(),
  })
  .strict()
  .refine(
    (life) =>
      life.album.length === life.generation - 1 &&
      life.album.every(
        (entry, i) =>
          entry.generation === i + 1 &&
          (i === 0 || entry.bornAt >= life.album[i - 1]!.movedOutAt),
      ) &&
      (!life.game ||
        (life.game.id === life.gameSequence &&
          life.game.generation === life.generation &&
          life.game.score <= life.game.round &&
          life.game.target ===
            shellTarget(life.game.id, life.game.generation, life.game.round) &&
          (life.game.round === 0
            ? life.game.lastCorrect === null
            : life.game.lastCorrect !== null))) &&
      (!life.lastGame || life.lastGame.id <= life.gameSequence) &&
      (life.sleep.mode === 'nap' ||
        life.sleep.mode === 'manual' ||
        life.sleep.until === 0) &&
      (life.sleep.mode !== 'nap' ||
        (life.sleep.until > 0 && life.sleep.napDay >= 0)) &&
      (life.sleep.mode !== 'manual' ||
        (life.routine.enabled
          ? life.sleep.until > 0
          : life.sleep.until === 0)) &&
      (life.health.waste < 3 || life.health.unwell) &&
      (life.routine.enabled ||
        (life.sleep.mode !== 'night' && life.sleep.mode !== 'nap')),
  )
