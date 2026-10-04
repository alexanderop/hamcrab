<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createSnack, type SnackKind } from './snacks'
import { disposeObject } from './disposeObject'

const props = defineProps<{
  kind: SnackKind
  label: string
  fallback: string
}>()
const host = ref<HTMLDivElement>()
const status = ref<'loading' | 'ready' | 'fallback'>('loading')
let cleanup = () => {}
let rotate = (_direction: number) => {}

onMounted(() => {
  const element = host.value
  if (!element) return
  let renderer: THREE.WebGLRenderer | undefined
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 20)
  camera.position.set(0.35, 0.3, 3.8)
  camera.lookAt(0, 0, 0)
  let snack: THREE.Group | undefined
  let controls: OrbitControls | undefined
  let observer: ResizeObserver | undefined
  let stopWatch = () => {}
  const render = () => {
    if (status.value !== 'fallback') renderer?.render(scene, camera)
  }
  const lost = (event: Event) => {
    event.preventDefault()
    status.value = 'fallback'
  }
  cleanup = () => {
    stopWatch()
    observer?.disconnect()
    controls?.dispose()
    disposeObject(scene)
    renderer?.domElement.removeEventListener('webglcontextlost', lost)
    renderer?.dispose()
    renderer?.domElement.remove()
    renderer?.forceContextLoss()
    renderer = undefined
    scene.clear()
  }
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.addEventListener('webglcontextlost', lost)
    element.append(renderer.domElement)
    scene.add(new THREE.HemisphereLight('#fff4df', '#b3bc9a', 2.2))
    const light = new THREE.DirectionalLight('#fff4df', 3)
    light.position.set(-3, 4, 5)
    scene.add(light)
    const fill = new THREE.DirectionalLight('#e8f0ff', 1.3)
    fill.position.set(3, 2, -2)
    scene.add(fill)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.addEventListener('change', render)
    function frameSnack() {
      if (!snack) return
      const size = new THREE.Box3()
        .setFromObject(snack)
        .getSize(new THREE.Vector3())
      const halfExtent = Math.max(size.y, size.x / camera.aspect) / 2
      const distance =
        (halfExtent / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) *
          1.25 +
        size.z / 2
      camera.position.set(distance * 0.09, distance * 0.07, distance)
      controls?.update()
      controls?.saveState()
    }
    function update() {
      if (snack) {
        scene.remove(snack)
        disposeObject(snack)
      }
      snack = createSnack(props.kind)
      scene.add(snack)
      controls?.reset()
      frameSnack()
      render()
    }
    rotate = (direction) => {
      if (snack) snack.rotation.y += direction * 0.25
      render()
    }
    const resize = () => {
      if (!renderer || !element.clientWidth || !element.clientHeight) return
      renderer.setSize(element.clientWidth, element.clientHeight)
      camera.aspect = element.clientWidth / element.clientHeight
      camera.updateProjectionMatrix()
      frameSnack()
      render()
    }
    update()
    resize()
    observer = new ResizeObserver(resize)
    observer.observe(element)
    stopWatch = watch(() => props.kind, update)
    status.value = 'ready'
  } catch {
    cleanup()
    status.value = 'fallback'
  }
})
onBeforeUnmount(() => cleanup())
</script>

<template>
  <div
    ref="host"
    class="snack-preview"
    role="img"
    :aria-label="label"
    :data-snack-renderer="status"
    tabindex="0"
    @keydown.left.prevent="rotate(-1)"
    @keydown.right.prevent="rotate(1)"
  >
    <p v-if="status === 'fallback'">{{ fallback }}</p>
  </div>
</template>

<style scoped>
.snack-preview {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
.snack-preview :deep(canvas) {
  display: block;
  max-width: 100%;
  cursor: grab;
  touch-action: none;
}
.snack-preview :deep(canvas:active) {
  cursor: grabbing;
}
.snack-preview p {
  margin: 0;
  font-size: 12px;
  text-align: center;
}
</style>
