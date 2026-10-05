<script setup lang="ts">
import { ref, watch } from 'vue'
import type { lifeView, LifeCommand, LifeMessage } from '../domain/life'
import type { LifeText } from './lifeText'
const props = defineProps<{
  view: ReturnType<typeof lifeView>
  text: LifeText
  german: boolean
  disabled: boolean
  notice: string | null
  retryLabel: string
  feedback: LifeMessage | null
  act: (command: LifeCommand) => Promise<boolean>
}>()
defineEmits<{ retry: [] }>()
const dialog = ref<HTMLDialogElement>()
const hidden = ref(false)
const trigger = ref<HTMLElement | null>(null)
const started = ref(false)
watch(
  () => `${props.view.game?.id}:${props.view.game?.round}`,
  () => {
    hidden.value = false
  },
)
async function start() {
  started.value = await props.act({ type: 'startGame' })
}
async function open() {
  trigger.value =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  started.value = false
  dialog.value?.showModal()
  await start()
}
async function guess(shell: 0 | 1 | 2) {
  const game = props.view.game
  if (game)
    await props.act({
      type: 'guessShell',
      gameId: game.id,
      round: game.round,
      shell,
    })
}
async function cancel() {
  if (await props.act({ type: 'cancelGame' })) dialog.value?.close()
}
function close() {
  dialog.value?.close()
}
function hide() {
  hidden.value = true
}
defineExpose({ open })
</script>
<template>
  <dialog
    ref="dialog"
    class="settings-dialog game-dialog"
    :aria-label="text.game"
    @close="trigger?.focus()"
  >
    <header>
      <h2>{{ text.game }}</h2>
      <button @click="close">
        {{ german ? 'Spiel schließen' : 'Close game' }}
      </button>
    </header>
    <div v-if="notice" role="alert">
      <p>{{ notice }}</p>
      <button @click="$emit('retry')">{{ retryLabel }}</button>
    </div>
    <p
      v-if="
        feedback && ['staleGame', 'sleeping', 'tired', 'egg'].includes(feedback)
      "
      aria-live="polite"
    >
      {{ text.results[feedback] }}
    </p>
    <template v-if="view.game">
      <p>
        {{ text.round }} {{ view.game.round + 1 }} / 5 · {{ text.score }}:
        {{ view.game.score }}
      </p>
      <p v-if="view.game.lastCorrect !== null" aria-live="polite">
        {{ view.game.lastCorrect ? text.correct : text.missed }}
      </p>
      <p>{{ text.instructions }}</p>
      <p v-if="!hidden" class="clue">
        {{ german ? 'Merke dir Muschel' : 'Remember shell' }}
        {{ view.game.target + 1 }} <span aria-hidden="true">●</span>
      </p>
      <div class="shells">
        <button
          v-for="shell in [0, 1, 2] as const"
          :key="shell"
          :aria-label="`${text.shell} ${shell + 1}`"
          :disabled="disabled || !hidden"
          @click="guess(shell)"
        >
          <svg aria-hidden="true" viewBox="0 0 80 62" class="shell-drawing">
            <path
              d="M14 39C3 29 9 11 23 13C25 0 39 1 40 9C46 -1 59 3 59 14C76 10 81 30 67 40L48 55H32Z"
              fill="#eabca0"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M23 15L35 48M40 12V49M59 16L45 48M13 28L31 46M68 29L49 47"
              fill="none"
              stroke="#b87b67"
              stroke-width="2"
              stroke-linecap="round"
            />
            <ellipse
              cx="40"
              cy="52"
              rx="11"
              ry="5"
              fill="#cf9d83"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle
              v-if="!hidden && view.game.target === shell"
              cx="40"
              cy="36"
              r="9"
              fill="#fffbe8"
              stroke="#ad9973"
              stroke-width="1.5"
            /></svg
          ><small>{{ shell + 1 }}</small>
        </button>
      </div>
      <button v-if="!hidden" :disabled="disabled" @click="hide">
        {{ german ? 'Bereit' : 'Ready' }}
      </button>
      <button :disabled="disabled" @click="cancel">
        {{ text.cancelGame }}
      </button>
    </template>
    <template v-else-if="started && view.lastGame"
      ><p class="score">{{ text.score }}: {{ view.lastGame.score }} / 5</p>
      <p>{{ text.results.gameFinished }}</p>
      <button :disabled="disabled" @click="start">
        {{ text.again }}
      </button></template
    >
    <template v-else
      ><p v-if="feedback">{{ text.results[feedback] }}</p>
      <button :disabled="disabled" @click="start">
        {{ text.start }}
      </button></template
    >
  </dialog>
</template>
<style scoped>
.game-dialog {
  width: min(430px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  overflow: auto;
  box-sizing: border-box;
  padding: 16px;
  color: #34412f;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: 20px;
}
p {
  line-height: 1.5;
}
button {
  min-height: 44px;
  padding: 8px 12px;
  margin: 4px 0;
  border: 1px solid #667357;
  border-radius: 8px;
  background: #f9f8e6;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible {
  outline: 3px solid #526b43;
  outline-offset: 2px;
}
.shells {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 12px 0;
}
.shells button {
  min-height: 80px;
}
.shell-drawing {
  display: block;
  width: min(72px, 100%);
  height: 62px;
  margin: auto;
}
.shells small {
  font-size: 16px;
}
.clue,
.score {
  font-weight: 700;
}
</style>
