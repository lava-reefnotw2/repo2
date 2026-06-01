const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent('<h1>Test</h1>');
    await page.pdf({ format: 'A4' });
    await browser.close();
    console.log("Success!");
  } catch (err) {
    console.error("Puppeteer error:", err.message);
  }
})();
