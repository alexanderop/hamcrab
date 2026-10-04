import { onMounted, onUnmounted, readonly, ref } from 'vue'
import { parsePetName, type CareAction, type CareMessage } from '../domain/pet'
import { InvalidPetDataError } from '../application/ports'
import type { PetService } from '../application/pet-service'

export function usePetSession(service: PetService) {
  const pet = ref(service.initial())
  const ready = ref(false)
  const busy = ref(false)
  const error = ref<'invalid' | 'save' | 'load' | null>(null)
  const message = ref<CareMessage | 'welcome' | 'hatched' | 'grown'>('welcome')
  const saved = ref(false)
  let disposed = false
  let timer: ReturnType<typeof setInterval> | undefined

  function reportError(cause: unknown, saving: boolean) {
    error.value =
      cause instanceof InvalidPetDataError
        ? 'invalid'
        : saving
          ? 'save'
          : 'load'
    saved.value = false
  }

  async function retry() {
    if (busy.value || disposed) return
    busy.value = true
    try {
      const stored = await service.load()
      if (disposed) return
      pet.value = stored
      ready.value = true
      error.value = null
      saved.value = true
    } catch (cause) {
      if (!disposed) reportError(cause, false)
    } finally {
      if (!disposed) busy.value = false
    }
  }

  async function care(action: CareAction) {
    if (!ready.value || busy.value || disposed || error.value) return false
    busy.value = true
    saved.value = false
    try {
      const result = await service.care(action)
      if (disposed) return false
      const grew =
        pet.value.lifecycle.stage === 'baby' &&
        result.pet.lifecycle.stage === 'adult'
      pet.value = result.pet
      message.value = grew ? 'grown' : result.message
      error.value = null
      saved.value = true
      return result.accepted
    } catch (cause) {
      if (!disposed) reportError(cause, true)
      return false
    } finally {
      if (!disposed) busy.value = false
    }
  }

  async function hatch() {
    if (!ready.value || busy.value || disposed || error.value) return false
    busy.value = true
    saved.value = false
    try {
      const result = await service.hatch()
      if (disposed) return false
      pet.value = result.pet
      if (result.hatched) message.value = 'hatched'
      saved.value = true
      return result.hatched
    } catch (cause) {
      if (!disposed) reportError(cause, true)
      return false
    } finally {
      if (!disposed) busy.value = false
    }
  }

  async function rename(name: string) {
    if (!parsePetName(name).success) return false
    if (!ready.value || busy.value || disposed || error.value) return false
    busy.value = true
    saved.value = false
    try {
      const stored = await service.rename(name)
      if (disposed || stored === null) return false
      pet.value = stored
      saved.value = true
      return true
    } catch (cause) {
      if (!disposed) reportError(cause, true)
      return false
    } finally {
      if (!disposed) busy.value = false
    }
  }

  function refreshWhenVisible() {
    if (document.visibilityState === 'visible' && !error.value) void retry()
  }

  onMounted(() => {
    void retry()
    timer = setInterval(refreshWhenVisible, 15_000)
    document.addEventListener('visibilitychange', refreshWhenVisible)
  })

  onUnmounted(() => {
    disposed = true
    if (timer !== undefined) clearInterval(timer)
    document.removeEventListener('visibilitychange', refreshWhenVisible)
  })

  return {
    pet: readonly(pet),
    ready: readonly(ready),
    busy: readonly(busy),
    error: readonly(error),
    message: readonly(message),
    saved: readonly(saved),
    care,
    hatch,
    rename,
    retry,
  }
}
