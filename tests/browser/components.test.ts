import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import NameHarness from './NameHarness.vue'
import MenuHarness from './MenuHarness.vue'
import SessionHarness from './SessionHarness.vue'
import { createPetService } from '../../src/features/pet/application/pet-service'
import { memoryPetRepository } from '../support/pet-repository'
import {
  InvalidPetDataError,
  type PetRepository,
} from '../../src/features/pet/application/ports'

it('explains invalid names, trims valid input and confirms a successful save', async () => {
  render(NameHarness)
  const input = page.getByRole('textbox', { name: 'Pet name' })
  const save = page.getByRole('button', { name: 'Save name' })
  await expect.element(save).toBeDisabled()
  await input.fill('   ')
  await expect.element(input).toHaveAttribute('aria-invalid', 'true')
  await expect.element(save).toBeDisabled()
  await expect.element(page.getByRole('alert')).toBeVisible()
  await input.fill('  Krümel  ')
  await userEvent.keyboard('{Enter}')
  await expect.element(page.getByRole('heading')).toHaveTextContent('Krümel')
  await expect.element(input).toHaveValue('Krümel')
  await expect
    .element(page.getByRole('status'))
    .toHaveTextContent('Name saved.')
})
it('leaves an unfinished or failed name out of the companion state', async () => {
  render(NameHarness, { props: { fail: true } })
  await page.getByRole('textbox', { name: 'Pet name' }).fill('Nemo')
  await expect.element(page.getByRole('heading')).toHaveTextContent('Pinchy')
  await page.getByRole('button', { name: 'Save name' }).click()
  await expect
    .element(page.getByRole('alert'))
    .toHaveTextContent('Save unavailable')
  await expect.element(page.getByRole('heading')).toHaveTextContent('Pinchy')
  await expect.element(page.getByRole('status')).not.toBeInTheDocument()
})
it('browses without serving and restores focus when the native dialog closes', async () => {
  render(MenuHarness)
  const trigger = page.getByRole('button', { name: 'Feed', exact: true })
  await trigger.click()
  await page.getByRole('radio', { name: 'Döner kebab' }).click()
  await expect
    .element(page.getByRole('radio', { name: 'Döner kebab' }))
    .toBeChecked()
  await userEvent.keyboard('{Escape}')
  await expect
    .element(page.getByRole('dialog', { includeHidden: true }))
    .not.toBeVisible()
  await expect.element(trigger).toHaveFocus()
  await expect
    .element(page.getByRole('status'))
    .toHaveTextContent('Nothing served')
  await trigger.click()
  await page.getByRole('button', { name: 'Give to Pinchy' }).click()
  await expect.element(page.getByRole('status')).toHaveTextContent('doener')
})
it('shows a storage error, blocks care, and recovers through retry', async () => {
  let available = false
  const memory = memoryPetRepository()
  const repository: PetRepository = {
    transact(change) {
      if (!available) return Promise.reject(new InvalidPetDataError())
      return memory.transact(change)
    },
  }
  render(SessionHarness, {
    props: {
      service: createPetService(repository, { now: () => 1_800_000_000_000 }),
    },
  })
  await expect.element(page.getByRole('alert')).toHaveTextContent('invalid')
  await expect
    .element(page.getByRole('button', { name: 'Play' }))
    .toBeDisabled()
  available = true
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect.element(page.getByRole('button', { name: 'Play' })).toBeEnabled()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect.element(page.getByText('Gestures: 1')).toBeVisible()
  await page.getByRole('button', { name: 'Rename' }).click()
  await expect.element(page.getByRole('heading')).toHaveTextContent('Milo')
  await expect.element(page.getByRole('status')).toHaveTextContent('Saved')
})

it.each(['Play', 'Rename'])(
  'keeps saved state intact when %s cannot be persisted',
  async (action) => {
    let unavailable = false
    const memory = memoryPetRepository()
    const repository: PetRepository = {
      transact(change) {
        return unavailable
          ? Promise.reject(new Error('Storage full'))
          : memory.transact(change)
      },
    }
    render(SessionHarness, {
      props: {
        service: createPetService(repository, { now: () => 1_800_000_000_000 }),
      },
    })
    await expect.element(page.getByRole('status')).toHaveTextContent('Saved')
    unavailable = true
    await page.getByRole('button', { name: action }).click()
    await expect.element(page.getByRole('alert')).toHaveTextContent('save')
    await expect.element(page.getByRole('heading')).toHaveTextContent('Pinchy')
    await expect.element(page.getByText('Gestures: 0')).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: action }))
      .toBeDisabled()
  },
)
