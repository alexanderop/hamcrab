<script setup lang="ts">
import { ref } from 'vue'
import { X, Utensils, Heart, BatteryMedium } from '@lucide/vue'
import { foods, foodIds, type FoodId } from '../domain/foods'

const props = defineProps<{
  selected: FoodId
  availableFoods: readonly FoodId[]
  disabled: boolean
  notice: string | null
  text: {
    title: string
    choose: string
    close: string
    give: string
    locked: string
    names: Record<FoodId, string>
  }
  meters: { fullness: string; happiness: string; energy: string }
}>()
const emit = defineEmits<{
  select: [food: FoodId]
  give: [food: FoodId]
}>()
const dialog = ref<HTMLDialogElement>()
const opened = ref(false)
const effects = [
  { key: 'fullness', icon: Utensils },
  { key: 'happiness', icon: Heart },
  { key: 'energy', icon: BatteryMedium },
] as const

function open() {
  opened.value = true
  dialog.value?.showModal()
}
function close() {
  dialog.value?.close()
}
defineExpose({ open, close })
</script>

<template>
  <dialog
    ref="dialog"
    class="settings-dialog food-dialog"
    aria-labelledby="food-title"
    @close="opened = false"
  >
    <div class="settings-heading">
      <h2 id="food-title">{{ text.title }}</h2>
      <button
        class="settings-close"
        :aria-label="text.close"
        autofocus
        @click="close"
      >
        <X :size="19" />
      </button>
    </div>
    <div v-if="opened" class="food-preview"><slot /></div>
    <fieldset class="food-options">
      <legend>{{ text.choose }}</legend>
      <label v-for="food in foodIds" :key="food">
        <input
          type="radio"
          name="food"
          :value="food"
          :disabled="!availableFoods.includes(food)"
          :aria-label="text.names[food]"
          :checked="selected === food"
          @change="emit('select', food)"
        />
        <span class="food-name"
          >{{ text.names[food]
          }}<small v-if="!availableFoods.includes(food)">
            · {{ text.locked }}</small
          ></span
        >
        <span class="food-effects">
          <template v-for="effect in effects" :key="effect.key">
            <span
              v-if="foods[food][effect.key]"
              :aria-label="`${meters[effect.key]} ${foods[food][effect.key] > 0 ? '+' : ''}${foods[food][effect.key]}`"
            >
              <component :is="effect.icon" :size="12" aria-hidden="true" />
              {{ foods[food][effect.key] > 0 ? '+' : ''
              }}{{ foods[food][effect.key] }}
            </span>
          </template>
        </span>
      </label>
    </fieldset>
    <p v-if="notice" role="alert" class="settings-note">{{ notice }}</p>
    <button
      class="settings-done"
      :disabled="disabled || !availableFoods.includes(selected)"
      @click="emit('give', props.selected)"
    >
      {{ text.give }}
    </button>
  </dialog>
</template>
