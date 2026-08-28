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
const { pick, geminiBody, ANGLES, ALL_VARIANTS } = require('./content');
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

/* ---------- 1b. variation: ang "skip and generate" ---------- */
{
  const day = '2026-08-27T06:00:00+08:00';
  const v0 = pick(new Date(day), 0);
  const v1 = pick(new Date(day), 1);
  const v2 = pick(new Date(day), 2);

  check('variation 0 = walang pagbabago', v0.base === v0.slug && v0.variation === 0, v0.base);
  check('variation: ibang pangalan ng file', v1.base === v0.slug + '-v2' && v2.base === v0.slug + '-v3',
        `${v1.base}, ${v2.base}`);
  check('variation: ibang angle', v1.angle !== v0.angle && v2.angle !== v0.angle && v2.angle !== v1.angle);
  check('variation: ibang papel', v1.paper !== v0.paper && v2.paper !== v0.paper);
  check('variation: ibang hugis ng caption', v1.shape !== v0.shape && v2.shape !== v0.shape);
  check('variation: ibang disenyo sa bawat ulit',
        new Set([v0.variant, v1.variant, v2.variant]).size === 3,
        `${v0.variant}, ${v1.variant}, ${v2.variant}`);
  check('variation: parehong pillar pa rin', v1.pillar === v0.pillar && v1.subject === v0.subject,
        'ang layunin ng araw ay hindi nagbabago');

  // Kahit anong araw, kahit anong ulit — dapat laging may lumalabas na angle.
  let bad = 0;
  for (let d = 0; d < 60; d++) {
    for (let v = 0; v < 6; v++) {
      const r = pick(new Date(Date.UTC(2026, 7, 1 + d, 6, 0, 0)), v);
      if (!r.angle || !r.variant || !r.paper || !r.base) bad++;
    }
  }
  check('variation: 360 na kombinasyon, walang butas', bad === 0, `${bad} sira`);
}

/* ---------- 1c. ang hanggahan ng taon ---------- */
{
  // Dating mula Enero 1 ang bilang ng araw, kaya nagre-reset ito taon-taon
  // habang ang ikot ay hindi. Dalawang bagay ang nasisira tuwing Disyembre 31:
  // dalawang magkasunod na RSVP, at isang angle na bumabalik pagkalipas ng
  // 17 araw. Tatlong taon ang tinatakbo rito — kailangang tumawid sa
  // hanggahan para mahuli ito.
  const days = 1095;
  const rows = [];
  for (let d = 0; d < days; d++) {
    rows.push(at(new Date(Date.UTC(2026, 0, 1 + d, 6, 0, 0)).toISOString()));
  }

  let runs = 0;
  for (let d = 1; d < days; d++) if (rows[d].subject === rows[d - 1].subject) runs++;
  check('taon: walang dalawang magkasunod na parehong serbisyo', runs === 0, `${runs} pares`);

  const hist = new Map();
  rows.forEach((r, d) => {
    const k = r.pillar + '::' + r.subject + '::' + r.angle;
    if (!hist.has(k)) hist.set(k, []);
    hist.get(k).push(d);
  });
  let closest = Infinity;
  for (const ds of hist.values())
    for (let i = 1; i < ds.length; i++) closest = Math.min(closest, ds[i] - ds[i - 1]);
  check('taon: 90+ araw bago maulit ang isang angle', closest >= 90, `${closest} araw ang pinakamaikli`);

  const papers = {};
  rows.forEach(r => { papers[r.paper] = (papers[r.paper] || 0) + 1; });
  const spread = Math.max(...Object.values(papers)) - Math.min(...Object.values(papers));
  check('taon: pantay ang papel sa tatlong taon', spread <= 1, JSON.stringify(papers));
}

