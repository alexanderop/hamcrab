import { expect, type Page } from '@playwright/test'

export class FriendshipPage {
  constructor(readonly page: Page) {}

  get summary() {
    return this.page.getByRole('button', {
      name: 'View friendship',
      exact: true,
    })
  }
  get dialog() {
    return this.page.getByRole('dialog', {
      name: 'Your friendship',
      exact: true,
    })
  }
  get habitat() {
    return this.page.locator('[data-renderer]')
  }
  async visit(date = '2026-01-01T12:00:00Z') {
    await this.page.clock.setFixedTime(new Date(date))
    await this.page.goto('./')
    const hatch = this.page.getByRole('button', {
      name: 'Help hatch',
      exact: true,
    })
    await expect(this.page.getByRole('status')).toContainText(
      'Your progress is saved',
    )
    if (await hatch.isVisible()) await hatch.click()
    await expect(
      this.page.getByRole('button', { name: 'Feed', exact: true }),
    ).toBeEnabled()
    await expect(this.habitat).toHaveAttribute('data-renderer', 'ready')
  }
  async seed(points: number, happiness = 78) {
    await this.page.evaluate(
      async ({ points, happiness }) => {
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
                  happiness,
                  friendship: { ...read.result.friendship, points },
                },
                'pinchy',
              )
            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
            transaction.onabort = () => reject(transaction.error)
          })
        } finally {
          database.close()
        }
      },
      { points, happiness },
    )
    await this.page.reload()
    await expect(this.summary).toBeEnabled()
    await expect(this.habitat).toHaveAttribute('data-renderer', 'ready')
  }
  async expectPoints(points: number) {
    await this.summary.click()
    await expect(
      this.dialog.getByRole('progressbar', { name: 'Friendship points' }),
    ).toHaveAttribute('value', String(points))
    await this.dialog.getByRole('button', { name: 'Close friendship' }).click()
    await expect(this.summary).toBeFocused()
  }
}
