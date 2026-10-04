import { expect, type Page } from '@playwright/test'

export class FoodMenuPage {
  constructor(
    readonly page: Page,
    readonly petName = 'Pinchy',
  ) {}

  get dialog() {
    return this.page.getByRole('dialog', { name: /^(Snack time|Hunger\?)$/ })
  }

  async open() {
    await this.page.getByRole('button', { name: /^(Feed|Füttern)$/ }).click()
    await expect(this.dialog).toBeVisible()
  }

  async choose(name: string) {
    await this.dialog.getByRole('radio', { name, exact: true }).check()
  }

  async give() {
    await this.dialog
      .getByRole('button', { name: `Give to ${this.petName}`, exact: true })
      .or(
        this.dialog.getByRole('button', {
          name: `${this.petName} geben`,
          exact: true,
        }),
      )
      .click()
  }

  async feed(name = 'Franzbrötchen') {
    await this.open()
    await this.choose(name)
    await this.give()
    await expect(this.dialog).not.toBeVisible()
  }

  async close() {
    await this.dialog
      .getByRole('button', { name: /^(Close food menu|Futtermenü schließen)$/ })
      .click()
    await expect(this.dialog).not.toBeVisible()
  }
}
