import * as THREE from 'three'

export function createEgg() {
  const root = new THREE.Group()
  const shell = new THREE.MeshStandardMaterial({
    color: '#fff1d3',
    roughness: 0.85,
  })
  const speckle = new THREE.MeshStandardMaterial({
    color: '#d99777',
    roughness: 0.9,
  })
  const coral = new THREE.MeshStandardMaterial({
    color: '#ee7055',
    roughness: 0.55,
  })
  const points = Array.from({ length: 33 }, (_, index) => {
    const angle = (index / 32) * Math.PI
    return new THREE.Vector2(
      Math.sin(angle) * (0.86 - Math.cos(angle) * 0.16),
      1.25 + Math.cos(angle) * 1.2,
    )
  })
  const egg = new THREE.Mesh(
    new THREE.LatheGeometry(points.reverse(), 48),
    shell,
  )
  egg.castShadow = true
  egg.receiveShadow = true
  root.add(egg)
  for (let index = 0; index < 36; index++) {
    const angle = (index * 2.39996) % (2 * Math.PI)
    const vertical = 0.25 + ((index % 11) / 11) * 2.0
    const cosine = (vertical - 1.25) / 1.2
    const radius = Math.sqrt(1 - cosine * cosine) * (0.86 - cosine * 0.16)
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + (index % 3) * 0.013, 8, 6),
      speckle,
    )
    dot.position.set(
      Math.sin(angle) * radius,
      vertical,
      Math.cos(angle) * radius,
    )
    dot.scale.y = 1.5
    root.add(dot)
  }
  const crack = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.2, 2.12, 0.46),
      new THREE.Vector3(0.02, 1.95, 0.63),
      new THREE.Vector3(-0.1, 1.8, 0.72),
      new THREE.Vector3(0.15, 1.68, 0.79),
      new THREE.Vector3(0.07, 1.5, 0.84),
    ],
    false,
    'catmullrom',
    0.01,
  )
  root.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(crack, 12, 0.015, 5, false),
      new THREE.MeshStandardMaterial({ color: '#997759' }),
    ),
  )
  for (const side of [-1, 1]) {
    const claw = new THREE.Group()
    claw.position.set(side * 0.85, 0.85, 0.12)
    claw.rotation.z = side * -0.4
    for (const offset of [-1, 1]) {
      const finger = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 18, 12),
        coral,
      )
      finger.scale.set(1, 1.6, 0.8)
      finger.position.set(offset * 0.1, 0.12, 0)
      finger.rotation.z = offset * -0.35
      finger.castShadow = true
      claw.add(finger)
    }
    root.add(claw)
  }
  return root
}
