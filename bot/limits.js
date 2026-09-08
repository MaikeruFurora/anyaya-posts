/**
 * Ang hangganan ng teksto sa loob ng larawan — iisang pinagmumulan.
 *
 * Dalawang lugar ang nangangailangan ng bilang na ito: ang `validate.js` na
 * tumatanggi, at ang `content.js` na nagsasabi sa modelo. Noong magkahiwalay
 * sila, nagkalayo sila — sinabi ng prompt na "statValue (max 8 chars)" at
 * walang nagpatupad, kaya dalawang post ang lumabas na sira noong Setyembre.
 *
 * Tapos, nang magpatupad ako, hiling pa rin ang prompt: nakabaon sa gitna ng
 * mahabang talata at walang bakod sa schema. Tatlong draft ang tinanggihan sa
 * isang araw, at nawala ang post — hindi dahil mali ang hangganan, kundi dahil
 * hindi ito nakarating sa modelo bilang utos.
 *
 * Kaya nandito ito. Ang bilang na binabasa ng validator ay ang mismong bilang
 * na ipinapadala sa Gemini bilang `maxLength`. Hindi sila puwedeng maglayo.
 */

// Bawat isa ay nasa titik, at hindi binibilang ang bituin ng markup —
// hindi naman nakikita iyon sa larawan.
const LIMITS = {
  eyebrow:      { default: 34 },
  headline:     { question: 75, showcase: 65, default: 110 },
  body:         { showcase: 130, default: 175 },
  item:         { showcase: 22, default: 125 },

  // MATIGAS. Nakaupo ito sa kasangkapang nakapirmi ang laki: ang bilang sa
  // 252px at ang label sa loob ng pindutan. Walang auto-fit na makakasagip.
  statValue:    { default: 8, hard: true },
  ctaLabel:     { default: 18, hard: true },

  statLabel:    { default: 70 },
  compareTitle: { default: 26 },
  compareItem:  { default: 62 },
};

/** Ang hangganan ng isang field para sa isang variant. */
const limitFor = (field, variant) => {
  const row = LIMITS[field];
  if (!row) throw new Error(`Walang hangganan para sa ${field}`);
  return row[variant] != null ? row[variant] : row.default;
};

const isHard = field => !!(LIMITS[field] && LIMITS[field].hard);

/** Ang teksto na walang markup — iyon ang nakikita sa larawan. */
const plain = t => String(t == null ? '' : t).replace(/\*/g, '').trim();

module.exports = { LIMITS, limitFor, isHard, plain };
