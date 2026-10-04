import { createBdd } from 'playwright-bdd'
import { expect, type Page } from '@playwright/test'
const { Given, When, Then } = createBdd()
const at = new Date('2026-01-01T12:00:00Z')
async function stopClock(page: Page) {
  await page.clock.install({ time: at })
  await page.clock.pauseAt(new Date(at.getTime() + 1000))
}
async function openHome(page: Page, reduced: boolean) {
  await page.emulateMedia({
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  await stopClock(page)
  await page.goto('./', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Help hatch', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Feed', exact: true }),
  ).toBeEnabled()
  await expect(page.locator('[data-renderer]')).toHaveAttribute(
    'data-renderer',
    'ready',
  )
  await page.clock.fastForward(100)
}
async function bodyPoint(page: Page) {
  const box = (await page.locator('.habitat-scene canvas').boundingBox())!
  return { x: box.x + box.width * 0.5, y: box.y + box.height * 0.54 }
}
async function capture(page: Page, name: string, browser: string) {
  return page
    .locator('.habitat-scene canvas')
    .screenshot({ path: `test-results/personality-${name}-${browser}.png` })
}
Given('I open a lively home', async ({ page }) => openHome(page, false))
Given('I open a calm home', async ({ page }) => openHome(page, true))
Then('my companion visibly waves hello', async ({ page, browserName }) => {
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'greet',
  )
  await page.clock.fastForward(600)
  const wave = await capture(page, 'greeting', browserName)
  await page.clock.fastForward(2400)
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'idle',
  )
  expect(wave.equals(await capture(page, 'after-greeting', browserName))).toBe(
    false,
  )
})
When('I tap my companion directly', async ({ page }) => {
  const point = await bodyPoint(page)
  await page.mouse.click(point.x, point.y)
  await expect(
    page.getByText('1 caring gestures', { exact: true }),
  ).toBeVisible()
  await page.clock.fastForward(700)
})
Then(
  'one cuddle is saved with a visibly affectionate pose',
  async ({ page, browserName }) => {
    await expect(page.locator('[data-motion]')).toHaveAttribute(
      'data-motion',
      'pet',
    )
    const cuddle = await capture(page, 'cuddle', browserName)
    await page.clock.fastForward(2000)
    expect(
      cuddle.equals(await capture(page, 'after-cuddle', browserName)),
    ).toBe(false)
    await expect(
      page.getByText('1 caring gestures', { exact: true }),
    ).toBeVisible()
  },
)
When('I drag the companion away and back', async ({ page }) => {
  const point = await bodyPoint(page)
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await page.mouse.move(point.x + 60, point.y, { steps: 5 })
  await page.mouse.move(point.x, point.y, { steps: 5 })
  await page.mouse.up()
  await page.clock.fastForward(100)
})
Then('no extra cuddle is saved', async ({ page }) => {
  await expect(
    page.getByText('1 caring gestures', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'idle',
  )
})
Then(
  'my companion has a quiet moment followed by a little discovery',
  async ({ page, browserName }) => {
    const quiet = await capture(page, 'quiet', browserName)
    await page.clock.fastForward(15900)
    await expect(page.locator('[data-motion]')).toHaveAttribute(
      'data-motion',
      /groom|inspect|wobble/,
    )
    expect(quiet.equals(await capture(page, 'idle-antic', browserName))).toBe(
      false,
    )
  },
)
Then(
  'the snack animation finishes before a visible celebration dance',
  async ({ page, browserName }) => {
    await page.clock.fastForward(1100)
    await expect(page.locator('[data-motion]')).toHaveAttribute(
      'data-motion',
      'feed',
    )
    await expect(page.locator('[data-snack]')).toHaveAttribute(
      'data-snack',
      'pastry',
    )
    const snack = await capture(page, 'snack', browserName)
    await page.clock.fastForward(3300)
    await expect(page.locator('[data-motion]')).toHaveAttribute(
      'data-motion',
      'celebrate',
    )
    await expect(page.locator('[data-renderer]')).not.toHaveAttribute(
      'data-snack',
    )
    expect(snack.equals(await capture(page, 'dance', browserName))).toBe(false)
    await page.clock.fastForward(2500)
  },
)
Then('my companion visibly stretches awake', async ({ page, browserName }) => {
  await page.clock.fastForward(900)
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'wake',
  )
  const stretch = await capture(page, 'wake', browserName)
  await page.clock.fastForward(2500)
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'idle',
  )
  expect(stretch.equals(await capture(page, 'after-wake', browserName))).toBe(
    false,
  )
})
When('I watch a lively game with the ball', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await stopClock(page)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Play', exact: true }),
  ).toBeEnabled()
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('saved')
  await page.clock.fastForward(1200)
})
Then(
  'the ball visibly moves and returns to rest',
  async ({ page, browserName }) => {
    await expect(page.locator('[data-ball-playing]')).toHaveAttribute(
      'data-ball-playing',
      'true',
    )
    const shove = await capture(page, 'ball-shove', browserName)
    await page.clock.fastForward(1700)
    await expect(page.locator('[data-ball-playing]')).toHaveAttribute(
      'data-ball-playing',
      'false',
    )
    expect(shove.equals(await capture(page, 'ball-return', browserName))).toBe(
      false,
    )
  },
)
Then(
  'my snack feedback stays still and disappears on time',
  async ({ page, browserName }) => {
    await page.clock.fastForward(100)
    const still = await capture(page, 'static-snack', browserName)
    await page.clock.fastForward(1500)
    expect(
      still.equals(await capture(page, 'static-snack-later', browserName)),
    ).toBe(true)
    await page.clock.fastForward(1900)
    await expect(page.locator('[data-renderer]')).not.toHaveAttribute(
      'data-snack',
    )
  },
)
Then('no old action or celebration is replayed', async ({ page }) => {
  await page.clock.fastForward(200)
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'idle',
  )
  await expect(page.locator('[data-renderer]')).not.toHaveAttribute(
    'data-snack',
  )
})

