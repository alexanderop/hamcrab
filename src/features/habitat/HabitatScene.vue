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
    renderer.toneMappingExposure = 0.95
    renderer.domElement.setAttribute('aria-hidden', 'true')
    element.append(renderer.domElement)
    scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40)
    camera.position.set(0.35, 2.75, 7.8)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.82, 0)
    controls.enableDamping = true
    controls.enableZoom = false
    controls.enablePan = false
    controls.minPolarAngle = Math.PI * 0.34
    controls.maxPolarAngle = Math.PI * 0.51
    controls.rotateSpeed = 0.6
    controls.update()
    const creature = createCreature()
    scene.add(creature.root)
    scene.add(new THREE.HemisphereLight('#fffaec', '#b3c7a9', 1.9))
    const key = new THREE.DirectionalLight('#fff5dc', 2.3)
    key.position.set(-3, 6, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3
    key.shadow.camera.right = 3
    key.shadow.camera.top = 5
    key.shadow.camera.bottom = -3
    key.shadow.normalBias = 0.025
    key.shadow.bias = -0.0002
    scene.add(key)
    const fill = new THREE.DirectionalLight('#dbe6ff', 1.6)
    fill.position.set(4, 3, -2)
    scene.add(fill)
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.77, 1.8, 0.14, 96),
      new THREE.MeshStandardMaterial({ color: '#d4dcc3', roughness: 1 }),
    )
    pedestal.position.y = -0.05
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
      camera.position.setLength(camera.aspect < 0.9 ? 8.8 : 8.3)
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
        : Math.sin(time * (props.sleeping ? 1.3 : 2))
      creature.root.position.y =
        props.reaction === 'play' && reacting
          ? Math.abs(Math.sin(age * 10)) * 0.24 * energy
          : idle * 0.018
      creature.root.rotation.z =
        props.reaction === 'pet' && reacting
          ? Math.sin(age * 7) * 0.07 * energy
          : 0
      creature.head.rotation.z = idle * 0.014
      creature.head.rotation.x = props.sleeping
        ? 0.075
        : props.reaction === 'feed'
          ? Math.sin(age * 16) * 0.04 * energy
          : 0
      const blink =
        props.sleeping || (!reducedMotion.matches && time % 5.5 > 5.32)
      creature.eyes.forEach((eye) => {
        eye.scale.y = blink ? 0.09 : 1
      })
      creature.paws.forEach((paw, index) => {
        paw.rotation.z =
          (index === 0 ? 1 : -1) *
          energy *
          (props.reaction === 'feed' ? -0.4 : 0.12)
      })
      creature.claws.forEach((claw, index) => {
        claw.rotation.z = (index === 0 ? 1 : -1) * (energy * 0.3 + idle * 0.018)
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
