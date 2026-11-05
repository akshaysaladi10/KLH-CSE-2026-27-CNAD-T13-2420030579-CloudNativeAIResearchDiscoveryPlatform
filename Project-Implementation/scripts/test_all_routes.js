const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://frontend-nine-kappa-55.vercel.app';

async function testAllRoutes() {
  console.log('--- TESTING ALL EXACT ROUTES ON VERCEL DEPLOYMENT ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Login
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle2' });
  const inputs = await page.$$('input');
  await inputs[0].type('demo@university.edu');
  await inputs[1].type('password123');
  await (await page.$('button[type="submit"]')).click();
  await new Promise((r) => setTimeout(r, 4000));

  const routes = [
    { name: 'Dashboard', path: '/dashboard', check: 'CLOUD-NATIVE MICROSERVICES OPERATIONAL' },
    { name: 'Discover', path: '/discover', check: 'Discover Research' },
    { name: 'Library', path: '/library', check: 'My Library' },
    { name: 'Upload', path: '/upload', check: 'Upload Paper' },
    { name: 'Collections', path: '/collections', check: 'Collections' },
    { name: 'Workspaces', path: '/workspaces', check: 'Workspaces' },
    { name: 'Assistant', path: '/assistant', check: 'AI Assistant' },
    { name: 'Compare', path: '/compare', check: 'Compare Papers' },
    { name: 'Gaps', path: '/gaps', check: 'Research Gap Explorer' },
    { name: 'History', path: '/history', check: 'Reading History' },
    { name: 'Bookmarks', path: '/bookmarks', check: 'Bookmarks' },
    { name: 'Reports', path: '/reports', check: 'Research Reports' },
    { name: 'Notifications', path: '/notifications', check: 'Notifications' },
    { name: 'Settings', path: '/settings', check: 'Settings' }
  ];

  let passed = 0;
  for (const r of routes) {
    await page.goto(`${TARGET_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((res) => setTimeout(res, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    const found = text.toLowerCase().includes(r.check.toLowerCase());
    console.log(`[${found ? 'PASS' : 'FAIL'}] ${r.name.padEnd(14)} (${r.path.padEnd(14)}) => Found "${r.check}"`);
    if (found) passed++;
  }

  console.log(`\nResults: ${passed} / ${routes.length} routes passed.`);
  await browser.close();
}

testAllRoutes().catch(console.error);
