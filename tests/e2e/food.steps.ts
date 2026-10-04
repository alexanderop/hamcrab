import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { FoodMenuPage } from './pages/food-menu'

const { When, Then } = createBdd()

When('I give Pinchy {string}', async ({ page }, name: string) => {
  await new FoodMenuPage(page).feed(name)
})

When('I browse {string} in the food menu', async ({ page }, name: string) => {
  const menu = new FoodMenuPage(page)
  await menu.open()
  await menu.choose(name)
})

Then(
  'I can see and rotate its three-dimensional preview',
  async ({ page, browserName, $testInfo }) => {
    $testInfo.setTimeout(60_000)
    const preview = page.locator('[data-snack-renderer]')
    await expect(preview).toHaveAttribute('data-snack-renderer', 'ready')
    const canvas = preview.locator('canvas')
    const before = await canvas.screenshot()
    await preview.focus()
    await page.keyboard.press('ArrowRight')
    await expect
      .poll(async () => before.equals(await canvas.screenshot()))
      .toBe(false)
    const selected = await page
      .getByRole('dialog')
      .locator('input:checked')
      .getAttribute('value')
    await page.screenshot({
      path: `test-results/food-${selected}-${browserName}.png`,
    })
  },
)

When('I dismiss the food menu', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

Then('focus returns to the feed button', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: 'Feed', exact: true }),
  ).toBeFocused()
})

Then(
  'the Döner feedback and care values are shown in German',
  async ({ page }) => {
    await expect(
      page.getByText('Dönerzeit! Pinchy ist satt und glücklich.', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('progressbar', { name: 'Sättigung' }),
    ).toHaveAttribute('aria-valuenow', '95')
    await expect(
      page.getByRole('progressbar', { name: 'Freude' }),
    ).toHaveAttribute('aria-valuenow', '83')
  },
)

When('Pinchy falls asleep in another home', async ({ page, context }) => {
  const second = await context.newPage()
  await second.goto('./')
  await second.getByRole('button', { name: 'Sleep', exact: true }).click()
  await expect(second.getByRole('button', { name: 'Wake up' })).toBeEnabled()
  await page.bringToFront()
})

When('I try to give the selected food', async ({ page }) => {
  const menu = new FoodMenuPage(page)
  const give = menu.dialog.getByRole('button', { name: 'Give to Pinchy' })
  if (await give.isEnabled()) await menu.give()
})

Then('the food menu explains that Pinchy is asleep', async ({ page }) => {
  const menu = new FoodMenuPage(page)
  await expect(menu.dialog.getByRole('alert')).toContainText('Pinchy is asleep')
  await expect(
    menu.dialog.getByRole('button', { name: 'Give to Pinchy' }),
  ).toBeDisabled()
  await menu.close()
  await expect(
    page.getByRole('progressbar', { name: 'Fullness' }),
  ).toHaveAttribute('aria-valuenow', '65')
  await expect(
    page.getByText('1 caring gestures', { exact: true }),
  ).toBeVisible()
})

Then(
  'giving Augustiner shows the bottle in the habitat before it disappears',
  async ({ page, browserName, $testInfo }) => {
    $testInfo.setTimeout(60_000)
    const stage = page.locator('[data-renderer]')
    await expect(stage).toHaveAttribute('data-renderer', 'ready')
    await page.clock.install()
    await page.clock.pauseAt(Date.now())
    const before = await stage.locator('canvas').screenshot()
    await new FoodMenuPage(page).feed('Augustiner beer')
    await page.clock.runFor(100)
    await expect(stage).toHaveAttribute('data-snack', 'bottle')
    expect(before.equals(await stage.locator('canvas').screenshot())).toBe(
      false,
    )
    await page.screenshot({
      path: `test-results/food-bottle-held-${browserName}.png`,
    })
    await page.clock.runFor(3500)
    await expect(stage).not.toHaveAttribute('data-snack')
  },
)

Then(
  'every food choice and the give button are reachable',
  async ({ page, browserName }) => {
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeInViewport({ ratio: 1 })
    for (const name of ['Franzbrötchen', 'Döner kebab', 'Augustiner beer']) {
      const option = dialog.getByRole('radio', { name, exact: true })
      await option.locator('..').scrollIntoViewIfNeeded()
      await expect(option).toBeInViewport({ ratio: 1 })
    }
    const give = dialog.getByRole('button', { name: 'Give to Pinchy' })
    await give.scrollIntoViewIfNeeded()
    await expect(give).toBeInViewport({ ratio: 1 })
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: `test-results/food-mobile-${page.viewportSize()!.width}-${browserName}.png`,
    })
  },
)
