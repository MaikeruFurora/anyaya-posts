#!/usr/bin/env node
/**
 * Anyaya Designs — HTML → JPEG post renderer
 *
 *   node render.js --in post.json --out ../docs/posts/2026-08-22.jpg
 *   echo '{"variant":"quote",...}' | node render.js --out out.jpg
 *
 * JPEG dahil ito lang ang format na tinatanggap ng Instagram Content
 * Publishing API. Gumagana rin ito sa Facebook.
 */
const fs   = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// ---------- args ----------
const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const inFile  = arg('--in');
const outFile = path.resolve(arg('--out', 'post.jpg'));

const readStdin = () => new Promise(res => {
  let b = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => (b += d));
  process.stdin.on('end', () => res(b));
});

// ---------- validation ----------
const VARIANTS = ['quote', 'tips', 'stat', 'compare', 'question', 'feature', 'cta'];

function validate(d) {
  const errors = [];
  if (!VARIANTS.includes(d.variant)) {
    errors.push(`variant must be one of: ${VARIANTS.join(', ')} (got "${d.variant}")`);
  }
  if (['quote', 'tips', 'compare', 'question', 'feature', 'cta'].includes(d.variant) && !d.headline) {
    errors.push('headline is required for this variant');
  }
  if (['tips', 'feature'].includes(d.variant)) {
    const n = (d.items || []).length;
    if (n < 3 || n > 5) errors.push(`items must be 3-5 (got ${n})`);
  }
  if (d.variant === 'stat' && !(d.stat && d.stat.value)) {
    errors.push('stat.value is required');
  }
  if (d.variant === 'compare') {
    const c = d.compare || {};
    if (!(c.left || []).length || !(c.right || []).length) {
      errors.push('compare.left and compare.right must each have items');
    }
  }
  if (d.headline && d.headline.length > 95) {
    errors.push(`headline too long (${d.headline.length} chars, max 95)`);
  }
  return errors;
}

// ---------- main ----------
(async () => {
  const raw  = inFile ? fs.readFileSync(inFile, 'utf8') : await readStdin();
  const data = JSON.parse(raw);

  const errors = validate(data);
  if (errors.length) {
    console.error('❌ Invalid post data:\n  - ' + errors.join('\n  - '));
    process.exit(1);
  }

  const height = data.size === 'square' ? 1080 : 1350;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
      '--force-color-profile=srgb',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height, deviceScaleFactor: 1 });

    // Inject data BEFORE the page's own script runs.
    await page.evaluateOnNewDocument(d => { window.__DATA__ = d; }, data);

    await page.goto('file://' + path.join(__dirname, 'template.html'), {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // wait for webfonts + layout pass
    await page.waitForSelector('body[data-ready="1"]', { timeout: 20000 });

    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    await page.screenshot({
      path: outFile,
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: 1080, height },
    });

    const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
    console.log(`✅ ${outFile}  (1080×${height}, ${kb} KB, variant: ${data.variant})`);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('❌ Render failed:', e.message);
  process.exit(1);
});
