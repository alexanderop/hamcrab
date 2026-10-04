import * as THREE from 'three'

export type CreatureReaction = 'idle' | 'feed' | 'play' | 'pet'
export interface CreatureRig {
  root: THREE.Group
  head: THREE.Group
  mouth: THREE.Group
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
  head.position.set(0, 1.86, 0.06)
  head.scale.setScalar(1.12)
  root.add(head)
  const fibers = new Uint8Array(128 * 128 * 4)
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const index = (y * 128 + x) * 4
      const grain =
        Math.sin(x * 1.71 + Math.sin(y * 0.17) * 2.1) *
        Math.sin(y * 0.37 + x * 0.11)
      fibers[index] =
        fibers[index + 1] =
        fibers[index + 2] =
          128 + Math.round(grain * 42)
      fibers[index + 3] = 255
    }
  }
  const furTexture = new THREE.DataTexture(fibers, 128, 128)
  furTexture.wrapS = furTexture.wrapT = THREE.RepeatWrapping
  furTexture.magFilter = THREE.LinearFilter
  furTexture.minFilter = THREE.LinearMipmapLinearFilter
  furTexture.generateMipmaps = true
  furTexture.repeat.set(4, 3)
  furTexture.needsUpdate = true
  const materials = {
    shell: new THREE.MeshStandardMaterial({
      color: '#e94b32',
      roughness: 0.68,
    }),
    coral: new THREE.MeshStandardMaterial({
      color: '#ff8061',
      roughness: 0.7,
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
      bumpMap: furTexture,
      bumpScale: 0.008,
    }),
    tan: new THREE.MeshStandardMaterial({ color: '#af713b', roughness: 0.9 }),
    pink: new THREE.MeshStandardMaterial({ color: '#f4a78b', roughness: 0.8 }),
    cheek: new THREE.MeshStandardMaterial({ color: '#f18d7a', roughness: 0.8 }),
    black: new THREE.MeshStandardMaterial({
      color: '#160e0c',
      roughness: 0.08,
    }),
    iris: new THREE.MeshPhysicalMaterial({
      color: '#8e4f21',
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    white: new THREE.MeshBasicMaterial({ color: '#fffdf1' }),
    line: new THREE.MeshStandardMaterial({ color: '#603b29', roughness: 0.9 }),
    mouth: new THREE.MeshStandardMaterial({ color: '#582523', roughness: 1 }),
    tooth: new THREE.MeshStandardMaterial({
      color: '#fff9e8',
      roughness: 0.65,
    }),
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

  const torsoGeometry = new THREE.SphereGeometry(1, 56, 40)
  const torsoPositions = torsoGeometry.attributes.position
  const torsoColors = new Float32Array(torsoPositions.count * 3)
  for (let i = 0; i < torsoPositions.count; i++) {
    const x = torsoPositions.getX(i)
    const y = torsoPositions.getY(i)
    const z = torsoPositions.getZ(i)
    const width = 1 - y * 0.19
    torsoPositions.setXYZ(i, x * width, y, z * (1 - y * 0.1))
    const belly =
      (1 -
        THREE.MathUtils.smoothstep(
          Math.pow(x / 0.62, 2) + Math.pow((y + 0.05) / 0.85, 2),
          0.83,
          1.02,
        )) *
      THREE.MathUtils.smoothstep(z, 0.3, 0.65)
    const color = new THREE.Color('#e94b32')
      .lerp(new THREE.Color('#ff8a55'), Math.max(0, y) * 0.35)
      .lerp(new THREE.Color('#ffeac2'), belly)
    color.toArray(torsoColors, i * 3)
  }
  torsoGeometry.setAttribute('color', new THREE.BufferAttribute(torsoColors, 3))
  torsoGeometry.computeVertexNormals()
  const torsoMaterial = materials.cream.clone()
  torsoMaterial.color.set('#ffffff')
  torsoMaterial.vertexColors = true
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial)
  torso.position.set(0, 0.79, 0)
  torso.scale.set(0.86, 0.77, 0.67)
  torso.castShadow = true
  torso.receiveShadow = true
  root.add(torso)
  for (const side of [-1, 1]) {
    ball(root, materials.shell, [side * 0.58, 0.39, 0.25], [0.32, 0.32, 0.39])
    const foot = ball(
      root,
      materials.cream,
      [side * 0.49, 0.14, 0.49],
      [0.265, 0.14, 0.31],
    )
    foot.rotation.y = side * -0.15
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
    ear.position.set(side * 0.78, 0.64, 0.04)
    ear.rotation.z = side * -0.4
    head.add(ear)
    ball(ear, materials.cream, [0, 0, 0], [0.32, 0.35, 0.19])
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

  const hood = ball(head, materials.shell, [0, 0, -0.025], [1.065, 0.91, 0.71])
  hood.rotation.z = 0.015
  const hoodPoints = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2
    const y = Math.sin(angle)
    return new THREE.Vector3(
      Math.cos(angle) * (0.9 + 0.055 * Math.max(0, -y)),
      y * 0.736 - 0.055,
      0.555 + 0.045 * Math.max(0, -y),
    )
  })
  const hoodRim = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(hoodPoints, true),
      96,
      0.042,
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
  const patchColor = new THREE.Color('#c58b4b')
  const blushColor = new THREE.Color('#ef9e81')
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index)
    const y = positions.getY(index)
    const z = positions.getZ(index)
    const cheekWidth = 1 + 0.23 * Math.exp(-Math.pow((y + 0.32) / 0.47, 2))
    const muzzle = Math.exp(
      -Math.pow(x / 0.42, 4) - Math.pow((y + 0.26) / 0.28, 2),
    )
    positions.setXYZ(
      index,
      x * cheekWidth,
      y,
      z +
        Math.max(0, z) *
          (muzzle * 0.3 +
            0.11 *
              Math.exp(
                -Math.pow((Math.abs(x) - 0.61) / 0.26, 2) -
                  Math.pow((y + 0.18) / 0.3, 2),
              )),
    )
    const patch = Math.exp(
      -Math.pow((x - (x < 0 ? -0.47 : 0.48)) / (x < 0 ? 0.34 : 0.21), 4) -
        Math.pow((y - 0.51) / 0.67, 4),
    )
    const blush = Math.exp(
      -Math.pow((Math.abs(x) - 0.65) / 0.16, 2) - Math.pow((y + 0.2) / 0.14, 2),
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
  face.scale.set(0.8, 0.7, 0.395)
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
    socket.position.set(side * 0.36, 0.092, 0.835)
    socket.scale.set(1.17, 1.1, 1)
    socket.rotation.z = side * -0.09
    head.add(socket)
    const eye = new THREE.Group()
    socket.add(eye)
    ball(eye, materials.tooth, [0, 0, 0.05], [0.158, 0.19, 0.052])
    ball(
      eye,
      materials.iris,
      [side * -0.011, 0.002, 0.075],
      [0.149, 0.18, 0.051],
    )
    ball(
      eye,
      materials.black,
      [side * -0.02, 0.003, 0.109],
      [0.103, 0.131, 0.026],
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
    brow.position.set(side * 0.36, 0.35, 0.832)
    head.add(brow)
    curve(
      brow,
      [
        [-0.115, 0, 0],
        [0, 0.045, 0.018],
        [0.115, 0.018, 0],
      ],
      0.019,
      materials.tan,
    )
    brows.push(brow)
    ball(head, materials.black, [side * 0.43, 0.7, 0.463], [0.09, 0.098, 0.056])
    ball(
      head,
      materials.white,
      [side * 0.43 - 0.02, 0.725, 0.517],
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
  const noseGeometry = sphere.clone()
  const nosePositions = noseGeometry.attributes.position
  for (let i = 0; i < nosePositions.count; i++) {
    nosePositions.setX(
      i,
      nosePositions.getX(i) * (0.72 + nosePositions.getY(i) * 0.28),
    )
  }
  noseGeometry.computeVertexNormals()
  const nose = new THREE.Mesh(noseGeometry, materials.pink)
  nose.position.set(0, -0.135, 1.02)
  nose.scale.set(0.13, 0.075, 0.068)
  nose.castShadow = true
  head.add(nose)
  curve(
    head,
    [
      [0, -0.195, 1.04],
      [0, -0.237, 1.026],
    ],
    0.012,
    materials.line,
  )
  const mouth = new THREE.Group()
  mouth.position.set(0, -0.235, 0.968)
  head.add(mouth)
  const smile = new THREE.Shape()
  smile.moveTo(-0.19, 0)
  smile.bezierCurveTo(-0.11, -0.036, 0.065, -0.035, 0.205, 0.025)
  smile.bezierCurveTo(0.13, -0.22, -0.12, -0.23, -0.19, 0)
  const smileMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(smile, {
      depth: 0.012,
      bevelEnabled: true,
      bevelSize: 0.009,
      bevelThickness: 0.007,
      bevelSegments: 3,
      curveSegments: 24,
    }),
    materials.mouth,
  )
  mouth.add(smileMesh)
  const toothShape = new THREE.Shape()
  toothShape.moveTo(-0.043, 0)
  toothShape.lineTo(0.043, 0)
  toothShape.lineTo(0.04, -0.064)
  toothShape.quadraticCurveTo(0, -0.087, -0.04, -0.064)
  toothShape.closePath()
  const toothGeometry = new THREE.ExtrudeGeometry(toothShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelSize: 0.007,
    bevelThickness: 0.006,
    bevelSegments: 3,
    curveSegments: 12,
  })
  for (const side of [-1, 1]) {
    const tooth = new THREE.Mesh(toothGeometry, materials.tooth)
    tooth.position.set(side * 0.048, -0.022, 0.018)
    tooth.rotation.z = side * -0.04
    mouth.add(tooth)
  }
  ball(mouth, materials.pink, [0.008, -0.13, 0.014], [0.06, 0.022, 0.013])
  for (const side of [-1, 1]) {
    curve(
      head,
      [
        [side * 0.025, -0.22, 1.027],
        [side * 0.1, -0.249, 1.007],
        [side * 0.2, -0.235, 0.959],
      ],
      0.011,
      materials.line,
    )
    for (let strand = 0; strand < 3; strand++) {
      const tuft = ball(
        head,
        materials.cream,
        [
          side * (0.75 + strand * 0.026),
          -0.23 - strand * 0.065,
          0.655 - strand * 0.024,
        ],
        [0.1, 0.043, 0.034],
      )
      tuft.rotation.z = side * (0.25 + strand * 0.16)
    }
  }

  const paws: THREE.Group[] = []
  const claws: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const paw = new THREE.Group()
    paw.position.set(side * 0.58, 1.02, 0.48)
    root.add(paw)
    const sleeve = ball(paw, materials.shell, [0, 0, 0], [0.33, 0.19, 0.23])
    sleeve.rotation.z = side * 0.5
    ball(
      paw,
      materials.cream,
      [side * -0.24, -0.08, 0.2],
      [0.175, 0.145, 0.125],
    )
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
    claw.position.set(side * 0.77, 0.99, -0.08)
    claw.scale.setScalar(1.0)
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
      const y = 0.78 - leg * 0.2
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
    mouth,
    eyes,
    lids,
    closedEyes,
    antennae,
    brows,
    paws,
    claws,
  }
}
