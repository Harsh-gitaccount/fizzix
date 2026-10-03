import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Check if Tailwind classes are working
const cssInfo = await page.evaluate(() => {
  const grid = document.querySelector('.grid');
  if (!grid) return { error: 'No .grid found' };
  const style = getComputedStyle(grid);

  // Check a card
  const card = document.querySelector('.atlas-card');
  const cardStyle = card ? getComputedStyle(card) : null;

  // Count stylesheets
  const sheets = document.querySelectorAll('link[rel="stylesheet"], style');

  return {
    gridTemplate: style.gridTemplateColumns,
    gridMaxWidth: style.maxWidth,
    gridWidth: style.width,
    gridDisplay: style.display,
    cardWidth: cardStyle?.width,
    cardHeight: cardStyle?.height,
    stylesheetCount: sheets.length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    // Check if any CSS errors
    firstDivBg: getComputedStyle(document.querySelector('.min-h-screen')).backgroundColor,
  };
});

console.log('CSS debug:', JSON.stringify(cssInfo, null, 2));

await browser.close();
