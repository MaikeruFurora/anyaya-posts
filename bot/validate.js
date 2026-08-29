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

  // Ang 170 ay masyadong maluwag. Sa 17 post na nagawa, 15 ang lumampas sa
  // 480 titik — ang puntong pinuputol ng Facebook sa telepono. Ang Instagram
  // ay mas maaga pa: ~125 titik bago ang "... more".
  //
  // Hindi ito tungkol sa pagiging maikli. Tungkol ito sa kung ano ang tunay
  // na nababasa.
  const caption = g.caption.trim();
  const words = caption.split(/\s+/).length;
  if (words < 40 || words > 110) throw new Error(`Haba ng caption: ${words} salita (40-110)`);

  // Ang unang pangungusap ang tanging tiyak na mababasa. Ito ang sinusukat,
  // hindi ang unang linya: may caption na walang line break, at doon ay ang
  // buong caption ang magiging "unang linya".
  const opener = (caption.match(/^[^.!?]*[.!?]/) || [caption])[0].trim();
  if (opener.length > 140) {
    throw new Error(`Sobrang haba ng unang pangungusap (${opener.length} titik, 140 ang taas). ` +
                    'Ito lang ang tiyak na mababasa bago ang "See more".');
  }

  // Tatlong bahagi ang caption: isang pangungusap, isang listahan, at ang
  // hiling na mag-DM. Ang prosa ay nawawala sa ilalim ng "See more" — ang
  // listahan ay nababasa kahit sa isang sulyap.
  const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => l.startsWith('· '));
  if (bullets.length < 3 || bullets.length > 4) {
    throw new Error(`Kailangan ng 3-4 na linya ng listahan na nagsisimula sa "· " ` +
                    `(mayroong ${bullets.length})`);
  }
  const tooLong = bullets.find(l => l.length > 60);
  if (tooLong) throw new Error(`Sobrang haba ng linya sa listahan: "${tooLong}"`);

  // Ang huling linya ay dapat may hinihinging ipadala. Kung wala, walang
  // susunod na hakbang ang nakabasa.
  const closer = lines[lines.length - 1];
  if (closer.startsWith('· ')) throw new Error('Nagtatapos ang caption sa listahan — walang hiling na mag-DM.');
  if (!/\b(dm|message|send|tell)\b/i.test(closer)) {
    throw new Error(`Walang hiling na mag-DM sa huling linya: "${closer.slice(0, 60)}"`);
  }

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
  const captionOnly = caption;

  return {
    design,
    captionOnly,
    hashtags,
    caption: captionOnly + '\n\n' + hashtags.join(' '),
  };
}

module.exports = { validate, BANNED };
