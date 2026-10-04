<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight, Heart, LockKeyhole, X } from '@lucide/vue'
import type { FriendshipView, RewardId, WishAction } from '../domain/friendship'

defineProps<{
  view: FriendshipView
  ready: boolean
  loading: string
  celebration: string
  text: {
    title: string
    open: string
    close: string
    points: string
    level: string
    first: string
    complete: string
    unlocked: string
    locked: string
    wishTitle: string
    wishDone: string
    wishBonus: (points: number) => string
    next: (reward: string, points: number) => string
    schedule: string
    rules: string
    rewards: Record<RewardId, string>
    descriptions: Record<RewardId, string>
    wishes: Record<WishAction, string>
  }
}>()
const dialog = ref<HTMLDialogElement>()
</script>

<template>
  <button
    class="friendship-summary"
    :aria-label="text.open"
    :disabled="!ready"
    @click="dialog?.showModal()"
  >
    <Heart :size="15" aria-hidden="true" />
    <span v-if="ready">
      <strong>{{
        view.next
          ? text.next(text.rewards[view.next.reward], view.next.remaining)
          : text.complete
      }}</strong>
      <small>{{
        celebration ||
        (view.wish.complete ? text.wishDone : text.wishes[view.wish.action])
      }}</small>
    </span>
    <span v-else>{{ loading }}</span>
    <ChevronRight :size="16" aria-hidden="true" />
  </button>
  <span class="sr-only" aria-live="polite">{{ celebration }}</span>
  <dialog
    ref="dialog"
    class="settings-dialog friendship-dialog"
    aria-labelledby="friendship-title"
  >
    <div class="settings-heading">
      <h2 id="friendship-title">{{ text.title }}</h2>
      <button
        class="settings-close"
        :aria-label="text.close"
        autofocus
        @click="dialog?.close()"
      >
        <X :size="19" />
      </button>
    </div>
    <p class="friendship-total">
      {{ text.level }} {{ view.level }} · {{ view.points }}/100
      {{ text.points }}
    </p>
    <progress :value="view.points" max="100" :aria-label="text.points" />
    <p v-if="!view.next">{{ text.complete }}</p>
    <section class="friendship-wish" :aria-label="text.wishTitle">
      <h3>{{ text.wishTitle }}</h3>
      <p>{{ text.wishes[view.wish.action] }}</p>
      <strong>{{
        view.wish.complete
          ? text.wishDone
          : view.wish.rewardPoints > 0
            ? text.wishBonus(view.wish.rewardPoints)
            : text.complete
      }}</strong>
    </section>
    <ol class="friendship-rewards">
      <li>
        <span class="friendship-level">1</span
        ><span
          ><strong>{{ text.first }}</strong
          ><small>{{ text.unlocked }}</small></span
        >
      </li>
      <li
        v-for="reward in view.rewards"
        :key="reward.reward"
        :class="{ 'reward-unlocked': view.unlocked.includes(reward.reward) }"
      >
        <span class="friendship-level">{{ reward.level }}</span>
        <span
          ><strong>{{ text.rewards[reward.reward] }}</strong
          ><small>{{ text.descriptions[reward.reward] }}</small
          ><small>{{
            view.unlocked.includes(reward.reward)
              ? text.unlocked
              : `${text.locked} · ${reward.points} ${text.points}`
          }}</small></span
        >
        <LockKeyhole
          v-if="!view.unlocked.includes(reward.reward)"
          :size="15"
          aria-hidden="true"
        />
      </li>
    </ol>
    <p class="settings-note">{{ text.schedule }}</p>
    <p class="settings-note">{{ text.rules }}</p>
  </dialog>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.friendship-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 5px 9px;
  border: 1px solid #859977;
  border-radius: 9px;
  color: #304b2a;
  background: #e1e9c9;
  text-align: left;
  flex-shrink: 0;
}
.friendship-summary > span {
  flex: 1;
  min-width: 0;
}
.friendship-summary strong,
.friendship-summary small {
  display: block;
  font-size: 11px;
  line-height: 1.25;
}
.friendship-summary strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.friendship-summary small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
}
.friendship-summary:disabled {
  opacity: 0.65;
}
.friendship-dialog progress {
  width: 100%;
  accent-color: #56724d;
}
.friendship-total {
  font-weight: 700;
  font-size: 14px;
}
.friendship-wish {
  background: #e8ecd7;
  padding: 12px;
  border-radius: 12px;
  margin: 14px 0;
}
.friendship-wish h3,
.friendship-wish p {
  margin: 0 0 6px;
}
.friendship-wish h3 {
  font-size: 14px;
}
.friendship-wish strong {
  font-size: 12px;
}
.friendship-rewards {
  list-style: none;
  padding: 0;
}
.friendship-rewards li {
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #d7ddcd;
  padding: 10px 0;
}
.friendship-rewards li > span:nth-child(2) {
  flex: 1;
}
.friendship-rewards strong,
.friendship-rewards small {
  display: block;
}
.friendship-rewards small {
  font-size: 11px;
  margin-top: 3px;
}
.friendship-level {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: #e8ecd7;
  border-radius: 50%;
}
.reward-unlocked .friendship-level {
  background: #56724d;
  color: white;
}
</style>
