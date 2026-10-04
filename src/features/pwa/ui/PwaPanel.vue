<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PwaService } from '../application/pwa-service'
import { usePwa } from './usePwa'
import { pwaMessages } from './messages'
const props = defineProps<{
  service: PwaService
  language: 'en' | 'de'
  mode: 'notices' | 'settings'
  busy?: boolean
}>()
const state = usePwa(props.service)
const text = computed(() => pwaMessages[props.language])
const dialog = ref<HTMLDialogElement>()
const error = computed(() =>
  state.value.error ? text.value[`${state.value.error}Error`] : '',
)
function snoozeInstall() {
  props.service.snoozeInstall()
  dialog.value?.close()
}
function openInstall() {
  dialog.value?.showModal()
}
</script>

<template>
  <section
    v-if="mode === 'settings'"
    class="pwa-settings"
    :aria-label="text.title"
  >
    <h3>{{ text.title }}</h3>
    <p>{{ state.offlineReady ? text.ready : text.preparing }}</p>
    <p v-if="!state.online">{{ text.offlineDetail }}</p>
    <p v-if="state.standalone">{{ text.standalone }}</p>
    <p v-else-if="state.installed">{{ text.installed }}</p>
    <button v-else type="button" @click="openInstall">
      {{ text.install }}
    </button>
    <div v-if="state.updateAvailable" class="pwa-update">
      <strong>{{ text.update }}</strong>
      <p>{{ text.updateDescription }}</p>
      <button :disabled="busy || state.applying" @click="service.apply()">
        {{ state.applying ? text.applying : text.apply }}
      </button>
    </div>
    <button
      :disabled="state.checking || !state.online"
      @click="service.check()"
    >
      {{ state.checking ? text.checking : text.check }}
    </button>
    <p v-if="state.checked && !state.updateAvailable" aria-live="polite">
      {{ text.checked }}
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
  <aside
    v-else-if="state.updateHint || state.installHint"
    class="pwa-notice"
    aria-live="polite"
    :aria-label="state.updateHint ? text.update : text.install"
  >
    <template v-if="state.updateHint">
      <strong>{{ text.update }}</strong>
      <p>{{ text.updateDescription }}</p>
      <div class="pwa-actions">
        <button :disabled="busy || state.applying" @click="service.apply()">
          {{ state.applying ? text.applying : text.apply }}
        </button>
        <button :disabled="state.applying" @click="service.snoozeUpdate()">
          {{ text.updateLater }}
        </button>
      </div>
      <p v-if="state.error === 'update'" role="alert">{{ error }}</p>
    </template>
    <template v-else>
      <strong>{{ text.install }}</strong>
      <p>{{ text.invitation }}</p>
      <div class="pwa-actions">
        <button @click="openInstall">{{ text.installNow }}</button>
        <button @click="service.snoozeInstall()">{{ text.later }}</button>
      </div>
    </template>
  </aside>
  <dialog
    ref="dialog"
    class="settings-dialog pwa-dialog"
    :aria-labelledby="`install-title-${mode}`"
  >
    <div class="settings-heading">
      <h2 :id="`install-title-${mode}`">{{ text.install }}</h2>
      <button
        class="settings-close"
        :aria-label="text.close"
        autofocus
        @click="dialog?.close()"
      >
        ×
      </button>
    </div>
    <template v-if="!state.installed && !state.standalone">
      <p>{{ text.invitation }}</p>
      <p>{{ text[state.platform] }}</p>
      <button
        v-if="state.canInstall"
        class="settings-done"
        :disabled="state.installing"
        @click="service.install()"
      >
        {{ state.installing ? text.installing : text.installNow }}
      </button>
      <p v-if="state.error === 'install'" role="alert">{{ error }}</p>
      <button class="settings-done" @click="snoozeInstall">
        {{ text.later }}
      </button>
    </template>
    <p v-else>{{ state.standalone ? text.standalone : text.installed }}</p>
  </dialog>
</template>
