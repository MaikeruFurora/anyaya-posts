#!/usr/bin/env node
/**
 * Isang araw na post: pumili ng laman, ipasulat sa Gemini, salain, at
 * ihanda ang design JSON para sa renderer.
 *
 *   node bot/generate.js --out-dir /tmp/post [--date 2026-08-26] [--variation 1] [--dry]
 *
 * Sumusulat ng dalawang file sa --out-dir:
 *   design.json  → ipapakain sa render/render.js
 *   post.json    → caption, hashtags, at ang konteksto ng araw
 *
 * --dry = laktawan ang Gemini, gumamit ng halimbawang teksto. Para sa test.
 */
const fs = require('fs');
const path = require('path');
const { pick, geminiBody } = require('./content');
const { validate } = require('./validate');
const { fetchRetry } = require('./http');

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const has = flag => process.argv.includes(flag);

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

async function callGemini(body, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  // Inuulit ng fetchRetry ang 429, ang 5xx, at ang hindi pagkarating ng
  // request. Ibinabalik nito ang 400, 403, at 404 — walang saysay ulitin
  // ang mali.
  const res = await fetchRetry(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, {
    onRetry: (n, why) => console.error(`   subok ${n} — ${why.slice(0, 160)}`),
  }).catch(e => { throw new Error('Hindi naabot ang Gemini: ' + e.message); });

  if (res.ok) return res.json();

  // Kapag naretiro ang modelo, sinasabi mismo ng Google kung ano ang kapalit.
  // Nangyari ito noong Agosto at tatlong araw kaming bulag. Ilalabas natin
  // nang buo ang mensahe para hindi na maulit iyon.
  const text = await res.text();
  throw new Error(`Hindi tumugon ang Gemini: HTTP ${res.status} — ${text.slice(0, 500)}`);
}

// Halimbawang laman para sa --dry: isa kada variant, para totoong nasusubok
// ang variant na pinili ng araw at hindi laging iisa lang.
const DRY_CAPTION =
  'The card sits on the table for a week before anyone opens it properly.\n\n' +
  'Then someone runs a thumb along the edge and stops. That is the part we ' +
  'spend the most time on, and the part nobody photographs. It is also the ' +
  'part that decides whether the card gets kept or thrown.\n\n' +
  'Send us your motif and we will show you the paper that suits it.';

const DRY_TAGS = ['#WeddingPH', '#CraftPaper', '#InvitationCards', '#PinoyWedding'];

const DRY = {
  quote:   { headline: 'You do not need *another* group chat. You need **one answer**.',
             body: 'Every night you count again. By morning something has changed.' },
  tips:    { eyebrow: 'Paper, plainly',
             headline: 'Four things to settle **before** printing',
             items: ['**Card weight** — 300gsm holds its shape in a hand.',
                     '**Spelling of names** — checked twice, on paper.',
                     '**Envelope size** — chosen after the card, never before.',
                     '**Extra copies** — ten percent above your guest count.'] },
  stat:    { eyebrow: 'Why the count matters', headline: 'x',
             statValue: '1 in 5', statLabel: 'who *confirmed* will not arrive',
             body: 'A live count with a real deadline costs less than the food you over-order.' },
  compare: { eyebrow: 'Two ways', headline: 'Group chat or a *live RSVP*?',
             compareLeftTitle: 'Group chat',
             compareLeft: ['Answers sink out of sight', 'Counted by hand', 'No record at all'],
             compareRightTitle: 'Anyaya RSVP',
             compareRight: ['One clean list', 'The count keeps itself', 'Everything written down'] },
  question:{ eyebrow: 'Tell us', headline: 'Smooth paper or textured?',
             body: 'Comment which one you reach for. We are curious.' },
  feature: { eyebrow: 'Inside the card', headline: 'More than *ink* on paper',
             items: ['**Craft stock** with visible grain',
                     '**A QR code** that opens the RSVP page',
                     '**Deckled edge** on the long side'] },
  cta:     { eyebrow: 'When you are ready', headline: 'Send us your *motif*',
             body: 'We will show you the paper that suits it.', ctaLabel: 'Message us' },
};

const dryFor = variant => ({
  variant,
  ...DRY[variant],
  caption: DRY_CAPTION,
  hashtags: DRY_TAGS,
});

(async () => {
  const outDir = arg('--out-dir', '/tmp/post');
  const dateArg = arg('--date');
  const when = dateArg ? new Date(dateArg + 'T06:00:00+08:00') : new Date();

  const variation = parseInt(arg('--variation', '0'), 10) || 0;
  const ctx = pick(when, variation);
  console.log(`Araw    : ${ctx.slug}`);
  console.log(`Pillar  : ${ctx.pillar}`);
  console.log(`Serbisyo: ${ctx.subject}`);
  console.log(`Angle   : ${ctx.angle}`);
  console.log(`Variant : ${ctx.variant}   Papel: ${ctx.paper}   Hugis: ${ctx.shape}`);
  if (ctx.variation) console.log(`Ulit    : #${ctx.variation + 1} — file ${ctx.base}`);

  let g;
  if (has('--dry')) {
    g = dryFor(ctx.variant);
    console.log('(--dry: hindi tinawagan ang Gemini)');
  } else {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Walang GEMINI_API_KEY.');
    const res = await callGemini(geminiBody(ctx), key);
    const text = res?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Walang teksto sa sagot ng Gemini: ' + JSON.stringify(res).slice(0, 400));
    try {
      g = JSON.parse(text);
    } catch (e) {
      throw new Error('Hindi mabasa ang JSON ng Gemini: ' + e.message);
    }
  }

  const out = validate(g, ctx);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'design.json'), JSON.stringify(out.design, null, 2));
  fs.writeFileSync(path.join(outDir, 'post.json'), JSON.stringify({
    ...ctx,
    // Ang bandilang ito ang pumipigil sa isang sample na makarating sa
    // Facebook. Noong Agosto 27, isang --dry na post ang nailabas dahil
    // walang paraan ang publisher para malaman kung sample lang ito.
    dry: has('--dry'),
    caption: out.caption,
    captionOnly: out.captionOnly,
    hashtags: out.hashtags,
  }, null, 2));

  console.log(`\n✅ ${outDir}/design.json at post.json`);
})().catch(e => {
  console.error('❌ ' + e.message);
  process.exit(1);
});
