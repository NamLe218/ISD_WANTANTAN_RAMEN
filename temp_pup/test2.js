const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Check if window.openRamen exists
    const hasOpenRamen = await page.evaluate(() => typeof window.openRamen === 'function');
    console.log('window.openRamen exists:', hasOpenRamen);

    // Try clicking the first menu card
    await page.evaluate(() => {
        const card = document.querySelector('.menu-card');
        if (card) card.click();
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Check if the sheet has 'show'
    const sheetShown = await page.evaluate(() => {
        const sheet = document.getElementById('sheet');
        return sheet ? sheet.classList.contains('show') : false;
    });
    console.log('Sheet shown after click:', sheetShown);
    
    await browser.close();
})();
