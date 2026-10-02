import { chromium } from 'playwright-core';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../../e2e/results/homepage');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
];

for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
  });
  await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Viewport-only screenshot (not full page) to check actual rendering
  await page.screenshot({
    path: `${outDir}/${vp.name}.png`,
    fullPage: false,
  });

  // Also get page height
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`  ${vp.name}: viewport ${vp.width}x${vp.height}, page height: ${height}px`);

  await page.close();
}

await browser.close();
console.log('Done');
