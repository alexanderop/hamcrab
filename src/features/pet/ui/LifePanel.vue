<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LifeCommand, LifeMessage, lifeView } from '../domain/life'
import type { LifeText } from './lifeText'
const props = defineProps<{
  view: ReturnType<typeof lifeView>
  text: LifeText
  disabled: boolean
  notice: string | null
  retryLabel: string
  feedback: LifeMessage | null
  act: (command: LifeCommand) => Promise<boolean>
}>()
defineEmits<{ retry: [] }>()
const dialog = ref<HTMLDialogElement>()
const opener = ref<HTMLButtonElement>()
const section = ref<'care' | 'things' | 'family' | 'routine'>('care')
const confirm = ref(false)
const expectedGeneration = ref(props.view.generation)
const routine = ref({ ...props.view.routine })
watch(
  () => props.view.generation,
  () => {
    confirm.value = false
  },
)
const equipment = computed(() => [
  { slot: 'outfit' as const, items: ['none', 'cap', 'ribbon'] as const },
  { slot: 'toy' as const, items: ['none', 'shell', 'ball'] as const },
  { slot: 'decoration' as const, items: ['none', 'pebble', 'flower'] as const },
])
function locked(item: string) {
  return (
    (item === 'ribbon' || item === 'ball' || item === 'flower') &&
    !props.view.owned[item]
  )
}
function equip(slot: 'outfit' | 'toy' | 'decoration', item: string) {
  if (
    slot === 'outfit' &&
    (item === 'none' || item === 'cap' || item === 'ribbon')
  )
    void props.act({ type: 'equip', slot, item })
  if (
    slot === 'toy' &&
    (item === 'none' || item === 'shell' || item === 'ball')
  )
    void props.act({ type: 'equip', slot, item })
  if (
    slot === 'decoration' &&
    (item === 'none' || item === 'pebble' || item === 'flower')
  )
    void props.act({ type: 'equip', slot, item })
}
function open() {
  confirm.value = false
  routine.value = { ...props.view.routine }
  dialog.value?.showModal()
}
function deviceOffset() {
  routine.value.utcOffsetMinutes = -new Date().getTimezoneOffset()
}
async function nextGeneration() {
  if (
    await props.act({
      type: 'nextGeneration',
      expectedGeneration: expectedGeneration.value,
    })
  )
    confirm.value = false
}
function confirmGeneration() {
  expectedGeneration.value = props.view.generation
  confirm.value = true
}
function saveRoutine() {
  void props.act({ type: 'setRoutine', ...routine.value })
}
</script>
<template>
  <button ref="opener" class="life-trigger" @click="open">
    {{ text.title }}
  </button>
  <Teleport to="body"
    ><dialog
      ref="dialog"
      class="settings-dialog life-dialog"
      :aria-label="text.title"
      @close="opener?.focus()"
    >
      <header>
        <h2>{{ text.title }}</h2>
        <button @click="dialog?.close()">{{ text.close }}</button>
      </header>
      <nav :aria-label="text.title">
        <button
          v-for="(label, key) in text.sections"
          :key="key"
          :aria-pressed="section === key"
          @click="section = key"
        >
          {{ label }}
        </button>
      </nav>
      <div v-if="notice" role="alert">
        <p>{{ notice }}</p>
        <button @click="$emit('retry')">{{ retryLabel }}</button>
      </div>
      <p v-if="feedback" aria-live="polite">{{ text.results[feedback] }}</p>
      <section v-if="section === 'care'">
        <h3>{{ text.sections.care }}</h3>
        <p>{{ text.attention[view.attention] }}</p>
        <p>
          {{ view.unwell ? text.attention.unwell : text.healthy }} ·
          {{ text.waste }}: {{ view.waste }}
        </p>
        <div class="actions">
          <button
            :disabled="disabled || !view.toiletCue"
            @click="act({ type: 'toilet' })"
          >
            {{ text.toilet }}</button
          ><button
            :disabled="disabled || view.waste === 0"
            @click="act({ type: 'clean' })"
          >
            {{ text.clean }}</button
          ><button
            :disabled="disabled || !view.unwell"
            @click="act({ type: 'medicine' })"
          >
            {{ text.medicine }}
          </button>
        </div>
        <p v-if="view.lastGame">
          {{ text.score }}: {{ view.lastGame.score }} / 5
        </p>
        <h3>{{ text.personalities[view.personality] }}</h3>
        <p>
          {{ text.favorite }}: {{ text.food[view.favoriteFood] }} ·
          {{ text.items[view.favoriteToy] }}
        </p>
      </section>
      <section v-if="section === 'things'">
        <h3>{{ text.sections.things }}</h3>
        <fieldset v-for="group in equipment" :key="group.slot">
          <legend>{{ text.slots[group.slot] }}</legend>
          <label v-for="item in group.items" :key="item"
            ><input
              type="radio"
              :name="group.slot"
              :checked="view[group.slot] === item"
              :disabled="disabled || locked(item)"
              @change="equip(group.slot, item)"
            />{{ text.items[item]
            }}<small v-if="locked(item)">{{ text.locked }}</small></label
          >
        </fieldset>
      </section>
      <section v-if="section === 'family'">
        <h3>{{ text.generation }} {{ view.generation }}</h3>
        <p>{{ text.courtship }}</p>
        <p>{{ view.visits }} / 3</p>
        <button
          :disabled="disabled || !view.canVisit"
          @click="act({ type: 'visitCompanion' })"
        >
          {{ text.visit }}</button
        ><button
          :disabled="disabled || !view.canStartGeneration"
          @click="confirmGeneration"
        >
          {{ text.newFamily }}
        </button>
        <div v-if="confirm" class="confirmation">
          <p>{{ text.consequence }}</p>
          <button :disabled="disabled" @click="nextGeneration">
            {{ text.confirm }}</button
          ><button @click="confirm = false">{{ text.cancel }}</button>
        </div>
        <h3>{{ text.album }}</h3>
        <p v-if="!view.album.length">{{ text.empty }}</p>
        <ul v-else>
          <li v-for="entry in view.album" :key="entry.generation">
            {{ entry.name }} · {{ text.variants[entry.variant] }} ·
            {{ text.generation }} {{ entry.generation }}
          </li>
        </ul>
      </section>
      <form v-if="section === 'routine'" @submit.prevent="saveRoutine">
        <h3>{{ text.sections.routine }}</h3>
        <label
          ><input v-model="routine.enabled" type="checkbox" />{{
            text.enabled
          }}</label
        ><label
          >{{ text.bedtime
          }}<input
            v-model.number="routine.bedtime"
            type="number"
            min="0"
            max="23"
            required /></label
        ><label
          >{{ text.wake
          }}<input
            v-model.number="routine.wakeHour"
            type="number"
            min="0"
            max="23"
            required /></label
        ><label
          >{{ text.offset
          }}<input
            v-model.number="routine.utcOffsetMinutes"
            type="number"
            min="-720"
            max="840"
            required
        /></label>
        <p>{{ text.offsetHelp }}</p>
        <button type="button" @click="deviceOffset">
          {{ text.deviceOffset }}</button
        ><button :disabled="disabled" type="submit">
          {{ text.saveRoutine }}
        </button>
      </form>
    </dialog></Teleport
  >
