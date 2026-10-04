# Hamcrab

This folder is a standalone Vue 3, TypeScript, Three.js and Vite PWA. Use pnpm.

- Organize by feature. `pet` owns care/time/name rules; `settings` owns preferences; `habitat` owns presentation and GPU lifecycle and never mutates game state.
- Inside a feature, `domain` contains pure TypeScript rules; `application` contains use cases and ports; `adapters` implement persistence; `ui` owns Vue and browser lifecycle.
- Keep domain and application independent of Vue, Dexie, Three.js, Zod and ambient browser/time APIs. Inject capabilities explicitly; do not introduce a DI container or module mocks.
- `src/app/bootstrap.ts` connects concrete adapters. `src/app/App.vue` composes public feature APIs and visible controls. Cross-feature imports use `index.ts`; adapters are private except to bootstrap. Oxlint enforces these boundaries.
- Pet updates must read, decide and write inside one Dexie transaction. Validate data at the storage boundary. Preserve existing `pinchy` database/store key, schema version and `hamcrab.settings.v1` preference key.
- The user replaced the former E2E-only policy: follow AOP's Test at the Right Layer, Make Dependencies Explicit and Functional Core principles. Use Vitest Node for rules/services and architecture checks, Vitest Browser Mode with vitest-browser-vue for components and real IndexedDB adapters, and Playwright/Gherkin for critical application journeys.
- Supply deterministic dependencies in unit tests. Real adapter tests must exercise real browser storage. Keep production service-worker offline reload, multi-tab wiring, 3D and application layout checks in E2E. See `docs/testing.md` for the coverage mapping.
- Run `pnpm verify` and `pnpm test:compat` after changes. Browser Mode uses Google Chrome; preserve the repository's Chromium/Firefox E2E compatibility checks.
- For Pages verification, use `VITE_BASE_PATH=/hamcrab/ pnpm verify` and the same environment for `pnpm test:compat`.
- Keep assets local and preserve offline and configurable base-path behavior.
