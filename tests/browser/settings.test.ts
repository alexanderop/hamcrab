import { expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-vue'
import SettingsHarness from './SettingsHarness.vue'
import { createSettingsService } from '../../src/features/settings/application/settings-service'
import {
  defaults,
  type Preferences,
} from '../../src/features/settings/domain/preferences'

function settings(fail = false) {
  let saved: Preferences = { ...defaults }
  return createSettingsService({
    read: () => saved,
    write: (value) => {
      if (fail) throw new Error('Quota exceeded')
      saved = value
    },
    subscribe: () => () => {},
  })
}
it.each([
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
])(
  'supports keyboard settings and focus restoration at $width × $height',
  async (viewport) => {
    await page.viewport(viewport.width, viewport.height)
    render(SettingsHarness, { props: { service: settings() } })
    const trigger = page.getByRole('button', { name: 'Settings', exact: true })
    await trigger.click()
    await expect
      .element(page.getByRole('button', { name: 'Close settings' }))
      .toHaveFocus()
    await userEvent.keyboard('{Tab}')
    await expect
      .element(page.getByRole('textbox', { name: 'Pet name' }))
      .toHaveFocus()
    await userEvent.keyboard('{Tab}')
    await expect
      .element(page.getByRole('radio', { name: 'English', exact: true }))
      .toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect
      .element(page.getByRole('radio', { name: 'Deutsch' }))
      .toBeChecked()
    await userEvent.keyboard('{ArrowLeft}')
    for (const group of ['Case colour', 'Crab costume']) {
      await userEvent.keyboard('{Tab}')
      const radios = page.getByRole('group', { name: group })
      await expect
        .element(radios.getByRole('radio', { name: 'Coral' }))
        .toHaveFocus()
      await userEvent.keyboard('{ArrowRight}')
      await expect
        .element(radios.getByRole('radio', { name: 'Mint' }))
        .toBeChecked()
    }
    await userEvent.keyboard('{Tab}')
    const done = page.getByRole('button', { name: 'Done' })
    await expect.element(done).toHaveFocus()
    const bounds = done.element().getBoundingClientRect()
    expect(bounds.top).toBeGreaterThanOrEqual(0)
    expect(bounds.bottom).toBeLessThanOrEqual(viewport.height)
    const dialog = page.getByRole('dialog').element()
    expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth)
    await userEvent.keyboard('{Escape}')
    await expect.element(trigger).toHaveFocus()
    await expect
      .element(page.getByRole('dialog', { includeHidden: true }))
      .not.toBeVisible()
  },
)
it('discards an unfinished name when settings close', async () => {
  render(SettingsHarness, { props: { service: settings() } })
  const trigger = page.getByRole('button', { name: 'Settings', exact: true })
  await trigger.click()
  await page.getByRole('textbox', { name: 'Pet name' }).fill('Crabby')
  await userEvent.keyboard('{Escape}')
  await expect.element(page.getByRole('heading')).toHaveTextContent('Pinchy')
  await trigger.click()
  await expect
    .element(page.getByRole('textbox', { name: 'Pet name' }))
    .toHaveValue('Pinchy')
})
it('keeps language changes visible and explains unavailable storage', async () => {
  render(SettingsHarness, { props: { service: settings(true) } })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await userEvent.keyboard('{Tab}{Tab}{ArrowRight}')
  await expect
    .element(page.getByRole('dialog'))
    .toHaveAccessibleName('Einstellungen')
  await expect
    .element(page.getByRole('radio', { name: 'Deutsch' }))
    .toBeChecked()
  await expect
    .element(page.getByRole('alert'))
    .toHaveTextContent('Die Einstellungen konnten nicht gespeichert werden.')
})
