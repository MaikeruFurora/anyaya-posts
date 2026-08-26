#!/usr/bin/env node
/**
 * Lahat ng logic, sinusubok nang walang AI, walang server, walang internet.
 *
 *   node bot/test.js
 *
 * Kung may pinalitan ka sa content.js o validate.js, ito ang patakbuhin bago
 * i-push. Mas mabuting mahuli dito kaysa sa alas-sais ng umaga.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pick, geminiBody, ANGLES } = require('./content');
const { validate } = require('./validate');

let fail = 0;
const check = (label, ok, extra = '') => {
  console.log(`${ok ? '✓' : '✗'} ${label}${extra ? '  — ' + extra : ''}`);
  if (!ok) fail++;
};
const at = iso => pick(new Date(iso));

/* ---------- 1. ang pumipili ---------- */
{
  const seen = new Map();
  for (let d = 0; d < 56; d++) {
    const r = at(new Date(Date.UTC(2026, 7, 22 + d, 6, 0, 0)).toISOString());
    if (!r.variant || !r.slug || !r.pillar || !r.angle || !r.paper) {
      check('pick: kumpleto ang output', false, JSON.stringify(r));
      break;
    }
    const k = r.pillar + '::' + r.angle;
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  check('pick: 56 natatanging angle sa 8 linggo',
        seen.size === 56 && Math.max(...seen.values()) === 1,
        `${seen.size} natatangi`);
}

{
  const tally = { rsvp: 0, craft: 0 }, papers = {}, combos = new Map();
  for (let d = 0; d < 182; d++) {
    const r = at(new Date(Date.UTC(2026, 0, 1 + d, 6, 0, 0)).toISOString());
    tally[r.subject]++;
    papers[r.paper] = (papers[r.paper] || 0) + 1;
    const k = r.pillar + '::' + r.angle;
    combos.set(k, (combos.get(k) || 0) + 1);
  }
  const share = tally.craft / 182;
  check('serbisyo: halos hati ang RSVP at craft sa kalahating taon',
        share > 0.42 && share < 0.58, `craft ${tally.craft}, rsvp ${tally.rsvp}`);
  check('papel: tatlong tono, halos pantay',
        Object.keys(papers).length === 3 && Math.min(...Object.values(papers)) > 50,
        JSON.stringify(papers));
  check('angle: hindi hihigit sa dalawang ulit sa 182 araw',
        Math.max(...combos.values()) <= 2,
        `${combos.size} natatangi, max ${Math.max(...combos.values())}`);
}

{
  const wk = [];
  for (let d = 0; d < 7; d++) wk.push(at(new Date(Date.UTC(2026, 7, 24 + d, 6, 0, 0)).toISOString()).subject);
  check('serbisyo: pareho lumalabas sa isang linggo',
        wk.includes('rsvp') && wk.includes('craft'), wk.join(','));

  let same = 0, prev = null;
  for (let d = 0; d < 30; d++) {
    const r = at(new Date(Date.UTC(2026, 7, 1 + d, 6, 0, 0)).toISOString());
    if (r.paper === prev) same++;
    prev = r.paper;
  }
  check('papel: hindi kailanman kapareho ng kahapon', same === 0, `${same} sunod-sunod`);
}

check('Lunes = Pain / Problem', at('2026-08-24T06:00:00+08:00').pillar === 'Pain / Problem');
check('Linggo = Offer / CTA',   at('2026-08-23T06:00:00+08:00').pillar === 'Offer / CTA');
check('slug format YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(at('2026-08-23T06:00:00+08:00').slug));

// Deterministic — dalawang tawag sa parehong petsa, parehong sagot.
{
  const a = at('2026-09-14T06:00:00+08:00'), b = at('2026-09-14T21:00:00+08:00');
  check('pick: pareho ang sagot sa buong araw', a.angle === b.angle && a.paper === b.paper);
}

/* ---------- 2. ang request sa Gemini ---------- */
{
  const p = at('2026-08-24T06:00:00+08:00');
  const b = geminiBody(p);
  check('gemini: may system_instruction', b.system_instruction.parts[0].text.includes('ANYAYA DESIGNS'));
  check('gemini: JSON mode', b.generationConfig.responseMimeType === 'application/json');
  check('gemini: may responseSchema', b.generationConfig.responseSchema.required.includes('caption'));
  check('gemini: naipasa ang hugis', /Caption shape to use: \w+/.test(b.contents[0].parts[0].text));
  check('gemini: naipasa ang serbisyo', /Service in focus today: the (LIVE RSVP WEBSITE|PRINTED CRAFT)/
        .test(b.contents[0].parts[0].text));
  check('gemini: valid JSON ang buong body', typeof JSON.parse(JSON.stringify(b)) === 'object');
}

/* ---------- 3. ang guardrails ---------- */
const goodEnglish =
  'It is ten in the evening and you are counting again. Yesterday you were sure ' +
  'it was a hundred. Tonight there are three new replies buried somewhere in the ' +
  'group chat and two cancellations you never saw.\n\n' +
  'The number was never really the problem. There is no single place where every ' +
  'answer lives, so you keep starting from the beginning.\n\n' +
  'With a live RSVP page you send one link and the count keeps itself. ' +
  'Message us your event date and we will show you what it looks like.';

const goodTips = {
  variant: 'tips', eyebrow: 'RSVP checklist',
  headline: 'Four things your **RSVP form** needs',
  items: ['**Name and guests** — an exact headcount, not a guess.',
          '**Meal preference** — the caterer and the allergies both need it.',
          '**A clear deadline** — three weeks before the day.',
          '**Contact number** — someone to reach when plans change.'],
  caption: goodEnglish,
  hashtags: ['WeddingPH', '#DebutPH', '#RSVPWebsite'],
};
const ctx = { pillar: 'Educate / Tips', angle: 'x', variant: 'tips', paper: 'kraft', slug: '2026-08-26' };

try {
  const out = validate(goodTips, ctx);
  check('validator: pumasa ang malinis na post', true);
  check('validator: nadagdag ang #AnyayaDesigns', out.hashtags.includes('#AnyayaDesigns'));
  check('validator: nalagyan ng # ang walang #', out.hashtags.includes('#WeddingPH'));
  check('validator: may hashtags sa dulo ng caption', out.caption.includes('#AnyayaDesigns'));
  check('validator: naipasa ang papel sa design', out.design.paper === 'kraft');
} catch (e) {
  check('validator: pumasa ang malinis na post', false, e.message);
}

const mustFail = [
  ['presyo',       { caption: goodEnglish + ' It is 5000 php only.' }],
  ['jargon',       { caption: goodEnglish.replace('The number', 'Time to unlock the number') }],
  ['claim',        { caption: goodEnglish + ' We are the #1 in the Philippines.' }],
  ['testimonial',  { caption: goodEnglish + ' Sabi ni Maria, ang ganda daw.' }],
  ['emoji spam',   { caption: goodEnglish + ' 🎉💚✨🕊️🌿' }],
  ['sobrang ikli', { caption: 'Message us na.' }],
  ['AI flip',      { caption: goodEnglish + " It's not a form. It's a whole event page." }],
  ['AI not-just',  { caption: goodEnglish + ' This is not just a website, but a system.' }],
  ['AI filler',    { caption: goodEnglish + " Here's the thing about guest lists." }],
  ['sobrang em-dash', { caption: goodEnglish + ' One link — one list — one count.' }],
  ['nagbukas sa tanong', { caption: 'How many guests are really coming? ' + goodEnglish }],
];
for (const [label, patch] of mustFail) {
  let threw = false;
  try { validate({ ...goodTips, ...patch }, ctx); } catch { threw = true; }
  check(`guardrail humuli ng ${label}`, threw, threw ? '' : 'HINDI NAHULI');
}

/* ---------- 4. end-to-end: lahat ng variant, lahat ng papel ---------- */
const SHAPES = {
  quote:   { variant:'quote', headline:'One strong *statement* here', body:'A short line underneath.' },
  tips:    goodTips,
  stat:    { variant:'stat', statValue:'1 in 5', statLabel:'who *confirmed* will not arrive', body:'A clear deadline is why this matters.', headline:'x' },
  compare: { variant:'compare', headline:'Group chat or a *live RSVP*?', compareLeftTitle:'Group chat', compareLeft:['Answers sink','Counted by hand','No record'], compareRightTitle:'Anyaya RSVP', compareRight:['One clean list','The count keeps itself','Written down'] },
  question:{ variant:'question', headline:'How long is your guest list?', body:'Comment the number.' },
  feature: { variant:'feature', eyebrow:'Inside the card', headline:'More than *ink*', items:['**Craft stock** you can feel','**A QR code** to the RSVP','**Deckled edge** on one side'] },
  cta:     { variant:'cta', headline:'Send us your *date*', body:'We answer the same day.', ctaLabel:'Message us' },
};
// Linisin muna. Kung may naiwang lumang JPEG, mabibilang iyon at magmumukhang
// pumasa ang test kahit walang na-render — nangyari nga iyon noong Agosto 26.
const outDir = '/tmp/gh-test';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const renderer = path.join(__dirname, '..', 'render', 'render.js');
const hasRenderer = fs.existsSync(renderer);

if (!hasRenderer) {
  // Dating tahimik na nilalaktawan ito at nag-uulat pa rin ng "lahat pumasa".
  // Iyon ang parehong uri ng pagkakamali na tatlong araw kaming binulag.
  // Bumabagsak na ito ngayon maliban kung sinadya mong laktawan.
  check('render: nandiyan ang render/render.js', !!process.env.SKIP_RENDER,
        process.env.SKIP_RENDER ? 'sinadyang laktawan (SKIP_RENDER=1)'
                                : 'WALA — hindi masubok ang disenyo');
} else {
  for (const paper of ['cream', 'kraft', 'chalk']) {
    for (const [name, base] of Object.entries(SHAPES)) {
      try {
        const r = validate({ ...base, caption: goodEnglish, hashtags: ['#a'] },
                           { ...ctx, variant: name, paper });
        const f = path.join(outDir, `${paper}-${name}.json`);
        fs.writeFileSync(f, JSON.stringify(r.design));
        execFileSync('node', [renderer, '--in', f, '--out', path.join(outDir, `${paper}-${name}.jpg`)],
                     { stdio: 'pipe' });
      } catch (e) {
        check(`render: ${paper}/${name}`, false, String(e.message).slice(0, 120));
      }
    }
  }
    const made = fs.readdirSync(outDir).filter(f => f.endsWith('.jpg')).length;
  check('render: 21 larawan (7 variant x 3 papel)', made === 21, `${made} nagawa`);
}

console.log(fail === 0 ? '\n🎉 Lahat pumasa.' : `\n⚠️  ${fail} na bumagsak.`);
process.exit(fail ? 1 : 0);
