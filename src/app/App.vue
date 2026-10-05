<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import {
  Heart,
  Sun,
  Moon,
  Utensils,
  Gamepad2,
  BatteryMedium,
  Check,
  WifiOff,
  Settings,
} from '@lucide/vue'
import {
  HabitatScene,
  SnackPreview,
  type SnackKind,
  type CareCue,
} from '../features/habitat'
import {
  usePetSession,
  lifeView,
  lifeText,
  LifePanel,
  ShellGame,
  type LifeCommand,
  lifecycleView,
  friendshipView,
  FriendshipPanel,
  LifecyclePanel,
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
import { PwaPanel, usePwa } from '../features/pwa'
import { useServices } from './services'

const services = useServices()
const { preferences, storageUnavailable, update } = useSettings(
  services.settings,
)
const {
  pet,
  ready,
  busy,
  error,
  message,
  saved,
  care,
  life,
  lifeMessage,
  retry,
  rename,
  hatch,
  chooseVariant,
} = usePetSession(services.pet)
const text = computed(() =>
  messages[preferences.value.language](pet.value.name),
)
const lifeState = computed(() => lifeView(pet.value))
const lifeCopy = computed(() =>
  lifeText(preferences.value.language, pet.value.name),
)
const shellGame = ref<InstanceType<typeof ShellGame>>()
async function lifeAction(command: LifeCommand) {
  const accepted = await life(command)
  if (accepted && lifeMessage.value === 'gameFinished')
    reaction.value = { id: ++reactionId, kind: 'play', celebrate: true }
  return accepted
}
const settingsPanel = ref<InstanceType<typeof SettingsPanel>>()
watchEffect(() => {
  document.documentElement.lang = preferences.value.language
  document.title = text.value.title
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', palettes[preferences.value.caseColor].base)
})

const reaction = ref<CareCue | null>(null)
let reactionId = 0
const selectedFood = ref<FoodId>('franzbroetchen')
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
const pwa = usePwa(services.pwa)
const friendship = computed(() => friendshipView(pet.value))
const celebration = ref('')
const celebrationDay = ref(-1)
watch(
  () => preferences.value.language,
  () => {
    celebration.value = ''
  },
)
const lifecycle = computed(() => lifecycleView(pet.value.lifecycle))
const sceneDescription = computed(() =>
  [
    text.value.lifecycle.scenes[pet.value.lifecycle.stage],
    text.value.scene,
    ...(lifecycle.value.adultVariant
      ? [
          text.value.lifecycle.variants[lifecycle.value.adultVariant],
          text.value.lifecycle.traits[lifecycle.value.adultVariant],
        ]
      : []),
    ...(pet.value.sleeping ? [text.value.sleepingScene] : []),
    lifeCopy.value.attention[lifeState.value.attention],
    ...[lifeState.value.outfit, lifeState.value.toy, lifeState.value.decoration]
      .filter((item) => item !== 'none')
      .map((item) =>
        item === 'ribbon' || item === 'ball' || item === 'flower'
          ? text.value.friendship.descriptions[item]
          : lifeCopy.value.items[item],
      ),
  ].join(' '),
)
async function careWithCelebration(action: CareAction) {
  if (!ready.value || busy.value || error.value) return false
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
  const celebrate =
    after.level > before.level ||
    (after.wish.complete &&
      (!before.wish.complete || day !== pet.value.friendship.daily.day))
  reaction.value =
    action.type === 'feed'
      ? {
          id: ++reactionId,
          kind: 'feed',
          snack: snackKinds[action.food],
          celebrate,
        }
      : { id: ++reactionId, kind: action.type, celebrate }
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
  await careWithCelebration({ type: action })
}
async function feed(food: FoodId) {
  const accepted = await careWithCelebration({ type: 'feed', food })
  if (!accepted) return
  foodMenu.value?.close()
}
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
            <div v-if="!pwa.online" class="offline-banner">
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
            <div class="growth-panels">
              <LifecyclePanel
                v-if="ready"
                :lifecycle="pet.lifecycle"
                :disabled="busy || !!error"
                :text="text.lifecycle"
                :notice="
                  error
                    ? {
                        message: text.errors[error],
                        retryLabel: text.retry,
                        busy,
                      }
                    : null
                "
                @retry="retry"
                @hatch="hatch"
                @choose-variant="chooseVariant"
              />
              <FriendshipPanel
                :view="friendship"
                :ready="ready"
                :loading="text.loading"
                :text="text.friendship"
                :celebration="
                  celebrationDay === pet.friendship.daily.day ? celebration : ''
                "
              />
            </div>
            <div class="scene-wrap">
              <HabitatScene
                v-if="ready"
                :life-stage="pet.lifecycle.stage"
                :adult-variant="lifecycle.adultVariant"
                :palette="palettes[preferences.costumeColor]"
                :description="sceneDescription"
                :outfit="lifeState.outfit"
                :toy="lifeState.toy"
                :decoration="lifeState.decoration"
                :waste="lifeState.waste"
                :unwell="lifeState.unwell"
                :fallback-title="text.fallback"
                :fallback-description="text.no3d"
                :sleeping="pet.sleeping"
                :reaction="reaction"
                :loaded="ready && pet.lifecycle.stage !== 'egg'"
                :available="
                  ready && !busy && !error && pet.lifecycle.stage !== 'egg'
                "
                @pet="act('pet')"
              /><span class="scene-caption">{{
                pet.sleeping ? text.sweetDreams : text.hello
              }}</span>
            </div>
            <div class="screen-tools">
              <LifePanel
                :view="lifeState"
                :text="lifeCopy"
                :disabled="!ready || busy || !!error"
                :notice="error ? text.errors[error] : null"
                :retry-label="text.retry"
                :feedback="lifeMessage"
                :act="lifeAction"
                @retry="retry"
              /><button
                :disabled="
                  !ready ||
                  busy ||
                  !!error ||
                  pet.lifecycle.stage === 'egg' ||
                  pet.sleeping
                "
                @click="act('pet')"
              >
                <Heart :size="13" /> {{ text.pet }}
              </button>
            </div>
            <p class="message-strip" aria-live="polite">
              <span aria-hidden="true">▸</span>
              <span>{{
                lifeState.attention !== 'content' &&
                lifeState.attention !== 'sleeping'
                  ? lifeCopy.attention[lifeState.attention]
                  : text.reactions[message]
              }}</span>
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
              :disabled="
                !ready ||
                busy ||
                !!error ||
                pet.lifecycle.stage === 'egg' ||
                pet.sleeping
              "
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
                !ready ||
                busy ||
                !!error ||
                pet.lifecycle.stage === 'egg' ||
                pet.sleeping ||
                pet.energy < 10
              "
              @click="shellGame?.open()"
            >
              <Gamepad2 :size="28" /></button
            ><span>{{ text.play }}</span
            ><small>B</small>
          </div>
          <div class="control">
            <button
              class="care-button"
              :aria-label="pet.sleeping ? text.wake : text.sleep"
              :disabled="
                !ready || busy || !!error || pet.lifecycle.stage === 'egg'
              "
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
        :disabled="
          !ready ||
          busy ||
          !!error ||
          pet.lifecycle.stage === 'egg' ||
          pet.sleeping
        "
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
      <ShellGame
        ref="shellGame"
        :view="lifeState"
        :text="lifeCopy"
        :german="preferences.language === 'de'"
        :disabled="!ready || busy || !!error"
        :notice="error ? text.errors[error] : null"
        :retry-label="text.retry"
        :feedback="lifeMessage"
        :act="lifeAction"
        @retry="retry"
      />
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
        <template #app>
          <PwaPanel
            :service="services.pwa"
            :language="preferences.language"
            mode="settings"
            :busy="busy || !ready"
          />
        </template>
      </SettingsPanel>
      <PwaPanel
        :service="services.pwa"
        :language="preferences.language"
        mode="notices"
        :busy="busy || !ready"
      />
    </section>
  </main>
</template>

<style scoped>
.growth-panels {
  display: contents;
}
@media (max-height: 600px) and (min-aspect-ratio: 6/5) {
  .growth-panels {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 5px;
    flex-shrink: 0;
  }
}
@media (max-height: 600px) and (max-aspect-ratio: 6/5) {
  .device-shell {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .device-brand {
    padding: 0;
  }
  .device-brand small,
  .shell-bottom {
    display: none;
  }
}
</style>
