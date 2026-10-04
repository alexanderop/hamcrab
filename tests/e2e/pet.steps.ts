import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'
const { Given, When, Then } = createBdd()
async function visit(page: Page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Füttern' })).toBeEnabled()
}
Given('I visit my new companion', async ({ page }) => {
  await visit(page)
})
Given('I visit Pinchy on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await visit(page)
})
Given(
  'I visit Pinchy on a {int} by {int} screen',
  async ({ page }, width: number, height: number) => {
    await page.setViewportSize({ width, height })
    await visit(page)
  },
)
Then(
  'the casing fills the viewport with all care controls in reach',
  async ({ page, browserName }) => {
    const viewport = page.viewportSize()!
    const casing = await page.locator('.device-shell').boundingBox()
    expect(casing).toEqual({ x: 0, y: 0, ...viewport })
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth === innerWidth &&
          document.documentElement.scrollHeight === innerHeight,
      ),
    ).toBe(true)
    for (const name of ['Füttern', 'Spielen', 'Schlafen']) {
      const button = page.getByRole('button', { name, exact: true })
      await expect(button).toBeInViewport({ ratio: 1 })
      const box = await button.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.locator('[data-renderer]')).toHaveAttribute(
      'data-renderer',
      'ready',
    )
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    const canvasBox = (await canvas.boundingBox())!
    expect(canvasBox.x).toBeGreaterThanOrEqual(0)
    expect(canvasBox.y).toBeGreaterThanOrEqual(0)
    expect(canvasBox.x + canvasBox.width).toBeLessThanOrEqual(viewport.width)
    expect(canvasBox.y + canvasBox.height).toBeLessThanOrEqual(viewport.height)
    expect(canvasBox.height).toBeGreaterThan(90)
    await page.screenshot({
      path: `test-results/full-casing-${viewport.width}-${viewport.height}-${browserName}.png`,
      fullPage: true,
    })
  },
)
When('I feed Pinchy', async ({ page }) => {
  await page.getByRole('button', { name: 'Füttern' }).click()
  await expect(
    page.getByText('Mmmh! Pinchy hat seinen Snack verputzt.', { exact: true }),
  ).toBeVisible()
})
When('I play with Pinchy', async ({ page }) => {
  await page.getByRole('button', { name: 'Spielen' }).click()
  await expect(
    page.getByText('Juhu! Eine Runde Spielen macht Pinchy glücklich.', {
      exact: true,
    }),
  ).toBeVisible()
})
Then(
  'Pinchy has {int} fullness, {int} happiness and {int} energy',
  async ({ page }, fullness: number, happiness: number, energy: number) => {
    for (const [name, value] of [
      ['Sättigung', fullness],
      ['Freude', happiness],
      ['Energie', energy],
    ] as const)
      await expect(page.getByRole('progressbar', { name })).toHaveAttribute(
        'aria-valuenow',
        String(value),
      )
  },
)
When('I reload my home', async ({ page }) => {
  await page.reload()
  await expect(page.getByRole('status')).toContainText(
    'Euer Spielstand ist gespeichert',
  )
})
Then('I have shared {int} caring gestures', async ({ page }, count: number) => {
  await expect(
    page.getByText(`${count} gemeinsame Gesten`, { exact: true }),
  ).toBeVisible()
})
When('I put Pinchy to sleep', async ({ page }) => {
  await page.getByRole('button', { name: 'Schlafen' }).click()
  await expect(page.getByRole('button', { name: 'Wecken' })).toBeEnabled()
})
When('I wake Pinchy', async ({ page }) => {
  await page.getByRole('button', { name: 'Wecken' }).click()
  await expect(page.getByRole('button', { name: 'Schlafen' })).toBeEnabled()
})
Then('active care is unavailable', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Füttern' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Spielen' })).toBeDisabled()
})
Then('active care is available', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Füttern' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Spielen' })).toBeEnabled()
})
When('two hours pass', async ({ page }) => {
  await page.clock.install()
  await page.clock.fastForward(2 * 60 * 60 * 1000)
})
Given('my home is available offline', async ({ page }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true)
})
When('I disconnect and reload my home', async ({ page, context }) => {
  await context.setOffline(true)
  await expect(
    page.getByText('Du bist offline. Eure gemeinsame Zeit geht weiter.'),
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
  await expect(page.getByRole('button', { name: 'Füttern' })).toBeEnabled()
})
When('I care for Pinchy from two tabs', async ({ page, context }) => {
  const second = await context.newPage()
  await second.goto('./', { waitUntil: 'domcontentloaded' })
  await expect(second.getByRole('button', { name: 'Füttern' })).toBeEnabled()
  await Promise.all([
    page.getByRole('button', { name: 'Füttern' }).click(),
    second.getByRole('button', { name: 'Spielen' }).click(),
  ])
  await expect(
    page.getByText('Mmmh! Pinchy hat seinen Snack verputzt.', { exact: true }),
  ).toBeVisible()
  await expect(
    second.getByText('Juhu! Eine Runde Spielen macht Pinchy glücklich.', {
      exact: true,
    }),
  ).toBeVisible()
  await second.close()
})
When('I feed Pinchy using the keyboard', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Füttern' })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('gespeichert')
})
Then('my home fits the screen', async ({ page }) => {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)
  await page.screenshot({
    path: 'test-results/pinchy-mobile.png',
    fullPage: true,
  })
})
When('my saved data becomes unreadable', async ({ page }) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('pinchy')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('pets', 'readwrite')
        tx.objectStore('pets').put({ broken: true }, 'pinchy')
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
    })
  })
})
Then(
  'I see a recovery message without losing the saved data',
  async ({ page }) => {
    await expect(page.getByRole('alert')).toContainText(
      'Er wurde nicht verändert',
    )
    await expect(page.getByRole('button', { name: 'Füttern' })).toBeDisabled()
    const stored = await page.evaluate(
      async () =>
        new Promise<unknown>((resolve, reject) => {
          const request = indexedDB.open('pinchy')
          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
            const db = request.result
            const get = db.transaction('pets').objectStore('pets').get('pinchy')
            get.onsuccess = () => {
              db.close()
              resolve(get.result)
            }
            get.onerror = () => reject(get.error)
          }
        }),
    )
    expect(stored).toEqual({ broken: true })
  },
)
When('I feed Pinchy three times', async ({ page }) => {
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Füttern' }).click()
    await expect(page.getByRole('status')).toContainText('gespeichert')
  }
})
Then('I can see and rotate the 3D companion', async ({ page, browserName }) => {
  const stage = page.locator('[data-renderer]')
  await expect(stage).toHaveAttribute('data-renderer', 'ready')
  const canvas = stage.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const before = await canvas.screenshot()
  await stage.focus()
  await page.keyboard.press('ArrowRight')
  await expect
    .poll(async () => before.equals(await canvas.screenshot()))
    .toBe(false)
  await page.screenshot({
    path: `test-results/pinchy-desktop-${browserName}.png`,
    fullPage: true,
  })
})

