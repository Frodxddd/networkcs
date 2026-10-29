const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });

  console.log('Navigating to http://localhost:8080/code.html to extract compiled CSS...');
  await page.goto('http://localhost:8080/code.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const css = await page.evaluate(() => {
    let combined = '';
    const styles = document.querySelectorAll('style');
    for (const s of styles) {
      if (s.textContent.includes('--tw-') || s.textContent.includes('tailwindcss')) {
        combined += s.textContent + '\n';
      }
    }
    return combined;
  });

  console.log('Extracted CSS length:', css.length);
  fs.writeFileSync('C:\\Users\\Windows 11\\Downloads\\ui\\stitch_buu_cs_program_portal\\cs_buu_official\\buu-style.css', css, 'utf-8');
  console.log('Saved to buu-style.css!');
  await browser.close();
})();