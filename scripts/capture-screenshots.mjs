import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const BASE = process.env.DT_BASE_URL || 'http://localhost:5173';
const PHOTO = path.join(ROOT, 'assets', 'catalog', 'dt-48624.png');

const VIEWPORT = { width: 1440, height: 900 };

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', name);
}

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.dt-login__title');
  await shot(page, '01-login');
  await page.fill('input[type="email"]', 'natalia@dressto.com');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button.dt-login__submit');
  await page.waitForSelector('#catalog-title');
  await page.waitForTimeout(600);
}

async function search(page, query) {
  const input = page.locator('input[aria-label="Buscar peças por nome ou SKU"]');
  await input.click();
  await input.fill('');
  await input.fill(query);
  await page.waitForTimeout(450);
}

async function addFirstResult(page) {
  const btn = page.locator('.dt-catalog-search__row button.dt-btn--primary').first();
  await btn.waitFor({ state: 'visible', timeout: 8000 });
  await btn.click();
  await page.waitForTimeout(350);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(BASE);
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  await login(page);
  await shot(page, '02-catalog-busca');

  await search(page, 'macacão');
  await page.waitForSelector('.dt-catalog-search__row');
  await shot(page, '03-catalog-resultados');

  await page.locator('button.dt-filter-trigger').first().click();
  await page.waitForSelector('.dt-filter-mega, .dt-filter-panel');
  await page.waitForTimeout(300);
  await shot(page, '04-catalog-filtros');
  const closeFilters = page.locator('.dt-filter-panel button.dt-btn--primary').first();
  if (await closeFilters.count()) await closeFilters.click();
  await page.waitForTimeout(200);

  await search(page, 'macacão');
  await page.waitForSelector('.dt-catalog-search__row');
  await addFirstResult(page);

  await search(page, 'calça');
  await page.waitForSelector('.dt-catalog-search__row');
  await addFirstResult(page);

  await search(page, 'bolsa');
  await page.waitForSelector('.dt-catalog-search__row');
  await addFirstResult(page);
  await shot(page, '05-catalog-look-montado');

  await search(page, '07.23.1137_2109, 03.07.0388_0069, 02.08.3668_0038');
  await page.waitForTimeout(600);
  await shot(page, '06-catalog-multi-sku');

  await page.locator('button.dt-catalog__dock-continue').click();
  await page.waitForSelector('#workspace-title');
  await page.waitForTimeout(500);
  await shot(page, '07-workspace-sem-foto');

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(PHOTO);
  await page.waitForSelector('#dt-crop-title');
  await page.waitForTimeout(500);
  await shot(page, '08-crop-foto');

  await page.locator('button.dt-btn--outline:has-text("Aplicar recorte")').click();
  await page.waitForSelector('button:has-text("Gerar look")');
  await page.waitForTimeout(700);
  await shot(page, '09-workspace-pronto');

  // Start generation and capture loading state
  await page.locator('.dt-workspace__dock button.dt-btn--primary').click();
  await page.waitForTimeout(900);
  await shot(page, '10-gerando-look');

  await page.waitForSelector('button:has-text("Copiar imagem")', { timeout: 20000 });
  await page.waitForTimeout(900);
  await shot(page, '11-workspace-resultado');

  const favBtn = page.locator('button.dt-workspace__favorite');
  if (await favBtn.count()) {
    await favBtn.click();
    await page.waitForTimeout(400);
  }

  await page.getByRole('button', { name: 'Histórico' }).click();
  await page.waitForTimeout(600);
  await shot(page, '12-historico');

  const removeHistory = page.locator('button[aria-label="Remover do histórico"]').first();
  if (await removeHistory.count()) {
    await removeHistory.click();
    await page.waitForSelector('.dt-confirm');
    await shot(page, '13-confirmacao-exclusao');
    await page.locator('.dt-confirm button.dt-btn--ghost').first().click();
    await page.waitForTimeout(200);
  }

  await page.getByRole('button', { name: 'Favoritados' }).click();
  await page.waitForTimeout(600);
  await shot(page, '14-favoritados');

  await browser.close();
  console.log(`\nScreenshots em: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
