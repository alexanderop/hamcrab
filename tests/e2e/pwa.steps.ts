import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
const { Then, When } = createBdd()
Then(
  'settings explain installation and offline readiness',
  async ({ page }) => {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const settings = page.getByRole('dialog', { name: 'Settings', exact: true })
    await expect(settings).toContainText('Ready for offline play')
    await settings.getByRole('button', { name: 'Install Hamcrab' }).click()
    const install = page.getByRole('dialog', {
      name: 'Install Hamcrab',
      exact: true,
    })
    await expect(install).toContainText('Chrome or Edge')
    await page.keyboard.press('Escape')
    await expect(
      settings.getByRole('button', { name: 'Install Hamcrab' }),
    ).toBeFocused()
    await settings.getByRole('button', { name: 'Check for updates' }).click()
    await expect(settings).toContainText('Update check completed')
  },
)
When('a new release arrives and I postpone then apply it', async ({ page }) => {
  if (process.env.PLAYWRIGHT_BASE_URL)
    throw new Error('Release test requires the local production preview')
  const workerPath = 'dist/sw.js'
  const original = await readFile(workerPath, 'utf8')
  try {
    await page.evaluate(() => {
      sessionStorage.setItem('pwa-release-started', 'yes')
      navigator.serviceWorker.addEventListener('controllerchange', () =>
        sessionStorage.setItem('pwa-controller-changed', 'yes'),
      )
    })
    await writeFile(workerPath, `${original}\n// release-proof-${Date.now()}\n`)
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update()
    })
    const notice = page.getByRole('complementary', {
      name: 'A new Hamcrab is ready',
    })
    await expect(notice).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(async () =>
          Boolean((await navigator.serviceWorker.ready).waiting),
        ),
      )
      .toBe(true)
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem('pwa-controller-changed'),
      ),
    ).toBeNull()
    await notice.getByRole('button', { name: 'Remind me in an hour' }).click()
    await expect(notice).not.toBeVisible()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const settings = page.getByRole('dialog', { name: 'Settings', exact: true })
    await expect(settings).toContainText('A new Hamcrab is ready')
    await Promise.all([
      page.waitForEvent('domcontentloaded'),
      settings.getByRole('button', { name: 'Update now' }).click(),
    ])
    await expect(
      page.getByRole('button', { name: 'Feed', exact: true }),
    ).toBeEnabled()
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem('pwa-controller-changed'),
      ),
    ).toBe('yes')
    await expect(notice).not.toBeVisible()
    await page.screenshot({ path: 'test-results/pwa-updated.png' })
  } finally {
    await writeFile(workerPath, original)
  }
})
