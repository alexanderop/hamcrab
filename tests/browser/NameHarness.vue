<script setup lang="ts">
import { ref } from 'vue'
import PetNameForm from '../../src/features/pet/ui/PetNameForm.vue'
import { messages } from '../../src/features/settings/ui/messages'
const props = defineProps<{ fail?: boolean }>()
const name = ref('Pinchy')
const error = ref<string | null>(null)
async function save(value: string) {
  if (props.fail) {
    error.value = 'Save unavailable'
    return false
  }
  name.value = value
  return true
}
</script>
<template>
  <h1>{{ name }}</h1>
  <PetNameForm
    :name="name"
    :disabled="false"
    :error="error"
    :save="save"
    :text="messages.en(name).name"
  />
</template>
