import { expect, it } from 'vitest'
import { createPetService } from '../../src/features/pet/application/pet-service'
import { createPet } from '../../src/features/pet/domain/pet'
import {
  InvalidPetDataError,
  type PetRepository,
} from '../../src/features/pet/application/ports'
import { memoryPetRepository } from '../support/pet-repository'

const now = 1_800_000_000_000
it('creates a new companion once and restores the latest saved state', async () => {
  const repository = memoryPetRepository()
  const service = createPetService(repository, { now: () => now })
  expect(await service.load()).toEqual(createPet(now))
  await service.hatch()
  await service.care({ type: 'feed', food: 'doener' })
  expect(
    await createPetService(repository, { now: () => now }).load(),
  ).toMatchObject({ fullness: 95, happiness: 86, careCount: 1 })
})
it('renames a sleeping companion without changing its saved care history', async () => {
  let time = now
  const service = createPetService(memoryPetRepository(), { now: () => time })
  await service.hatch()
  await service.care({ type: 'sleep' })
  time += 7_200_000
  expect(await service.rename('  Schlummer  ')).toMatchObject({
    name: 'Schlummer',
    sleeping: true,
    energy: 100,
    careCount: 1,
  })
  expect(await service.load()).toMatchObject({
    name: 'Schlummer',
    sleeping: true,
    fullness: 57,
    careCount: 1,
  })
})
it('rejects invalid names without changing the saved name', async () => {
  const service = createPetService(memoryPetRepository(createPet(now)), {
    now: () => now,
  })
  expect(await service.rename(' ')).toBeNull()
  expect((await service.load()).name).toBe('Pinchy')
})
it('uses the latest stored state when deciding whether a meal is allowed', async () => {
  const repo = memoryPetRepository()
  const first = createPetService(repo, { now: () => now })
  const second = createPetService(repo, { now: () => now })
  await first.load()
  await first.hatch()
  await second.care({ type: 'sleep' })
  expect(await first.care({ type: 'feed', food: 'doener' })).toMatchObject({
    accepted: false,
    message: 'sleeping',
  })
  expect(await first.load()).toMatchObject({ fullness: 65, careCount: 1 })
})
it.each([new InvalidPetDataError(), new Error('disk unavailable')])(
  'preserves storage error identity',
  async (cause) => {
    const repo: PetRepository = {
      transact: async () => {
        throw cause
      },
    }
    const service = createPetService(repo, { now: () => now })
    await expect(service.load()).rejects.toBe(cause)
    await expect(service.care({ type: 'play' })).rejects.toBe(cause)
    await expect(service.rename('Milo')).rejects.toBe(cause)
  },
)