/* ---------- 1d. walang disenyong namamatay ---------- */
{
  // Pito ang disenyo sa ALL_VARIANTS. Anim lang ang lumalabas noon: ang
  // Martes ay `week * 2` kaya laging even ang occurrence, kaya laging
  // variants[0]. Dalawang taon na walang `stat` kahit isang beses — buhay
  // sa renderer, may test na nagre-render nito, pero walang nakakakita.
  const days = 730;
  const rows = [];
  for (let d = 0; d < days; d++) {
    rows.push(at(new Date(Date.UTC(2026, 0, 1 + d, 6, 0, 0)).toISOString()));
  }

  const tally = {};
  rows.forEach(r => { tally[r.variant] = (tally[r.variant] || 0) + 1; });
  const missing = ALL_VARIANTS.filter(v => !tally[v]);
  check('disenyo: lahat ng pito ay lumalabas', missing.length === 0,
        missing.length ? 'wala: ' + missing.join(', ') : JSON.stringify(tally));

  // Walang dapat lumampas nang doble sa pinakakaunti — kung hindi, may
  // isang disenyong halos hindi na rin nakikita.
  const counts = Object.values(tally);
  check('disenyo: walang lumalamang nang doble',
        Math.max(...counts) <= Math.min(...counts) * 2,
        `pinakamarami ${Math.max(...counts)}, pinakakaunti ${Math.min(...counts)}`);

  let sameVariant = 0, samePaper = 0;
  for (let d = 1; d < days; d++) {
    if (rows[d].variant === rows[d - 1].variant) sameVariant++;
    if (rows[d].paper === rows[d - 1].paper) samePaper++;
  }
  check('disenyo: walang magkasunod na magkaparehong disenyo', sameVariant === 0, `${sameVariant} pares`);
  check('papel: walang magkasunod na magkaparehong papel', samePaper === 0, `${samePaper} pares`);
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

/* ---------- 2b. ang muling pagsulat kapag tinanggihan ---------- */
{
  // Isang draft lang ang hinihingi noon. Noong 2026-08-28, tumama ang
  // "Nagbukas ang caption sa tanong" at wala nang post sa buong araw —
  // gayong ang kailangan lang ay sabihin sa modelo kung ano ang nasira.
  //
  // Biyernes ang pinakamadalas: question ang variant, at tanong din ang
  // angle. Halos hinihila ang modelo sa mismong ipinagbabawal.
  const friday = at('2026-08-28T06:00:00Z');
  const first = JSON.stringify(geminiBody(friday));
  const again = JSON.stringify(geminiBody(friday, 'Nagbukas ang caption sa tanong.'));

  check('prompt: Biyernes ay question variant', friday.variant === 'question', friday.pillar);
  check('prompt: hiwalay ang tuntunin ng disenyo at ng caption',
        first.includes('The CAPTION may not'));
  check('prompt: walang note ang unang draft',
        !first.includes('rejected your previous'));
  check('prompt: dala ng ikalawang draft ang dahilan ng pagtanggi',
        again.includes('rejected your previous draft') && again.includes('Nagbukas'));

  // Ang mga halimbawang laman ng --dry ay dapat dumaan sa guardrails —
  // kung hindi, hindi na masusubok ang buong daloy nang walang AI.
  const { execFileSync: run } = require('child_process');
  const dir = path.join(require('os').tmpdir(), 'dry-check');
  let dryOk = true, why = '';
  for (const d of ['2026-08-28', '2026-08-29', '2026-08-30', '2026-08-31',
                   '2026-09-01', '2026-09-02', '2026-09-03']) {
    try {
      run('node', [path.join(__dirname, 'generate.js'),
                   '--out-dir', dir, '--date', d, '--dry'], { stdio: 'pipe' });
    } catch (e) {
      dryOk = false; why = d + ': ' + String(e.stderr || e.message).slice(0, 90);
      break;
    }
  }
  check('dry: pumasa ang pitong araw sa guardrails', dryOk, why);
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

/* ---------- 3b. showcase: totoong gawa ---------- */
{
  const { showcaseBody } = require('./content');
  const b = showcaseBody('Live RSVP site for a September wedding in Baao.', 0);
  check('showcase: may system_instruction',
        b.system_instruction.parts[0].text.includes('ANYAYA DESIGNS'));
  check('showcase: nasa prompt ang brief',
        b.contents[0].parts[0].text.includes('September wedding in Baao'));
  check('showcase: ipinagbabawal ang pag-imbento',
        /Do NOT invent details/.test(b.contents[0].parts[0].text));
  const b2 = showcaseBody('x'.repeat(40), 2);
  check('showcase: iba ang tagubilin sa pang-ulit',
        /rewrite number 3/.test(b2.contents[0].parts[0].text));

  const g = {
    variant: 'showcase', eyebrow: 'Recent work',
    headline: 'Where the **story** goes',
    body: 'How they met, in their own words.',
    items: ['Their own words', 'Photos', 'One scroll'],
    caption: goodEnglish, hashtags: ['#a'],
  };
  const sc = { paper: 'kraft', imageFile: 'assets/showcase/x.png' };
  try {
    const out = validate(g, sc);
    check('showcase: naipasa ang larawan sa design', out.design.imageFile === sc.imageFile);
    check('showcase: tatlong label', out.design.items.length === 3);
  } catch (e) {
    check('showcase: pumasa ang malinis na post', false, e.message);
  }

  for (const [label, patch, ctx] of [
    ['walang larawan',   {}, { paper: 'cream' }],
    ['isang label lang', { items: ['Solo'] }, sc],
    ['sobrang haba ng label', { items: ['Everything a guest could possibly need', 'B', 'C'] }, sc],
  ]) {
    let threw = false;
    try { validate({ ...g, ...patch }, ctx); } catch { threw = true; }
    check(`showcase: sumisigaw kapag ${label}`, threw);
  }
}

/* ---------- 3c. frame at blur ---------- */
{
  const cap = Array(80).fill('word').join(' ') + '.';
  const g = { variant: 'showcase', headline: 'x', body: 'y',
              items: ['a', 'b', 'c'], caption: cap, hashtags: ['#a'] };
  const base = { paper: 'cream', imageFile: 'a.png' };

  for (const [f, want] of [['phone','phone'], ['card','card'], ['grid','grid'], [undefined,'phone']]) {
    check(`frame: ${f || '(wala)'} → ${want}`,
          validate({ ...g }, { ...base, frame: f }).design.frame === want);
  }
  let threw = false;
  try { validate({ ...g }, { ...base, frame: 'poster' }); } catch { threw = true; }
  check('frame: sumisigaw sa hindi kilala', threw);
}

/* ---------- 3d. walang workflow na umaasa sa executable bit ---------- */
// Nawawala ang executable bit kapag ang file ay dumaan sa zip at Windows bago
// ma-commit. Ang lumalabas ay "exit code 126" — walang sinasabi tungkol sa
// tunay na dahilan. Nangyari ito noong Agosto 26 at isang araw na post ang
// nawala. Ang tseke na ito ang pumipigil na maulit.
{
  const wfDir = path.join(__dirname, '..', '.github', 'workflows');
  const bad = [];
  if (fs.existsSync(wfDir)) {
    for (const f of fs.readdirSync(wfDir).filter(n => n.endsWith('.yml'))) {
      const txt = fs.readFileSync(path.join(wfDir, f), 'utf8');
      for (const line of txt.split('\n')) {
        // Hinahanap ang tawag sa isang .sh na hindi dumadaan sa `bash`.
        const m = line.match(/(^|[^\w/.])((?:\.\/)?[\w./-]*\.sh)\b/);
        if (!m) continue;
        if (/\b(bash|sh)\s+[\w./-]*\.sh/.test(line)) continue;
        if (/^\s*#/.test(line)) continue;
        bad.push(`${f}: ${line.trim().slice(0, 70)}`);
      }
    }
  }
  check('workflow: walang umaasa sa executable bit', bad.length === 0, bad.join(' | '));
}

/* ---------- 3e. ang orasan ay may higit sa isang alarma ---------- */
// Sa public repo, ang scheduled workflow ng GitHub ay nahuhuli nang ilang oras
// at minsan hindi na tumatakbo. Noong Agosto 27 ay lumipas ang 6 AM nang
// walang anuman. Tatlong alarma ngayon, at may guard laban sa dobleng post.
{
  const wfDir = path.join(__dirname, '..', '.github', 'workflows');
  const daily = path.join(wfDir, 'daily-post.yml');
  const make  = path.join(wfDir, 'make-post.yml');

  if (fs.existsSync(daily)) {
    const crons = (fs.readFileSync(daily, 'utf8').match(/^\s*- cron:/gm) || []).length;
    check('orasan: higit sa isang alarma', crons >= 2, `${crons} cron`);
    check('orasan: naipapasa ang skip_if_exists',
          /skip_if_exists:\s*\$\{\{\s*github\.event_name == 'schedule'/
            .test(fs.readFileSync(daily, 'utf8')));
  }
  if (fs.existsSync(make)) {
    const txt = fs.readFileSync(make, 'utf8');
    check('make-post: may guard laban sa dobleng post',
          /steps\.guard\.outputs\.skip/.test(txt) && /docs\/posts\/\$SLUG\.json/.test(txt));
    // Bawat mabigat na hakbang ay dapat may guard — kung may nakalimutan,
    // tatakbo pa rin ito kahit dapat huminto na.
    const guarded = (txt.match(/if: steps\.guard\.outputs\.skip != 'true'/g) || []).length;
    check('make-post: may guard ang lahat ng hakbang', guarded >= 7, `${guarded} na naka-guard`);
  }
}

/* ---------- 3f. hindi dapat makalabas ang isang sample ---------- */
// Agosto 27: isang --dry na post ang nailabas sa Facebook. Walang paraan ang
// publisher para malaman na sample lang iyon, at walang babala ang issue.
// Tatlong harang ngayon, at bawat isa ay may test.
{
  const { execFileSync: run } = require('child_process');
  const tmp = '/tmp/dry-check';
  fs.mkdirSync(tmp, { recursive: true });

  // (a) may `dry` ba sa post.json ng isang --dry na takbo?
  try {
    run('node', [path.join(__dirname, 'generate.js'), '--dry', '--out-dir', tmp,
                 '--date', '2026-08-27'], { stdio: 'pipe' });
    const post = JSON.parse(fs.readFileSync(path.join(tmp, 'post.json'), 'utf8'));
    check('sample: nakatala sa post.json', post.dry === true, `dry=${post.dry}`);
  } catch (e) {
    check('sample: nakatala sa post.json', false, String(e.message).slice(0, 120));
  }

  // (b) tumatanggi ba ang publisher?
  const dryPost = path.join(tmp, 'dry.json');
  fs.writeFileSync(dryPost, JSON.stringify({ dry: true, caption: 'x', base: '2026-08-27' }));
  let refused = false, why = '';
  try {
    run('node', [path.join(__dirname, 'publish.js'), '--post', dryPost,
                 '--image-url', 'https://example.com/a.jpg'],
        { stdio: 'pipe',
          env: { ...process.env, FB_PAGE_TOKEN: 'x', FB_PAGE_ID: 'y', IG_USER_ID: 'z' } });
  } catch (e) {
    refused = true;
    why = String(e.stderr || '');
  }
  check('sample: tumatanggi ang publisher', refused && /SAMPLE/.test(why),
        why.trim().slice(0, 90));

  // (c) may babala ba ang issue?
  const bodyDry = run('node', [path.join(__dirname, 'issue-body.js'),
                               '--post', dryPost, '--image-url', 'http://x/y.jpg'],
                      { encoding: 'utf8' });
  check('sample: may babala sa itaas ng issue',
        bodyDry.startsWith('> [!CAUTION]') && /huwag i-post/i.test(bodyDry));

  // (d) at walang babala kapag totoo
  const realPost = path.join(tmp, 'real.json');
  fs.writeFileSync(realPost, JSON.stringify({ caption: 'x', base: '2026-08-27' }));
  const bodyReal = run('node', [path.join(__dirname, 'issue-body.js'),
                                '--post', realPost, '--image-url', 'http://x/y.jpg'],
                       { encoding: 'utf8' });
  check('totoo: walang babala', !/CAUTION/.test(bodyReal) && bodyReal.startsWith('!['));

  // (e) may marka ba ang pamagat?
  const wfDir = path.join(__dirname, '..', '.github', 'workflows');
  for (const f of ['make-post.yml', 'showcase-post.yml']) {
    const txt = fs.readFileSync(path.join(wfDir, f), 'utf8');
    check(`sample: may marka ang pamagat (${f})`,
          /SAMPLE, huwag i-post/.test(txt) && /inputs\.dry.*=.*"true"|"\$\{\{ inputs\.dry \}\}" = "true"/s.test(txt));
  }
}

/* ---------- 3g. ang index para sa dashboard ---------- */
{
  const { execFileSync: run } = require('child_process');
  const root = path.join('/tmp', 'idx-test');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(path.join(root, 'docs', 'posts'), { recursive: true });
  fs.cpSync(__dirname, path.join(root, 'bot'), { recursive: true });

  const write = (base, extra = {}) => {
    fs.writeFileSync(path.join(root, 'docs/posts', base + '.json'),
      JSON.stringify({ base, slug: base.slice(0, 10), subject: 'craft',
                       angle: 'x', variant: 'tips', paper: 'kraft',
                       caption: 'y', ...extra }));
    if (!extra.noImage) fs.writeFileSync(path.join(root, 'docs/posts', base + '.jpg'), 'x');
  };
  write('2026-08-25');
  write('2026-08-26');
  write('2026-08-27', { dry: true });          // sample — dapat wala sa index
  write('2026-08-24', { noImage: true });      // walang larawan — dapat wala rin

  run('node', [path.join(root, 'bot', 'index-posts.js')], { stdio: 'pipe' });
  const idx = JSON.parse(fs.readFileSync(path.join(root, 'docs/posts/index.json'), 'utf8'));
  const bases = idx.posts.map(p => p.base);

  check('index: kasama ang totoong post', bases.includes('2026-08-25') && bases.includes('2026-08-26'));
  check('index: hindi kasama ang sample', !bases.includes('2026-08-27'));
  check('index: hindi kasama ang walang larawan', !bases.includes('2026-08-24'));
  check('index: bago ang nasa itaas', bases[0] === '2026-08-26', bases.join(','));
  check('index: may caption ang bawat isa', idx.posts.every(p => 'caption' in p));
}

/* ---------- 3h. ang dashboard: caption sa textContent, hindi innerHTML ---------- */
{
  // Galing sa AI ang caption. Noong isang beses, muntik itong dumaan sa
  // innerHTML — sapat na iyon para tumakbo ang kahit anong markup na naisulat
  // ng modelo. Dito nahuhuli kung may nagbalik nito nang hindi sinasadya.
  const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'admin.html'), 'utf8');

  check('admin: caption sa pamamagitan ng textContent',
        /\.cap'\)\.textContent\s*=/.test(html));

  // Bawal ang hubad na ${caption} o ${p.caption} sa loob ng template — bilang
  // lang ang pinapayagan, tulad ng ${caption.length}.
  const bare = [...html.matchAll(/\$\{\s*(?:p\.)?caption\s*\}/g)];
  check('admin: walang hubad na caption sa markup', bare.length === 0,
        bare.map(m => m[0]).join(' '));

  check('admin: may harang bago ang laman',
        /PASS_HASH\s*=\s*'[0-9a-f]{64}'/.test(html));
}

/* ---------- 3i. ang fetch na may ulit ---------- */
{
  // Noong 2026-08-27, tatlong run ang bumagsak sa iisang mensahe: "fetch
  // failed". Nasa labas ng try ang await fetch(...), kaya ang pagkaputol ng
  // network ay tumatalon palabas agad — zero na ulit, gayong iyon mismo ang
  // pinakadapat ulitin. At itinatago ng Node sa error.cause ang tunay na
  // dahilan, kaya walang masabi ang mensahe.
  //
  // Lokal na server lang ang ginagamit dito. Walang internet, gaya ng iba.
  const http = require('http');
  const { fetchRetry, describe } = require('./http');
  const results = [];

  const withServer = (handler, fn) => new Promise(resolve => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', async () => {
      const url = `http://127.0.0.1:${srv.address().port}/`;
      let out;
      try { out = await fn(url); } catch (e) { out = { threw: e }; }
      srv.close(() => resolve(out));
    });
  });

  const run = async () => {
    // 1. Ang 500 ay inuulit, at kapag gumaling ay tumutuloy.
    let hits = 0;
    let r = await withServer((q, s) => {
      hits++;
      if (hits < 3) { s.writeHead(500); return s.end('nasira'); }
      s.writeHead(200, { 'Content-Type': 'application/json' });
      s.end('{"ok":true}');
    }, url => fetchRetry(url, {}, { backoffMs: 5 }));
    results.push(['http: inuulit ang 500 hanggang gumaling',
                  !r.threw && r.status === 200 && hits === 3, `${hits} subok`]);

    // 2. Ang 400 ay hindi inuulit — ibinabalik para basahin ng tumawag.
    hits = 0;
    r = await withServer((q, s) => { hits++; s.writeHead(400); s.end('mali'); },
                         url => fetchRetry(url, {}, { backoffMs: 5 }));
    results.push(['http: hindi inuulit ang 400',
                  !r.threw && r.status === 400 && hits === 1, `${hits} subok`]);

    // 3. Ang hindi pagkarating ng request ay inuulit din — ito ang butas noon.
    //    Sarado na ang server, kaya tiyak na hindi ito maaabot.
    let tries = 0;
    const dead = await withServer(() => {}, url => url);
    r = await fetchRetry(dead, {}, { backoffMs: 5, onRetry: () => tries++ })
      .then(x => ({ res: x })).catch(e => ({ threw: e }));
    results.push(['http: inuulit ang hindi makarating na request',
                  !!r.threw && tries === 2, `${tries} ulit`]);

    // 4. Nasa mensahe ang tunay na dahilan, hindi lang "fetch failed".
    const msg = r.threw ? r.threw.message : '';
    results.push(['http: nasa mensahe ang dahilan, hindi "fetch failed" lang',
                  /ECONN|ENOTFOUND|EADDR|refused|socket/i.test(msg), msg.slice(0, 90)]);

    // 5. Ang nakabiting koneksyon ay may hangganan.
    const t0 = Date.now();
    r = await withServer(() => { /* hindi sumasagot kailanman */ },
                         url => fetchRetry(url, {}, { attempts: 1, timeoutMs: 300 })
                           .then(x => ({ res: x })).catch(e => ({ threw: e })));
    results.push(['http: may timeout ang nakabiting koneksyon',
                  !!r.threw && Date.now() - t0 < 5000, `${Date.now() - t0} ms`]);

    // 6. Binubuksan ng describe ang buong kadena ng cause.
    const e = new Error('fetch failed');
    e.cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    const d = describe(e);
    results.push(['http: binubuksan ng describe ang cause',
                  d.includes('fetch failed') && d.includes('ECONNREFUSED'), d]);
  };

  // Ang test file ay sunod-sunod, kaya hinihintay natin ito bago magpatuloy.
  // Sunod-sunod ang test file na ito; ito lang ang bahaging async. Hinihintay
  // ito ng huling ulat sa ibaba bago lumabas.
  global.__httpTest = run().then(() => results.forEach(a => check(...a)));
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
// Ang showcase ay nangangailangan ng totoong larawan, kaya gumagawa tayo ng
// isang maliit na PNG sa pamamagitan ng renderer mismo — walang ibang kailangan.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64');

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

  // Ang showcase: lahat ng frame, may blur at wala.
  const tiny = path.join(outDir, 'tiny.png');
  fs.writeFileSync(tiny, TINY_PNG);
  const scCases = [
    ['phone-isa',   { frame: 'phone', imageFile: tiny }],
    ['card-isa',    { frame: 'card',  imageFile: tiny }],
    ['card-tatlo',  { frame: 'card',  imageFiles: [tiny, tiny, tiny] }],
    ['grid-walo',   { frame: 'grid',  imageFiles: Array(8).fill(tiny) }],
    ['blur-listahan', { frame: 'grid', imageFiles: [tiny, tiny], blurBelow: [0, 30] }],
    ['blur-isa',    { frame: 'card',  imageFile: tiny, blurBelow: 25 }],
  ];
  for (const [name, extra] of scCases) {
    try {
      const d = { variant: 'showcase', size: 'portrait', paper: 'kraft',
                  eyebrow: 'Recent work', headline: 'A **real** piece of work',
                  body: 'Short line underneath.', items: ['One', 'Two', 'Three'], ...extra };
      const f = path.join(outDir, `sc-${name}.json`);
      fs.writeFileSync(f, JSON.stringify(d));
      execFileSync('node', [renderer, '--in', f, '--out', path.join(outDir, `sc-${name}.jpg`)],
                   { stdio: 'pipe' });
      check(`showcase render: ${name}`, true);
    } catch (e) {
      check(`showcase render: ${name}`, false, String(e.message).slice(0, 140));
    }
  }

  // Dapat tumanggi ang renderer sa maling laman.
  for (const [name, d] of [
    ['walang larawan', { variant: 'showcase', headline: 'x' }],
    ['maling frame',   { variant: 'showcase', headline: 'x', imageFile: tiny, frame: 'poster' }],
    ['maling blur',    { variant: 'showcase', headline: 'x', imageFile: tiny, blurBelow: 200 }],
    ['sampung larawan', { variant: 'showcase', headline: 'x', frame: 'grid',
                          imageFiles: Array(10).fill(tiny) }],
  ]) {
    const f = path.join(outDir, `bad-${name.replace(/\s/g, '-')}.json`);
    fs.writeFileSync(f, JSON.stringify({ size: 'portrait', ...d }));
    let rejected = false;
    try { execFileSync('node', [renderer, '--in', f, '--out', '/tmp/should-not-exist.jpg'], { stdio: 'pipe' }); }
    catch { rejected = true; }
    check(`renderer tinatanggihan ang ${name}`, rejected);
  }
}

const report = () => {
  console.log(fail === 0 ? '\n🎉 Lahat pumasa.' : `\n⚠️  ${fail} na bumagsak.`);
  process.exit(fail ? 1 : 0);
};

// Hintayin ang mga test na hindi kayang tapusin nang sunod-sunod.
if (global.__httpTest) {
  global.__httpTest.then(report, e => { check('http: tumakbo', false, e.message); report(); });
} else {
  report();
}
