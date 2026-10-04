<script setup lang="ts">
import { usePetSession } from '../../src/features/pet/ui/usePetSession'
import type { PetService } from '../../src/features/pet/application/pet-service'
const props = defineProps<{ service: PetService }>()
const { pet, ready, busy, error, care, retry, rename, saved } = usePetSession(
  props.service,
)
</script>
<template>
  <h1>{{ pet.name }}</h1>
  <p role="status">{{ saved ? 'Saved' : busy ? 'Busy' : 'Waiting' }}</p>
  <p v-if="error" role="alert">{{ error }}</p>
  <p>Gestures: {{ pet.careCount }}</p>
  <button :disabled="!ready || busy || !!error" @click="care({ type: 'play' })">
    Play
  </button>
  <button :disabled="!ready || busy || !!error" @click="rename('Milo')">
    Rename
  </button>
  <button @click="retry">Retry</button>
</template>
