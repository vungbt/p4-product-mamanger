import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

/**
 * E2E against the built web (`vite preview`, port 5174, `/api` proxied to `@stay/api`).
 * The API must already run with a migrated, seeded database: see `scripts/test-stay-web-e2e.sh`.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/artifacts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  // No retries: sign-in is rate limited (30/min per IP) and a flaky test must be fixed.
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5174',
    locale: 'vi-VN',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'pnpm exec vite preview',
    url: 'http://localhost:5174/login',
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
});
