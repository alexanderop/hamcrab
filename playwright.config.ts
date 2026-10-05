import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'
const testDir = defineBddConfig({
  features: 'tests/e2e/*.feature',
  steps: 'tests/e2e/*.steps.ts',
})
export default defineConfig({
  testDir,
  fullyParallel: false,
  workers: 1,
  timeout: process.env.CI ? 90_000 : 30_000,
  expect: { timeout: 8000 },
  use: {
    contextOptions: { reducedMotion: 'reduce' },
    launchOptions: { timeout: 15_000 },
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      `http://127.0.0.1:5197${process.env.VITE_BASE_PATH || '/'}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          timeout: 15_000,
          args:
            process.env.CI && process.platform === 'linux'
              ? ['--use-gl=angle', '--use-angle=swiftshader']
              : [],
        },
      },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm preview --port 5197 --strictPort',
        url: `http://127.0.0.1:5197${process.env.VITE_BASE_PATH || '/'}`,
        reuseExistingServer: false,
      },
})