When('I reopen a damaged home', async ({ page }) => {
  await page.reload()
})
When('I attempt to feed Pinchy', async ({ page }) => {
  await page.getByRole('button', { name: 'Füttern' }).click()
})

Then(
  'the app manifest and icons are ready for installation',
  async ({ page, request, baseURL }) => {
    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href')
    expect(manifestHref).toBeTruthy()
    const manifestUrl = new URL(manifestHref!, page.url())
    const response = await request.get(manifestUrl.href)
    expect(response.ok()).toBe(true)
    const manifest = await response.json()
    const home = new URL(baseURL!).href
    expect(new URL(manifest.start_url, manifestUrl).href).toBe(home)
    expect(new URL(manifest.scope, manifestUrl).href).toBe(home)
    expect(new URL(manifest.id, manifestUrl).href).toBe(home)
    expect(manifest.display).toBe('standalone')
    for (const size of ['192x192', '512x512']) {
      const icon = manifest.icons.find(
        (entry: { sizes: string }) => entry.sizes === size,
      )
      expect(icon).toBeTruthy()
      const image = await request.get(new URL(icon.src, manifestUrl).href)
      expect(image.ok()).toBe(true)
      expect(image.headers()['content-type']).toContain('image/png')
    }
    expect(
      await page.evaluate(
        async () => (await navigator.serviceWorker.ready).scope,
      ),
    ).toBe(home)
  },
)
