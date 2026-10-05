import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { createPet, hatchPet } from '../../src/features/pet/domain/pet'
import { dayLength, neutralDay } from '../../src/features/pet/domain/lifecycle'
import { LifePage, saveLifeFixture } from './pages/life'
import { ShellGamePage } from './pages/shell-game'

const { Given, When, Then } = createBdd()
const now = Date.parse('2026-10-05T12:00:00Z')
const baby = () => hatchPet(createPet(now), now).pet

Given('my companion needs the toilet', async ({ page }) => {
  await page.clock.setFixedTime(new Date(now))
  const pet = baby()
  await saveLifeFixture(page, {
    ...pet,
    life: {
      ...pet.life,
      health: { waste: 0, unwell: false, nextToiletAt: now + 60_000 },
    },
  })
})
When('I help my companion use the toilet', async ({ page }) => {
  const life = new LifePage(page)
  await life.open()
  await life.dialog
    .getByRole('button', { name: 'Use toilet', exact: true })
    .click()
  await expect(life.dialog).toContainText('Well done!')
  await life.close()
})
Then('my home has no mess', async ({ page }) => {
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-waste',
    '0',
  )
})
Given('my companion has a messy home and feels unwell', async ({ page }) => {
  await page.clock.setFixedTime(new Date(now))
  const pet = baby()
  await saveLifeFixture(page, {
    ...pet,
    life: {
      ...pet.life,
      health: { ...pet.life.health, waste: 3, unwell: true },
    },
  })
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-unwell',
    'true',
  )
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-waste',
    '3',
  )
})
When('I clean the home and give medicine', async ({ page, browserName }) => {
  await page.screenshot({ path: `.audit/companion/unwell-${browserName}.png` })
  const life = new LifePage(page)
  await life.open()
  await life.dialog
    .getByRole('button', { name: 'Clean home', exact: true })
    .click()
  await life.dialog
    .getByRole('button', { name: 'Give medicine', exact: true })
    .click()
  await expect(life.dialog).toContainText('Your friend feels well again.')
  await life.close()
})
Then(
  'my companion is well in a clean habitat after reload',
  async ({ page, browserName }) => {
    await page.reload()
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-unwell',
      'false',
    )
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-waste',
      '0',
    )
    await page.screenshot({
      path: `.audit/companion/recovered-${browserName}.png`,
    })
  },
)
When('I finish a perfect shell game', async ({ page, browserName }) => {
  const game = new ShellGamePage(page)
  await game.open()
  await page.screenshot({ path: `.audit/companion/game-${browserName}.png` })
  await game.finishOpen()
})
When('I choose my cap, shell and pebble', async ({ page }) => {
  const life = new LifePage(page)
  await life.open('My things')
  for (const name of ['Cap', 'Shell', 'Pebble']) {
    await life.dialog.getByRole('radio', { name, exact: true }).click()
    await expect(
      life.dialog.getByRole('radio', { name, exact: true }),
    ).toBeChecked()
  }
  await life.close()
})
Then('my selected belongings are visible', async ({ page, browserName }) => {
  const habitat = page.locator('[data-renderer]')
  await expect(habitat).toHaveAttribute('data-outfit', 'cap')
  await expect(habitat).toHaveAttribute('data-toy', 'shell')
  await expect(habitat).toHaveAttribute('data-decoration', 'pebble')
  await expect(habitat).toHaveAttribute('data-renderer', 'ready')
  await page.screenshot({
    path: `.audit/companion/belongings-${browserName}.png`,
  })
})
Then('my last game score is remembered', async ({ page }) => {
  const life = new LifePage(page)
  await life.open()
  await expect(life.dialog).toContainText('5 / 5')
  await life.close()
})
Given(
  'my companion has earned the {word} stage',
  async ({ page }, stage: string) => {
    if (stage !== 'child' && stage !== 'teen')
      throw new Error('Unexpected growth fixture')
    await page.clock.setFixedTime(new Date(now))
    const pet = baby()
    const count = stage === 'child' ? 3 : 6
    const day = Math.floor(now / dayLength)
    await saveLifeFixture(page, {
      ...pet,
      createdAt: now - 10 * dayLength,
      lifecycle: {
        stage,
        days: Array.from({ length: count }, (_, index) => ({
          ...neutralDay(day - count + index),
          cuddled: true,
        })),
      },
    })
  },
)
Then(
  'the {word} stage is visible in the habitat',
  async ({ page, browserName }, stage: string) => {
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-life-stage',
      stage,
    )
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-renderer',
      'ready',
    )
    await expect(
      page.getByText(stage === 'child' ? 'Child' : 'Teen', { exact: true }),
    ).toBeVisible()
    await page.screenshot({
      path: `.audit/companion/${stage}-${browserName}.png`,
    })
  },
)
Given('my adult companion is ready for a third visit', async ({ page }) => {
  await page.clock.setFixedTime(new Date(now))
  const pet = baby()
  const day = Math.floor(now / dayLength)
  await saveLifeFixture(page, {
    ...pet,
    createdAt: now - 12 * dayLength,
    name: 'Milo',
    lifecycle: {
      stage: 'adult',
      identity: { status: 'chosen', variant: 'cuddly' },
    },
    life: { ...pet.life, visits: [day - 2, day - 1] },
  })
})
When(
  'I visit Coral and choose a new generation',
  async ({ page, browserName }) => {
    const life = new LifePage(page)
    await life.open('Family')
    await life.dialog
      .getByRole('button', { name: 'Visit Coral', exact: true })
      .click()
    await life.dialog
      .getByRole('button', { name: 'Next generation', exact: true })
      .click()
    await page.screenshot({
      path: `.audit/companion/family-choice-${browserName}.png`,
    })
    await life.dialog
      .getByRole('button', {
        name: 'Archive this adult and start a new egg',
        exact: true,
      })
      .click()
    await life.close()
  },
)
Then(
  "a new egg and my adult's album entry survive reload",
  async ({ page, browserName }) => {
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Help hatch', exact: true }),
    ).toBeEnabled()
    const life = new LifePage(page)
    await life.open('Family')
    await expect(life.dialog).toContainText('Milo')
    await expect(life.dialog).toContainText('Generation 2')
    await page.screenshot({ path: `.audit/companion/album-${browserName}.png` })
    await life.close()
  },
)
When('I set bedtime to the next hour', async ({ page }) => {
  const life = new LifePage(page)
  await life.open('Routine')
  await life.dialog
    .getByRole('checkbox', { name: 'Use an automatic routine', exact: true })
    .check()
  await life.dialog.getByLabel('Bedtime (hour)', { exact: true }).fill('13')
  await life.dialog.getByLabel('Wake time (hour)', { exact: true }).fill('8')
  await life.dialog
    .getByLabel('Fixed UTC offset (minutes)', { exact: true })
    .fill('0')
  await life.dialog
    .getByRole('button', { name: 'Save routine', exact: true })
    .click()
  await expect(life.dialog).toContainText('Routine saved.')
  await life.close()
})
When('the scheduled bedtime arrives', async ({ page }) => {
  await page.clock.setFixedTime(new Date(now + 3_600_000))
  await page.reload()
})
When(
  "I explore my companion's life with the keyboard",
  async ({ page, browserName }) => {
    const life = new LifePage(page)
    await life.trigger.focus()
    await page.keyboard.press('Enter')
    await expect(life.dialog).toBeInViewport({ ratio: 1 })
    for (const name of ['Care', 'My things', 'Family', 'Routine']) {
      const navigation = life.dialog.getByRole('button', { name, exact: true })
      await navigation.focus()
      await page.keyboard.press('Enter')
      expect(
        await life.dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true)
    }
    await page.screenshot({
      path: `.audit/companion/mobile-${browserName}.png`,
    })
    await life.close()
  },
)
