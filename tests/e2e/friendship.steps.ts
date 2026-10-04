import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { FoodMenuPage } from './pages/food-menu'
import { FriendshipPage } from './pages/friendship'

const { Given, When, Then } = createBdd()

Given('I arrive on a snack-wish day', async ({ page }) => {
  await new FriendshipPage(page).visit()
})
Then(
  'my ribbon and fulfilled wish are visible',
  async ({ page, browserName }) => {
    const home = new FriendshipPage(page)
    await expect(home.summary).toContainText('Wish fulfilled')
    await expect(home.habitat).toHaveAttribute('data-ribbon', 'true')
    await expect(home.habitat).toHaveAccessibleName(
      /A little bow on your crab costume/,
    )
    await page.screenshot({
      path: `test-results/friendship-ribbon-${browserName}.png`,
    })
  },
)
Then('I have {int} friendship points', async ({ page }, points: number) => {
  await new FriendshipPage(page).expectPoints(points)
})
Given('I am one point away from the strawberry', async ({ page }) => {
  const home = new FriendshipPage(page)
  await home.visit()
  await home.seed(29)
})
Then('the strawberry is still locked', async ({ page }) => {
  const menu = new FoodMenuPage(page)
  await menu.open()
  await expect(
    menu.dialog.getByRole('radio', { name: 'Strawberry', exact: true }),
  ).toBeDisabled()
  await menu.close()
})
When('I cuddle my companion', async ({ page }) => {
  await page.getByRole('button', { name: 'Pet', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
})
When('I serve my selected friendship snack', async ({ page }) => {
  await new FoodMenuPage(page).give()
})
Then('Pinchy enjoys the strawberry', async ({ page }) => {
  await expect(
    page.getByText('Sweet! Pinchy wiggles with strawberry joy.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(new FriendshipPage(page).habitat).toHaveAttribute(
    'data-snack',
    'strawberry',
  )
  await page.reload()
  await new FriendshipPage(page).expectPoints(43)
})
Given('I am one point away from the play ball', async ({ page }) => {
  const home = new FriendshipPage(page)
  await home.visit()
  await home.seed(59)
})
Then('the new ball participates in play', async ({ page, browserName }) => {
  const home = new FriendshipPage(page)
  await expect(home.habitat).toHaveAttribute('data-ball', 'true')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(home.habitat).toHaveAttribute('data-ball-playing', 'true')
  await page.screenshot({
    path: `test-results/friendship-ball-play-${browserName}.png`,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
})
Given('I am one point away from the home flower', async ({ page }) => {
  const home = new FriendshipPage(page)
  await home.visit('2026-01-02T12:00:00Z')
  await home.seed(99)
})
Then(
  'all friendship rewards decorate my home',
  async ({ page, browserName }) => {
    const home = new FriendshipPage(page)
    await expect(home.habitat).toHaveAttribute('data-flower', 'true')
    await expect(home.habitat).toHaveAttribute('data-ball', 'true')
    await expect(home.habitat).toHaveAttribute('data-ribbon', 'true')
    await expect(home.habitat).toHaveAccessibleName(
      /A flower to brighten your home/,
    )
    await home.expectPoints(100)
    await page.screenshot({
      path: `test-results/friendship-rewards-${browserName}.png`,
    })
    await page.reload()
    await expect(home.summary).toContainText('All five levels reached!')
    await expect(home.habitat).toHaveAttribute('data-flower', 'true')
  },
)
Given('I arrive with full happiness on a play-wish day', async ({ page }) => {
  const home = new FriendshipPage(page)
  await home.visit('2026-01-02T12:00:00Z')
  await home.seed(0, 100)
})
When('I play from two homes at once', async ({ page, context }) => {
  const second = await context.newPage()
  await new FriendshipPage(second).visit('2026-01-02T12:00:00Z')
  await Promise.all([
    page.getByRole('button', { name: 'Play', exact: true }).click(),
    second.getByRole('button', { name: 'Play', exact: true }).click(),
  ])
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
  await expect(second.getByRole('status')).toContainText(
    'Your progress is saved',
  )
  await page.bringToFront()
})
Then('the fulfilled wish appears in both homes', async ({ context }) => {
  for (const home of context.pages()) {
    await home.bringToFront()
    await expect(new FriendshipPage(home).summary).toContainText(
      'Wish fulfilled',
    )
    await new FriendshipPage(home).expectPoints(6)
  }
})
When(
  'I read friendship details on a small screen',
  async ({ page, browserName }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const home = new FriendshipPage(page)
    await home.summary.click()
    await expect(home.dialog).toBeInViewport({ ratio: 1 })
    const rules = home.dialog.getByText(/Useful feeding and play earn 4 points/)
    await rules.scrollIntoViewIfNeeded()
    await expect(rules).toBeInViewport({ ratio: 1 })
    expect(
      await home.dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: `test-results/friendship-details-mobile-${browserName}.png`,
    })
    await page.keyboard.press('Escape')
  },
)
Then('the friendship summary regains keyboard focus', async ({ page }) => {
  await expect(new FriendshipPage(page).summary).toBeFocused()
})

Then('my friendship summary speaks German', async ({ page }) => {
  const summary = page.getByRole('button', {
    name: 'Freundschaft ansehen',
    exact: true,
  })
  await expect(summary).toContainText('Noch 20 Punkte bis Erdbeere')
  await expect(summary).toContainText('Wunsch erfüllt')
  await expect(summary).not.toContainText('Ribbon unlocked')
  await expect(summary).not.toContainText('Wish fulfilled')
})
