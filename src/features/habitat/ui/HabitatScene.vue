<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createSnack } from '../three/snacks'
import type { AdultVariant } from '../domain/scene-types'
import type { SnackKind } from '../scene-types'
import { disposeObject } from '../three/disposeObject'
import { createRewards } from '../three/rewards'
import { createEgg } from '../three/egg'
import { createCreature } from '../three/creature'
import { createSleepNest } from '../three/sleepNest'
import type {
  CostumePalette,
  CareCue,
  LifeStage,
  Outfit,
  Toy,
  Decoration,
} from '../scene-types'
import { stageProportions, visibleWaste } from '../domain/lifePresentation'
import {
  initialAnimation,
  updateEnvironment,
  acceptCue,
  sampleAnimation,
  type Motion,
} from '../domain/animation'
import {
  beginPetGesture,
  movePetGesture,
  completesPetGesture,
  type PetGesture,
} from '../domain/petGesture'

const props = defineProps<{
  adultVariant?: AdultVariant | null
  lifeStage: LifeStage
  ribbon?: boolean
  ball?: boolean
  flower?: boolean
  outfit?: Outfit
  toy?: Toy
  decoration?: Decoration
  waste?: number
  unwell?: boolean
  palette: CostumePalette
  description: string
  fallbackTitle: string
  fallbackDescription: string
  sleeping: boolean
  reaction: CareCue | null
  loaded: boolean
  available: boolean
}>()
const outfit = computed(
  () => props.outfit ?? (props.ribbon ? 'ribbon' : 'none'),
)
const toy = computed(() => props.toy ?? (props.ball ? 'ball' : 'none'))
const decoration = computed(
  () => props.decoration ?? (props.flower ? 'flower' : 'none'),
)
const wasteCount = computed(() => visibleWaste(props.waste ?? 0))
const emit = defineEmits<{ ready: []; pet: [] }>()
const host = ref<HTMLDivElement>()
const ballPlaying = ref(false)
const motion = ref<Motion>('idle')
const activeSnack = ref<SnackKind | null>(null)
const status = ref<'loading' | 'ready' | 'fallback'>('loading')
const stars = [
  [9, 25],
  [19, 61],
  [29, 16],
  [39, 39],
  [63, 13],
  [73, 65],
  [87, 47],
  [93, 22],
] as const
let cleanup: (() => void) | undefined
let react = () => {}
let rotate = (_direction: number) => {}
watch(
  () => props.reaction,
  () => react(),
)

