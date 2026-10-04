<script setup lang="ts">
import { computed, ref } from 'vue'
import { lifecycleView, type Lifecycle } from '../domain/lifecycle'
const props = defineProps<{
  lifecycle: Lifecycle
  disabled: boolean
  text: {
    title: string
    close: string
    stages: Record<Lifecycle['stage'], string>
    hatch: string
    egg: string
    baby: string
    adult: string
    progress: string
    days: (count: number) => string
    schedule: string
  }
}>()
defineEmits<{ hatch: [] }>()
const details = ref<HTMLDialogElement>()
const view = computed(() => lifecycleView(props.lifecycle))
</script>
<template>
  <section class="lifecycle-panel" :aria-label="text.title">
    <div class="lifecycle-heading">
      <button
        class="lifecycle-info"
        :aria-label="text.title"
        @click="details?.showModal()"
      >
        ?
      </button>
      <strong>{{ text.stages[view.stage] }}</strong>
      <span v-if="view.stage === 'baby'">{{ text.days(view.careDays) }}</span>
      <button
        v-if="view.stage === 'egg'"
        :disabled="disabled"
        @click="$emit('hatch')"
      >
        {{ text.hatch }}
      </button>
    </div>
    <p class="lifecycle-description">{{ text[view.stage] }}</p>
    <progress
      v-if="view.stage === 'baby'"
      :aria-label="text.progress"
      :value="view.careDays"
      max="10"
    />
    <span v-if="view.stage === 'baby'" class="lifecycle-schedule">{{
      text.schedule
    }}</span>
    <dialog ref="details" class="settings-dialog" :aria-label="text.title">
      <h2>{{ text.title }}</h2>
      <p>{{ text[view.stage] }}</p>
      <p v-if="view.stage === 'baby'">{{ text.schedule }}</p>
      <button @click="details?.close()">{{ text.close }}</button>
    </dialog>
  </section>
</template>
<style scoped>
.lifecycle-info {
  display: none;
}
.lifecycle-panel {
  flex-shrink: 0;
  position: relative;
  margin: 5px 0;
  padding: 7px 10px;
  border: 1px solid #66735744;
  border-radius: 9px;
  color: #34412f;
  background: #edf2da99;
  font-size: 11px;
}
.lifecycle-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.lifecycle-heading strong {
  font-size: 12px;
}
p {
  margin: 3px 0 0;
  line-height: 1.3;
}
button {
  border: 1px solid #667357;
  border-radius: 7px;
  padding: 7px 10px;
  min-height: 36px;
  background: #f9f8e6;
  color: inherit;
  font: inherit;
  font-weight: 700;
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
progress {
  display: block;
  width: 100%;
  height: 5px;
  margin-top: 5px;
  accent-color: #526b43;
}
@media (max-height: 600px) {
  .lifecycle-panel {
    margin: 2px 0;
    padding: 0 5px 3px;
  }
  .lifecycle-heading {
    min-height: 24px;
    gap: 5px;
  }
  .lifecycle-heading strong {
    font-size: 10px;
  }
  .lifecycle-heading span {
    margin-left: auto;
    font-size: 10px;
  }
  .lifecycle-info {
    display: block;
    min-height: 24px;
    width: 24px;
    padding: 0;
    border: 0;
    background: transparent;
  }
  .lifecycle-heading button:not(.lifecycle-info) {
    min-height: 30px;
    padding: 3px 5px;
  }
  .lifecycle-description,
  .lifecycle-schedule {
    display: none;
  }
  progress {
    position: absolute;
    bottom: 0;
    left: 5px;
    width: calc(100% - 10px);
    height: 3px;
    margin: 0;
  }
}
</style>
