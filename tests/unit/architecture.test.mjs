import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'
import { boundaryViolation } from '../../tooling/architecture.mjs'

it.each([
  ['features/pet/domain/pet.ts', 'vue'],
  ['features/pet/domain/pet.ts', '../adapters/storage'],
  ['features/pet/application/service.ts', '../ui/usePet'],
  ['features/pet/ui/Pet.vue', '../adapters/storage'],
  ['features/pet/ui/Pet.vue', '../../settings/ui/Panel.vue'],
  ['features/pet/domain/pet.ts', '../../settings'],
  ['features/pet/index.ts', './adapters/storage'],
  ['features/pet/ui/Pet.vue', '../../../app/services'],
  ['app/App.vue', '../features/pet/adapters/storage'],
  ['features/pet/ui/Pet.vue', '@/features/settings/ui/Panel.vue'],
])('rejects forbidden dependency %s -> %s', (file, specifier) => {
  expect(boundaryViolation(`/repo/src/${file}`, specifier)).toBeTruthy()
})
it.each([
  ['features/pet/domain/pet.ts', './foods'],
  ['features/pet/application/service.ts', '../domain/pet'],
  ['features/pet/adapters/storage.ts', '../application/ports'],
  ['features/pet/ui/Pet.vue', '../application/service'],
  ['features/pet/index.ts', './ui/Pet.vue'],
  ['app/App.vue', '../features/pet'],
  ['app/bootstrap.ts', '../features/pet/adapters/storage'],
  ['features/habitat/ui/Scene.vue', '../three/creature'],
])('permits intended dependency %s -> %s', (file, specifier) => {
  expect(boundaryViolation(`/repo/src/${file}`, specifier)).toBeNull()
})
it('enforces imports, re-exports, dynamic imports, require and Vue scripts through the real linter', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'hamcrab-boundaries-'))
  const directory = path.join(root, 'src/features/pet/ui')
  mkdirSync(directory, { recursive: true })
  const fixtures = {
    'static.ts': "import '../adapters/storage'",
    'export.ts': "export { store } from '../adapters/storage'",
    'star.ts': "export * from '../adapters/storage'",
    'dynamic.ts': "void import('../adapters/storage')",
    'require.ts': "require('../adapters/storage')",
    'types.ts': "export type Store = import('../adapters/storage').Store",
    'Panel.vue':
      '<script setup lang="ts">import \'../adapters/storage\'</script><template><p>Test</p></template>',
  }
  try {
    for (const [file, source] of Object.entries(fixtures))
      writeFileSync(path.join(directory, file), source)
    const executable = path.resolve('node_modules/.bin/oxlint')
    const args = [
      '--config',
      path.resolve('.oxlintrc.json'),
      '--format',
      'json',
      directory,
    ]
    const result = spawnSync(executable, args, { encoding: 'utf8' })
    expect(result.status).toBe(1)
    const report = JSON.parse(result.stdout)
    const violations = report.diagnostics.filter((item) =>
      item.code?.includes('boundaries'),
    )
    expect(
      violations.map((item) => path.basename(item.filename)).sort(),
    ).toEqual(Object.keys(fixtures).sort())
    for (const file of Object.keys(fixtures)) rmSync(path.join(directory, file))
    writeFileSync(
      path.join(directory, 'valid.ts'),
      "import '../application/service'",
    )
    expect(() =>
      execFileSync(executable, args, { stdio: 'pipe' }),
    ).not.toThrow()
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
