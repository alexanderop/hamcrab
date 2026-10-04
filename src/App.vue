<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
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
} from '@lucide/vue'
import HabitatScene from './features/habitat/HabitatScene.vue'
import { usePetSession } from './features/pet/usePetSession'

const { pet, ready, busy, error, message, saved, care, retry } = usePetSession()
const reaction = ref<'idle' | 'feed' | 'play' | 'pet'>('idle')
const reactionId = ref(0)
const online = ref(navigator.onLine)
const level = computed(() => Math.floor(pet.value.careCount / 5) + 1)
const needs = computed(() => [
  { label: 'Sättigung', value: Math.round(pet.value.fullness), icon: Utensils },
  { label: 'Freude', value: Math.round(pet.value.happiness), icon: Heart },
  {
    label: 'Energie',
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
      aria-label="Pinchys Zuhause"
    >
      <div class="device-shell">
        <div class="device-brand">
          <span aria-hidden="true">✦</span> hamcrab
          <span aria-hidden="true">✦</span><small>YOUR TINY BESTIE</small>
        </div>
        <div class="screen-bezel">
          <div class="bezel-label">
            <span>HAMSTER + CRAB = ♡</span><span>01</span>
          </div>
          <div class="lcd-screen">
            <div v-if="error" class="error-banner" role="alert">
              {{ error }} <button @click="retry">Erneut versuchen</button>
            </div>
            <div v-if="!online" class="offline-banner">
              <WifiOff :size="16" /> Du bist offline. Eure gemeinsame Zeit geht
              weiter.
            </div>
            <div class="screen-header">
              <h2>{{ pet.name }}</h2>
              <span
                ><component :is="pet.sleeping ? Moon : Sun" :size="14" /> LVL
                {{ String(level).padStart(2, '0') }}</span
              >
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
                :sleeping="pet.sleeping"
                :reaction="reaction"
                :reaction-id="reactionId"
              /><span class="scene-caption">{{
                pet.sleeping ? 'Z z z …' : 'HI, BESTIE!'
              }}</span>
            </div>
            <div class="screen-tools">
              <span><Rotate3d :size="13" /> Ziehen zum Drehen</span
              ><button
                :disabled="!ready || busy || !!error || pet.sleeping"
                @click="act('pet')"
              >
                <Heart :size="13" /> Streicheln
              </button>
            </div>
            <p class="message-strip" aria-live="polite">
              <span aria-hidden="true">▸</span>
              <span>{{ message || 'Du bist da! Hab dich vermisst.' }}</span>
            </p>
          </div>
          <div class="bezel-bottom">
            <p class="gesture-count">
              <Heart :size="14" /> {{ pet.careCount }} gemeinsame Gesten
            </p>
            <div class="status-line" role="status">
              <Check v-if="saved" :size="13" />{{
                !ready
                  ? 'Pinchy wacht gleich auf …'
                  : busy
                    ? 'Wird gespeichert …'
                    : saved
                      ? 'Euer Spielstand ist gespeichert'
                      : 'Speichern noch nicht bestätigt'
              }}
            </div>
          </div>
        </div>
        <div class="care-actions" aria-label="Kümmere dich um Pinchy">
          <div class="control">
            <button
              class="care-button"
              aria-label="Füttern"
              :disabled="!ready || busy || !!error || pet.sleeping"
              @click="act('feed')"
            >
              <Utensils :size="26" /></button
            ><span>FÜTTERN</span><small>A</small>
          </div>
          <div class="control">
            <button
              class="care-button"
              aria-label="Spielen"
              :disabled="
                !ready || busy || !!error || pet.sleeping || pet.energy < 10
              "
              @click="act('play')"
            >
              <Gamepad2 :size="28" /></button
            ><span>SPIELEN</span><small>B</small>
          </div>
          <div class="control">
            <button
              class="care-button"
              :aria-label="pet.sleeping ? 'Wecken' : 'Schlafen'"
              :disabled="!ready || busy || !!error"
              @click="act(pet.sleeping ? 'wake' : 'sleep')"
            >
              <component :is="pet.sleeping ? Sun : Moon" :size="26" /></button
            ><span>{{ pet.sleeping ? 'WECKEN' : 'SCHLAFEN' }}</span
            ><small>C</small>
          </div>
        </div>
        <div class="shell-bottom" aria-hidden="true">
          <span>♡</span><i /><i /><i /><span>♡</span>
        </div>
      </div>
    </section>
  </main>
</template>
