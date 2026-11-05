const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://frontend-nine-kappa-55.vercel.app';

async function runFullBrowserSuite() {
  console.log('====================================================');
  console.log('COMPREHENSIVE REAL BROWSER TEST (Chrome Headless)');
  console.log('Target URL:', TARGET_URL);
  console.log('====================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER CONSOLE ERROR]`, msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    console.log(`[NETWORK FAILED] ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
  });

  page.on('response', (res) => {
    if (res.url().includes('/api/auth/')) {
      console.log(`[AUTH RESPONSE] ${res.status()} ${res.url()}`);
    }
  });

  // TEST 1: REGISTRATION
  console.log('\n--- TEST 1: User Registration on Deployed Vercel App ---');
  const testEmail = `chrome_user_${Date.now()}@university.edu`;
  await page.goto(`${TARGET_URL}/register`, { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('input');
  const inputs = await page.$$('input');
  // Form has:
  // inputs[0]: Name
  // inputs[1]: Email
  // inputs[2]: Institution
  // inputs[3]: Password
  // inputs[4]: Confirm Password
  await inputs[0].type('Prof. Chrome Evaluator');
  await inputs[1].type(testEmail);
  await inputs[2].type('KL University Research Lab');
  await inputs[3].type('StrongPassword123!');
  await inputs[4].type('StrongPassword123!');

  const regSubmit = await page.$('button[type="submit"]');
  await regSubmit.click();
  await new Promise((r) => setTimeout(r, 4000));

  const pageError = await page.evaluate(() => {
    const el = document.querySelector('.bg-rose-500\\/10');
    return el ? el.innerText : null;
  });
  if (pageError) {
    console.log('[PAGE DISPLAYED ERROR]:', pageError);
  }

  console.log('URL after registration:', page.url());
  const regToken = await page.evaluate(() => localStorage.getItem('token'));
  const regUser = await page.evaluate(() => localStorage.getItem('user'));
  console.log('Registration successful? Token exists:', !!regToken);
  console.log('Registered User in LocalStorage:', regUser);
  if (page.url().includes('/dashboard')) {
    console.log('[PASS] Registration automatically redirected to Dashboard!');
  } else {
    throw new Error('Registration did not redirect to dashboard');
  }

  // TEST 2: LOGOUT
  console.log('\n--- TEST 2: User Logout ---');
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle2' });
  console.log('Logged out. Current URL:', page.url());

  // TEST 3: DEMO USER LOGIN
  console.log('\n--- TEST 3: Demo User Login (demo@university.edu / password123) ---');
  const loginInputs = await page.$$('input');
  await loginInputs[0].type('demo@university.edu');
  await loginInputs[1].type('password123');

  const loginSubmit = await page.$('button[type="submit"]');
  await loginSubmit.click();
  await new Promise((r) => setTimeout(r, 4000));

  console.log('URL after demo login:', page.url());
  const demoToken = await page.evaluate(() => localStorage.getItem('token'));
  const demoUser = await page.evaluate(() => localStorage.getItem('user'));
  console.log('Demo Login successful? Token exists:', !!demoToken);
  console.log('Demo User in LocalStorage:', demoUser);
  if (page.url().includes('/dashboard')) {
    console.log('[PASS] Demo login automatically redirected to Dashboard!');
  } else {
    throw new Error('Demo login did not redirect to dashboard');
  }

  // TEST 4: PAGE REFRESH & AUTH PERSISTENCE
  console.log('\n--- TEST 4: Browser Refresh & Session Persistence ---');
  await page.reload({ waitUntil: 'networkidle2' });
  console.log('URL after reload:', page.url());
  const persistedToken = await page.evaluate(() => localStorage.getItem('token'));
  console.log('Token persisted after refresh?', !!persistedToken);
  if (page.url().includes('/dashboard') && !!persistedToken) {
    console.log('[PASS] Session successfully persisted across page refresh!');
  } else {
    throw new Error('Session did not persist after refresh');
  }

  // TEST 5: NAVIGATE TO DISCOVER PAGE
  console.log('\n--- TEST 5: Navigate to Discover Page ---');
  await page.goto(`${TARGET_URL}/discover`, { waitUntil: 'networkidle2' });
  console.log('Discover page URL:', page.url());
  await new Promise((r) => setTimeout(r, 3000));
  const discoverText = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log('Discover page text preview:\n', discoverText.slice(0, 200));

  console.log('\n====================================================');
  console.log('ALL REAL BROWSER TESTS PASSED 100%!');
  console.log('====================================================');

  await browser.close();
}

runFullBrowserSuite().catch((err) => {
  console.error('[BROWSER SUITE FAILED]:', err);
  process.exit(1);
});
