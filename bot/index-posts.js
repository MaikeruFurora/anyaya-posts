#!/usr/bin/env node
/**
 * Ginagawa ang docs/posts/index.json mula sa lahat ng post.json na naroon.
 *
 *   node bot/index-posts.js
 *
 * Kailangan ito dahil hindi kayang maglista ng folder ang GitHub Pages —
 * static file lang ang naibibigay nito. Ito ang listahang binabasa ng
 * docs/admin.html.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'docs', 'posts');
if (!fs.existsSync(dir)) {
  console.error('Wala ang docs/posts/');
  process.exit(1);
}

const posts = fs.readdirSync(dir)
  .filter(f => f.endsWith('.json') && f !== 'index.json')
  .map(f => {
    try {
      const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const base = p.base || path.basename(f, '.json');
      // May larawan ba talaga? Kung wala, walang saysay ito sa dashboard.
      if (!fs.existsSync(path.join(dir, base + '.jpg'))) return null;
      return {
        base,
        slug: p.slug || base.slice(0, 10),
        subject: p.subject || '',
        pillar: p.pillar || '',
        angle: p.angle || '',
        variant: p.variant || '',
        paper: p.paper || '',
        dry: !!p.dry,
        caption: p.caption || '',
      };
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  // Ang sample ay hindi dapat lumabas sa dashboard — hindi ito ipopost.
  .filter(p => !p.dry)
  .sort((a, b) => b.base.localeCompare(a.base));

const out = path.join(dir, 'index.json');
fs.writeFileSync(out, JSON.stringify({ posts }, null, 1));
console.log(`✅ ${out} — ${posts.length} post`);
