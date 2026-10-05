import * as THREE from 'three'

export function createRewards() {
  const ribbon = new THREE.Group()
  const ball = new THREE.Group()
  const flower = new THREE.Group()
  const sphere = new THREE.SphereGeometry(1, 24, 16)
  const mint = new THREE.MeshStandardMaterial({
    color: '#6ecdb7',
    roughness: 0.65,
  })
  const gold = new THREE.MeshStandardMaterial({
    color: '#f9c95b',
    roughness: 0.55,
  })
  const pink = new THREE.MeshStandardMaterial({
    color: '#ef91aa',
    roughness: 0.7,
  })
  const green = new THREE.MeshStandardMaterial({
    color: '#639657',
    roughness: 0.8,
  })
  function oval(
    parent: THREE.Group,
    material: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
  ) {
    const mesh = new THREE.Mesh(sphere, material)
    mesh.position.set(...position)
    mesh.scale.set(...scale)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  for (const side of [-1, 1]) {
    oval(
      ribbon,
      mint,
      [side * 0.13, 0.025, 0],
      [0.16, 0.12, 0.065],
    ).rotation.z = side * 0.3
    oval(
      ribbon,
      mint,
      [side * 0.085, -0.14, -0.01],
      [0.06, 0.16, 0.035],
    ).rotation.z = side * 0.4
  }
  oval(ribbon, gold, [0, 0, 0.05], [0.072, 0.072, 0.05])
  ribbon.position.set(0.74, 0.51, 0.53)
  ribbon.rotation.z = -0.25
  oval(ball, gold, [0, 0, 0], [0.23, 0.23, 0.23])
  for (const angle of [0, Math.PI / 2]) {
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.224, 0.019, 8, 32),
      mint,
    )
    stripe.rotation.y = angle
    ball.add(stripe)
  }
  ball.position.set(0.82, 0.2, 0.85)
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.14, 0.26, 24),
    new THREE.MeshStandardMaterial({ color: '#d39275', roughness: 0.9 }),
  )
  pot.position.y = 0.13
  pot.castShadow = true
  flower.add(pot)
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.42, 12),
    green,
  )
  stem.position.y = 0.43
  flower.add(stem)
  oval(flower, green, [0.085, 0.4, 0], [0.13, 0.05, 0.04]).rotation.z = 0.5
  for (let index = 0; index < 5; index++) {
    const angle = (index * Math.PI * 2) / 5
    oval(
      flower,
      pink,
      [Math.cos(angle) * 0.115, 0.68 + Math.sin(angle) * 0.115, 0.025],
      [0.09, 0.09, 0.045],
    )
  }
  oval(flower, gold, [0, 0.68, 0.07], [0.07, 0.07, 0.04])
  flower.position.set(-1.02, -0.055, 0.42)
  const cap = new THREE.Group()
  oval(cap, mint, [0, 0, 0], [0.42, 0.2, 0.33])
  oval(cap, gold, [0, -0.08, 0.29], [0.43, 0.035, 0.3])
  oval(cap, gold, [0, 0.2, 0], [0.055, 0.035, 0.055])
  cap.position.set(0.18, 0.68, 0.28)
  cap.rotation.z = -0.16
  const shell = new THREE.Group()
  for (let index = -2; index <= 2; index++) {
    const rib = oval(
      shell,
      index % 2 === 0 ? pink : gold,
      [index * 0.065, 0.1, 0],
      [0.07, 0.18, 0.2],
    )
    rib.rotation.z = -index * 0.24
  }
  oval(shell, pink, [0, 0.02, 0.15], [0.11, 0.06, 0.1])
  shell.position.set(0.86, 0, 0.82)
  shell.rotation.x = -0.35
  const pebble = new THREE.Group()
  const stone = new THREE.MeshStandardMaterial({
    color: '#819aaa',
    roughness: 0.95,
  })
  oval(pebble, stone, [0, 0.08, 0], [0.3, 0.13, 0.24])
  oval(pebble, stone, [0.04, 0.24, 0], [0.23, 0.1, 0.17])
  oval(pebble, stone, [-0.015, 0.36, 0], [0.14, 0.075, 0.12])
  pebble.position.set(-1.02, -0.055, 0.42)
  const wasteMaterial = new THREE.MeshStandardMaterial({
    color: '#9a7351',
    roughness: 1,
  })
  const waste = Array.from({ length: 3 }, (_, index) => {
    const pile = new THREE.Group()
    oval(pile, wasteMaterial, [0, 0.04, 0], [0.14, 0.07, 0.11])
    oval(pile, wasteMaterial, [0.01, 0.12, 0], [0.09, 0.06, 0.08])
    pile.position.set(-0.6 + index * 0.55, -0.045, 1.08)
    return pile
  })
  return { ribbon, ball, flower, cap, shell, pebble, waste }
}
