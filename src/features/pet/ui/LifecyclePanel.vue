<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  lifecycleView,
  type AdultVariant,
  type Lifecycle,
} from '../domain/lifecycle'
const props = defineProps<{
  lifecycle: Lifecycle
  disabled: boolean
  notice?: Readonly<{
    message: string
    retryLabel: string
    busy: boolean
  }> | null
  text: {
    choose: string
    equal: string
    shaping: string
    variants: Record<AdultVariant, string>
    traits: Record<AdultVariant, string>
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
defineEmits<{ hatch: []; chooseVariant: [variant: AdultVariant]; retry: [] }>()
const details = ref<HTMLDialogElement>()
const info = ref<HTMLButtonElement>()
const close = ref<HTMLButtonElement>()
const recovery = ref<HTMLButtonElement>()
const choicesGroup = ref<HTMLDivElement>()
const view = computed(() => lifecycleView(props.lifecycle))
watch(
  () => view.value.adultVariant,
  (variant, previous) => {
    if (variant && !previous && details.value?.open) close.value?.focus()
  },
  { flush: 'post' },
)
watch(
  () => props.notice?.message,
  (message, previous) => {
    if (!details.value?.open) return
    if (message) recovery.value?.focus()
    else if (previous)
      choicesGroup.value
        ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
        ?.focus()
  },
  { flush: 'post' },
)
function restoreFocus() {
  if (view.value.adultVariant) info.value?.focus()
}
</script>
<template>
  <section class="lifecycle-panel" :aria-label="text.title">
    <div class="lifecycle-heading">
      <strong>{{ text.stages[view.stage] }}</strong>
      <span v-if="view.adultVariant">{{
        text.variants[view.adultVariant]
      }}</span>
      <button v-if="view.choices.length" @click="details?.showModal()">
        {{ text.choose }}
      </button>
      <span v-if="view.stage === 'baby'">{{ text.days(view.careDays) }}</span>
      <button
        v-if="view.stage === 'egg'"
        :disabled="disabled"
        @click="$emit('hatch')"
      >
        {{ text.hatch }}
      </button>
      <button
        ref="info"
        class="lifecycle-info"
        :aria-label="text.title"
        @click="details?.showModal()"
      >
        ?
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
    <dialog
      @close="restoreFocus"
      ref="details"
      class="settings-dialog"
      :aria-label="text.title"
    >
      <h2>{{ text.title }}</h2>
      <p>{{ text[view.stage] }}</p>
      <p v-if="view.stage === 'baby'">{{ text.shaping }}</p>
      <ul v-if="view.stage === 'baby'" class="variant-guide">
        <li v-for="(score, variant) in view.scores" :key="variant">
          <strong>{{ text.variants[variant] }}</strong
          >: {{ text.traits[variant] }} <span>{{ score }} / 10</span>
        </li>
      </ul>
      <p v-if="view.stage === 'adult'">{{ text.equal }}</p>
      <p v-if="view.adultVariant">
        {{ text.variants[view.adultVariant] }}:
        {{ text.traits[view.adultVariant] }}
      </p>
      <div v-if="notice" class="variant-recovery">
        <p role="alert">{{ notice.message }}</p>
        <button ref="recovery" :disabled="notice.busy" @click="$emit('retry')">
          {{ notice.retryLabel }}
        </button>
      </div>
      <div
        v-if="view.choices.length"
        ref="choicesGroup"
        class="variant-choices"
      >
        <button
          v-for="variant in view.choices"
          :key="variant"
          :disabled="disabled"
          @click="$emit('chooseVariant', variant)"
        >
          <strong>{{ text.variants[variant] }}</strong>
          <span>{{ text.traits[variant] }}</span>
        </button>
      </div>
      <p v-if="view.stage === 'baby'">{{ text.schedule }}</p>
      <button ref="close" @click="details?.close()">{{ text.close }}</button>
    </dialog>
  </section>
</template>
<style scoped>
.variant-choices {
  display: grid;
  gap: 8px;
  margin: 12px 0;
}
.variant-choices button {
  text-align: left;
}
.variant-choices span {
  display: block;
  font-weight: 400;
  margin-top: 4px;
}
.lifecycle-info {
  display: block;
  min-height: 24px;
  padding: 0 7px;
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
