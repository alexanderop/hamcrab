import { expect, type Page } from '@playwright/test'

export class ShellGamePage {
  constructor(readonly page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog', { name: 'Shell game', exact: true })
  }

  async open() {
    await this.page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(this.dialog).toBeVisible()
  }

  async finish() {
    await this.open()
    await this.finishOpen()
  }

  async finishOpen() {
    for (let round = 0; round < 5; round++) {
      const clue = this.dialog.getByText(/Remember shell [123]/)
      await expect(clue).toBeVisible()
      const shell = (await clue.innerText()).match(/shell ([123])/)?.[1]
      if (!shell) throw new Error('The game did not reveal a shell to remember')
      await this.dialog
        .getByRole('button', { name: 'Ready', exact: true })
        .click()
      await this.dialog
        .getByRole('button', { name: `Shell ${shell}`, exact: true })
        .click()
    }
    await expect(this.dialog.getByText(/5 \/ 5/)).toBeVisible()
    await this.dialog
      .getByRole('button', { name: 'Close game', exact: true })
      .click()
  }
}
