import { expect, type Page } from '@playwright/test'

export class PetNamePage {
  constructor(readonly page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog', { name: /^(Settings|Einstellungen)$/ })
  }
  get input() {
    return this.dialog.getByRole('textbox', {
      name: /^(Pet name|Name deines Hamcrabs)$/,
    })
  }
  get save() {
    return this.dialog.getByRole('button', {
      name: /^(Save name|Namen speichern)$/,
    })
  }
  async open() {
    await this.page
      .getByRole('button', { name: /^(Settings|Einstellungen)$/ })
      .click()
    await expect(this.input).toBeVisible()
  }
  async close() {
    await this.dialog.getByRole('button', { name: /^(Done|Fertig)$/ }).click()
    await expect(this.dialog).not.toBeVisible()
  }
  async rename(name: string) {
    await this.open()
    await this.input.fill(name)
    await this.input.press('Enter')
    await expect(this.dialog.getByRole('status')).toHaveText(
      /^(Name saved\.|Name gespeichert\.)$/,
    )
    await this.close()
  }
}
