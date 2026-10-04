import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'

const { When, Then } = createBdd()
let originalCanvas: Buffer
let originalCase: string

class SettingsPage {
  constructor(readonly page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog')
  }

  async open() {
    await this.page
      .getByRole('button', { name: /^(Settings|Einstellungen)$/ })
      .click()
    await expect(this.dialog).toBeVisible()
  }

  async close() {
    await this.dialog.getByRole('button', { name: /^(Done|Fertig)$/ }).click()
    await expect(this.dialog).not.toBeVisible()
  }

  async choose(group: string, option: string) {
    await this.dialog
      .getByRole('group', { name: group, exact: true })
      .getByRole('radio', { name: option, exact: true })
      .check()
  }
}

Then('my home speaks English', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(
    page.getByRole('button', { name: 'Feed', exact: true }),
  ).toBeEnabled()
  await expect(
    page.getByRole('progressbar', { name: 'Happiness' }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
})

When(
  'I choose an ocean case and a lilac costume',
  async ({ page, $testInfo }) => {
    $testInfo.setTimeout(60_000)
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-renderer',
      'ready',
    )
    originalCanvas = await page.locator('canvas').screenshot()
    originalCase = await page
      .locator('.device-shell')
      .evaluate((element) => getComputedStyle(element).backgroundImage)
    const settings = new SettingsPage(page)
    await settings.open()
    await settings.choose('Case colour', 'Ocean')
    await settings.choose('Crab costume', 'Lilac')
    await settings.close()
  },
)

Then(
  'the case and the rendered costume have changed colour',
  async ({ page }) => {
    await expect
      .poll(() =>
        page
          .locator('.device-shell')
          .evaluate((element) => getComputedStyle(element).backgroundImage),
      )
      .not.toBe(originalCase)
    await expect
      .poll(async () =>
        originalCanvas.equals(await page.locator('canvas').screenshot()),
      )
      .toBe(false)
  },
)

When('I switch the language to German', async ({ page }) => {
  const settings = new SettingsPage(page)
  await settings.open()
  await settings.choose('Language', 'Deutsch')
  await settings.close()
})

When('I personalise my home in German', async ({ page }) => {
  const settings = new SettingsPage(page)
  await settings.open()
  await settings.choose('Case colour', 'Ocean')
  await settings.choose('Crab costume', 'Lilac')
  await settings.choose('Language', 'Deutsch')
  await settings.close()
})

Then('the current care message and controls speak German', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('button', { name: 'Füttern' })).toBeEnabled()
  await expect(
    page.getByText('Mmmh! Pinchy liebt sein Franzbrötchen.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    'Euer Spielstand ist gespeichert',
  )
})

When('I reopen my home offline', async ({ page, context }) => {
  await context.setOffline(true)
  await expect(
    page.getByText('Du bist offline. Eure gemeinsame Zeit geht weiter.'),
  ).toBeVisible()
  await page.reload()
  expect(
    await page.evaluate(() =>
      fetch('./offline-settings-proof.txt', { cache: 'no-store' }).then(
        () => true,
        () => false,
      ),
    ),
  ).toBe(false)
})

Then(
  'my German language and colour choices are remembered',
  async ({ page, browserName }) => {
    const settings = new SettingsPage(page)
    await settings.open()
    await expect(
      settings.dialog.getByRole('radio', { name: 'Deutsch', exact: true }),
    ).toBeChecked()
    await expect(
      settings.dialog
        .getByRole('group', { name: 'Gehäusefarbe' })
        .getByRole('radio', { name: 'Ozean' }),
    ).toBeChecked()
    await expect(
      settings.dialog
        .getByRole('group', { name: 'Krabbenkostüm' })
        .getByRole('radio', { name: 'Flieder' }),
    ).toBeChecked()
    await settings.close()
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-renderer',
      'ready',
    )
    await page.screenshot({
      path: `test-results/settings-custom-${browserName}.png`,
    })
  },
)

Then('my existing care progress is preserved in German', async ({ page }) => {
  await expect(
    page.getByRole('progressbar', { name: 'Sättigung' }),
  ).toHaveAttribute('aria-valuenow', '85')
  await expect(
    page.getByText('1 gemeinsame Gesten', { exact: true }),
  ).toBeVisible()
})

When('I switch the language to English', async ({ page }) => {
  const settings = new SettingsPage(page)
  await settings.open()
  await settings.choose('Sprache', 'English')
  await settings.close()
})

When(
  'I choose different preferences in two open homes',
  async ({ page, context }) => {
    const second = await context.newPage()
    await second.goto('./')
    const firstSettings = new SettingsPage(page)
    const secondSettings = new SettingsPage(second)
    await firstSettings.open()
    await secondSettings.open()
    await firstSettings.choose('Case colour', 'Mint')
    await secondSettings.choose('Crab costume', 'Ocean')
  },
)

Then('both homes keep the combined preferences', async ({ context }) => {
  for (const page of context.pages()) {
    const settings = new SettingsPage(page)
    await expect(
      settings.dialog
        .getByRole('group', { name: 'Case colour' })
        .getByRole('radio', { name: 'Mint' }),
    ).toBeChecked()
    await expect(
      settings.dialog
        .getByRole('group', { name: 'Crab costume' })
        .getByRole('radio', { name: 'Ocean' }),
    ).toBeChecked()
  }
})
