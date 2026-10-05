<script setup lang="ts">
import { computed, ref } from 'vue'
import LifePanel from '../../src/features/pet/ui/LifePanel.vue'
import ShellGame from '../../src/features/pet/ui/ShellGame.vue'
import { lifeText } from '../../src/features/pet/ui/lifeText'
import { lifeView } from '../../src/features/pet/domain/life'
import { usePetSession } from '../../src/features/pet/ui/usePetSession'
import type { PetService } from '../../src/features/pet/application/pet-service'
const props = defineProps<{ service: PetService }>()
const { pet, ready, busy, error, lifeMessage, life, retry } = usePetSession(
  props.service,
)
const view = computed(() => lifeView(pet.value))
const text = lifeText('en', 'Pinchy')
const game = ref<InstanceType<typeof ShellGame>>()
</script>
<template>
  <LifePanel
    :view="view"
    :text="text"
    :disabled="!ready || busy || !!error"
    :notice="error"
    retry-label="Retry"
    :feedback="lifeMessage"
    :act="life"
    @retry="retry"
  />
  <button :disabled="!ready || busy" @click="game?.open()">Play</button>
  <ShellGame
    ref="game"
    :view="view"
    :text="text"
    :german="false"
    :disabled="!ready || busy || !!error"
    :notice="error"
    retry-label="Retry"
    :feedback="lifeMessage"
    :act="life"
    @retry="retry"
  />
</template>