</template>
<style scoped>
.life-trigger {
  min-height: 44px;
  padding: 6px 10px;
  font: inherit;
  border: 1px solid #667357;
  border-radius: 8px;
  background: #edf2da;
  color: #34412f;
}
.life-dialog {
  width: min(430px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
  color: #34412f;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: 20px;
}
h3 {
  margin: 18px 0 8px;
}
p {
  line-height: 1.5;
}
nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 16px 0;
}
button {
  min-height: 44px;
  border: 1px solid #667357;
  border-radius: 8px;
  background: #f9f8e6;
  color: inherit;
  padding: 8px 12px;
  font: inherit;
  cursor: pointer;
}
button[aria-pressed='true'] {
  background: #34412f;
  color: #fff;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
input:focus-visible {
  outline: 3px solid #526b43;
  outline-offset: 2px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
section > button,
form > button {
  margin: 4px;
}
fieldset {
  border: 1px solid #66735755;
  border-radius: 8px;
  margin: 12px 0;
}
label {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
label small {
  width: 100%;
  padding-left: 26px;
}
form label {
  margin: 12px 0;
}
input[type='number'] {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 8px;
  font: inherit;
}
.confirmation {
  padding: 12px;
  border: 1px solid #667357;
  margin-top: 12px;
  border-radius: 8px;
}
</style>
