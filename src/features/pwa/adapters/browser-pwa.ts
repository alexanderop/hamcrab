import { registerSW } from 'virtual:pwa-register'
import { createPwaService, type Platform } from '../application/pwa-service'

type InstallPrompt = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
const SNOOZE_KEY = 'hamcrab.pwa.install-snooze.v1'
export function createBrowserPwa() {
  const ua = navigator.userAgent
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const android = /Android/i.test(ua)
  const platform: Platform = ios ? 'ios' : android ? 'android' : 'desktop'
  const displayMode = matchMedia('(display-mode: standalone)')
  const standalone = () =>
    displayMode.matches ||
    ('standalone' in navigator && navigator.standalone === true)
  let deferred: InstallPrompt | null = null
  let registration: ServiceWorkerRegistration | undefined
  let previousController = navigator.serviceWorker?.controller
  let controllerChanged = false
  let disposed = false
  let lastCheck = 0
  const service = createPwaService(
    {
      now: () => Date.now(),
      readSnooze() {
        try {
          const value = Number(localStorage.getItem(SNOOZE_KEY))
          return Number.isFinite(value) && value >= 0 ? value : 0
        } catch {
          return 0
        }
      },
      writeSnooze(until) {
        try {
          localStorage.setItem(SNOOZE_KEY, String(until))
        } catch {
          /* Keep the in-memory snooze when storage is unavailable. */
        }
      },
      async check() {
        if (!navigator.onLine || !registration)
          throw new Error('Update check unavailable')
        await registration.update()
      },
      async apply() {
        if (controllerChanged) {
          window.location.reload()
          return
        }
        if (!registration?.waiting) throw new Error('No waiting update')
        let activated = () => {}
        let timeout: ReturnType<typeof setTimeout> | undefined
        try {
          await new Promise<void>((resolve, reject) => {
            activated = resolve
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              activated,
              { once: true },
            )
            timeout = setTimeout(
              () => reject(new Error('Update activation timed out')),
              15_000,
            )
            void updateWorker(true).catch(reject)
          })
          window.location.reload()
        } finally {
          clearTimeout(timeout)
          navigator.serviceWorker.removeEventListener(
            'controllerchange',
            activated,
          )
        }
      },
      async install() {
        const prompt = deferred
        if (!prompt) return null
        deferred = null
        service.receive({ canInstall: false })
        await prompt.prompt()
        return (await prompt.userChoice).outcome
      },
    },
    {
      standalone: standalone(),
      online: navigator.onLine,
      platform,
      mobile: ios || android,
    },
  )
  const updateWorker = registerSW({
    immediate: true,
    // Reload only after this tab explicitly requests the update. Workbox's
    // isUpdate heuristic also treats rapid releases as external workers.
    onNeedReload() {},
    onRegisteredSW(_url, value) {
      if (!disposed) {
        registration = value
        if (value?.active) service.receive({ offlineReady: true })
      }
    },
    onNeedRefresh() {
      if (!disposed) service.receive({ updateAvailable: true })
    },
    onOfflineReady() {
      if (!disposed) service.receive({ offlineReady: true })
    },
    onRegisterError() {
      if (!disposed) service.receive({ error: 'registration' })
    },
  })
  function installPrompt(event: Event) {
    event.preventDefault()
    deferred = event as InstallPrompt
    service.receive({ canInstall: true })
  }
  function installed() {
    deferred = null
    service.receive({ installed: true, canInstall: false })
  }
  function changedController() {
    if (
      previousController &&
      previousController !== navigator.serviceWorker.controller
    ) {
      controllerChanged = true
      service.receive({ updateAvailable: true })
    }
    previousController = navigator.serviceWorker.controller
  }
  navigator.serviceWorker?.addEventListener(
    'controllerchange',
    changedController,
  )
  function modeChanged() {
    service.receive({ standalone: standalone() })
  }
  function connectivity() {
    service.receive({ online: navigator.onLine })
    if (navigator.onLine) checkOnReturn()
  }
  function checkOnReturn() {
    service.refreshHints()
    if (
      document.visibilityState !== 'visible' ||
      !navigator.onLine ||
      !registration ||
      Date.now() - lastCheck < 60_000
    )
      return
    lastCheck = Date.now()
    void service.check()
  }
  window.addEventListener('beforeinstallprompt', installPrompt)
  window.addEventListener('appinstalled', installed)
  window.addEventListener('online', connectivity)
  window.addEventListener('offline', connectivity)
  displayMode.addEventListener('change', modeChanged)
  document.addEventListener('visibilitychange', checkOnReturn)
  const hintTimer = window.setTimeout(() => service.showInstallHint(), 2000)
  const refreshTimer = window.setInterval(() => service.refreshHints(), 60_000)
  return {
    service,
    dispose() {
      disposed = true
      navigator.serviceWorker?.removeEventListener(
        'controllerchange',
        changedController,
      )
      clearTimeout(hintTimer)
      clearInterval(refreshTimer)
      window.removeEventListener('beforeinstallprompt', installPrompt)
      window.removeEventListener('appinstalled', installed)
      window.removeEventListener('online', connectivity)
      window.removeEventListener('offline', connectivity)
      displayMode.removeEventListener('change', modeChanged)
      document.removeEventListener('visibilitychange', checkOnReturn)
    },
  }
}
