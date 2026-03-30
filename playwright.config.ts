import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const distPath = path.resolve(__dirname, 'dist');

export default defineConfig({
  testDir: './scripts/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx serve ${distPath} -p 3000 -s`,
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});