onMounted(() => {
  if (!host.value) return
  const element = host.value
  let renderer: THREE.WebGLRenderer | undefined
  let scene: THREE.Scene | undefined
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.setAttribute('aria-hidden', 'true')
    element.append(renderer.domElement)
    scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)
    camera.position.set(1.05, 2.6, 7.8)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.65, 0)
    controls.enableDamping = true
    controls.enableZoom = false
    controls.enablePan = false
    controls.minPolarAngle = Math.PI * 0.34
    controls.maxPolarAngle = Math.PI * 0.51
    controls.rotateSpeed = 0.6
    controls.update()
    let needsRender = true
    const invalidate = () => {
      needsRender = true
    }
    controls.addEventListener('change', invalidate)
    const creature = createCreature()
    const egg = createEgg()
    const morphology = new THREE.Group()
    morphology.add(creature.root)
    scene.add(morphology, egg)
    let transitionStart = -10
    let transitionPending = false
    const stopStageWatch = watch(
      () => props.lifeStage,
      (stage, previous) => {
        egg.visible = stage === 'egg'
        morphology.visible = stage !== 'egg'
        morphology.scale.setScalar(stageProportions[stage].body)
        creature.setLifeStage(stage)
        transitionPending = previous !== undefined && previous !== stage
        invalidate()
      },
      { immediate: true },
    )
    const stopVariantWatch = watch(
      () => props.adultVariant,
      (variant) => {
        creature.setAdultVariant(variant ?? null)
        invalidate()
      },
      { immediate: true },
    )
    creature.setPalette(props.palette)
    const rewards = createRewards()
    const ballPosition = new THREE.Vector3()
    creature.head.add(rewards.ribbon, rewards.cap)
    scene.add(
      rewards.ball,
      rewards.flower,
      rewards.shell,
      rewards.pebble,
      ...rewards.waste,
    )
    const stopRewardWatch = watch(
      () => [
        outfit.value,
        toy.value,
        decoration.value,
        wasteCount.value,
        props.unwell,
        props.lifeStage,
        props.adultVariant,
      ],
      () => {
        const hatched = props.lifeStage !== 'egg'
        rewards.ribbon.visible = outfit.value === 'ribbon' && hatched
        rewards.cap.visible = outfit.value === 'cap' && hatched
        rewards.ball.visible = toy.value === 'ball' && hatched
        rewards.shell.visible = toy.value === 'shell' && hatched
        rewards.flower.visible = decoration.value === 'flower' && hatched
        rewards.pebble.visible = decoration.value === 'pebble' && hatched
        rewards.waste.forEach((pile, index) => {
          pile.visible = index < wasteCount.value && hatched
        })
        invalidate()
      },
      { immediate: true },
    )
    const stopPaletteWatch = watch(
      () => props.palette,
      (palette) => {
        creature.setPalette(palette)
        invalidate()
      },
    )
    const snackHolder = new THREE.Group()
    snackHolder.visible = false
    creature.root.add(snackHolder)
    const ambient = new THREE.HemisphereLight('#fff0df', '#99a888', 1.25)
    scene.add(ambient)
    const nest = createSleepNest()
    scene.add(nest)
    const daylight = new THREE.Color('#fff0db')
    const moonlight = new THREE.Color('#b9caff')
    const dayGround = new THREE.Color('#bbc7a0')
    const nightGround = new THREE.Color('#737fa8')
    const key = new THREE.DirectionalLight('#fff0db', 3.1)
    key.position.set(-3, 5, 6)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3
    key.shadow.camera.right = 3
    key.shadow.camera.top = 5
    key.shadow.camera.bottom = -3
    key.shadow.normalBias = 0.025
    key.shadow.bias = -0.0002
    scene.add(key)
    const fill = new THREE.DirectionalLight('#e7edff', 0.85)
    fill.position.set(4, 3, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight('#ffe4b9', 2.4)
    rim.position.set(2, 4, -4)
    scene.add(rim)
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.38, 0.06, 64),
      new THREE.MeshStandardMaterial({ color: '#bbc7a0', roughness: 1 }),
    )
    pedestal.position.y = -0.09
    pedestal.receiveShadow = true
    scene.add(pedestal)
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 96),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.125
    ground.receiveShadow = true
    scene.add(ground)
    const resize = () => {
      const width = element.clientWidth
      const height = element.clientHeight
      if (!width || !height || !renderer) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      const halfFieldOfView = THREE.MathUtils.degToRad(camera.fov / 2)
      const distance =
        Math.max(2.05, 1.55 / camera.aspect) / Math.tan(halfFieldOfView) + 0.55
      camera.position
        .sub(controls.target)
        .normalize()
        .multiplyScalar(distance)
        .add(controls.target)
      camera.updateProjectionMatrix()
      invalidate()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation = initialAnimation()
    const clock = new THREE.Clock()
    let frame = 0
    let ready = false
    let sleepBlend = props.sleeping ? 1 : 0
    let previousTime = 0
    const syncEnvironment = () => {
      animation = updateEnvironment(
        animation,
        {
          loaded: ready && props.loaded,
          available: props.available,
          sleeping: props.sleeping,
          visible: !document.hidden,
          reduced: reducedMotion.matches,
        },
        clock.getElapsedTime(),
      )
      invalidate()
    }
    const stopEnvironmentWatch = watch(
      () => [props.loaded, props.available, props.sleeping],
      syncEnvironment,
    )
    let pendingVisibilitySync = false
    const visibilityChanged = () => {
      gesture = null
      pendingVisibilitySync = !document.hidden
      if (document.hidden) syncEnvironment()
      invalidate()
    }
    document.addEventListener('visibilitychange', visibilityChanged)
    reducedMotion.addEventListener('change', syncEnvironment)
    react = () => {
      syncEnvironment()
      if (props.reaction)
        animation = acceptCue(animation, props.reaction, clock.getElapsedTime())
      invalidate()
    }
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const canvas = renderer.domElement
    let gesture: PetGesture | null = null
    const hitCreature = (event: PointerEvent) => {
      if (props.lifeStage === 'egg') return false
      const bounds = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObject(creature.root, true).some((hit) => {
        let object: THREE.Object3D | null = hit.object
        while (object) {
          if (
            object === snackHolder ||
            object === rewards.ribbon ||
            object === rewards.cap
          )
            return false
          object = object.parent
        }
        return true
      })
    }
    const pointerDown = (event: PointerEvent) => {
      gesture = beginPetGesture(gesture, {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        primary: event.isPrimary && event.button === 0,
        hit: hitCreature(event),
      })
    }
    const pointerMove = (event: PointerEvent) => {
      if (gesture)
        gesture = movePetGesture(
          gesture,
          event.pointerId,
          event.clientX,
          event.clientY,
        )
    }
    const pointerUp = (event: PointerEvent) => {
      pointerMove(event)
      const pet = completesPetGesture(
        gesture,
        event.pointerId,
        hitCreature(event),
      )
      gesture = null
      if (pet && props.available && !props.sleeping) emit('pet')
    }
    const pointerCancel = () => {
      gesture = null
    }
    canvas.addEventListener('pointerdown', pointerDown, true)
    canvas.addEventListener('pointermove', pointerMove, true)
    canvas.addEventListener('pointerup', pointerUp, true)
    canvas.addEventListener('pointercancel', pointerCancel, true)
    canvas.addEventListener('lostpointercapture', pointerCancel)

    rotate = (direction) => {
      creature.root.rotation.y += direction * 0.2
      egg.rotation.y += direction * 0.2
      invalidate()
    }
    const animate = () => {
      if (!renderer || !scene) return
      if (pendingVisibilitySync) {
        pendingVisibilitySync = false
        syncEnvironment()
      }
      const time = clock.getElapsedTime()
      if (transitionPending) {
        transitionStart = time
        transitionPending = false
      }
      const reveal = reducedMotion.matches
        ? 1
        : THREE.MathUtils.smoothstep(time - transitionStart, 0, 0.8)
      const size = stageProportions[props.lifeStage].body
      morphology.scale.setScalar(size * (0.85 + reveal * 0.15))
      morphology.position.y = Math.sin(reveal * Math.PI) * 0.2
      egg.rotation.z = reducedMotion.matches ? 0 : Math.sin(time * 1.8) * 0.035
      const elapsed = Math.min(0.05, time - previousTime)
      previousTime = time
      const sampled = sampleAnimation(
        animation,
        time,
        props.adultVariant ?? null,
      )
      motion.value = sampled.motion
      const age = sampled.age
      const energy = sampled.energy
      const reacting = sampled.motion !== 'idle'
      const serving = sampled.snack
      controls.update()
      const nextSnack = serving
      const snackChanged = activeSnack.value !== nextSnack
      if (
        (reducedMotion.matches && !needsRender && !snackChanged) ||
        document.hidden
      ) {
        frame = requestAnimationFrame(animate)
        return
      }
      if (snackChanged) {
        disposeObject(snackHolder)
        snackHolder.clear()
        if (nextSnack) snackHolder.add(createSnack(nextSnack))
      }
      const targetSleep = props.sleeping ? 1 : 0
      sleepBlend = reducedMotion.matches
        ? targetSleep
        : THREE.MathUtils.damp(sleepBlend, targetSleep, 5, elapsed)
      if (Math.abs(sleepBlend - targetSleep) < 0.001) sleepBlend = targetSleep
      const rest = sleepBlend
      key.color.copy(daylight).lerp(moonlight, rest)
      key.intensity = 3.1 - rest * 1.4
      ambient.intensity = 1.25 - rest * 0.4
      fill.intensity = 0.85 + rest * 0.3
      rim.intensity = 2.4 - rest * 1.1
      pedestal.material.color.copy(dayGround).lerp(nightGround, rest)
      nest.visible = rest > 0.001
      nest.scale.setScalar(Math.max(0.001, rest))
      activeSnack.value = nextSnack
      snackHolder.visible = !!serving
      if (serving) {
        const lift = reducedMotion.matches
          ? 0
          : Math.sin((Math.min(age / 1.1, 1) * Math.PI) / 2)
        const nibble =
          reducedMotion.matches || serving === 'bottle'
            ? 1
            : 1 - Math.max(0, age - 1.6) * 0.25
        snackHolder.position.set(0, 1.17 + lift * 0.49, 1.03)
        snackHolder.rotation.z = serving === 'bottle' ? -lift * 0.6 : 0
        snackHolder.scale.setScalar(0.5 * nibble)
      }
      const idle = reducedMotion.matches
        ? 0
        : Math.sin(time * (props.sleeping ? 1.15 : 1.45))
      const still = reducedMotion.matches
      const play = reacting && sampled.motion === 'play'
      ballPlaying.value =
        play && (toy.value === 'ball' || props.adultVariant === 'whirlwind')
      rewards.ball.visible =
        props.lifeStage !== 'egg' && (toy.value === 'ball' || ballPlaying.value)
      rewards.ball.position.x =
        0.82 + (toy.value === 'ball' ? sampled.ballTravel * 0.55 : 0)
      rewards.ball.position.y =
        0.2 + (toy.value === 'ball' ? sampled.ballLift : 0)
      rewards.ball.position.z = 0.85

      rewards.ball.rotation.z = sampled.juggle
        ? time * 7
        : toy.value === 'ball'
          ? -sampled.ballTravel * 5
          : 0
      const feed = reacting && sampled.motion === 'feed'
      const pet = reacting && sampled.motion === 'pet'
      const anticipation = play ? Math.sin(Math.min(age / 0.2, 1) * Math.PI) : 0
      const jump =
        play && age > 0.2
          ? Math.max(0, Math.sin(((age - 0.2) / 0.65) * Math.PI)) * energy
          : 0
      const unwell = props.unwell && !props.sleeping ? 1 : 0
      const breathe = idle * (props.sleeping ? 0.018 : 0.004)
      creature.root.position.x = sampled.x
      creature.root.position.y =
        jump * 0.29 - anticipation * 0.05 - rest * 0.04 + sampled.y
      creature.root.scale.set(
        1 + anticipation * 0.035 - jump * 0.025 - breathe * 0.4 + rest * 0.035,
        1 - anticipation * 0.06 + jump * 0.045 + breathe - rest * 0.12,
        1 + rest * 0.03,
      )
      creature.root.rotation.z = sampled.roll - rest * 0.1 - unwell * 0.035
      if (sampled.juggle) {
        creature.root.updateWorldMatrix(true, false)
        rewards.ball.position.lerp(
          creature.root.localToWorld(
            ballPosition.set(
              sampled.juggle.x,
              sampled.juggle.y,
              sampled.juggle.z,
            ),
          ),
          Math.min(1, energy * 4),
        )
      }
      const pose = (offset: number) => {
        const phase = (time - offset + 14) % 14
        const left =
          THREE.MathUtils.smoothstep(phase, 2.2, 3.3) -
          THREE.MathUtils.smoothstep(phase, 5.1, 6.4)
        const right =
          THREE.MathUtils.smoothstep(phase, 9.2, 10.1) -
          THREE.MathUtils.smoothstep(phase, 11.2, 12.5)
        return left - right * 0.7
      }
      const glance = still || props.sleeping ? 0 : pose(0)
      const headTurn = still || props.sleeping ? 0 : pose(0.22)
      const curious = Math.max(0, headTurn)
      creature.head.rotation.z =
        -0.06 + curious * 0.07 + sampled.headRoll + rest * 0.24
      creature.head.rotation.y = -0.025 + headTurn * 0.1 + sampled.headTurn
      creature.head.rotation.x =
        rest * 0.23 + unwell * 0.12 + -curious * 0.025 + sampled.headPitch
      const blinkPhase = time % 6.1
      const blink = Math.max(
        rest,
        sampled.eyesClosed,
        unwell * 0.4,
        still ? 0 : Math.max(0, 1 - Math.abs(blinkPhase - 5.78) / 0.13),
      )
      creature.lids.forEach((lid) => {
        lid.rotation.x = -Math.PI / 2 + blink * Math.PI
      })
      creature.closedEyes.forEach((eye) => {
        eye.visible = blink > 0.93
      })
      creature.eyes.forEach((eye) => {
        eye.visible = blink < 0.93
        eye.position.x = glance * 0.014 + sampled.headTurn * 0.05
        eye.position.y = sampled.gaze + curious * 0.007
      })
      creature.brows.forEach((brow, index) => {
        brow.rotation.z =
          (index === 0 ? -1 : 1) *
          (curious * 0.12 + (pet ? energy * 0.15 : 0) - unwell * 0.2)
        brow.position.y = 0.345 + curious * (index === 0 ? 0.03 : 0.015)
      })
      creature.paws.forEach((paw, index) => {
        paw.rotation.z =
          (index === 0 ? -0.04 : 0.075) +
          (index === 0 ? 1 : -1) *
            (energy * 0.15 - sampled.pawReach - rest * 0.35)
        paw.position.y =
          1.22 +
          (index === 0 ? 0 : 0.035) +
          (feed ? energy * 0.075 : 0) -
          rest * 0.1
      })
      creature.claws.forEach((claw, index) => {
        claw.rotation.z =
          (index === 0 ? -1 : 1) *
            (-0.42 +
              (index === 0 ? 0.06 : -0.06) +
              energy * 0.23 +
              idle * 0.015 -
              rest * 0.2) -
          (index === 0 ? sampled.leftClaw : sampled.rightClaw)
      })
      creature.antennae.forEach((antenna, index) => {
        antenna.rotation.z = still
          ? 0
          : Math.sin(time * 1.4 - index * 0.7) * 0.014 +
            headTurn * (index === 0 ? 0.045 : 0.025) +
            Math.sin(age * 8 - 0.65) * energy * 0.12
        antenna.rotation.x =
          rest * 0.24 + (still ? 0 : Math.sin(time * 1.2 - index * 0.6) * 0.018)
      })
      renderer.render(scene, camera)
      needsRender = false
      if (!ready) {
        ready = true
        status.value = 'ready'
        syncEnvironment()
        emit('ready')
      }
      frame = requestAnimationFrame(animate)
    }
    let disposed = false
    const contextLost = (event: Event) => {
      event.preventDefault()
      cleanup?.()
      status.value = 'fallback'
    }
    canvas.addEventListener('webglcontextlost', contextLost)
    cleanup = () => {
      if (disposed) return
      disposed = true
      react = () => {}
      rotate = () => {}
      stopPaletteWatch()
      stopEnvironmentWatch()
      stopRewardWatch()
      stopVariantWatch()
      stopStageWatch()
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', visibilityChanged)
      reducedMotion.removeEventListener('change', syncEnvironment)
      canvas.removeEventListener('pointerdown', pointerDown, true)
      canvas.removeEventListener('pointermove', pointerMove, true)
      canvas.removeEventListener('pointerup', pointerUp, true)
      canvas.removeEventListener('pointercancel', pointerCancel, true)
      canvas.removeEventListener('lostpointercapture', pointerCancel)
      gesture = null
      observer.disconnect()
      controls.dispose()
      canvas.removeEventListener('webglcontextlost', contextLost)
      if (scene) disposeObject(scene)
      key.shadow.dispose()
      renderer?.dispose()
      canvas.remove()
      renderer?.forceContextLoss()
    }
    animate()
  } catch {
    cleanup?.()
    renderer?.dispose()
    renderer?.domElement.remove()
    status.value = 'fallback'
  }
})
onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div
    ref="host"
    class="habitat-scene"
    :class="{ sleeping }"
    :data-sleeping="sleeping"
    :data-life-stage="lifeStage"
    :data-renderer="status"
    :data-snack="activeSnack"
    :data-motion="motion"
    :data-ribbon="outfit === 'ribbon'"
    :data-outfit="outfit"
    :data-toy="toy"
    :data-decoration="decoration"
    :data-waste="wasteCount"
    :data-unwell="!!unwell"
    :data-ball="toy === 'ball'"
    :data-ball-playing="ballPlaying"
    :data-flower="decoration === 'flower'"
    role="img"
    :aria-label="description"
    tabindex="0"
    @keydown.left.prevent="rotate(-1)"
    @keydown.right.prevent="rotate(1)"
  >
    <div class="night-sky" aria-hidden="true">
      <svg class="night-moon" viewBox="0 0 48 48">
        <path
          d="M33 4a20 20 0 1 0 11 30A18 18 0 0 1 33 4Z"
          fill="currentColor"
        />
      </svg>
      <span
        v-for="([left, top], index) in stars"
        :key="index"
        class="night-star"
        :style="{
          left: `${left}%`,
          top: `${top}%`,
          animationDelay: `${index * -0.7}s`,
        }"
        >✦</span
      >
    </div>
    <div v-if="sleeping" class="sleep-bubbles" aria-hidden="true">
      <span>z</span><span>z</span><span>Z</span>
    </div>
    <div v-if="status === 'fallback'" class="habitat-fallback">
      <span aria-hidden="true">{{ lifeStage === 'egg' ? '🥚' : '🐹' }}</span>
      <p>
        {{ fallbackTitle }}<br /><small>{{ fallbackDescription }}</small>
      </p>
    </div>
  </div>
