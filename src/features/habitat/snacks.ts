import * as THREE from 'three'

export type SnackKind = 'pastry' | 'kebab' | 'bottle'

export function createSnack(kind: SnackKind): THREE.Group {
  const root = new THREE.Group()
  const sphere = new THREE.SphereGeometry(1, 24, 16)
  const material = (color: string, roughness = 0.7) =>
    new THREE.MeshStandardMaterial({ color, roughness })
  function mesh(
    geometry: THREE.BufferGeometry,
    surface: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
  ) {
    const part = new THREE.Mesh(geometry, surface)
    part.position.set(...position)
    part.scale.set(...scale)
    part.castShadow = true
    root.add(part)
    return part
  }
  function tube(
    points: THREE.Vector3[],
    radius: number,
    surface: THREE.Material,
  ) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        points.length * 2,
        radius,
        6,
        false,
      ),
      surface,
    )
  }

  if (kind === 'pastry') {
    const crust = material('#d9943e', 0.58)
    const golden = material('#efb660', 0.61)
    const cinnamon = material('#783921', 0.8)
    const toasted = material('#a55626', 0.72)
    for (const side of [-1, 1]) {
      const wing = mesh(sphere, crust, [side * 0.36, 0, 0], [0.46, 0.32, 0.26])
      wing.rotation.z = side * -0.2
      mesh(sphere, golden, [side * 0.36, 0.025, 0.07], [0.42, 0.285, 0.24])
      const spiral = Array.from({ length: 76 }, (_, index) => {
        const angle = (index / 75) * Math.PI * 5
        const radius = 0.024 + (index / 75) * 0.33
        return new THREE.Vector3(
          side * 0.36 + Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.75,
          0.31 - radius * 0.23,
        )
      })
      tube(spiral, 0.022, cinnamon)
      tube(
        spiral.map((point) =>
          point.clone().add(new THREE.Vector3(0, -0.03, -0.012)),
        ),
        0.012,
        toasted,
      )
    }
    const twist = mesh(sphere, golden, [0, -0.06, 0.03], [0.2, 0.3, 0.31])
    twist.rotation.z = -0.25
    for (let index = 0; index < 3; index++) {
      tube(
        [
          new THREE.Vector3(-0.15, -0.17 + index * 0.09, 0.26),
          new THREE.Vector3(0, -0.12 + index * 0.08, 0.335),
          new THREE.Vector3(0.14, -0.05 + index * 0.07, 0.25),
        ],
        0.012,
        toasted,
      )
    }
    root.rotation.x = -0.12
  } else if (kind === 'kebab') {
    const bread = material('#e8b364')
    const crust = material('#bf7b36')
    const leaf = material('#78ae40', 0.85)
    const leafLight = material('#a8c85c', 0.85)
    const meat = material('#8d5132')
    const meatLight = material('#b57345')
    const tomato = material('#dd4e35', 0.55)
    const sauce = material('#fff0d6', 0.65)
    const onion = material('#a25c94')
    const pita = new THREE.Shape()
    pita.moveTo(-0.58, 0.35)
    pita.quadraticCurveTo(-0.48, -0.2, -0.1, -0.65)
    pita.quadraticCurveTo(0, -0.73, 0.1, -0.65)
    pita.quadraticCurveTo(0.48, -0.2, 0.58, 0.35)
    pita.quadraticCurveTo(0, 0.5, -0.58, 0.35)
    const pitaGeometry = new THREE.ExtrudeGeometry(pita, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.045,
      bevelSegments: 3,
      curveSegments: 16,
      steps: 1,
    })
    mesh(pitaGeometry, crust, [0, 0.12, -0.25])
    mesh(pitaGeometry, bread, [0, -0.07, 0.21], [1, 0.86, 1])
    for (let index = 0; index < 7; index++) {
      const x = (index - 3) * 0.145
      const y = 0.37 + Math.sin(index * 2.4) * 0.045
      const lettuce = mesh(
        sphere,
        index % 2 ? leaf : leafLight,
        [x, y, 0],
        [0.17, 0.13, 0.22],
      )
      lettuce.rotation.z = Math.sin(index * 3) * 0.6
      const slice = mesh(
        sphere,
        index % 2 ? meat : meatLight,
        [x, 0.28, 0.19],
        [0.135, 0.06, 0.11],
      )
      slice.rotation.z = Math.sin(index * 1.7) * 0.5
    }
    for (const side of [-1, 1]) {
      const slice = mesh(
        sphere,
        tomato,
        [side * 0.29, 0.4, 0.17],
        [0.155, 0.13, 0.055],
      )
      slice.rotation.z = side * 0.35
      mesh(
        sphere,
        material('#f39261'),
        [side * 0.29, 0.4, 0.22],
        [0.095, 0.075, 0.014],
      )
      mesh(new THREE.TorusGeometry(0.11, 0.017, 7, 28), onion, [
        side * 0.11,
        0.46,
        0.24,
      ])
    }
    tube(
      Array.from(
        { length: 14 },
        (_, index) =>
          new THREE.Vector3(
            -0.42 + index * 0.065,
            0.26 + Math.sin(index * 1.8) * 0.028,
            0.32,
          ),
      ),
      0.021,
      sauce,
    )
    const seed = material('#ffe8ba')
    for (let index = 0; index < 18; index++) {
      const y = -0.45 + (index % 5) * 0.14
      const width = (y + 0.7) * 0.5
      const x = Math.sin(index * 2.4) * width
      const sesame = mesh(sphere, seed, [x, y, 0.36], [0.012, 0.032, 0.009])
      sesame.rotation.z = index * 1.3
    }
  } else {
    const glass = material('#593018', 0.25)
    const profile: [number, number][] = [
      [0, 0],
      [0.17, 0],
      [0.22, 0.035],
      [0.235, 0.1],
      [0.235, 0.91],
      [0.23, 1.0],
      [0.19, 1.09],
      [0.115, 1.2],
      [0.097, 1.27],
      [0.097, 1.54],
      [0.115, 1.57],
      [0.115, 1.62],
      [0.077, 1.62],
      [0.077, 1.54],
    ]
    mesh(
      new THREE.LatheGeometry(
        profile.map(([x, y]) => new THREE.Vector2(x, y)),
        40,
      ),
      glass,
    )
    mesh(
      new THREE.CylinderGeometry(0.079, 0.079, 0.018, 24),
      material('#28170e'),
      [0, 1.53, 0],
    )
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 768
    const context = canvas.getContext('2d')
    if (!context) throw new Error('The bottle label needs a 2D canvas context')
    context.fillStyle = '#f5e9c8'
    context.fillRect(0, 0, 768, 768)
    context.strokeStyle = '#bb9b48'
    context.lineWidth = 15
    context.strokeRect(22, 22, 724, 724)
    context.strokeStyle = '#274d77'
    context.lineWidth = 5
    context.strokeRect(40, 40, 688, 688)
    context.textAlign = 'center'
    context.fillStyle = '#274d77'
    context.font = 'bold 89px Georgia, serif'
    context.fillText('Augustiner', 384, 162)
    context.font = '32px Georgia, serif'
    context.fillText('MÜNCHEN', 384, 215)
    context.beginPath()
    context.arc(384, 370, 102, 0, Math.PI * 2)
    context.stroke()
    context.font = 'bold 132px Georgia, serif'
    context.fillText('A', 384, 414)
    context.font = 'bold 54px Georgia, serif'
    context.fillText('Lagerbier', 384, 575)
    context.font = 'italic 78px Georgia, serif'
    context.fillText('Hell', 384, 674)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const label = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
    })
    mesh(
      new THREE.CylinderGeometry(0.239, 0.239, 0.66, 40, 1, true, -1.55, 3.1),
      label,
      [0, 0.49, 0],
    )
    mesh(
      new THREE.CylinderGeometry(0.103, 0.114, 0.14, 32),
      material('#c9b57b', 0.45),
      [0, 1.32, 0],
    )
  }

  if (kind === 'bottle') sphere.dispose()
  root.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(root)
  const center = bounds.getCenter(new THREE.Vector3())
  const size = bounds.getSize(new THREE.Vector3())
  const scale = 1.6 / Math.max(size.x, size.y, size.z)
  const holder = new THREE.Group()
  root.position.sub(center)
  holder.add(root)
  holder.scale.setScalar(scale)
  return holder
}
