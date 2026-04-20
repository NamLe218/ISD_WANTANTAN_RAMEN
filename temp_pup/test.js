const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    const clickResult = await page.evaluate(() => {
        // Find what covers the center
        const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return {
            id: el ? el.id : null,
            className: el ? el.className : null,
            tagName: el ? el.tagName : null
        };
    });
    
    console.log('Element blocking center:', clickResult);
    
    // Also screenshot to verify
    await page.screenshot({ path: 'debug_screenshot.png' });
    
    await browser.close();
})();
