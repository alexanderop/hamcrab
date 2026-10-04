import * as THREE from 'three'

export function createSleepNest() {
  const nest = new THREE.Group()
  const fabric = new THREE.MeshStandardMaterial({
    color: '#aaa9df',
    roughness: 1,
  })
  const cushion = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), fabric)
  cushion.scale.set(1.34, 0.18, 1.12)
  cushion.position.y = -0.015
  cushion.receiveShadow = true
  nest.add(cushion)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.13, 12, 64),
    new THREE.MeshStandardMaterial({ color: '#d2caef', roughness: 1 }),
  )
  rim.rotation.x = Math.PI / 2
  rim.scale.set(1.22, 1.04, 0.7)
  rim.position.y = 0.02
  rim.receiveShadow = true
  nest.add(rim)
  return nest
}
