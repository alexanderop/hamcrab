# Hamcrab

This folder is a standalone Vue 3, TypeScript, Three.js and Vite PWA. Use pnpm.

- `src/features/pet` owns pure care/time rules and transactional Dexie persistence. Validate saved data at the storage boundary.
- `src/features/habitat` owns the original procedural 3D model, rendering, animation and GPU lifecycle. Never mutate game state here.
- `App.vue` composes feature APIs and visible controls.
- The user explicitly chose ONLY Playwright end-to-end tests with Gherkin BDD. Do not add Vitest or component tests.
- Run `pnpm verify` and `pnpm test:compat` after changes. Browser tests target a built production app, including actual service-worker offline reload.
- For Pages verification, use `VITE_BASE_PATH=/hamcrab/ pnpm verify` and the same environment for `pnpm test:compat`.
- Keep assets local and preserve offline and configurable base-path behavior.
