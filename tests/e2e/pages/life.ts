import { expect, type Page } from '@playwright/test'
import type { PetSnapshot } from '../../../src/features/pet/domain/pet'

export async function saveLifeFixture(page: Page, pet: PetSnapshot) {
  await page.goto('./')
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
  await page.evaluate(async (snapshot) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('pinchy')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('pets', 'readwrite')
        transaction.objectStore('pets').put(snapshot, 'pinchy')
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      })
    } finally {
      database.close()
    }
  }, pet)
  await page.reload()
  await expect(page.getByRole('status')).toContainText('Your progress is saved')
}

export class LifePage {
  constructor(readonly page: Page) {}

  get trigger() {
    return this.page.getByRole('button', { name: 'Your Hamcrab', exact: true })
  }

  get dialog() {
    return this.page.getByRole('dialog', { name: 'Your Hamcrab', exact: true })
  }

  async open(section: 'Care' | 'My things' | 'Family' | 'Routine' = 'Care') {
    await this.trigger.click()
    await expect(this.dialog).toBeVisible()
    await this.dialog
      .getByRole('button', { name: section, exact: true })
      .click()
  }

  async close() {
    await this.page.keyboard.press('Escape')
    await expect(this.dialog).not.toBeVisible()
    await expect(this.trigger).toBeFocused()
  }
}
