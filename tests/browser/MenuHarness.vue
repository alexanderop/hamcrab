<script setup lang="ts">
import { ref } from 'vue'
import FoodMenu from '../../src/features/pet/ui/FoodMenu.vue'
import type { FoodId } from '../../src/features/pet/domain/foods'
import { messages } from '../../src/features/settings/ui/messages'
const props = defineProps<{ unlocked?: boolean }>()
const menu = ref<InstanceType<typeof FoodMenu>>()
const selected = ref<FoodId>('franzbroetchen')
const served = ref('Nothing served')
const text = messages.en('Pinchy')
function give(food: FoodId) {
  served.value = food
  menu.value?.close()
}
</script>
<template>
  <button @click="menu?.open()">Feed</button>
  <p role="status">{{ served }}</p>
  <FoodMenu
    ref="menu"
    :selected="selected"
    :available-foods="
      props.unlocked
        ? ['franzbroetchen', 'doener', 'augustiner', 'strawberry']
        : ['franzbroetchen', 'doener', 'augustiner']
    "
    :disabled="false"
    :notice="null"
    :text="text.food"
    :meters="text"
    @select="selected = $event"
    @give="give"
  />
</template>
