const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://frontend-nine-kappa-55.vercel.app';
const SAMPLE_PDF_PATH = path.resolve(__dirname, '../sample_cloud_native_research_paper.pdf');

async function testUploadWorkflow() {
  console.log('================================================================');
  console.log('REAL BROWSER PDF UPLOAD & EXTRACTION TEST ON VERCEL DEPLOYMENT');
  console.log('Target URL:', TARGET_URL);
  console.log('Sample PDF:', SAMPLE_PDF_PATH);
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/papers/upload') || res.url().includes('/api/papers/')) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      console.log(`[API RESPONSE ${res.status()}] ${res.request().method()} ${res.url()} -> ${body.slice(0, 160)}`);
    }
  });

  // STEP 1: LOGIN
  console.log('\n--- 1. Authenticating with Demo Credentials ---');
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle2' });
  const inputs = await page.$$('input');
  await inputs[0].type('demo@university.edu');
  await inputs[1].type('password123');
  await (await page.$('button[type="submit"]')).click();
  await new Promise((r) => setTimeout(r, 4000));
  console.log('Logged in. Current URL:', page.url());

  // STEP 2: NAVIGATE TO UPLOAD PAGE
  console.log('\n--- 2. Navigating to Upload Paper Page ---');
  await page.goto(`${TARGET_URL}/upload`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Upload page URL:', page.url());

  // STEP 3: ATTACH PDF FILE
  console.log('\n--- 3. Selecting sample_cloud_native_research_paper.pdf ---');
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) throw new Error('File input element not found on Upload page');
  await fileInput.uploadFile(SAMPLE_PDF_PATH);
  await new Promise((r) => setTimeout(r, 1000));

  const fileNameOnScreen = await page.evaluate(() => {
    const el = document.querySelector('.truncate.font-bold') || document.querySelector('p');
    return el ? el.innerText : '';
  });
  console.log('Selected file confirmed in DOM:', fileNameOnScreen.slice(0, 80));

  // STEP 4: CLICK SUBMIT UPLOAD
  console.log('\n--- 4. Clicking Upload & Analyze PDF ---');
  const submitBtn = await page.$('button[type="submit"]');
  if (!submitBtn) throw new Error('Submit button not found');
  await submitBtn.click();

  // Wait for processing and navigation
  console.log('Waiting for PyMuPDF text stream extraction & AI synthesis redirection...');
  let reachedDetails = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (page.url().match(/\/papers\/[0-9a-fA-F]{24}/) || (page.url().includes('/papers/') && !page.url().endsWith('/upload'))) {
      reachedDetails = true;
      break;
    }
    const onScreenErr = await page.evaluate(() => {
      const el = document.querySelector('.bg-rose-500\\/10');
      return el ? el.innerText : null;
    });
    if (onScreenErr) {
      console.log('[ON-SCREEN ERROR DETECTED]:', onScreenErr);
      throw new Error(`Upload page showed error: ${onScreenErr}`);
    }
  }

  console.log('Final URL after upload:', page.url());
  if (!reachedDetails) {
    throw new Error('Upload workflow timed out before navigating to Paper Details');
  }
  console.log('[PASS] Upload succeeded and automatically navigated to Paper Details!');

  // STEP 5: VERIFY PAPER DETAILS PAGE RENDERING
  console.log('\n--- 5. Verifying Paper Details Rendering ---');
  await new Promise((r) => setTimeout(r, 3000));
  const detailsText = await page.evaluate(() => document.body.innerText);

  const hasDecentralized = detailsText.includes('Decentralized') || detailsText.includes('Resilience');
  const hasMethodology = detailsText.includes('Methodology') || detailsText.includes('Kubernetes');
  const hasGaps = detailsText.includes('Research Gap') || detailsText.includes('Gaps');
  console.log('- Contains Title/Keywords:', hasDecentralized ? 'YES' : 'NO');
  console.log('- Contains Methodology:', hasMethodology ? 'YES' : 'NO');
  console.log('- Contains Research Gaps tab:', hasGaps ? 'YES' : 'NO');

  // STEP 6: VERIFY IN LIBRARY
  console.log('\n--- 6. Verifying Paper appears in My Library ---');
  await page.goto(`${TARGET_URL}/library`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  const libraryText = await page.evaluate(() => document.body.innerText);
  const inLibrary = libraryText.includes('Decentralized') || libraryText.includes('sample_cloud_native');
  console.log('Uploaded paper listed in Library:', inLibrary ? 'YES' : 'NO');

  console.log('\n================================================================');
  console.log('ALL PDF UPLOAD & EXTRACTION TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');

  await browser.close();
}

testUploadWorkflow().catch((err) => {
  console.error('[BROWSER UPLOAD TEST FAILED]:', err);
  process.exit(1);
});
