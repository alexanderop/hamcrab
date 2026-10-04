import { expect, it } from 'vitest'
import {
  createPwaService,
  type PwaPort,
} from '../../src/features/pwa/application/pwa-service'
function setup(overrides: Partial<PwaPort> = {}) {
  let now = 1000
  let snooze = 0
  const port: PwaPort = {
    now: () => now,
    readSnooze: () => snooze,
    writeSnooze: (value) => {
      snooze = value
    },
    check: async () => {},
    apply: async () => {},
    install: async () => 'accepted',
    ...overrides,
  }
  return {
    port,
    advance: (value: number) => {
      now += value
    },
    service: createPwaService(port, { mobile: true }),
  }
}
it('snoozes installation for seven days across sessions and allows it again afterwards', () => {
  const test = setup()
  test.service.showInstallHint()
  expect(test.service.getState().installHint).toBe(true)
  test.service.snoozeInstall()
  const reopened = createPwaService(test.port, { mobile: true })
  reopened.showInstallHint()
  expect(reopened.getState().installHint).toBe(false)
  test.advance(7 * 24 * 60 * 60 * 1000)
  reopened.refreshHints()
  expect(reopened.getState().installHint).toBe(true)
})
it('does not promote installation on desktop, standalone or after appinstalled', () => {
  for (const initial of [
    { mobile: false },
    { mobile: true, standalone: true },
    { mobile: true, installed: true },
  ]) {
    const service = createPwaService(setup().port, initial)
    service.showInstallHint()
    expect(service.getState().installHint).toBe(false)
  }
})
it('snoozes the update hint for one hour without hiding the available update', () => {
  const { service, advance } = setup()
  service.receive({ updateAvailable: true })
  service.snoozeUpdate()
  expect(service.getState()).toMatchObject({
    updateAvailable: true,
    updateHint: false,
  })
  advance(60 * 60 * 1000)
  service.refreshHints()
  expect(service.getState().updateHint).toBe(true)
})
it('recovers from a failed update check and clears its pending state', async () => {
  let fail = true
  const { service } = setup({
    check: async () => {
      if (fail) throw new Error('Offline')
    },
  })
  await service.check()
  expect(service.getState()).toMatchObject({
    checking: false,
    checked: false,
    error: 'check',
  })
  fail = false
  await service.check()
  expect(service.getState()).toMatchObject({
    checking: false,
    checked: true,
    error: null,
  })
})
it('never activates an update just because it became available and ignores repeated clicks while applying', async () => {
  let calls = 0
  let finish = () => {}
  const { service } = setup({
    apply: () => {
      calls++
      return new Promise<void>((resolve) => {
        finish = resolve
      })
    },
  })
  service.receive({ updateAvailable: true })
  expect(calls).toBe(0)
  const applying = service.apply()
  await service.apply()
  expect(calls).toBe(1)
  expect(service.getState().applying).toBe(true)
  finish()
  await applying
  expect(service.getState().applying).toBe(false)
})
it('keeps installation available after dismissal and reports failures without a stuck spinner', async () => {
  const { service } = setup({
    install: async () => 'dismissed',
    apply: async () => {
      throw new Error('Unavailable')
    },
  })
  service.showInstallHint()
  await service.install()
  expect(service.getState()).toMatchObject({
    installed: false,
    installHint: false,
    installing: false,
  })
  await service.apply()
  expect(service.getState()).toMatchObject({
    error: 'update',
    applying: false,
    updateAvailable: false,
  })
})
