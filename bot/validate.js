/**
 * Labing-isang guardrail. Tumatakbo bago pa man makita ng tao ang post.
 *
 * Kayang mag-imbento ng AI ng presyo, testimonial, at istatistika nang buong
 * kumpiyansa. Mas mabuti nang walang post ngayong araw kaysa sa isang post na
 * nagsisinungaling para sa negosyo mo.
 */

const BANNED = [
  // Ang presyo ay pwedeng nasa unahan o sa hulihan ng numero — nahuli ito ng
  // test noong Agosto 26: "It is 5000 php only" ay dumaan sa lumang bersyon.
  ['presyo/promo', /(₱|\bphp\s*[\d,]|[\d,]{2,}\s*(php|pesos?|piso)\b|\bpiso\b|\d+\s*%\s*off|discount|promo\s*code|sale ngayon)/],
  ['jargon',       /(unlock|elevate|seamless|game.?changer|revolutioniz)/],
  ['claim',        /(#1\b|number one|best in the philippines|award.winning|top.rated)/],
  ['testimonial',  /(sabi ni |ayon kay |testimonial|review ni )/],
  // Ang mga sumusunod ay ang pinaka-halatang tatak ng AI na sulat.
  ['ai-flip',      /\bit'?s not (just |only )?[^.!?]{2,50}[.,]\s*it'?s\b/],
  ['ai-notjust',   /\bnot (just|only) [^,.]{2,50}[,]?\s*(but|—)/],
  ['ai-filler',    /\b(here'?s the thing|the truth is|let'?s be honest|at the end of the day|that'?s where we come in|imagine this)\b/],
];

/**
 * @param {object} g   ang JSON na galing sa Gemini
 * @param {object} ctx ang galing sa pick(): pillar, angle, variant, paper, slug…
 * @returns {{design: object, caption: string, captionOnly: string, hashtags: string[]}}
 * @throws kapag may tumamang guardrail — sinasadya iyon.
 */
function validate(g, ctx) {
  const blob = [g.headline, g.body, g.caption, ...(g.items || [])].join(' ').toLowerCase();

  const hits = BANNED.filter(([, re]) => re.test(blob)).map(([n]) => n);
  if (hits.length) throw new Error('Bumagsak sa guardrail: ' + hits.join(', '));

  const emojis = (g.caption.match(/\p{Extended_Pictographic}/gu) || []).length;
  if (emojis > 3) throw new Error(`Sobrang emoji sa caption (${emojis})`);

  const words = g.caption.trim().split(/\s+/).length;
  if (words < 45 || words > 170) throw new Error(`Haba ng caption: ${words} salita`);

  // Isang em-dash lang. Ang sunod-sunod na em-dash ay halatang tatak.
  const dashes = (g.caption.match(/—/g) || []).length;
  if (dashes > 1) throw new Error(`Sobrang em-dash sa caption (${dashes})`);

  // Bawal magbukas ang caption sa tanong.
  if (/^[^.!?]{0,120}\?/.test(g.caption.trim())) {
    throw new Error('Nagbukas ang caption sa tanong — bawal iyon.');
  }

  // ---------- hugis para sa renderer ----------
  const design = { variant: g.variant, size: 'portrait', paper: ctx.paper || 'cream' };
  if (g.eyebrow)  design.eyebrow  = g.eyebrow;
  if (g.headline) design.headline = g.headline;
  if (g.body)     design.body     = g.body;
  if (g.items && g.items.length) design.items = g.items.slice(0, 5);

  if (g.variant === 'stat') {
    design.stat = { value: g.statValue, label: g.statLabel };
  }
  if (g.variant === 'compare') {
    design.compare = {
      leftTitle:  g.compareLeftTitle,
      left:       (g.compareLeft  || []).slice(0, 4),
      rightTitle: g.compareRightTitle,
      right:      (g.compareRight || []).slice(0, 4),
    };
  }
  if (g.variant === 'cta') design.cta = g.ctaLabel;

  if (g.variant === 'showcase') {
    // Ang larawan ay galing sa iyo, hindi sa AI. Kung wala ito, walang post —
    // mas mabuti nang huminto kaysa gumawa ng showcase na walang ipinapakita.
    if (!ctx.imageFile) throw new Error('Walang larawan para sa showcase post.');
    design.imageFile = ctx.imageFile;

    // Screen o papel? Magkaibang kahon ang kailangan. Kung wala nito,
    // napupunta ang isang naka-imprentang invitation sa loob ng telepono.
    const FRAMES = ['phone', 'card', 'grid'];
    const frame = ctx.frame || 'phone';
    if (!FRAMES.includes(frame)) {
      throw new Error(`Hindi kilalang frame: ${frame} (${FRAMES.join(', ')} lang)`);
    }
    design.frame = frame;
    design.items = (g.items || []).slice(0, 3);
    if (design.items.length < 2) {
      throw new Error(`Kailangan ng 2-3 label sa showcase (mayroong ${design.items.length})`);
    }
    const tooLong = design.items.find(t => t.length > 22);
    if (tooLong) throw new Error(`Sobrang haba ng label: "${tooLong}"`);
  }

  const tags = (g.hashtags || []).map(t => (t.startsWith('#') ? t : '#' + t));
  if (!tags.some(t => t.toLowerCase() === '#anyayadesigns')) tags.push('#AnyayaDesigns');

  const hashtags = tags.slice(0, 12);
  const captionOnly = g.caption.trim();

  return {
    design,
    captionOnly,
    hashtags,
    caption: captionOnly + '\n\n' + hashtags.join(' '),
  };
}

module.exports = { validate, BANNED };
