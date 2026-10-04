import * as THREE from 'three'

import type { CostumePalette } from '../scene-types'

export interface CreatureRig {
  setLifeStage: (stage: 'baby' | 'adult') => void
  setPalette: (palette: CostumePalette) => void
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
      color: '#ef5943',
      roughness: 0.5,
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
      color: '#fff0cc',
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
  const hoodPoints = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2
    const y = Math.sin(angle)
    return new THREE.Vector3(
      Math.cos(angle) * (0.842 + 0.035 * Math.max(0, -y)),
      y * 0.733 - 0.055,
      0.555 + 0.04 * Math.max(0, -y),
    )
  })
  const hoodRim = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(hoodPoints, true),
      96,
      0.048,
      12,
      true,
    ),
    materials.coral,
  )
  hoodRim.castShadow = true
  hoodRim.receiveShadow = true
  head.add(hoodRim)
  const faceGeometry = new THREE.SphereGeometry(1, 72, 52)
  const positions = faceGeometry.attributes.position
  const faceColors = new Float32Array(positions.count * 3)
  const creamColor = new THREE.Color('#fff0cc')
  const patchColor = new THREE.Color('#b98248')
  const blushColor = new THREE.Color('#ed9b7f')
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index)
    const y = positions.getY(index)
    const z = positions.getZ(index)
    const cheekWidth = 1 + 0.14 * Math.exp(-Math.pow((y + 0.32) / 0.5, 2))
    const muzzle = Math.exp(
      -Math.pow(x / 0.35, 4) - Math.pow((y + 0.31) / 0.23, 2),
    )
    positions.setXYZ(
      index,
      x * cheekWidth,
      y,
      z + Math.max(0, z) * muzzle * 0.13,
    )
    const patch = Math.exp(
      -Math.pow((Math.abs(x) - 0.46) / 0.26, 4) -
        Math.pow((y - 0.29) / 0.57, 4),
    )
    const blush = Math.exp(
      -Math.pow((Math.abs(x) - 0.65) / 0.16, 2) -
        Math.pow((y + 0.18) / 0.095, 2),
    )
    const front = THREE.MathUtils.smoothstep(z, 0.25, 0.65)
    const color = creamColor
      .clone()
      .lerp(patchColor, patch * front * 0.97)
      .lerp(blushColor, blush * front * 0.75)
    color.toArray(faceColors, index * 3)
  }
  faceGeometry.setAttribute('color', new THREE.BufferAttribute(faceColors, 3))
  faceGeometry.computeVertexNormals()
  const faceMaterial = materials.cream.clone()
  faceMaterial.color.set('#ffffff')
  faceMaterial.vertexColors = true
  const face = new THREE.Mesh(faceGeometry, faceMaterial)
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
    const socket = new THREE.Group()
    socket.position.set(side * 0.35, 0.085, 0.79)
    socket.rotation.z = side * -0.09
    head.add(socket)
    const eye = new THREE.Group()
    socket.add(eye)
    ball(eye, materials.iris, [side * -0.014, 0, 0.074], [0.145, 0.187, 0.051])
    ball(
      eye,
      materials.black,
      [side * -0.02, 0.003, 0.109],
      [0.101, 0.141, 0.025],
    )
    ball(eye, materials.white, [-0.046, 0.073, 0.133], [0.032, 0.039, 0.012])
    ball(eye, materials.white, [0.035, -0.063, 0.131], [0.012, 0.015, 0.007])
    eyes.push(eye)
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.cream,
    )
    lid.scale.set(0.18, 0.23, 0.23)
    lid.rotation.x = -Math.PI / 2
    lid.position.z = 0.008
    const lidDepth = new THREE.Group()
    lidDepth.scale.z = 0.61
    socket.add(lidDepth)
    lidDepth.add(lid)
    lids.push(lid)
    const closedEye = curve(
      socket,
      [
        [-0.13, 0.018, 0.108],
        [-0.07, -0.021, 0.136],
        [0, -0.034, 0.15],
        [0.07, -0.021, 0.136],
        [0.13, 0.018, 0.108],
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
    const pincerShape = new THREE.Shape()
    pincerShape.moveTo(0.22, 0.05)
    pincerShape.bezierCurveTo(0.2, 0.23, 0.34, 0.36, 0.49, 0.31)
    pincerShape.bezierCurveTo(0.62, 0.3, 0.74, 0.17, 0.76, 0.07)
    pincerShape.bezierCurveTo(0.66, 0.1, 0.6, 0.15, 0.52, 0.15)
    pincerShape.quadraticCurveTo(0.46, 0.11, 0.48, 0.055)
    pincerShape.quadraticCurveTo(0.59, 0.005, 0.72, 0.025)
    pincerShape.bezierCurveTo(0.66, -0.1, 0.46, -0.15, 0.32, -0.055)
    pincerShape.quadraticCurveTo(0.24, -0.025, 0.22, 0.05)
    const pincer = new THREE.Mesh(
      new THREE.ExtrudeGeometry(pincerShape, {
        depth: 0.12,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.045,
        bevelThickness: 0.065,
        curveSegments: 18,
      }),
      materials.shell,
    )
    pincer.scale.x = side
    pincer.position.z = -0.02
    pincer.castShadow = true
    pincer.receiveShadow = true
    claw.add(pincer)
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
  return {
    root,
    head,
    eyes,
    lids,
    closedEyes,
    antennae,
    brows,
    paws,
    claws,
    setLifeStage(stage) {
      head.scale.setScalar(stage === 'baby' ? 1.15 : 1)
      claws.forEach((claw) => claw.scale.setScalar(stage === 'baby' ? 0.65 : 1))
    },
    setPalette(palette) {
      materials.shell.color.set(palette.base)
      materials.coral.color.set(palette.light)
      materials.darkRed.color.set(palette.shade)
    },
  }
}
