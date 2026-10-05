import { advancePet, careForPet, createPet, type PetSnapshot } from './pet'
import { nextWake } from './routine'
import { dayLength } from './lifecycle'
import {
  createLife,
  lifeView,
  shellTarget,
  syncInventory,
  toiletInterval,
  type LifeCommand,
  type LifeMessage,
  type LifeResult,
} from './life'

export function liveWithPet(
  snapshot: PetSnapshot,
  command: LifeCommand,
  now: number,
): LifeResult {
  const pet = advancePet(snapshot, now)
  const life = syncInventory(pet.life, pet.friendship.points)
  const result = (
    accepted: boolean,
    message: LifeMessage,
    updated = pet,
  ): LifeResult => ({ pet: updated, accepted, message })
  if (command.type === 'setRoutine') {
    const { enabled, bedtime, wakeHour, utcOffsetMinutes } = command
    if (
      ![bedtime, wakeHour, utcOffsetMinutes].every(Number.isInteger) ||
      bedtime < 0 ||
      bedtime > 23 ||
      wakeHour < 0 ||
      wakeHour > 23 ||
      bedtime === wakeHour ||
      Math.abs(utcOffsetMinutes) > 840
    )
      return result(false, 'invalidRoutine')
    const routine = { enabled, bedtime, wakeHour, utcOffsetMinutes }
    const sleep =
      life.sleep.mode === 'night' || life.sleep.mode === 'nap'
        ? { ...life.sleep, mode: 'awake' as const, until: 0 }
        : life.sleep.mode === 'manual'
          ? {
              ...life.sleep,
              until: enabled
                ? nextWake({ ...life, routine }, pet.updatedAt)
                : 0,
            }
          : life.sleep
    return result(
      true,
      'routineSaved',
      advancePet(
        {
          ...pet,
          sleeping: sleep.mode !== 'awake',
          life: { ...life, routine, sleep },
        },
        pet.updatedAt,
      ),
    )
  }
  if (command.type === 'equip') {
    if (
      (command.item === 'ribbon' ||
        command.item === 'ball' ||
        command.item === 'flower') &&
      !life.owned[command.item]
    )
      return result(false, 'itemLocked')
    return result(true, 'equipped', {
      ...pet,
      life: {
        ...life,
        equipment: { ...life.equipment, [command.slot]: command.item },
        selected: { ...life.selected, [command.slot]: true },
      },
    })
  }
  if (pet.lifecycle.stage === 'egg') return result(false, 'egg')
  switch (command.type) {
    case 'clean':
      return result(true, 'cleaned', {
        ...pet,
        life: {
          ...life,
          health: {
            waste: 0,
            unwell: life.health.unwell,
            nextToiletAt: pet.updatedAt + toiletInterval,
          },
        },
      })
    case 'medicine':
      if (!life.health.unwell) return result(false, 'alreadyWell')
      return result(true, 'medicine', {
        ...pet,
        life: {
          ...life,
          health: {
            waste: 0,
            unwell: false,
            nextToiletAt: pet.updatedAt + toiletInterval,
          },
        },
      })
    case 'toilet':
      if (!lifeView(pet).toiletCue) return result(false, 'noToilet')
      return result(true, 'toilet', {
        ...pet,
        happiness: Math.min(100, pet.happiness + 2),
        life: {
          ...life,
          health: {
            ...life.health,
            nextToiletAt: pet.updatedAt + toiletInterval,
          },
        },
      })
    case 'startGame': {
      if (life.game) return result(true, 'gameStarted', { ...pet, life })
      if (pet.sleeping) return result(false, 'sleeping')
      if (pet.energy < 10) return result(false, 'tired')
      const id = life.gameSequence + 1
      return result(true, 'gameStarted', {
        ...pet,
        life: {
          ...life,
          gameSequence: id,
          game: {
            id,
            generation: life.generation,
            round: 0,
            score: 0,
            target: shellTarget(id, life.generation, 0),
            lastCorrect: null,
          },
        },
      })
    }
    case 'cancelGame':
      return result(true, 'gameCancelled', {
        ...pet,
        life: { ...life, game: null },
      })
    case 'guessShell': {
      const game = life.game
      if (
        !game ||
        game.id !== command.gameId ||
        game.round !== command.round ||
        game.generation !== life.generation ||
        ![0, 1, 2].includes(command.shell)
      )
        return result(false, 'staleGame')
      if (pet.sleeping) return result(false, 'sleeping')
      if (pet.energy < 10) return result(false, 'tired')
      const correct = game.target === command.shell
      const score = game.score + Number(correct)
      if (game.round === 4) {
        const played = careForPet(
          { ...pet, life },
          { type: 'play' },
          pet.updatedAt,
        ).pet
        return result(true, 'gameFinished', {
          ...played,
          happiness: Math.min(100, played.happiness + score),
          life: {
            ...played.life,
            game: null,
            lastGame: { id: game.id, score },
          },
        })
      }
      const round = game.round + 1
      return result(true, correct ? 'roundCorrect' : 'roundMissed', {
        ...pet,
        life: {
          ...life,
          game: {
            ...game,
            round,
            score,
            lastCorrect: correct,
            target: shellTarget(game.id, life.generation, round),
          },
        },
      })
    }
    case 'visitCompanion': {
      if (
        pet.lifecycle.stage !== 'adult' ||
        pet.lifecycle.identity.status !== 'chosen'
      )
        return result(false, 'adultRequired')
      const day = Math.floor(pet.updatedAt / dayLength)
      if (life.visits.includes(day) || life.visits.length >= 3)
        return result(false, 'alreadyVisited')
      return result(true, 'companionVisited', {
        ...pet,
        life: { ...life, visits: [...life.visits, day] },
      })
    }
    case 'nextGeneration': {
      if (
        pet.lifecycle.stage !== 'adult' ||
        pet.lifecycle.identity.status !== 'chosen'
      )
        return result(false, 'adultRequired')
      if (
        life.generation !== command.expectedGeneration ||
        life.visits.length < 3
      )
        return result(false, 'familyNotReady')
      const fresh = createPet(pet.updatedAt)
      const personality = createLife(pet.updatedAt + life.generation * 1000)
      return result(true, 'newGeneration', {
        ...fresh,
        friendship: { ...fresh.friendship, points: pet.friendship.points },
        life: {
          ...fresh.life,
          personality: personality.personality,
          favoriteFood: personality.favoriteFood,
          favoriteToy: personality.favoriteToy,
          generation: life.generation + 1,
          routine: life.routine,
          owned: life.owned,
          equipment: life.equipment,
          selected: life.selected,
          gameSequence: life.gameSequence,
          album: [
            ...life.album,
            {
              generation: life.generation,
              name: pet.name,
              variant: pet.lifecycle.identity.variant,
              bornAt: pet.createdAt,
              movedOutAt: pet.updatedAt,
            },
          ],
        },
      })
    }
  }
}
