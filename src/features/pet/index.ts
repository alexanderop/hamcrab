export { default as FoodMenu } from './ui/FoodMenu.vue'
export { default as PetNameForm } from './ui/PetNameForm.vue'
export { usePetSession } from './ui/usePetSession'
export { createPetService, type PetService } from './application/pet-service'
export type { CareAction } from './domain/pet'
export type { FoodId } from './domain/foods'

export { friendshipView } from './domain/friendship'
export { default as FriendshipPanel } from './ui/FriendshipPanel.vue'

export { default as LifecyclePanel } from './ui/LifecyclePanel.vue'

export { lifecycleView, type AdultVariant } from './domain/lifecycle'
