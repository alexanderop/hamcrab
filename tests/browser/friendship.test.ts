import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import FriendshipPanel from '../../src/features/pet/ui/FriendshipPanel.vue'
import MenuHarness from './MenuHarness.vue'
import { createPet } from '../../src/features/pet/domain/pet'
import { friendshipView } from '../../src/features/pet/domain/friendship'
import { messages } from '../../src/features/settings/ui/messages'

const text = messages.en('Pinchy')
const pet = createPet(6 * 86_400_000)

it('shows the next reward and wish and restores focus after reading details', async () => {
  render(FriendshipPanel, {
    props: {
      view: friendshipView(pet),
      ready: true,
      loading: text.loading,
      text: text.friendship,
      celebration: '',
    },
  })
  const trigger = page.getByRole('button', { name: 'View friendship' })
  await expect.element(trigger).toHaveTextContent('10 points to Ribbon')
  await expect.element(trigger).toHaveTextContent('Share a snack with Pinchy')
  await trigger.click()
  await expect
    .element(page.getByRole('dialog', { name: 'Your friendship' }))
    .toBeVisible()
  await expect
    .element(page.getByRole('progressbar', { name: 'Friendship points' }))
    .toHaveAttribute('value', '0')
  await expect.element(page.getByRole('listitem')).toHaveLength(5)
  await expect
    .element(page.getByText(/A new wish arrives at 00:00 UTC/))
    .toBeVisible()
  await userEvent.keyboard('{Escape}')
  await expect.element(trigger).toHaveFocus()
})

it('keeps loading neutral and does not invent an unlock announcement', async () => {
  const screen = await render(FriendshipPanel, {
    props: {
      view: friendshipView(pet),
      ready: false,
      loading: text.loading,
      text: text.friendship,
      celebration: '',
    },
  })
  const trigger = page.getByRole('button', { name: 'View friendship' })
  await expect.element(trigger).toBeDisabled()
  await expect.element(trigger).toHaveTextContent(text.loading)
  await expect.element(trigger).not.toHaveTextContent('Ribbon')
  expect(screen.container.querySelector('[aria-live]')?.textContent).toBe('')
})

it('shows completed friendship without promising more points', async () => {
  render(FriendshipPanel, {
    props: {
      view: friendshipView({ friendship: { ...pet.friendship, points: 100 } }),
      ready: true,
      loading: text.loading,
      text: text.friendship,
      celebration: '',
    },
  })
  await expect
    .element(page.getByRole('button', { name: 'View friendship' }))
    .toHaveTextContent('All five levels reached!')
  await page.getByRole('button', { name: 'View friendship' }).click()
  await expect
    .element(page.getByText('+6 friendship points'))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('progressbar'))
    .toHaveAttribute('value', '100')
})

it('shows local celebrations inside the compact summary', async () => {
  render(FriendshipPanel, {
    props: {
      view: friendshipView({ friendship: { ...pet.friendship, points: 10 } }),
      ready: true,
      loading: text.loading,
      text: text.friendship,
      celebration: 'Ribbon unlocked! Wish fulfilled.',
    },
  })
  await expect
    .element(page.getByRole('button', { name: 'View friendship' }))
    .toHaveTextContent('Ribbon unlocked! Wish fulfilled.')
})

it.each([false, true])(
  'makes the strawberry selectable only when unlocked: %s',
  async (unlocked) => {
    render(MenuHarness, { props: { unlocked } })
    await page.getByRole('button', { name: 'Feed', exact: true }).click()
    const strawberry = page.getByRole('radio', { name: 'Strawberry' })
    if (unlocked) {
      await expect.element(strawberry).toBeEnabled()
      await strawberry.click()
      await page.getByRole('button', { name: 'Give to Pinchy' }).click()
      await expect
        .element(page.getByRole('status'))
        .toHaveTextContent('strawberry')
    } else {
      await expect.element(strawberry).toBeDisabled()
      await expect
        .element(page.getByText('· Unlocks at friendship level 3'))
        .toBeVisible()
    }
  },
)
