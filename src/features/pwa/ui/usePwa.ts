import { shallowRef, onUnmounted } from 'vue'
import type { PwaService } from '../application/pwa-service'
export function usePwa(service: PwaService) {
  const state = shallowRef(service.getState())
  const unsubscribe = service.subscribe((value) => {
    state.value = value
  })
  onUnmounted(unsubscribe)
  return state
}
