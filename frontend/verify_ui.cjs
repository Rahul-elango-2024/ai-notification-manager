const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Listen to console logs
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  console.log("Navigating to http://localhost:5174/...");
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });

  // Wait for alerts to load and click the first one if not already selected
  try {
    await page.waitForSelector('.alert-item', { timeout: 5000 });
    console.log("Alert items found. Clicking the first one just in case...");
    await page.click('.alert-item:first-child');
    // Wait a moment for network fetch
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (e) {
    console.log("Could not click alert, maybe already selected or not loaded:", e.message);
  }

  // Extract HTML of the alert detail panel
  console.log("Extracting AlertDetail HTML...");
  const html = await page.evaluate(() => {
    const detailPanel = document.querySelector('.alert-full-detail') || document.querySelector('.alert-detail');
    return detailPanel ? detailPanel.innerHTML : 'No detail panel found';
  });

  console.log("\n--- HTML CONTENT ---");
  console.log(html);
  
  await browser.close();
})();
