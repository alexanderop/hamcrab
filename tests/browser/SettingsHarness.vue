<script setup lang="ts">
import { computed, ref } from 'vue'
import SettingsPanel from '../../src/features/settings/ui/SettingsPanel.vue'
import PetNameForm from '../../src/features/pet/ui/PetNameForm.vue'
import { messages } from '../../src/features/settings/ui/messages'
import { useSettings } from '../../src/features/settings/ui/useSettings'
import type { SettingsService } from '../../src/features/settings/application/settings-service'
const props = defineProps<{ service: SettingsService }>()
const { preferences, storageUnavailable, update } = useSettings(props.service)
const text = computed(() => messages[preferences.value.language]('Pinchy'))
const panel = ref<InstanceType<typeof SettingsPanel>>()
const name = ref('Pinchy')
async function save(value: string) {
  name.value = value
  return true
}
</script>
<template>
  <button @click="panel?.open()">Settings</button>
  <h1>{{ name }}</h1>
  <SettingsPanel
    ref="panel"
    :preferences="preferences"
    :storage-unavailable="storageUnavailable"
    :text="text"
    @change="update"
  >
    <PetNameForm
      :name="name"
      :disabled="false"
      :error="null"
      :save="save"
      :text="text.name"
    />
  </SettingsPanel>
</template>
