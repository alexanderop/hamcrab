<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parsePetName } from '../domain/pet'

const props = defineProps<{
  name: string
  disabled: boolean
  error: string | null
  save: (name: string) => Promise<boolean>
  text: {
    label: string
    hint: string
    save: string
    saved: string
    invalid: string
  }
}>()
const draft = ref(props.name)
const savedName = ref<string | null>(null)
const confirmed = computed(
  () =>
    savedName.value === draft.value.trim() && savedName.value === props.name,
)
const parsed = computed(() => parsePetName(draft.value))
const changed = computed(() => draft.value.trim() !== props.name)
watch(
  () => props.name,
  (name) => {
    draft.value = name
  },
)

async function submit() {
  if (props.disabled || !parsed.value.success || !changed.value) return
  const name = parsed.value.data
  if (await props.save(name)) savedName.value = name
}
</script>

<template>
  <form class="pet-name-form" novalidate @submit.prevent="submit">
    <label for="pet-name">{{ text.label }}</label>
    <div class="pet-name-controls">
      <input
        id="pet-name"
        v-model="draft"
        type="text"
        maxlength="24"
        autocomplete="off"
        :disabled="disabled"
        :aria-invalid="!parsed.success"
        :aria-describedby="
          !parsed.success ? 'name-hint name-error' : 'name-hint'
        "
      />
      <button type="submit" :disabled="disabled || !parsed.success || !changed">
        {{ text.save }}
      </button>
    </div>
    <p id="name-hint" class="settings-note">{{ text.hint }}</p>
    <p
      v-if="!parsed.success"
      id="name-error"
      role="alert"
      class="settings-note"
    >
      {{ text.invalid }}
    </p>
    <p v-if="error" role="alert" class="settings-note">{{ error }}</p>
    <p v-if="confirmed" role="status" class="settings-note">{{ text.saved }}</p>
  </form>
</template>
