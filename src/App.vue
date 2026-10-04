<script setup lang="ts">
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import {
  Heart,
  Sun,
  Moon,
  Utensils,
  Gamepad2,
  BatteryMedium,
  Rotate3d,
  Check,
  WifiOff,
  Settings,
} from '@lucide/vue'
import HabitatScene from './features/habitat/HabitatScene.vue'
import { usePetSession } from './features/pet/usePetSession'

import SettingsPanel from './features/settings/SettingsPanel.vue'
import { useSettings } from './features/settings/useSettings'
import { messages } from './features/settings/messages'
import { palettes } from './features/settings/preferences'

const { preferences, storageUnavailable, update } = useSettings()
const text = computed(() => messages[preferences.value.language])
const settingsPanel = ref<InstanceType<typeof SettingsPanel>>()
watchEffect(() => {
  document.documentElement.lang = preferences.value.language
  document.title = text.value.title
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', palettes[preferences.value.caseColor].base)
})

const { pet, ready, busy, error, message, saved, care, retry } = usePetSession()
const reaction = ref<'idle' | 'feed' | 'play' | 'pet'>('idle')
const reactionId = ref(0)
const online = ref(navigator.onLine)
const level = computed(() => Math.floor(pet.value.careCount / 5) + 1)
const needs = computed(() => [
  {
    label: text.value.fullness,
    value: Math.round(pet.value.fullness),
    icon: Utensils,
  },
  {
    label: text.value.happiness,
    value: Math.round(pet.value.happiness),
    icon: Heart,
  },
  {
    label: text.value.energy,
    value: Math.round(pet.value.energy),
    icon: BatteryMedium,
  },
])
async function act(action: 'feed' | 'play' | 'sleep' | 'wake' | 'pet') {
  const accepted = await care(action)
  if (!accepted) return
  reaction.value =
    action === 'feed' || action === 'play' || action === 'pet' ? action : 'idle'
  reactionId.value++
}
function updateOnline() {
  online.value = navigator.onLine
}
window.addEventListener('online', updateOnline)
window.addEventListener('offline', updateOnline)
onUnmounted(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
})
</script>

<template>
  <main class="app-shell">
    <section
      class="device"
      :class="{ night: pet.sleeping }"
      :aria-label="text.home"
      :style="{ '--case-hue': palettes[preferences.caseColor].hue }"
    >
      <div class="device-shell">
        <div class="device-brand">
          <span aria-hidden="true">✦</span> hamcrab
          <span aria-hidden="true">✦</span><small>{{ text.bestie }}</small>
        </div>
        <div class="screen-bezel">
          <div class="bezel-label">
            <span>{{ text.equation }}</span
            ><span>01</span>
          </div>
          <div class="lcd-screen">
            <div v-if="error" class="error-banner" role="alert">
              {{ text.errors[error] }}
              <button @click="retry">{{ text.retry }}</button>
            </div>
            <div v-if="!online" class="offline-banner">
              <WifiOff :size="16" /> {{ text.offline }}
            </div>
            <div class="screen-header">
              <h2>{{ pet.name }}</h2>
              <div class="header-tools">
                <span
                  ><component :is="pet.sleeping ? Moon : Sun" :size="14" /> LVL
                  {{ String(level).padStart(2, '0') }}</span
                >
                <button
                  class="settings-trigger"
                  :aria-label="text.settings"
                  @click="settingsPanel?.open()"
                >
                  <Settings :size="18" />
                </button>
              </div>
            </div>
            <div class="needs-panel">
              <div v-for="need in needs" :key="need.label" class="need">
                <div class="need-label">
                  <component :is="need.icon" :size="13" /><span>{{
                    need.label
                  }}</span
                  ><b>{{ need.value }}</b>
                </div>
                <div
                  class="meter"
                  role="progressbar"
                  :aria-label="need.label"
                  :aria-valuenow="need.value"
                  :aria-valuemin="0"
                  :aria-valuemax="100"
                >
                  <span
                    v-for="segment in 10"
                    :key="segment"
                    :class="{ filled: need.value >= segment * 10 - 5 }"
                  />
                </div>
              </div>
            </div>
            <div class="scene-wrap">
              <HabitatScene
                :palette="palettes[preferences.costumeColor]"
                :description="text.scene"
                :fallback-title="text.fallback"
                :fallback-description="text.no3d"
                :sleeping="pet.sleeping"
                :reaction="reaction"
                :reaction-id="reactionId"
              /><span class="scene-caption">{{
                pet.sleeping ? 'Z z z …' : text.hello
              }}</span>
            </div>
            <div class="screen-tools">
              <span><Rotate3d :size="13" /> {{ text.rotate }}</span
              ><button
                :disabled="!ready || busy || !!error || pet.sleeping"
                @click="act('pet')"
              >
                <Heart :size="13" /> {{ text.pet }}
              </button>
            </div>
            <p class="message-strip" aria-live="polite">
              <span aria-hidden="true">▸</span>
              <span>{{ text.reactions[message] }}</span>
            </p>
          </div>
          <div class="bezel-bottom">
            <p class="gesture-count">
              <Heart :size="14" /> {{ pet.careCount }} {{ text.gestures }}
            </p>
            <div class="status-line" role="status">
              <Check v-if="saved" :size="13" />{{
                !ready
                  ? text.loading
                  : busy
                    ? text.saving
                    : saved
                      ? text.saved
                      : text.notSaved
              }}
            </div>
          </div>
        </div>
        <div class="care-actions" :aria-label="text.care">
          <div class="control">
            <button
              class="care-button"
              :aria-label="text.feed"
              :disabled="!ready || busy || !!error || pet.sleeping"
              @click="act('feed')"
            >
              <Utensils :size="26" /></button
            ><span>{{ text.feed }}</span
            ><small>A</small>
          </div>
          <div class="control">
            <button
              class="care-button"
              :aria-label="text.play"
              :disabled="
                !ready || busy || !!error || pet.sleeping || pet.energy < 10
              "
              @click="act('play')"
            >
              <Gamepad2 :size="28" /></button
            ><span>{{ text.play }}</span
            ><small>B</small>
          </div>
          <div class="control">
            <button
              class="care-button"
              :aria-label="pet.sleeping ? text.wake : text.sleep"
              :disabled="!ready || busy || !!error"
              @click="act(pet.sleeping ? 'wake' : 'sleep')"
            >
              <component :is="pet.sleeping ? Sun : Moon" :size="26" /></button
            ><span>{{ pet.sleeping ? text.wake : text.sleep }}</span
            ><small>C</small>
          </div>
        </div>
        <div class="shell-bottom" aria-hidden="true">
          <span>♡</span><i /><i /><i /><span>♡</span>
        </div>
      </div>
      <SettingsPanel
        ref="settingsPanel"
        :preferences="preferences"
        :text="text"
        :storage-unavailable="storageUnavailable"
        @change="update"
      />
    </section>
  </main>
</template>
