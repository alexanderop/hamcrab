export type Platform = 'ios' | 'android' | 'desktop'
export type PwaState = Readonly<{
  standalone: boolean
  installed: boolean
  canInstall: boolean
  mobile: boolean
  platform: Platform
  online: boolean
  offlineReady: boolean
  updateAvailable: boolean
  checking: boolean
  applying: boolean
  installing: boolean
  checked: boolean
  error: 'check' | 'update' | 'install' | 'registration' | null
  installHint: boolean
  updateHint: boolean
}>
export type PwaPort = {
  now(): number
  readSnooze(): number
  writeSnooze(until: number): void
  check(): Promise<void>
  apply(): Promise<void>
  install(): Promise<'accepted' | 'dismissed' | null>
}
const DAY = 24 * 60 * 60 * 1000
export function createPwaService(
  port: PwaPort,
  initial: Partial<PwaState> = {},
) {
  let state: PwaState = {
    standalone: false,
    installed: false,
    canInstall: false,
    mobile: false,
    platform: 'desktop',
    online: true,
    offlineReady: false,
    updateAvailable: false,
    checking: false,
    applying: false,
    installing: false,
    checked: false,
    error: null,
    installHint: false,
    updateHint: false,
    ...initial,
  }
  let hintDue = false
  let snoozeUntil = port.readSnooze()
  let updateSnoozeUntil = 0
  const listeners = new Set<(state: PwaState) => void>()
  function publish(change: Partial<PwaState> = {}) {
    state = { ...state, ...change }
    state = {
      ...state,
      installHint:
        hintDue &&
        state.mobile &&
        !state.standalone &&
        !state.installed &&
        port.now() >= snoozeUntil,
      updateHint: state.updateAvailable && port.now() >= updateSnoozeUntil,
    }
    for (const listener of listeners) listener(state)
  }
  async function run(kind: 'check' | 'update' | 'install') {
    const key =
      kind === 'check'
        ? 'checking'
        : kind === 'update'
          ? 'applying'
          : 'installing'
    if (state[key]) return
    publish({
      [key]: true,
      error: null,
      ...(kind === 'check' ? { checked: false } : {}),
    })
    try {
      if (kind === 'check') {
        await port.check()
        publish({ checked: true })
      } else if (kind === 'update') await port.apply()
      else {
        const outcome = await port.install()
        if (outcome === 'accepted')
          publish({ installed: true, canInstall: false })
        else if (outcome === 'dismissed') service.snoozeInstall()
      }
    } catch {
      publish({ error: kind })
    } finally {
      publish({ [key]: false })
    }
  }
  const service = {
    getState: () => state,
    subscribe(listener: (state: PwaState) => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    receive: publish,
    showInstallHint() {
      hintDue = true
      publish()
    },
    refreshHints() {
      publish()
    },
    snoozeInstall() {
      snoozeUntil = port.now() + 7 * DAY
      port.writeSnooze(snoozeUntil)
      publish()
    },
    snoozeUpdate() {
      updateSnoozeUntil = port.now() + 60 * 60 * 1000
      publish()
    },
    check: () => run('check'),
    apply: () => run('update'),
    install: () => run('install'),
  }
  return service
}
export type PwaService = ReturnType<typeof createPwaService>
