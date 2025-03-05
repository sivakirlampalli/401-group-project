const express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit'); // For PDF creation

const app = express();
const port = 3000; // You can change this to any port you prefer
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use('/captured_data', express.static(path.join(__dirname, 'public', 'captured_data')));

// -------- Instagram Capture Functionality --------
function convertImagesToPDF(outputDir, pdfFilePath) {
    const doc = new PDFDocument({ autoFirstPage: false });
    const files = fs.readdirSync(outputDir);
    const imageFiles = files.filter(file => file.endsWith('.png')).sort(); // Filter and sort PNG files

    doc.pipe(fs.createWriteStream(pdfFilePath));

    imageFiles.forEach((file) => {
        const imagePath = path.join(outputDir, file);
        doc.addPage().image(imagePath, { fit: [500, 700], align: 'center', valign: 'center' });
    });

    doc.end();
    console.log(`PDF created at ${pdfFilePath}`);
}
app.post('/capture-instagram', async (req, res) => {
    const { username, password } = req.body;
    const outputDir = path.join(__dirname, 'public', 'captured_data');
    const pdfFilePath = path.join(outputDir, 'instagramdata.pdf');
    console.log(`Received request to capture Instagram data for username: ${username}`);

    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
        console.log(`Created directory: ${outputDir}`);
    }

    try {
        const browser = await puppeteer.launch({
            executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
            headless: false
        });
        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(120000);
        console.log('Navigating to Instagram login page...');
        await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle0' });

        await page.waitForSelector('input[name="username"]');
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log(`Logged in as ${username}. Navigating to user profile...`);
        await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle0' });

        let previousHeight;
        console.log('Scrolling through the posts...');
        while (true) {
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(resolve => setTimeout(resolve, 2000));
            let newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) break;
        }

        const allPostsPath = path.join(outputDir, 'instagram_all_posts.png');
        await page.screenshot({ path: allPostsPath, fullPage: true });
        console.log('Captured screenshot of all posts.');

        await page.click('a[href*="/followers/"]');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const followersModalSelector = 'div[role="dialog"] ul';
        let previousFollowersHeight;
        let maxFollowersToCapture = 10;
        let totalFollowersCaptured = 0;

        console.log('Scrolling through the followers list...');
        while (totalFollowersCaptured < maxFollowersToCapture) {
            previousFollowersHeight = await page.evaluate(() => document.querySelector('div[role="dialog"]').scrollHeight);
            await page.evaluate(() => document.querySelector('div[role="dialog"]').scrollBy(0, 1000));
            await new Promise(resolve => setTimeout(resolve, 2000));
            let newFollowersHeight = await page.evaluate(() => document.querySelector('div[role="dialog"]').scrollHeight);

            const followersPartPath = path.join(outputDir, `instagram_followers_part${totalFollowersCaptured + 1}.png`);
            await page.screenshot({
                path: followersPartPath,
                clip: {
                    x: 0,
                    y: 0,
                    width: 400,
                    height: 1000
                }
            });

            totalFollowersCaptured += 1;

            if (newFollowersHeight === previousFollowersHeight) break;
        }

        await browser.close();
        console.log('Browser closed. Data capture complete.');
        convertImagesToPDF(outputDir, pdfFilePath);
        res.send(`
            capturing completed and PDF created at ${pdfFilePath}
        `);
    } catch (error) {
        console.error('An error occurred:', error);
        
    }
});



// -------- WhatsApp Capture Functionality --------
app.post('/capture-whatsapp', async (req, res) => {
    const chromedriverPath = 'C:\webdriver\chromedriver-win64\chromedriver.exe';  // Update this path
    const screenshotsDir = path.join(__dirname, 'public', 'captured_data', 'whatsappchats');
    
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeService(new chrome.ServiceBuilder(chromedriverPath))
        .build();

    try {
        // Maximize the browser window
        await driver.manage().window().maximize();

        // Navigate to WhatsApp Web
        await driver.get('https://web.whatsapp.com/');
        console.log("Waiting for QR code to appear and be scanned...");
        
        await driver.wait(until.elementLocated(By.css('canvas[aria-label="Scan this QR code to link a device!"]')), 120000);
        await driver.sleep(30000);

        await driver.wait(until.elementLocated(By.css('#pane-side')), 180000);
        console.log("Logged in successfully, capturing screenshots...");

        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }
        
        let chatListSelector = '#pane-side';
        let previousHeight = 0;
        let maxScreenshots=10;
        let currentHeight = await driver.executeScript(`return document.querySelector('${chatListSelector}').scrollHeight`);
        let index = 1;

        while (previousHeight !== currentHeight) {
            const screenshotPath = path.join(screenshotsDir, `whatsapp_chat_page_${index}.png`);
            await driver.findElement(By.css(chatListSelector)).takeScreenshot().then(function(image) {
                fs.writeFileSync(screenshotPath, image, 'base64');
            });
            console.log(`Screenshot of chat page ${index} taken`);

            await driver.executeScript(`
                const chatList = document.querySelector('${chatListSelector}');
                chatList.scrollBy(0, 200); 
            `);
            await driver.sleep(2000);

            previousHeight = currentHeight;
            currentHeight = await driver.executeScript(`return document.querySelector('${chatListSelector}').scrollHeight`);

            index++;
        }
        
        console.log('Finished capturing all chat screenshots');
        res.send('WhatsApp chat screenshots captured successfully!');

        // Convert screenshots to PDF
        convertScreenshotsToPDF(screenshotsDir);

    } finally {
        await driver.quit();
    }
});
function convertScreenshotsToPDF(screenshotsDir) {
    const pdfPath = path.join(__dirname, 'public', 'whatsappchats.pdf'); // Save the PDF in 'public'

    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(fs.createWriteStream(pdfPath)); // Save the PDF to the public directory

    fs.readdir(screenshotsDir, (err, files) => {
        if (err) throw err;

        files.sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]))
            .forEach((file) => {
                const filePath = path.join(screenshotsDir, file);
                doc.addPage().image(filePath, { fit: [600, 800], align: 'center', valign: 'center' });
            });

        doc.end();
        console.log(`PDF created at ${pdfPath}`);
    });
}



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
