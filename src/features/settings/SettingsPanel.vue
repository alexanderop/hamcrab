<script setup lang="ts">
import { ref } from 'vue'
import { Check, X } from '@lucide/vue'
import { colorNames, palettes, type Preferences } from './preferences'
import type { Messages } from './messages'

defineProps<{
  preferences: Preferences
  text: Messages
  storageUnavailable: boolean
}>()
const emit = defineEmits<{ change: [change: Partial<Preferences>] }>()
const dialog = ref<HTMLDialogElement>()
defineExpose({ open: () => dialog.value?.showModal() })
</script>

<template>
  <dialog ref="dialog" class="settings-dialog" aria-labelledby="settings-title">
    <div class="settings-heading">
      <h2 id="settings-title">{{ text.settings }}</h2>
      <button
        class="settings-close"
        :aria-label="text.close"
        autofocus
        @click="dialog?.close()"
      >
        <X :size="19" />
      </button>
    </div>
    <fieldset class="settings-group">
      <legend>{{ text.language }}</legend>
      <div class="language-options">
        <label v-for="language in ['en', 'de'] as const" :key="language">
          <input
            type="radio"
            name="language"
            :value="language"
            :checked="preferences.language === language"
            @change="emit('change', { language })"
          />
          <span :lang="language">{{
            language === 'en' ? 'English' : 'Deutsch'
          }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset
      v-for="field in ['caseColor', 'costumeColor'] as const"
      :key="field"
      class="settings-group"
    >
      <legend>{{ text[field] }}</legend>
      <div class="color-options">
        <label v-for="color in colorNames" :key="color">
          <input
            type="radio"
            :name="field"
            :value="color"
            :checked="preferences[field] === color"
            @change="emit('change', { [field]: color })"
          />
          <span
            class="color-swatch"
            :style="{ background: palettes[color].base }"
            aria-hidden="true"
          >
            <Check v-if="preferences[field] === color" :size="19" />
          </span>
          <span>{{ text.colors[color] }}</span>
        </label>
      </div>
    </fieldset>
    <p v-if="storageUnavailable" role="alert" class="settings-note">
      {{ text.settingsUnsaved }}
    </p>
    <p v-else class="settings-note">{{ text.autoSave }}</p>
    <button class="settings-done" @click="dialog?.close()">
      {{ text.done }}
    </button>
  </dialog>
</template>
