import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import LifeHarness from './LifeHarness.vue'
import { lifeView } from '../../src/features/pet/domain/life'
import { createPet, hatchPet } from '../../src/features/pet/domain/pet'
import { createPetService } from '../../src/features/pet/application/pet-service'
import { memoryPetRepository } from '../support/pet-repository'

function service() {
  const now = Date.UTC(2026, 9, 5, 12)
  return createPetService(
    memoryPetRepository(hatchPet(createPet(now), now).pet),
    { now: () => now },
  )
}
it('selects equipment, edits a fixed routine and returns keyboard focus', async () => {
  const petService = service()
  render(LifeHarness, { props: { service: petService } })
  await expect
    .element(page.getByRole('button', { name: 'Play', exact: true }))
    .toBeEnabled()
  const trigger = page.getByRole('button', {
    name: 'Your Hamcrab',
    exact: true,
  })
  await trigger.click()
  await page.getByRole('button', { name: 'My things', exact: true }).click()
  await page.getByRole('radio', { name: 'Cap', exact: true }).click()
  await expect
    .element(page.getByRole('radio', { name: 'Cap', exact: true }))
    .toBeChecked()
  expect(lifeView(await petService.load()).outfit).toBe('cap')
  await page.getByRole('button', { name: 'Routine', exact: true }).click()
  await page.getByRole('checkbox').click()
  await page.getByRole('spinbutton', { name: 'Bedtime (hour)' }).fill('22')
  await page.getByRole('spinbutton', { name: 'Wake time (hour)' }).fill('7')
  await page
    .getByRole('spinbutton', { name: 'Fixed UTC offset (minutes)' })
    .fill('120')
  await page.getByRole('button', { name: 'Save routine' }).click()
  await expect
    .element(
      page
        .getByRole('dialog', { name: 'Your Hamcrab' })
        .getByText('Routine saved.', { exact: true }),
    )
    .toBeVisible()
  expect(lifeView(await petService.load()).routine).toEqual({
    enabled: true,
    bedtime: 22,
    wakeHour: 7,
    utcOffsetMinutes: 120,
  })
  await userEvent.keyboard('{Escape}')
  await expect.element(trigger).toHaveFocus()
})
it('plays five real rounds with keyboard choices and restores focus', async () => {
  render(LifeHarness, { props: { service: service() } })
  const trigger = page.getByRole('button', { name: 'Play', exact: true })
  await trigger.click()
  for (let round = 0; round < 5; round++) {
    const clue = page.getByText(/Remember shell [123]/)
    await expect.element(clue).toBeVisible()
    const target = clue
      .element()
      .textContent?.match(/Remember shell ([123])/)?.[1]
    expect(target).toBeDefined()
    await page.getByRole('button', { name: 'Ready', exact: true }).click()
    const shell = page.getByRole('button', {
      name: `Shell ${target}`,
      exact: true,
    })
    ;(shell.element() as HTMLElement).focus()
    await userEvent.keyboard('{Enter}')
  }
  await expect
    .element(
      page
        .getByRole('dialog', { name: 'Shell game' })
        .getByText('Pearls found: 5 / 5'),
    )
    .toBeVisible()
  await page.getByRole('button', { name: 'Close game' }).click()
  await expect.element(trigger).toHaveFocus()
})
it('keeps a failed game round retryable without losing the attempt', async () => {
  const base = service()
  let fail = true
  render(LifeHarness, {
    props: {
      service: {
        ...base,
        life: async (command) => {
          if (command.type === 'guessShell' && fail) {
            fail = false
            throw new Error('unavailable')
          }
          return base.life(command)
        },
      },
    },
  })
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect.element(page.getByText(/Remember shell [123]/)).toBeVisible()
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await page.getByRole('button', { name: 'Shell 1', exact: true }).click()
  await expect.element(page.getByRole('alert')).toHaveTextContent('save')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect
    .element(page.getByRole('button', { name: 'Shell 1', exact: true }))
    .toBeEnabled()
  await page.getByRole('button', { name: 'Shell 1', exact: true }).click()
  await expect.element(page.getByText(/Round 2 \/ 5/)).toBeVisible()
})
