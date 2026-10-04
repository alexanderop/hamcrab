import { createBdd } from 'playwright-bdd'
import { expect } from '@playwright/test'
const { Given, When, Then } = createBdd()
Given('a new egg is waiting for me', async ({ page, browserName }) => {
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Help hatch' })).toBeEnabled()
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-life-stage',
    'egg',
  )
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  await page.screenshot({ path: `.audit/lifecycle/egg-${browserName}.png` })
})
Then('ordinary care waits for hatching', async ({ page }) => {
  for (const name of ['Feed', 'Play', 'Pet', 'Sleep'])
    await expect(page.getByRole('button', { name, exact: true })).toBeDisabled()
})
When('I help my friend hatch', async ({ page }) => {
  await page.getByRole('button', { name: 'Help hatch' }).click()
  await expect(page.locator('.message-strip')).toContainText('has hatched')
})
Then('my friend is a baby with no care days', async ({ page, browserName }) => {
  await expect(page.getByText('Baby', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('progressbar', { name: 'Care days' }),
  ).toHaveAttribute('value', '0')
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-life-stage',
    'baby',
  )
  await expect(
    page.getByRole('button', { name: 'Feed', exact: true }),
  ).toBeEnabled()
  await expect(
    page.getByText('0 caring gestures', { exact: true }),
  ).toBeVisible()
  if (
    (await page.locator('[data-renderer]').getAttribute('data-renderer')) ===
    'ready'
  )
    await page.screenshot({ path: `.audit/lifecycle/baby-${browserName}.png` })
})
When("I reload my baby's home offline", async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true)
  await context.setOffline(true)
  await expect(
    page.getByText('You’re offline. Your time together goes on.', {
      exact: true,
    }),
  ).toBeVisible()
  await page.reload()
  expect(
    await page.evaluate(() =>
      fetch('./offline-proof.txt', { cache: 'no-store' }).then(
        () => true,
        () => false,
      ),
    ),
  ).toBe(false)
})
Given('my baby has nine earlier care days', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'))
  await page.goto('./')
  await page.getByRole('button', { name: 'Help hatch' }).click()
  await expect(page.getByText('Baby', { exact: true })).toBeVisible()
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
        read.onsuccess = () => {
          const now = Date.now()
          const day = Math.floor(now / 86_400_000)
          store.put(
            {
              ...read.result,
              createdAt: now - 10 * 86_400_000,
              lifecycle: {
                stage: 'baby',
                careDays: Array.from(
                  { length: 9 },
                  (_, index) => day - 9 + index,
                ),
              },
            },
            'pinchy',
          )
        }
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } finally {
      database.close()
    }
  })
  await page.reload()
  await expect(
    page.getByRole('progressbar', { name: 'Care days' }),
  ).toHaveAttribute('value', '9')
})
When('I cuddle my growing friend', async ({ page }) => {
  await page.getByRole('button', { name: 'Pet', exact: true }).click()
  await expect(page.locator('.message-strip')).toContainText('all grown up')
})
Then('my friend is grown up', async ({ page, browserName }) => {
  await expect(page.getByText('Adult', { exact: true })).toBeVisible()
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-life-stage',
    'adult',
  )
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  await page.screenshot({ path: `.audit/lifecycle/adult-${browserName}.png` })
})
When('I hatch from two homes', async ({ page, context }) => {
  const other = await context.newPage()
  try {
    await other.goto(page.url())
    await expect(
      other.getByRole('button', { name: 'Help hatch' }),
    ).toBeEnabled()
    await Promise.all([
      page.getByRole('button', { name: 'Help hatch' }).click(),
      other.getByRole('button', { name: 'Help hatch' }).click(),
    ])
    await expect(other.getByText('Baby', { exact: true })).toBeVisible()
    await page.reload()
  } finally {
    await other.close()
  }
})

When('the 3D view becomes unavailable', async ({ page }) => {
  await page.locator('[data-renderer] canvas').evaluate((canvas) => {
    const context = (canvas as HTMLCanvasElement).getContext('webgl2')
    const extension = context?.getExtension('WEBGL_lose_context')
    if (!extension) throw new Error('Browser has no context-loss capability')
    extension.loseContext()
  })
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-renderer',
    'fallback',
  )
})
Then('the fallback explains the unavailable view', async ({ page }) => {
  await expect(
    page.getByText('The 3D view is not available on this device.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.locator('.message-strip')).toContainText('has hatched')
})

When('I read the compact growth guidance', async ({ page, browserName }) => {
  const trigger = page.getByRole('button', {
    name: 'Growing together',
    exact: true,
  })
  await trigger.click()
  const dialog = page.getByRole('dialog', {
    name: 'Growing together',
    exact: true,
  })
  await expect(dialog).toContainText('Gaps are welcome')
  await expect(dialog).toContainText('once per UTC day')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await dialog.getByRole('button', { name: 'Close growth details' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await page.screenshot({ path: `.audit/lifecycle/compact-${browserName}.png` })
})

Then(
  'growth stays readable in German on short and tall screens',
  async ({ page, browserName }) => {
    for (const viewport of [
      { width: 844, height: 390 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport)
      await expect(
        page.getByText('0 / 10 Pflegetage', { exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Füttern', exact: true }),
      ).toBeInViewport({ ratio: 1 })
      await expect(
        page.getByRole('progressbar', { name: 'Pflegetage' }),
      ).toHaveAttribute('value', '0')
      expect(
        (await page.locator('[data-renderer] canvas').boundingBox())!.height,
      ).toBeGreaterThan(90)
      await page.screenshot({
        path: `.audit/lifecycle/baby-de-${viewport.width}-${browserName}.png`,
      })
    }
  },
)