When(
  'I return after another home puts my companion to sleep',
  async ({ page, context }) => {
    await page.clock.fastForward(4000)
    await page.evaluate(() => {
      document.documentElement.dataset.testHidden = 'true'
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => document.documentElement.dataset.testHidden === 'true',
      })
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (document.hidden ? 'hidden' : 'visible'),
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.clock.fastForward(31000)
    const other = await context.newPage()
    await other.clock.setFixedTime(new Date(at.getTime() + 36000))
    await other.goto('./')
    await other.getByRole('button', { name: 'Sleep', exact: true }).click()
    await expect(
      other.getByRole('button', { name: 'Wake up', exact: true }),
    ).toBeEnabled()
    const release = await other.evaluateHandle(
      () =>
        new Promise<() => void>((resolve, reject) => {
          const request = indexedDB.open('pinchy')
          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
            const database = request.result
            const transaction = database.transaction('pets', 'readwrite')
            let released = false
            const hold = () => {
              const read = transaction.objectStore('pets').get('pinchy')
              read.onsuccess = () => {
                if (!released) hold()
              }
            }
            transaction.oncomplete = () => database.close()
            hold()
            resolve(() => {
              released = true
            })
          }
        }),
    )
    try {
      await page.evaluate(() => {
        document.documentElement.dataset.testHidden = 'false'
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await expect(
        page.getByRole('button', { name: 'Feed', exact: true }),
      ).toBeDisabled()
      await page.clock.fastForward(200)
      await expect(page.locator('[data-motion]')).toHaveAttribute(
        'data-motion',
        'idle',
      )
    } finally {
      await release.evaluate((unlock) => unlock())
      await release.dispose()
      await other.close()
    }
  },
)
Then('I see the sleeping companion without a greeting', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: 'Wake up', exact: true }),
  ).toBeEnabled()
  await page.clock.fastForward(200)
  await expect(page.locator('[data-motion]')).toHaveAttribute(
    'data-motion',
    'idle',
  )
  await expect(page.locator('[data-sleeping]')).toHaveAttribute(
    'data-sleeping',
    'true',
  )
})
