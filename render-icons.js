// Renders icon.svg to PNG sizes for the home screen. Run: node render-icons.js
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const svg = fs.readFileSync(__dirname + '/icon.svg', 'utf8');
  const browser = await chromium.launch();
  for (const size of [180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg.replace('rx="112"', 'rx="0"')}`);
    await page.screenshot({ path: `${__dirname}/icon-${size}.png` });
    await page.close();
  }
  await browser.close();
})();
