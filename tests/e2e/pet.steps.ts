import { ShellGamePage } from './pages/shell-game'
import { createBdd } from 'playwright-bdd'
import { FoodMenuPage } from './pages/food-menu'
import { expect, type Page } from '@playwright/test'
const { Given, When, Then } = createBdd()
async function visit(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'))
  await page.goto('./', { waitUntil: 'domcontentloaded' })
  const hatch = page.getByRole('button', { name: 'Help hatch', exact: true })
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
  if (await hatch.isVisible()) await hatch.click()
  await expect(page.getByRole('button', { name: 'Feed' })).toBeEnabled()
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
    for (const name of ['Feed', 'Play', 'Sleep']) {
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
  await new FoodMenuPage(page).feed()
  await expect(
    page.getByText('Mmm! Pinchy loved his Franzbrötchen.', { exact: true }),
  ).toBeVisible()
})
When('I play with Pinchy', async ({ page }) => {
  await new ShellGamePage(page).finish()
  await expect(
    page.getByText('Hooray! Playing makes Pinchy happy.', {
      exact: true,
    }),
  ).toBeVisible()
})
Then(
  'Pinchy has {int} fullness, {int} happiness and {int} energy',
  async ({ page }, fullness: number, happiness: number, energy: number) => {
    for (const [name, value] of [
      ['Fullness', fullness],
      ['Happiness', happiness],
      ['Energy', energy],
    ] as const)
      await expect(page.getByRole('progressbar', { name })).toHaveAttribute(
        'aria-valuenow',
        String(value),
      )
  },
)
When('I reload my home', async ({ page }) => {
  await page.reload()
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
})
Then('I have shared {int} caring gestures', async ({ page }, count: number) => {
  await expect(
    page.getByText(`${count} caring gestures`, { exact: true }),
  ).toBeVisible()
})
When('I put Pinchy to sleep', async ({ page }) => {
  await page.getByRole('button', { name: 'Sleep' }).click()
  await expect(page.getByRole('button', { name: 'Wake up' })).toBeEnabled()
})
When('I wake Pinchy', async ({ page }) => {
  await page.getByRole('button', { name: 'Wake up' }).click()
  await expect(page.getByRole('button', { name: 'Sleep' })).toBeEnabled()
})
Then('active care is unavailable', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Feed' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled()
})
Then('active care is available', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Feed' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Play' })).toBeEnabled()
})
When('two hours pass', async ({ page }) => {
  await page.clock.install({
    time: new Date(await page.evaluate(() => Date.now())),
  })
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
    page.getByText('You’re offline. Your time together goes on.'),
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
  await expect(page.getByRole('button', { name: 'Feed' })).toBeEnabled()
})
When('I feed Pinchy using the keyboard', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Feed' })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('button', { name: 'Close food menu' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: 'Franzbrötchen' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('status')).toContainText('saved')
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
      'It has not been changed',
    )
    await expect(page.getByRole('button', { name: 'Feed' })).toBeDisabled()
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

Then('the bedtime scene is visible', async ({ page, browserName }) => {
  await expect(
    page.getByRole('img', { name: /sleeping with closed eyes/ }),
  ).toBeVisible()
  await expect(page.getByText('SWEET DREAMS', { exact: true })).toBeVisible()
  await expect(page.locator('.night-sky')).toHaveCSS('opacity', '1')
  await expect(page.locator('.sleep-bubbles span')).toHaveCount(3)
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  await page.screenshot({ path: `test-results/bedtime-${browserName}.png` })
})
Then('the daytime scene is restored', async ({ page }) => {
  await expect(page.locator('.night-sky')).toHaveCSS('opacity', '0')
  await expect(page.locator('.sleep-bubbles')).toHaveCount(0)
  await expect(
    page.getByRole('img', { name: /sleeping with closed eyes/ }),
  ).toHaveCount(0)
})
Then('bedtime decorations stay still', async ({ page }) => {
  await expect(page.locator('.sleep-bubbles span').first()).toHaveCSS(
    'animation-name',
    'none',
  )
  await expect(page.locator('.night-star').first()).toHaveCSS(
    'animation-name',
    'none',
  )
})
When('I allow motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
})
Then('bedtime decorations drift gently', async ({ page }) => {
  const bubble = page.locator('.sleep-bubbles span').first()
  await expect(bubble).not.toHaveCSS('animation-name', 'none')
  const initial = await bubble.evaluate(
    (element) => getComputedStyle(element).transform,
  )
  await expect
    .poll(() =>
      bubble.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(initial)
})
