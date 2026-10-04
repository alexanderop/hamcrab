import { FoodMenuPage } from './pages/food-menu'
import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
const { Given, When, Then } = createBdd()

Given('my longtime adult has no chosen form', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const at = new Date('2026-10-04T12:00:00Z')
  await page.clock.install({ time: at })
  await page.clock.pauseAt(new Date(at.getTime() + 1000))
  await page.goto('./')
  await expect(
    page.getByRole('button', { name: 'Help hatch', exact: true }),
  ).toBeEnabled()
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pinchy')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('pets', 'readwrite')
        const store = transaction.objectStore('pets')
        const read = store.get('pinchy')
        read.onsuccess = () =>
          store.put(
            {
              ...read.result,
              lifecycle: { stage: 'adult' },
              name: 'Milo',
              careCount: 42,
            },
            'pinchy',
          )
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } finally {
      database.close()
    }
  })
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Choose a form', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('42 caring gestures', { exact: true }),
  ).toBeVisible()
})
When('I choose the {string} adult form', async ({ page }, form: string) => {
  await page.getByRole('button', { name: 'Choose a form', exact: true }).click()
  const dialog = page.getByRole('dialog', {
    name: 'Growing together',
    exact: true,
  })
  await expect(dialog).toContainText('Care needs and rewards stay the same')
  await dialog.getByRole('button', { name: form, exact: false }).click()
  await expect(page.locator('.lifecycle-heading')).toContainText(form)
  await dialog
    .getByRole('button', { name: 'Close growth details', exact: true })
    .click()
  await expect(
    page.getByText('42 caring gestures', { exact: true }),
  ).toBeVisible()
})
Then(
  'the {string} signature is visible while we {string}',
  async ({ page, browserName }, form: string, activity: string) => {
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-renderer',
      'ready',
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await page.clock.fastForward(3200)
    const resting = await page
      .locator('.habitat-scene canvas')
      .screenshot({ path: `.audit/variants/${form}-rest-${browserName}.png` })
    if (activity === 'eat') {
      await new FoodMenuPage(page, 'Milo').feed()
    } else
      await page
        .getByRole('button', {
          name: activity === 'play' ? 'Play' : 'Pet',
          exact: true,
        })
        .click()
    await expect(
      page.getByText('43 caring gestures', { exact: true }),
    ).toBeVisible()
    await page.clock.fastForward(1150)
    await expect(page.locator('[data-motion]')).toHaveAttribute(
      'data-motion',
      activity === 'eat' ? 'feed' : activity === 'play' ? 'play' : 'pet',
    )
    const active = await page.locator('.habitat-scene canvas').screenshot({
      path: `.audit/variants/${form}-signature-${browserName}.png`,
    })
    expect(active.equals(resting)).toBe(false)
    if (activity === 'play') {
      await expect(page.locator('[data-ball-playing]')).toHaveAttribute(
        'data-ball-playing',
        'true',
      )
      await expect(page.locator('[data-ball]')).toHaveAttribute(
        'data-ball',
        'false',
      )
      await page.clock.fastForward(220)
      const otherSide = await page.locator('.habitat-scene canvas').screenshot({
        path: `.audit/variants/${form}-other-side-${browserName}.png`,
      })
      expect(otherSide.equals(active)).toBe(false)
    }
    await page.clock.fastForward(7000)
  },
)
Then(
  'my adult form fits short and tall screens',
  async ({ page, browserName }) => {
    const form = await page.locator('.lifecycle-heading span').innerText()
    await page.clock.resume()
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 844, height: 390 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport)
      await expect
        .poll(() =>
          page.locator('.habitat-scene canvas').evaluate((node) => {
            const canvas = node as HTMLCanvasElement
            const ratio = Math.min(window.devicePixelRatio, 2)
            return (
              canvas.width === Math.floor(canvas.clientWidth * ratio) &&
              canvas.height === Math.floor(canvas.clientHeight * ratio)
            )
          }),
        )
        .toBe(true)
      await expect(
        page.getByRole('button', { name: 'Feed', exact: true }),
      ).toBeInViewport({ ratio: 1 })
      expect(
        (await page.locator('.habitat-scene canvas').boundingBox())!.height,
      ).toBeGreaterThan(90)
      await page.screenshot({
        path: `.audit/variants/${form}-layout-${viewport.width}-${browserName}.png`,
      })
    }
    await page.clock.pauseAt(
      new Date((await page.evaluate(() => Date.now())) + 100),
    )
  },
)
Then('my adult form is still {string}', async ({ page }, form: string) => {
  await expect(page.locator('.lifecycle-heading')).toContainText(form)
  await expect(
    page.getByRole('button', { name: 'Choose a form', exact: true }),
  ).toHaveCount(0)
  await expect(page.getByText('Adult', { exact: true })).toBeVisible()
})
When('two homes choose different adult forms', async ({ page, context }) => {
  const other = await context.newPage()
  try {
    await other.goto(page.url())
    await other
      .getByRole('button', { name: 'Choose a form', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Choose a form', exact: true })
      .click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Gourmet/ })
      .click()
    await expect(page.locator('.lifecycle-heading')).toContainText('Gourmet')
    await other
      .getByRole('dialog')
      .getByRole('button', { name: /Whirlwind/ })
      .click()
    await expect(other.locator('.lifecycle-heading')).toContainText('Gourmet')
    await page.reload()
  } finally {
    await other.close()
  }
})
Then('both homes keep the first adult form', async ({ page }) => {
  await expect(page.locator('.lifecycle-heading')).toContainText('Gourmet')
  await expect(
    page.getByText('42 caring gestures', { exact: true }),
  ).toBeVisible()
})
Then('my adult welcomes me in its own style', async ({ page, browserName }) => {
  const form = await page.locator('.lifecycle-heading span').innerText()
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  await page.clock.fastForward(950)
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'greet',
  )
  const greeting = await page
    .locator('.habitat-scene canvas')
    .screenshot({ path: `.audit/variants/${form}-greeting-${browserName}.png` })
  await page.clock.fastForward(2500)
  const resting = await page.locator('.habitat-scene canvas').screenshot({
    path: `.audit/variants/${form}-after-greeting-${browserName}.png`,
  })
  expect(greeting.equals(resting)).toBe(false)
})
