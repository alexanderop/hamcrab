<script setup lang="ts">
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
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
import { HabitatScene, SnackPreview, type SnackKind } from '../features/habitat'
import {
  usePetSession,
  friendshipView,
  FriendshipPanel,
  FoodMenu,
  PetNameForm,
  type CareAction,
  type FoodId,
} from '../features/pet'
import {
  SettingsPanel,
  useSettings,
  messages,
  palettes,
} from '../features/settings'
import { useServices } from './services'

const services = useServices()
const { preferences, storageUnavailable, update } = useSettings(
  services.settings,
)
const { pet, ready, busy, error, message, saved, care, retry, rename } =
  usePetSession(services.pet)
const text = computed(() =>
  messages[preferences.value.language](pet.value.name),
)
const settingsPanel = ref<InstanceType<typeof SettingsPanel>>()
watchEffect(() => {
  document.documentElement.lang = preferences.value.language
  document.title = text.value.title
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', palettes[preferences.value.caseColor].base)
})

const reaction = ref<'idle' | 'feed' | 'play' | 'pet'>('idle')
const reactionId = ref(0)
const selectedFood = ref<FoodId>('franzbroetchen')
const servedSnack = ref<SnackKind | null>(null)
const foodMenu = ref<InstanceType<typeof FoodMenu>>()
const snackKinds: Record<FoodId, SnackKind> = {
  franzbroetchen: 'pastry',
  doener: 'kebab',
  augustiner: 'bottle',
  strawberry: 'strawberry',
}
const foodNotice = computed(() =>
  error.value
    ? text.value.errors[error.value]
    : pet.value.sleeping
      ? text.value.reactions.sleeping
      : null,
)
const online = ref(navigator.onLine)
const friendship = computed(() => friendshipView(pet.value))
const celebration = ref('')
const celebrationDay = ref(-1)
watch(
  () => preferences.value.language,
  () => {
    celebration.value = ''
  },
)
const sceneDescription = computed(() =>
  [
    text.value.scene,
    ...(pet.value.sleeping ? [text.value.sleepingScene] : []),
    ...friendship.value.unlocked.map(
      (reward) => text.value.friendship.descriptions[reward],
    ),
  ].join(' '),
)
async function careWithCelebration(action: CareAction) {
  const before = friendship.value
  const day = pet.value.friendship.daily.day
  const accepted = await care(action)
  if (!accepted) return false
  const after = friendship.value
  celebrationDay.value = pet.value.friendship.daily.day
  celebration.value = after.unlocked
    .filter((reward) => !before.unlocked.includes(reward))
    .map((reward) =>
      text.value.friendship.celebration(text.value.friendship.rewards[reward]),
    )
    .join(' ')
  if (
    after.wish.complete &&
    (!before.wish.complete || day !== pet.value.friendship.daily.day)
  )
    celebration.value += ` ${text.value.friendship.wishDone}.`
  return true
}
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
async function act(action: Exclude<CareAction['type'], 'feed'>) {
  const accepted = await careWithCelebration({ type: action })
  if (!accepted) return
  reaction.value = action === 'play' || action === 'pet' ? action : 'idle'
  reactionId.value++
}
async function feed(food: FoodId) {
  const accepted = await careWithCelebration({ type: 'feed', food })
  if (!accepted) return
  servedSnack.value = snackKinds[food]
  reaction.value = 'feed'
  reactionId.value++
  foodMenu.value?.close()
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
              <h2 :title="pet.name">{{ pet.name }}</h2>
              <div class="header-tools">
                <span
                  ><component :is="pet.sleeping ? Moon : Sun" :size="14" /> LVL
                  {{
                    ready ? String(friendship.level).padStart(2, '0') : '…'
                  }}</span
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
            <FriendshipPanel
              :view="friendship"
              :ready="ready"
              :loading="text.loading"
              :text="text.friendship"
              :celebration="
                celebrationDay === pet.friendship.daily.day ? celebration : ''
              "
            />
            <div class="scene-wrap">
              <HabitatScene
                :palette="palettes[preferences.costumeColor]"
                :description="sceneDescription"
                :ribbon="ready && friendship.unlocked.includes('ribbon')"
                :ball="ready && friendship.unlocked.includes('ball')"
                :flower="ready && friendship.unlocked.includes('flower')"
                :fallback-title="text.fallback"
                :fallback-description="text.no3d"
                :sleeping="pet.sleeping"
                :reaction="reaction"
                :snack="servedSnack"
                :reaction-id="reactionId"
              /><span class="scene-caption">{{
                pet.sleeping ? text.sweetDreams : text.hello
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
              @click="foodMenu?.open()"
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
      <FoodMenu
        ref="foodMenu"
        :selected="selectedFood"
        :available-foods="friendship.availableFoods"
        :disabled="!ready || busy || !!error || pet.sleeping"
        :notice="foodNotice"
        :text="text.food"
        :meters="text"
        @select="selectedFood = $event"
        @give="feed"
      >
        <SnackPreview
          :kind="snackKinds[selectedFood]"
          :label="text.food.names[selectedFood]"
          :fallback="text.no3d"
        />
      </FoodMenu>
      <SettingsPanel
        ref="settingsPanel"
        :preferences="preferences"
        :text="text"
        :storage-unavailable="storageUnavailable"
        @change="update"
      >
        <PetNameForm
          :name="pet.name"
          :disabled="!ready || busy || !!error"
          :error="error ? text.errors[error] : null"
          :save="rename"
          :text="text.name"
        />
      </SettingsPanel>
    </section>
  </main>
</template>
