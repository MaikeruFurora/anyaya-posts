#!/usr/bin/env node
/**
 * Isang showcase post: totoong gawa, hindi imbento.
 *
 *   node bot/showcase.js --images a.png,b.png --brief "..." --paper kraft \
 *        --frame card --out-dir /tmp/post [--blur-below 20] [--variation 1] [--dry]
 *
 * --frame       phone (screenshot ng site) | card (naka-imprentang papel) | grid
 * --blur-below  bahagdan ng taas. Bubura sa lahat ng nasa ibaba nito.
 *               Para sa entourage at listahan ng pangalan.
 *
 * Walang AI na makakaimbento ng totoong trabaho. Ikaw ang nagbibigay ng
 * larawan at ng maikling kuwento; ang AI ang bahalang sumulat sa paligid.
 */
const fs = require('fs');
const path = require('path');
const { showcaseBody } = require('./content');
const { validate } = require('./validate');

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 && process.argv[i+1] ? process.argv[i+1] : d; };
const has = f => process.argv.includes(f);

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

async function callGemini(body, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();
    const text = await res.text();
    last = `HTTP ${res.status} — ${text.slice(0, 500)}`;
    if (res.status === 400 || res.status === 403 || res.status === 404) break;
    if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 5000));
  }
  throw new Error('Hindi tumugon ang Gemini: ' + last);
}

const DRY = {
  variant: 'showcase',
  eyebrow: 'Recent work',
  headline: 'Where the **story** goes',
  body: 'How they met, in their own words. The page holds it, so nobody has to retell it.',
  items: ['Their own words', 'Photos', 'One scroll'],
  caption:
    'The invitation goes out and the questions start. What time is the church. ' +
    'Can I bring my mother.\n\n' +
    'Those used to land in a group chat at eleven at night, and somebody had to ' +
    'answer them twice. Now they land on the page instead, where the answer stays put.\n\n' +
    'Message us your event date and we will show you what yours could look like.',
  hashtags: ['#WeddingPH', '#RSVPWebsite', '#WeddingPlanning', '#PinoyWedding'],
};

(async () => {
  const outDir = arg('--out-dir', '/tmp/post');
  const paper  = arg('--paper', 'cream');
  const frame  = arg('--frame', 'phone');
  // Isang numero para sa lahat, o listahang tig-isa: "0,0,20,20"
  const blurRaw = arg('--blur-below', '0');
  const blurList = blurRaw.split(',').map(v => parseFloat(v.trim()) || 0);
  const blurBelow = blurList.length === 1 ? blurList[0] : blurList;
  const brief  = arg('--brief', '').trim();
  const variation = parseInt(arg('--variation', '0'), 10) || 0;

  if (!['cream', 'kraft', 'chalk'].includes(paper)) {
    throw new Error(`Hindi kilalang papel: ${paper} (cream, kraft, o chalk lang)`);
  }
  if (!['phone', 'card', 'grid'].includes(frame)) {
    throw new Error(`Hindi kilalang frame: ${frame} (phone, card, o grid lang)`);
  }
  for (const v of blurList) {
    if (v !== 0 && (v < 5 || v > 95)) {
      throw new Error(`--blur-below ay 0 o 5 hanggang 95 (nakuha: ${v})`);
    }
  }
  if (!brief) throw new Error('Walang --brief. Kailangan kong malaman kung ano ang nasa larawan.');
  if (brief.length < 20) throw new Error('Sobrang ikli ng --brief. Isang pangungusap man lang.');

  const images = arg('--images', '').split(',').map(s => s.trim()).filter(Boolean);
  if (!images.length) throw new Error('Walang --images.');
  const maxImages = frame === 'grid' ? 9 : 3;
  if (images.length > maxImages) {
    throw new Error(`${maxImages} na larawan lang ang kasya sa frame na "${frame}" (${images.length} ang binigay)`);
  }
  for (const f of images) {
    if (!fs.existsSync(f)) throw new Error(`Wala ang larawan: ${f}`);
  }

  // Petsa sa Maynila — iyon ang oras ng negosyo mo, hindi ng server.
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const pad = n => String(n).padStart(2, '0');
  const slug = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const base = variation === 0 ? `${slug}-showcase` : `${slug}-showcase-v${variation + 1}`;

  console.log(`Araw    : ${slug}`);
  console.log(`Larawan : ${images.length} (${images.join(', ')})`);
  console.log(`Papel   : ${paper}   Frame: ${frame}`);
  if (blurList.some(Boolean)) console.log(`Blur    : ${blurList.join(', ')}% (kada larawan)`);
  if (variation) console.log(`Ulit    : #${variation + 1}`);

  let g;
  if (has('--dry')) {
    g = DRY;
    console.log('(--dry: hindi tinawagan ang Gemini)');
  } else {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Walang GEMINI_API_KEY.');
    const res = await callGemini(showcaseBody(brief, variation), key);
    const text = res?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Walang teksto sa sagot ng Gemini: ' + JSON.stringify(res).slice(0, 400));
    try { g = JSON.parse(text); }
    catch (e) { throw new Error('Hindi mabasa ang JSON ng Gemini: ' + e.message); }
  }

  g.variant = 'showcase';
  const ctx = { paper, frame, imageFile: images[0], slug, base, variation,
                pillar: 'Product Showcase', subject: 'showcase', angle: brief,
                variant: 'showcase', shape: 'noticing' };

  const out = validate(g, ctx);

  // Isa o marami — ang una ang mapupunta sa gitna.
  if (images.length > 1) {
    delete out.design.imageFile;
    out.design.imageFiles = images;
  }
  if (blurList.some(Boolean)) out.design.blurBelow = blurBelow;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'design.json'), JSON.stringify(out.design, null, 2));
  fs.writeFileSync(path.join(outDir, 'post.json'), JSON.stringify({
    ...ctx, images,
    // Tingnan ang bot/generate.js — ganito rin ang dahilan dito.
    dry: has('--dry'),
    caption: out.caption, captionOnly: out.captionOnly, hashtags: out.hashtags,
  }, null, 2));

  console.log(`\n✅ ${outDir}/design.json at post.json  (${base})`);
})().catch(e => { console.error('❌ ' + e.message); process.exit(1); });
