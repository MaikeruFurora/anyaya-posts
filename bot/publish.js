#!/usr/bin/env node
/**
 * Ipo-post ang larawan sa Facebook Page at Instagram.
 *
 *   node bot/publish.js --post /tmp/post/post.json --image-url https://…/2026-08-26.jpg
 *
 * Public URL ang kailangan — hindi tumatanggap ng file upload ang Instagram
 * Content Publishing API. Kaya nasa GitHub Pages ang larawan.
 */
const fs = require('fs');

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const V     = process.env.FB_API_VERSION || 'v26.0';
const TOKEN = process.env.FB_PAGE_TOKEN;
const PAGE  = process.env.FB_PAGE_ID;
const IG    = process.env.IG_USER_ID;

async function graph(pathname, params, label) {
  const url = `https://graph.facebook.com/${V}/${pathname}`;
  const form = new URLSearchParams({ ...params, access_token: TOKEN });

  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { method: 'POST', body: form });
    const text = await res.text();
    if (res.ok) {
      try { return JSON.parse(text); } catch { return { raw: text }; }
    }
    last = `HTTP ${res.status} — ${text.slice(0, 400)}`;
    // Ang 190 ay expired o binawing token. Walang saysay ulitin iyon.
    if (/"code"\s*:\s*190/.test(text)) break;
    if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 8000));
  }
  throw new Error(`${label} — ${last}`);
}

(async () => {
  for (const [name, val] of [['FB_PAGE_TOKEN', TOKEN], ['FB_PAGE_ID', PAGE], ['IG_USER_ID', IG]]) {
    if (!val) throw new Error(`Walang ${name} sa mga secret.`);
  }

  const post = JSON.parse(fs.readFileSync(arg('--post', '/tmp/post/post.json'), 'utf8'));

  // Ang huling harang. Kahit ma-approve ito nang aksidente, hindi ito
  // makakalabas. Mas mabuting mabigo nang maingay kaysa mag-post ng sample
  // sa totoong page.
  if (post.dry) {
    throw new Error(
      'SAMPLE ito, hindi totoong post. Ginawa ito na may naka-check na "dry", ' +
      'kaya halimbawang teksto lang ang laman at hindi ito tinawagan sa Gemini. ' +
      'Patakbuhin ulit nang WALANG dry para sa totoong post.');
  }

  const imageUrl = arg('--image-url');
  if (!imageUrl) throw new Error('Walang --image-url.');

  const results = [];

  // Facebook muna. Kung mabigo ang Instagram, nailabas na ang isa.
  const fb = await graph(`${PAGE}/photos`,
    { url: imageUrl, caption: post.caption }, 'Facebook');
  results.push(`Facebook: post ${fb.post_id || fb.id}`);
  console.log('✅ Facebook — ' + (fb.post_id || fb.id));

  // Instagram: dalawang hakbang. Container muna, tsaka publish.
  const container = await graph(`${IG}/media`,
    { image_url: imageUrl, caption: post.caption }, 'Instagram (container)');

  // Kailangan ng ilang segundo bago maproseso ng Meta ang larawan.
  await new Promise(r => setTimeout(r, 8000));

  const ig = await graph(`${IG}/media_publish`,
    { creation_id: container.id }, 'Instagram (publish)');
  results.push(`Instagram: media ${ig.id}`);
  console.log('✅ Instagram — ' + ig.id);

  fs.writeFileSync('/tmp/publish-result.txt', results.join('\n'));
})().catch(e => {
  console.error('❌ ' + e.message);
  fs.writeFileSync('/tmp/publish-result.txt', '❌ ' + e.message);
  process.exit(1);
});
