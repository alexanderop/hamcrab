import { ShellGamePage } from './pages/shell-game'
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { PetNamePage } from './pages/pet-name'
import { FoodMenuPage } from './pages/food-menu'

const { When, Then } = createBdd()

When('I rename my companion to {string}', async ({ page }, name: string) => {
  await new PetNamePage(page).rename(name)
})

Then(
  'my companion is called {string} throughout the home',
  async ({ page }, name: string) => {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await expect(
      page.getByRole('img', {
        name: `${name}, a hamster in a crab costume. Drag or use the arrow keys to rotate.`,
        exact: false,
      }),
    ).toBeVisible()
    await expect(page.locator('.message-strip')).toContainText(name)
    const settings = new PetNamePage(page)
    await settings.open()
    await expect(settings.input).toHaveValue(name)
    await settings.close()
  },
)

Then(
  'the German food menu and feedback call my companion {string}',
  async ({ page }, name: string) => {
    const menu = new FoodMenuPage(page, name)
    await menu.open()
    await expect(
      menu.dialog.getByRole('group', { name: `Was mag ${name} heute?` }),
    ).toBeVisible()
    await menu.give()
    await expect(menu.dialog).not.toBeVisible()
    await expect(page.locator('.message-strip')).toHaveText(
      `▸Mmmh! ${name} liebt sein Franzbrötchen.`,
    )
  },
)

When(
  'I rename and play in two homes at the same time',
  async ({ page, context }) => {
    const second = await context.newPage()
    await second.goto('./')
    await expect(
      second.getByRole('button', { name: 'Play', exact: true }),
    ).toBeEnabled()
    const settings = new PetNamePage(page)
    await settings.open()
    await settings.input.fill('Kalle')
    await Promise.all([
      settings.save.click(),
      new ShellGamePage(second).finish(),
    ])
    await expect(settings.dialog.getByRole('status')).toHaveText('Name saved.')
    await expect(second.locator('.message-strip')).toContainText(
      'Playing makes',
    )
    await settings.close()
  },
)

Then(
  'the long name and settings controls fit the screen',
  async ({ page, browserName }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Captain Knusperkrabbe XL',
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Settings', exact: true }),
    ).toBeInViewport({ ratio: 1 })
    const settings = new PetNamePage(page)
    await settings.open()
    await expect(settings.dialog).toBeInViewport({ ratio: 1 })
    await settings.input.scrollIntoViewIfNeeded()
    await expect(settings.input).toBeInViewport({ ratio: 1 })
    await expect(settings.save).toBeInViewport({ ratio: 1 })
    expect(
      await settings.dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    await settings.input.fill('123456789012345678901234567890')
    await expect(settings.input).toHaveValue('123456789012345678901234')
    await settings.input.fill('Captain Knusperkrabbe XL')
    await page.screenshot({
      path: `test-results/name-settings-${page.viewportSize()!.width}-${browserName}.png`,
    })
    await settings.close()
  },
)
