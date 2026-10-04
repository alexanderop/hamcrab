<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createCreature, type CreatureReaction } from './creature'

const props = defineProps<{
  sleeping: boolean
  reaction: CreatureReaction
  reactionId: number
}>()
const emit = defineEmits<{ ready: [] }>()
const host = ref<HTMLDivElement>()
const status = ref<'loading' | 'ready' | 'fallback'>('loading')
let cleanup: (() => void) | undefined
let react = () => {}
let rotate = (_direction: number) => {}
watch(
  () => props.reactionId,
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
    const creature = createCreature()
    scene.add(creature.root)
    scene.add(new THREE.HemisphereLight('#fff0df', '#99a888', 1.25))
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
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reactionStart = -10
    const clock = new THREE.Clock()
    let frame = 0
    let ready = false
    react = () => {
      reactionStart = clock.getElapsedTime()
    }
    rotate = (direction) => {
      creature.root.rotation.y += direction * 0.2
    }
    const animate = () => {
      if (!renderer || !scene) return
      const time = clock.getElapsedTime()
      const age = time - reactionStart
      const reacting = age < 1.5 && !reducedMotion.matches && !props.sleeping
      const energy = reacting ? Math.sin(Math.min(age / 1.5, 1) * Math.PI) : 0
      const idle = reducedMotion.matches
        ? 0
        : Math.sin(time * (props.sleeping ? 1.15 : 1.45))
      const still = reducedMotion.matches
      const play = reacting && props.reaction === 'play'
      const feed = reacting && props.reaction === 'feed'
      const pet = reacting && props.reaction === 'pet'
      const anticipation = play ? Math.sin(Math.min(age / 0.2, 1) * Math.PI) : 0
      const jump =
        play && age > 0.2
          ? Math.max(0, Math.sin(((age - 0.2) / 0.65) * Math.PI)) * energy
          : 0
      const breathe = idle * (props.sleeping ? 0.009 : 0.004)
      creature.root.position.y = jump * 0.29 - anticipation * 0.05
      creature.root.scale.set(
        1 + anticipation * 0.035 - jump * 0.025 - breathe * 0.4,
        1 - anticipation * 0.06 + jump * 0.045 + breathe,
        1,
      )
      creature.root.rotation.z = pet ? Math.sin(age * 6) * 0.065 * energy : 0
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
        -0.06 + curious * 0.07 + (pet ? energy * 0.09 : 0)
      creature.head.rotation.y = -0.025 + headTurn * 0.1
      creature.head.rotation.x = props.sleeping
        ? 0.13
        : feed
          ? Math.sin(age * 15) * 0.025 * energy
          : -curious * 0.025
      const blinkPhase = time % 6.1
      const blink = props.sleeping
        ? 1
        : still
          ? 0
          : Math.max(0, 1 - Math.abs(blinkPhase - 5.78) / 0.13)
      creature.lids.forEach((lid) => {
        lid.rotation.x = -Math.PI / 2 + blink * Math.PI
      })
      creature.closedEyes.forEach((eye) => {
        eye.visible = blink > 0.93
      })
      creature.eyes.forEach((eye) => {
        eye.visible = blink < 0.93
        eye.position.x = glance * 0.014
        eye.position.y = feed ? -energy * 0.014 : curious * 0.007
      })
      creature.brows.forEach((brow, index) => {
        brow.rotation.z =
          (index === 0 ? -1 : 1) * (curious * 0.12 + (pet ? energy * 0.15 : 0))
        brow.position.y = 0.345 + curious * (index === 0 ? 0.03 : 0.015)
      })
      creature.paws.forEach((paw, index) => {
        paw.rotation.z =
          (index === 0 ? -0.04 : 0.075) +
          (index === 0 ? 1 : -1) * energy * (feed ? -0.5 : 0.15)
        paw.position.y =
          1.22 + (index === 0 ? 0 : 0.035) + (feed ? energy * 0.075 : 0)
      })
      creature.claws.forEach((claw, index) => {
        claw.rotation.z =
          (index === 0 ? -1 : 1) *
          (-0.42 + (index === 0 ? 0.06 : -0.06) + energy * 0.23 + idle * 0.015)
      })
      creature.antennae.forEach((antenna, index) => {
        antenna.rotation.z = still
          ? 0
          : Math.sin(time * 1.4 - index * 0.7) * 0.014 +
            headTurn * (index === 0 ? 0.045 : 0.025) +
            Math.sin(age * 8 - 0.65) * energy * 0.12
        antenna.rotation.x = still
          ? 0
          : Math.sin(time * 1.2 - index * 0.6) * 0.018
      })
      controls.update()
      renderer.render(scene, camera)
      if (!ready) {
        ready = true
        status.value = 'ready'
        emit('ready')
      }
      frame = requestAnimationFrame(animate)
    }
    const contextLost = (event: Event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      status.value = 'fallback'
    }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    cleanup = () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost)
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene?.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry)
          if (Array.isArray(object.material))
            object.material.forEach((material) => materials.add(material))
          else materials.add(object.material)
        }
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      key.shadow.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
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
    :data-renderer="status"
    role="img"
    aria-label="Pinchy, ein Hamster im roten Hummerkostüm. Mit Ziehen oder den Pfeiltasten drehen."
    tabindex="0"
    @keydown.left.prevent="rotate(-1)"
    @keydown.right.prevent="rotate(1)"
  >
    <div v-if="status === 'fallback'" class="habitat-fallback">
      <span aria-hidden="true">🐹</span>
      <p>
        Pinchy ist hier.<br /><small
          >Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar.</small
        >
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
</style>
