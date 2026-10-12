import { defineConfig, devices } from '@playwright/test';

// End-to-end smoke tests against a running API with development fixtures (see README → "End-to-end tests").
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    // The development fixtures are in Warsaw: be there, so maps open on them.
    geolocation: { latitude: 52.2297, longitude: 21.0122 },
    permissions: ['geolocation'],
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.WEB_URL
    ? undefined
    : { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
