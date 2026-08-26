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
const VARIANTS = ['quote', 'tips', 'stat', 'compare', 'question', 'feature', 'cta', 'showcase'];

// Mga larawang kayang ipasok sa showcase. Base64 ang ginagamit para walang
// network call sa oras ng render — kung sa internet kukunin, may araw na
// mabibigo iyon at tahimik na mawawala ang larawan sa post mo.
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function toDataUri(file) {
  const ext = path.extname(file).toLowerCase();
  if (!MIME[ext]) throw new Error(`Hindi kilalang uri ng larawan: ${ext} (png, jpg, o webp lang)`);
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) throw new Error(`Wala ang larawan: ${abs}`);
  const bytes = fs.readFileSync(abs);
  if (bytes.length > 8 * 1024 * 1024) {
    throw new Error(`Sobrang laki ng larawan (${(bytes.length / 1048576).toFixed(1)} MB, max 8 MB)`);
  }
  return `data:${MIME[ext]};base64,${bytes.toString('base64')}`;
}

function inlineImage(d) {
  // Isa o marami. Ang una sa listahan ang mapupunta sa gitna — iyon ang
  // dapat na pinakamalakas na larawan.
  if (Array.isArray(d.imageFiles) && d.imageFiles.length) {
    const max = d.frame === 'grid' ? 9 : 3;
    if (d.imageFiles.length > max) {
      throw new Error(`${max} na larawan lang ang kasya sa frame na "${d.frame || 'phone'}" (${d.imageFiles.length} ang binigay)`);
    }
    d.images = d.imageFiles.map(toDataUri);
    return;
  }
  if (d.imageFile) d.image = toDataUri(d.imageFile);
}

function validate(d) {
  const errors = [];
  if (!VARIANTS.includes(d.variant)) {
    errors.push(`variant must be one of: ${VARIANTS.join(', ')} (got "${d.variant}")`);
  }
  if (['quote', 'tips', 'compare', 'question', 'feature', 'cta'].includes(d.variant) && !d.headline) {
    errors.push('headline is required for this variant');
  }
  if (d.frame && !['phone', 'card', 'grid', 'plain'].includes(d.frame)) {
    errors.push(`frame ay "phone", "card", "grid", o "plain" lang (nakuha: "${d.frame}")`);
  }
  if (d.blurBelow !== undefined) {
    // Isang numero, o listahan na tig-isa sa bawat larawan. Ang 0 ay walang blur.
    const list = Array.isArray(d.blurBelow) ? d.blurBelow : [d.blurBelow];
    for (const v of list) {
      const n = Number(v);
      if (Number.isNaN(n) || (n !== 0 && !(n >= 5 && n <= 95))) {
        errors.push(`blurBelow ay 0 o 5-95 (nakuha: "${v}")`);
        break;
      }
    }
  }
  if (d.frame === 'grid' && (d.imageFiles || d.images || []).length > 9) {
    errors.push('siyam na larawan lang ang kasya sa grid');
  }
  if (d.variant === 'showcase' &&
      !d.image && !d.imageFile && !(d.images || []).length && !(d.imageFiles || []).length) {
    errors.push('kailangan ng larawan ang showcase (imageFile o imageFiles)');
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

  // Bago pa ang validation: kapag may imageFile, gawin itong base64 image.
  inlineImage(data);

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
