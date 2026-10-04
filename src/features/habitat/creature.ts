import * as THREE from 'three'

export type CreatureReaction = 'idle' | 'feed' | 'play' | 'pet'
export interface CreatureRig {
  root: THREE.Group
  head: THREE.Group
  eyes: THREE.Group[]
  paws: THREE.Group[]
  claws: THREE.Group[]
}

export function createCreature(): CreatureRig {
  const root = new THREE.Group()
  const head = new THREE.Group()
  head.position.y = 2.08
  root.add(head)
  const materials = {
    shell: new THREE.MeshStandardMaterial({
      color: '#ed543f',
      roughness: 0.66,
    }),
    coral: new THREE.MeshStandardMaterial({
      color: '#ff7860',
      roughness: 0.68,
    }),
    darkRed: new THREE.MeshStandardMaterial({
      color: '#b83129',
      roughness: 0.8,
    }),
    cream: new THREE.MeshStandardMaterial({
      color: '#fff0bf',
      roughness: 0.88,
    }),
    tan: new THREE.MeshStandardMaterial({ color: '#c88d51', roughness: 0.88 }),
    pink: new THREE.MeshStandardMaterial({ color: '#f4a78b', roughness: 0.8 }),
    cheek: new THREE.MeshStandardMaterial({ color: '#f18d7a', roughness: 0.8 }),
    black: new THREE.MeshStandardMaterial({
      color: '#251e22',
      roughness: 0.13,
    }),
    white: new THREE.MeshBasicMaterial({ color: '#fffdf1' }),
    line: new THREE.MeshStandardMaterial({ color: '#584135', roughness: 0.9 }),
  }
  const sphere = new THREE.SphereGeometry(1, 40, 28)
  function ball(
    parent: THREE.Object3D,
    material: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
  ) {
    const mesh = new THREE.Mesh(sphere, material)
    mesh.position.set(...position)
    mesh.scale.set(...scale)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  function curve(
    parent: THREE.Object3D,
    points: [number, number, number][],
    width: number,
    material: THREE.Material,
  ) {
    const path = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point)),
    )
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(path, 32, width, 8, false),
      material,
    )
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }

  ball(root, materials.shell, [0, 0.96, 0], [0.88, 0.94, 0.62])
  ball(root, materials.cream, [0, 0.91, 0.555], [0.45, 0.61, 0.13])
  for (const side of [-1, 1]) {
    ball(root, materials.coral, [side * 0.57, 0.56, 0.38], [0.29, 0.4, 0.32])
    ball(root, materials.cream, [side * 0.49, 0.16, 0.41], [0.24, 0.11, 0.28])
    for (let toe = 0; toe < 3; toe++) {
      curve(
        root,
        [
          [side * 0.49 - 0.09 + toe * 0.09, 0.205, 0.58],
          [side * 0.49 - 0.09 + toe * 0.09, 0.18, 0.64],
        ],
        0.009,
        materials.tan,
      )
    }
    const ear = new THREE.Group()
    ear.position.set(side * 0.77, 0.64, 0)
    ear.rotation.z = side * -0.4
    head.add(ear)
    ball(ear, materials.tan, [0, 0, 0], [0.3, 0.37, 0.19])
    ball(ear, materials.pink, [0, 0.02, 0.15], [0.235, 0.285, 0.07])
    curve(
      ear,
      [
        [-0.08, -0.15, 0.218],
        [0, -0.04, 0.227],
        [0.07, 0.015, 0.21],
      ],
      0.013,
      materials.tan,
    )
  }

  ball(head, materials.shell, [0, 0, 0], [1.01, 0.94, 0.68])
  ball(head, materials.darkRed, [0, -0.075, 0.39], [0.852, 0.744, 0.38])
  ball(head, materials.cream, [0, -0.06, 0.5], [0.807, 0.695, 0.35])
  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const patch = ball(
      head,
      materials.tan,
      [side * 0.4, 0.19, 0.722],
      [0.21, 0.365, 0.1],
    )
    patch.rotation.z = side * 0.28
    const eye = new THREE.Group()
    eye.position.set(side * 0.35, 0.105, 0.815)
    head.add(eye)
    ball(eye, materials.black, [0, 0, 0], [0.115, 0.158, 0.062])
    ball(eye, materials.white, [-0.032, 0.056, 0.054], [0.037, 0.044, 0.018])
    ball(eye, materials.white, [0.032, -0.049, 0.058], [0.017, 0.019, 0.01])
    eyes.push(eye)
    ball(
      head,
      materials.cheek,
      [side * 0.5, -0.15, 0.778],
      [0.135, 0.066, 0.021],
    )
    ball(
      head,
      materials.cream,
      [side * 0.14, -0.245, 0.818],
      [0.18, 0.13, 0.062],
    )
    ball(
      head,
      materials.black,
      [side * 0.43, 0.663, 0.473],
      [0.09, 0.098, 0.056],
    )
    ball(
      head,
      materials.white,
      [side * 0.43 - 0.02, 0.69, 0.523],
      [0.022, 0.026, 0.013],
    )
    curve(
      head,
      [
        [side * 0.36, 0.83, 0.08],
        [side * 0.48, 1.18, 0.04],
        [side * 0.72, 1.48, 0],
        [side * 0.95, 1.55, 0.04],
      ],
      0.035,
      materials.shell,
    )
    ball(
      head,
      materials.coral,
      [side * 0.95, 1.55, 0.04],
      [0.093, 0.105, 0.086],
    )
    for (let whisker = 0; whisker < 3; whisker++) {
      curve(
        head,
        [
          [side * 0.65, -0.12 - whisker * 0.075, 0.66],
          [side * 0.88, -0.08 - whisker * 0.09, 0.71],
          [side * 1.09, -0.04 - whisker * 0.11, 0.68],
        ],
        0.008,
        materials.line,
      )
    }
  }
  const nose = ball(
    head,
    materials.pink,
    [0, -0.174, 0.903],
    [0.09, 0.057, 0.045],
  )
  nose.rotation.z = Math.PI
  curve(
    head,
    [
      [0, -0.21, 0.9],
      [0, -0.285, 0.901],
      [-0.09, -0.32, 0.879],
      [-0.17, -0.29, 0.866],
    ],
    0.014,
    materials.line,
  )
  curve(
    head,
    [
      [0, -0.285, 0.901],
      [0.09, -0.32, 0.879],
      [0.17, -0.29, 0.866],
    ],
    0.014,
    materials.line,
  )
  curve(
    head,
    [
      [-0.09, -0.33, 0.857],
      [0, -0.42, 0.853],
      [0.09, -0.33, 0.857],
    ],
    0.012,
    materials.line,
  )

  const paws: THREE.Group[] = []
  const claws: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const paw = new THREE.Group()
    paw.position.set(side * 0.56, 1.29, 0.47)
    root.add(paw)
    const sleeve = ball(paw, materials.shell, [0, 0, 0], [0.36, 0.22, 0.25])
    sleeve.rotation.z = side * 0.5
    ball(paw, materials.cream, [side * -0.26, -0.09, 0.2], [0.14, 0.13, 0.11])
    for (let finger = 0; finger < 2; finger++) {
      curve(
        paw,
        [
          [side * -0.3 + finger * 0.055, -0.11, 0.304],
          [side * -0.29 + finger * 0.055, -0.17, 0.282],
        ],
        0.009,
        materials.tan,
      )
    }
    paws.push(paw)
    const claw = new THREE.Group()
    claw.position.set(side * 0.79, 1.24, -0.01)
    root.add(claw)
    curve(
      claw,
      [
        [0, 0, 0],
        [side * 0.28, 0.02, 0],
        [side * 0.38, 0.15, 0.02],
      ],
      0.09,
      materials.darkRed,
    )
    const pincer = ball(
      claw,
      materials.shell,
      [side * 0.45, 0.12, 0.04],
      [0.25, 0.18, 0.18],
    )
    pincer.rotation.z = side * 0.5
    curve(
      claw,
      [
        [side * 0.46, 0.23, 0.055],
        [side * 0.67, 0.16, 0.065],
        [side * 0.72, 0.01, 0.07],
      ],
      0.072,
      materials.coral,
    )
    curve(
      claw,
      [
        [side * 0.45, 0.04, 0.09],
        [side * 0.58, -0.03, 0.09],
        [side * 0.65, 0.02, 0.09],
      ],
      0.058,
      materials.shell,
    )
    claws.push(claw)
    for (let leg = 0; leg < 3; leg++) {
      const y = 0.9 - leg * 0.23
      curve(
        root,
        [
          [side * 0.72, y, -0.21],
          [side * 0.97, y - 0.04, -0.1],
          [side * 1.035, y - 0.25, 0.02],
        ],
        0.074 - leg * 0.009,
        materials.shell,
      )
    }
    ball(
      root,
      materials.coral,
      [side * 0.33, 0.29, -0.59],
      [0.4, 0.16, 0.39],
    ).rotation.y = side * 0.6
  }
  ball(root, materials.shell, [0, 0.33, -0.68], [0.28, 0.21, 0.48])
  ball(
    head,
    materials.coral,
    [-0.22, 0.77, 0.36],
    [0.054, 0.095, 0.024],
  ).rotation.z = -0.4
  return { root, head, eyes, paws, claws }
}
