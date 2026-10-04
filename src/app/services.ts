import { inject, type InjectionKey } from 'vue'
import type { PetService } from '../features/pet'
import type { SettingsService } from '../features/settings'

export type Services = { pet: PetService; settings: SettingsService }
export const servicesKey: InjectionKey<Services> = Symbol('services')

export function useServices(): Services {
  const services = inject(servicesKey)
  if (!services) throw new Error('Application services have not been provided')
  return services
}