</template>

<style scoped>
.habitat-scene {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  outline: none;
  touch-action: pan-y;
}
.habitat-scene:focus-visible {
  outline: 2px solid #56724d;
  outline-offset: -6px;
  border-radius: 24px;
}
.habitat-scene :deep(canvas) {
  display: block;
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  cursor: grab;
}
.habitat-scene :deep(canvas:active) {
  cursor: grabbing;
}
.habitat-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #53614c;
  z-index: 1;
}
.habitat-fallback > span {
  font-size: 110px;
}
.habitat-fallback p {
  line-height: 1.6;
}
.habitat-fallback small {
  font-size: 12px;
}
.night-sky {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: radial-gradient(
    ellipse at 50% 100%,
    #67769e 0%,
    #35466a 55%,
    #202c49 100%
  );
  opacity: 0;
  transition: opacity 1.1s ease;
}
.sleeping .night-sky {
  opacity: 1;
}
.night-moon {
  position: absolute;
  right: 13%;
  top: 13%;
  width: clamp(24px, 7vh, 46px);
  color: #fff1bd;
  filter: drop-shadow(0 0 12px #fbe9b64d);
}
.night-star {
  position: absolute;
  color: #e4e7ff;
  font-size: 10px;
  opacity: 0.55;
}
.sleeping .night-star {
  animation: twinkle 4s ease-in-out infinite;
}
.sleep-bubbles {
  position: absolute;
  z-index: 2;
  left: 56%;
  top: 24%;
  width: 58px;
  height: 65px;
  pointer-events: none;
  color: #f3edff;
  text-shadow: 0 2px 5px #233355;
  font-family: var(--pixel);
}
.sleep-bubbles span {
  position: absolute;
  bottom: 0;
  left: 0;
  font-size: 12px;
  animation: dream-drift 3.6s ease-in-out infinite;
}
.sleep-bubbles span:nth-child(2) {
  animation-delay: -1.2s;
}
.sleep-bubbles span:nth-child(3) {
  animation-delay: -2.4s;
  font-size: 18px;
}
.sleeping .habitat-fallback {
  color: #f3edff;
}
.sleeping .habitat-fallback > span {
  transform: rotate(-12deg);
}
@keyframes dream-drift {
  0% {
    transform: translate(0, 0) scale(0.65);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translate(30px, -48px) scale(1.1);
    opacity: 0;
  }
}
@keyframes twinkle {
  50% {
    opacity: 0.95;
  }
}
@media (prefers-reduced-motion: reduce) {
  .night-sky {
    transition: none;
  }
  .sleeping .night-star,
  .sleep-bubbles span {
    animation: none;
  }
  .sleep-bubbles span:nth-child(2) {
    transform: translate(16px, -18px);
  }
  .sleep-bubbles span:nth-child(3) {
    transform: translate(32px, -38px);
  }
}
</style>
