import { onMounted, onUnmounted, readonly, ref } from 'vue'
import {
  advancePet,
  createPet,
  petNameSchema,
  type CareAction,
  type CareMessage,
} from './domain'
import { InvalidPetDataError, loadPet, saveCare, savePetName } from './storage'

export function usePetSession() {
  const pet = ref(createPet(Date.now()))
  const ready = ref(false)
  const busy = ref(false)
  const error = ref<'invalid' | 'save' | 'load' | null>(null)
  const message = ref<CareMessage | 'welcome'>('welcome')
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
      const stored = await loadPet()
      if (disposed) return
      pet.value = advancePet(stored, Date.now())
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
      const result = await saveCare(action)
      if (disposed) return false
      pet.value = result.pet
      message.value = result.message
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

  async function rename(name: string) {
    if (!ready.value || busy.value || disposed || error.value) return false
    const parsed = petNameSchema.safeParse(name)
    if (!parsed.success) return false
    busy.value = true
    saved.value = false
    try {
      const stored = await savePetName(parsed.data)
      if (disposed) return false
      pet.value = advancePet(stored, Date.now())
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
    rename,
    retry,
  }
}
