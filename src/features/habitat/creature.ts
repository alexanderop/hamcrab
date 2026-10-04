import * as THREE from 'three'

export type CreatureReaction = 'idle' | 'feed' | 'play' | 'pet'
export interface CreatureRig {
  root: THREE.Group
  head: THREE.Group
  eyes: THREE.Group[]
  lids: THREE.Mesh[]
  closedEyes: THREE.Object3D[]
  antennae: THREE.Group[]
  brows: THREE.Group[]
  paws: THREE.Group[]
  claws: THREE.Group[]
}

export function createCreature(): CreatureRig {
  const root = new THREE.Group()
  const head = new THREE.Group()
  head.position.y = 1.94
  root.add(head)
  const materials = {
    shell: new THREE.MeshStandardMaterial({
      color: '#ef503c',
      roughness: 0.38,
    }),
    coral: new THREE.MeshStandardMaterial({
      color: '#ff7860',
      roughness: 0.43,
    }),
    darkRed: new THREE.MeshStandardMaterial({
      color: '#b83129',
      roughness: 0.8,
    }),
    cream: new THREE.MeshPhysicalMaterial({
      sheen: 0.65,
      sheenColor: '#ffe4bf',
      sheenRoughness: 0.85,
      color: '#fff1cb',
      roughness: 0.88,
    }),
    tan: new THREE.MeshStandardMaterial({ color: '#c88d51', roughness: 0.88 }),
    pink: new THREE.MeshStandardMaterial({ color: '#f4a78b', roughness: 0.8 }),
    cheek: new THREE.MeshStandardMaterial({ color: '#f18d7a', roughness: 0.8 }),
    black: new THREE.MeshStandardMaterial({
      color: '#251e22',
      roughness: 0.13,
    }),
    iris: new THREE.MeshPhysicalMaterial({
      color: '#764324',
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
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

  ball(root, materials.shell, [0, 0.91, 0], [0.96, 0.91, 0.69])
  ball(root, materials.cream, [0, 0.87, 0.58], [0.51, 0.62, 0.14])
  for (const side of [-1, 1]) {
    ball(root, materials.coral, [side * 0.6, 0.49, 0.34], [0.34, 0.39, 0.34])
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
  const faceGeometry = sphere.clone()
  const positions = faceGeometry.attributes.position
  for (let index = 0; index < positions.count; index++) {
    const y = positions.getY(index)
    const cheekWidth = 1 + 0.12 * Math.exp(-Math.pow((y + 0.3) / 0.5, 2))
    positions.setX(index, positions.getX(index) * cheekWidth)
  }
  faceGeometry.computeVertexNormals()
  const face = new THREE.Mesh(faceGeometry, materials.cream)
  face.position.set(0, -0.06, 0.5)
  face.scale.set(0.785, 0.7, 0.37)
  face.castShadow = true
  face.receiveShadow = true
  head.add(face)
  const eyes: THREE.Group[] = []
  const lids: THREE.Mesh[] = []
  const closedEyes: THREE.Object3D[] = []
  const antennae: THREE.Group[] = []
  const brows: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const patch = ball(
      head,
      materials.tan,
      [side * 0.4, 0.18, 0.735],
      [0.225, 0.335, 0.07],
    )
    patch.rotation.z = side * 0.28
    const socket = new THREE.Group()
    socket.position.set(side * 0.35, 0.085, 0.815)
    socket.rotation.z = side * -0.08
    head.add(socket)
    ball(socket, materials.line, [0, 0, 0], [0.175, 0.218, 0.074])
    ball(socket, materials.cream, [0, 0, 0.028], [0.153, 0.193, 0.075])
    const eye = new THREE.Group()
    socket.add(eye)
    ball(eye, materials.iris, [side * -0.014, 0, 0.074], [0.13, 0.176, 0.064])
    ball(eye, materials.black, [side * -0.02, 0, 0.119], [0.081, 0.123, 0.03])
    ball(eye, materials.white, [-0.046, 0.073, 0.143], [0.032, 0.039, 0.012])
    ball(eye, materials.white, [0.035, -0.063, 0.139], [0.012, 0.015, 0.007])
    eyes.push(eye)
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.tan,
    )
    lid.scale.set(0.18, 0.23, 0.23)
    lid.rotation.x = -Math.PI / 2
    lid.position.z = 0.008
    socket.add(lid)
    lids.push(lid)
    const closedEye = curve(
      socket,
      [
        [-0.13, 0.018, 0.171],
        [-0.07, -0.021, 0.216],
        [0, -0.034, 0.24],
        [0.07, -0.021, 0.216],
        [0.13, 0.018, 0.171],
      ],
      0.009,
      materials.line,
    )
    closedEye.visible = false
    closedEyes.push(closedEye)
    const brow = new THREE.Group()
    brow.position.set(side * 0.35, 0.345, 0.798)
    head.add(brow)
    curve(
      brow,
      [
        [-0.115, 0, 0],
        [0, 0.045, 0.018],
        [0.115, 0.018, 0],
      ],
      0.026,
      materials.tan,
    )
    brows.push(brow)
    ball(
      head,
      materials.cheek,
      [side * 0.51, -0.15, 0.79],
      [0.14, 0.063, 0.009],
    )
    ball(
      head,
      materials.cream,
      [side * 0.14, -0.245, 0.818],
      [0.19, 0.145, 0.074],
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
    const antenna = new THREE.Group()
    antenna.position.set(side * 0.36, 0.83, 0.08)
    head.add(antenna)
    curve(
      antenna,
      [
        [0, 0, 0],
        [side * 0.1, 0.27, -0.04],
        [side * 0.3, 0.52, -0.08],
        [side * 0.5, 0.58, -0.04],
      ],
      0.033,
      materials.shell,
    )
    ball(
      antenna,
      materials.coral,
      [side * 0.5, 0.58, -0.04],
      [0.095, 0.105, 0.088],
    )
    antennae.push(antenna)
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
    paw.position.set(side * 0.57, 1.22, 0.5)
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
    claw.position.set(side * 0.76, 1.13, -0.08)
    claw.scale.setScalar(0.8)
    claw.rotation.z = side * -0.42
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
  return { root, head, eyes, lids, closedEyes, antennae, brows, paws, claws }
}
