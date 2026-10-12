import { expect, test, type Page } from '@playwright/test';

// Runs against the API with `npm run seed` data and DEV_LOGIN=true (see README).

const errors: string[] = [];

test.beforeEach(({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
});

test.afterEach(() => {
  expect(errors, 'uncaught errors in the page').toEqual([]);
});

async function signIn(page: Page, email: string, path = '/') {
  await page.goto(path);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
}

/** A real JPEG, so the browser can resize it and compute the blurhash. */
async function jpeg(page: Page): Promise<Buffer> {
  const data = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 480;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#1D4FA0';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#F2B900';
    ctx.beginPath();
    ctx.arc(320, 240, 150, 0, Math.PI * 2);
    ctx.fill();
    return c.toDataURL('image/jpeg', 0.9).split(',')[1]!;
  });
  return Buffer.from(data, 'base64');
}

test('signed out: the manifest and sign-in', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tylko');
  await expect(page.getByText('Logowanie deweloperskie')).toBeVisible();
});

test('discover, search, a place, stats and profile', async ({ page }) => {
  await signIn(page, 'kuba@example.com');
  await expect(page.getByRole('heading', { name: 'Odkrywaj' })).toBeVisible();
  const cards = page.locator('.place-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(10);

  await page.getByLabel('Szukaj miejsc').fill('pawilon');
  await expect(page).toHaveURL(/q=pawilon/);
  await expect(cards.first()).toContainText(/pawilon/i);

  await cards.first().click();
  await expect(page.getByText('Ocena łączna')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Komentarze/ })).toBeVisible();

  await page.getByRole('link', { name: 'Staty' }).click();
  await expect(page.getByText('Top 10')).toBeVisible();
  await page.getByRole('tab', { name: 'Ja' }).click();
  await expect(page.getByText('Podobny gust')).toBeVisible();

  await page.getByRole('link', { name: 'Ja', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kuba' })).toBeVisible();
});

test('rate a place with a photo', async ({ page }) => {
  await signIn(page, 'ola@example.com', '/?unrated_only=true');
  await page.locator('.place-card').first().click();
  const name = await page.locator('.place-name').textContent();
  await page.getByRole('link', { name: 'Oceń' }).click();

  for (const label of ['Klimat: 5 na 5', 'Oferta: 4 na 5', 'Obsługa: 4 na 5']) {
    await page.getByRole('button', { name: label }).click();
  }
  await expect(page.getByRole('button', { name: 'Zapisz ocenę' })).toBeDisabled(); // no photo yet
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'p.jpg', mimeType: 'image/jpeg', buffer: await jpeg(page) });
  await expect(page.locator('.photo-picker-item img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Zapisz ocenę' }).click();

  await expect(page.locator('.place-name')).toHaveText(name!);
  await expect(page.getByRole('link', { name: 'Zmień ocenę' })).toBeVisible();
});

test('add a place with rating, photo and map pin', async ({ page }) => {
  await signIn(page, 'tomek@example.com');
  await page.getByRole('link', { name: 'Dodaj' }).click();
  const name = `Testowa Kawiarnia ${Date.now()}`;
  await page.getByLabel('Nazwa').fill(name);
  await page.getByRole('button', { name: 'Kawa' }).click();
  const map = page.locator('.map-picker');
  await expect(map.locator('canvas')).toBeVisible();
  await map.click({ position: { x: 200, y: 150 } });
  await expect(page.getByText(/^52\.\d+, 2\d\.\d+$/)).toBeVisible();
  await page.getByLabel('Dlaczego warto').fill('Test end-to-end.');
  await page.getByRole('button', { name: 'Klimat: 4 na 5' }).click();
  await page.getByRole('button', { name: 'Oferta: 5 na 5' }).click();
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'p.jpg', mimeType: 'image/jpeg', buffer: await jpeg(page) });
  await expect(page.locator('.photo-picker-item img')).toHaveCount(1);

  // Card style, with a live preview.
  await page.getByRole('button', { name: 'Koło' }).click();
  await page.getByRole('button', { name: 'Morski' }).click();
  await page.getByRole('button', { name: 'Raster' }).click();
  const preview = page.locator('.card-style-preview');
  await expect(preview.locator('[data-layout="c"]')).toBeVisible();
  await expect(preview.locator('.fx-halftone')).toBeVisible();

  await page.getByRole('button', { name: 'Dodaj miejsce' }).click();

  await expect(page.locator('.place-name')).toHaveText(name);
  await expect(page.getByText('Test end-to-end.')).toBeVisible();
  await expect(page.locator('.gallery-item').first().locator('.fx-halftone')).toBeVisible();

  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.locator('.place-card [data-layout="c"] .fx-halftone')).toBeVisible();
});

test('change a place card style', async ({ page }) => {
  await signIn(page, 'marta@example.com', '/?sort=newest');
  await page.locator('.place-card').first().click();
  const name = (await page.locator('.place-name').textContent())!;
  await page.getByRole('link', { name: 'Edytuj' }).click();
  await page.getByRole('button', { name: 'Plakat' }).click();
  await page.getByRole('button', { name: 'Granatowy' }).click();
  await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
  await expect(page.locator('.place-name')).toHaveText(name);

  await page.goto(`/?q=${encodeURIComponent(name)}`);
  const art = page.locator('.place-card').first().locator('[data-layout="b"]');
  await expect(art).toBeVisible();
  await expect(art).toHaveCSS('background-color', 'rgb(23, 43, 77)');
});

test('the map shows places', async ({ page }) => {
  await signIn(page, 'kuba@example.com');
  await page.getByRole('link', { name: 'Mapa' }).click();
  await expect(page.locator('.map-marker').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('.map-marker').first().click();
  await expect(page.locator('.map-card .place-card')).toBeVisible();
});

test('admin dashboard', async ({ page }) => {
  await signIn(page, 'marta@example.com', '/admin/');
  await expect(page.getByRole('tab', { name: 'Ludzie' })).toBeVisible();
  await expect(page.locator('table.people tbody tr')).toHaveCount(11); // 10 members + ADMIN_EMAILS
  await page.getByRole('tab', { name: 'Ustawienia' }).click();
  await expect(page.getByLabel('Złote gwiazdki na miesiąc')).toBeVisible();

  // Same origin, same session: the app is signed in too.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Odkrywaj' })).toBeVisible();
});

test('members cannot use the dashboard', async ({ page }) => {
  await signIn(page, 'kuba@example.com', '/admin/');
  await expect(page.getByRole('heading', { name: 'Brak dostępu' })).toBeVisible();
});
