import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Try to login to trigger PlantGallery
  try {
    await page.click('#auth-submit');
    await page.waitForTimeout(2000);
  } catch(e) {}
  
  await browser.close();
})();
