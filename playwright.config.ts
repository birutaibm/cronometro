import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  timeout: 20000,
  expect: { timeout: 5000 },
  reporter: [['list']],
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'electron',
      use: { ...devices['Desktop Linux'] },
    },
  ],
});
