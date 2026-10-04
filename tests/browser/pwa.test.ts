import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import PwaPanel from '../../src/features/pwa/ui/PwaPanel.vue'
import {
  createPwaService,
  type PwaState,
} from '../../src/features/pwa/application/pwa-service'
function service(initial: Partial<PwaState> = {}) {
  return createPwaService(
    {
      now: () => 1000,
      readSnooze: () => 0,
      writeSnooze: () => {},
      check: async () => {
        throw new Error('Unavailable')
      },
      apply: async () => {},
      install: async () => 'accepted',
    },
    initial,
  )
}
it('opens iOS instructions and restores keyboard focus after Escape', async () => {
  render(PwaPanel, {
    props: {
      service: service({ platform: 'ios', mobile: true }),
      language: 'en',
      mode: 'settings',
    },
  })
  const install = page.getByRole('button', { name: 'Install Hamcrab' })
  await install.click()
  await expect
    .element(page.getByRole('dialog'))
    .toHaveTextContent('Add to Home Screen')
  await userEvent.keyboard('{Escape}')
  await expect.element(install).toHaveFocus()
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
})
it('uses native installation when available and removes the invitation after acceptance', async () => {
  render(PwaPanel, {
    props: {
      service: service({ canInstall: true }),
      language: 'en',
      mode: 'settings',
    },
  })
  await page.getByRole('button', { name: 'Install Hamcrab' }).click()
  await page.getByRole('button', { name: 'Install now' }).click()
  await expect
    .element(page.getByRole('dialog'))
    .toHaveTextContent('Hamcrab is installed')
  await expect
    .element(page.getByRole('button', { name: 'Install now' }))
    .not.toBeInTheDocument()
})
it('keeps a failed check retryable and explains offline readiness in German', async () => {
  render(PwaPanel, {
    props: {
      service: service({ offlineReady: true }),
      language: 'de',
      mode: 'settings',
    },
  })
  await expect
    .element(page.getByText('Bereit zum Offline-Spielen.', { exact: false }))
    .toBeVisible()
  const check = page.getByRole('button', { name: 'Nach Updates suchen' })
  await check.click()
  await expect
    .element(page.getByRole('alert'))
    .toHaveTextContent('Update-Suche fehlgeschlagen')
  await expect.element(check).toBeEnabled()
})
it('keeps an update in settings after snoozing and prevents reload during a save', async () => {
  const pwa = service({ updateAvailable: true })
  pwa.receive({})
  const view = await render(PwaPanel, {
    props: { service: pwa, language: 'en', mode: 'notices', busy: true },
  })
  await expect
    .element(page.getByRole('button', { name: 'Update now' }))
    .toBeDisabled()
  await page.getByRole('button', { name: 'Remind me in an hour' }).click()
  await expect.element(page.getByRole('complementary')).not.toBeInTheDocument()
  await view.unmount()
  render(PwaPanel, {
    props: { service: pwa, language: 'en', mode: 'settings' },
  })
  await expect
    .element(page.getByRole('button', { name: 'Update now' }))
    .toBeEnabled()
})
