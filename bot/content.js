/**
 * Anyaya Designs — ang utak ng araw-araw na post.
 *
 * Dating nasa loob ito ng n8n bilang Code node. Dito na ngayon: isang
 * karaniwang Node module na kayang patakbuhin at subukan kahit saan, walang
 * kailangang serbisyo. Ito ang buong dahilan kung bakit tayo lumipat.
 */

/* ------------------------------------------------------------------ */
/* Ang system prompt na nagpapasunod sa AI sa content system            */
/* ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You write social posts for ANYAYA DESIGNS, a small Filipino business.

WHAT WE SELL
- Live RSVP websites for weddings, debuts and milestone events. The guest count
  updates in real time. Meal preferences, venue map, countdown, message wall.
- Craft paper printed invitation cards, usually with a QR code linking to the RSVP page.
- Website: anyayadesigns.github.io/flow

WHO READS THIS
Filipinos planning a wedding, a debut, or a milestone event. Usually 25-40,
active on Facebook and Instagram, stressed by planning, watching their budget.

VOICE — read this twice
Write in ENGLISH. Plain, warm, specific. The way a thoughtful supplier writes
to a client, not the way a brand writes to a market.

You may use a Filipino word ONLY where a Filipino would actually say it in an
English sentence — ninong, ninang, po, kasi, talaga, sana. At most two per
caption, and only if the sentence would sound stiff without it.

NEVER write a full Tagalog sentence. NEVER use literary or deep Tagalog
(paanyaya, pagdiriwang, panauhin, hinihintay). If a line reads like it was
translated from Tagalog, rewrite it in plain English.

Short sentences. Concrete details, not adjectives. No exclamation marks.

BANNED
- Jargon: unlock, elevate, seamless, game-changer, revolutionize, curated,
  "In today's fast-paced world", "Are you looking for"
- More than 3 emoji in a caption
- Invented prices, promos, discounts or deadlines
- Invented testimonials, client names or customer stories
- Claims of being #1, best in the Philippines, award-winning, top-rated
- Outside statistics without a source. If you use a number, it must be clearly
  an example or an estimate, or about our own service.
- Any promise about delivery time or a specific number of days

CAPTION SHAPE — you are given ONE shape. Follow it exactly.
Do not fall back to hook-body-CTA unless the shape says so.

- cold_open   : Start inside a moment already happening, mid-scene. Two short
                paragraphs. Let the CTA sit as a plain last sentence, no build-up.
- one_breath  : A single paragraph, 45-70 words. The CTA lives inside it, not
                on its own line. No paragraph break at all.
- three_beats : Three short lines, each its own paragraph, like thoughts landing
                one after another. Then one closing line that turns.
- plain_answer: Open with the actual question a client asks, in their words
                and in quotes. Answer it plainly. Stop when it is answered.
- noticing    : State one specific thing you notice in this work. Then what it
                means for the reader. Two or three paragraphs, uneven lengths.

Total 60-140 words. No hashtags inside the caption; they go in their own field.

HOW TO NOT SOUND LIKE A MACHINE — this matters more than anything above
Use contractions. Let one sentence be a fragment. Do not make every paragraph
the same length; uneven is human. Prefer one concrete detail over three
adjectives. Leave one thing unresolved rather than tying a neat bow.

These constructions are BANNED. They are the clearest tells:
- "It's not X. It's Y." and every variation of that flip
- "Not just X, but Y" / "Not only X but also Y"
- Opening with a rhetorical question
- "Here's the thing" / "The truth is" / "Let's be honest" / "At the end of
  the day" / "That's where we come in" / "Imagine this"
- Three items in a row inside one sentence (the rule of three)
- A closing sentence that restates the opening
- More than one em-dash in the whole caption
- Any sentence that could open any other business's post

Write like one person typing to one person. Not like a brand addressing a market.

HASHTAGS
Pick 8-12: 3 broad (#WeddingPH #DebutPH #EventsPH #WeddingPlanning),
4-5 niche (#RSVPWebsite #DigitalInvitation #WeddingInvitation #CraftPaper
#InvitationCards #WeddingStationery), 2-3 local (#PhilippineWeddings
#PinoyWedding #ManilaWedding #WeddingSupplierPH), and always #AnyayaDesigns.

DESIGN VARIANTS — use the ONE you are given
- quote    : one strong statement. Needs headline (max 95 chars), body (max 150).
- tips     : numbered list. Needs headline, items (3-5, each 60-110 chars).
- stat     : one big figure. Needs statValue (max 8 chars), statLabel (max 60), body.
- compare  : two columns. Needs headline, compareLeftTitle, compareLeft (3-4),
             compareRightTitle, compareRight (3-4). Each item max 55 chars.
- question : a question to the audience. Needs headline (short, max 60), body.
- feature  : product spotlight on a dark sage background. Needs headline, items (3-4).
- cta      : an invitation to book. Needs headline, body, ctaLabel (max 18 chars).

MARKUP IN DESIGN TEXT
In headline and items you may wrap *one phrase* in asterisks for italic accent
colour, and **one phrase** in double asterisks for bold. Once or twice per
headline at most — it is emphasis, not decoration.
The eyebrow is 2-4 words, like a label ("The honest part", "RSVP checklist").

IMPORTANT: the DESIGN text must not repeat the caption almost word for word.
The design is the hook; the caption explains it.`;

const PILLARS = {
  1: { name: 'Pain / Problem',     variants: ['quote', 'compare'],  perWeek: 1, slot: 0 },
  2: { name: 'Educate / Tips',     variants: ['tips', 'stat'],      perWeek: 2, slot: 0 },
  3: { name: 'Product Showcase',   variants: ['feature'],           perWeek: 1, slot: 0 },
  4: { name: 'Objection Handling', variants: ['compare', 'quote'],  perWeek: 1, slot: 0 },
  5: { name: 'Engagement',         variants: ['question'],          perWeek: 1, slot: 0 },
  6: { name: 'Educate / Tips',     variants: ['tips'],              perWeek: 2, slot: 1 },
  0: { name: 'Offer / CTA',        variants: ['cta'],               perWeek: 1, slot: 0 },
};

const ANGLES = {
  'Pain / Problem': {
    rsvp: [
      'Group chat chaos — "who confirmed already?" asked for the fifth time',
      'A spreadsheet that never matches reality, with duplicates and gaps',
      'Over-ordering food because the headcount was a guess',
      'Not enough seats at the reception, in front of the ninongs',
      'Learning about dietary restrictions the week of the event',
      'No way to know how many are bringing a plus one',
      'Counting RSVPs by hand every night before bed',
      'The same venue and time questions, asked again and again in Messenger',
      'A rush fee from the caterer because the final count came late',
      'No record of who answered and who never did',
      'Following up with hundreds of guests one by one',
    ],
    craft: [
      'An invitation that arrives creased and stained from the mail',
      'Ordering exactly the guest count, then running short when families ask for extras',
      'A design that looked right on a screen and came out wrong on paper',
      'A name spelled wrong, found after a hundred cards were already printed',
      'Card stock so thin it curls the moment someone holds it',
      'An invitation that looks like every other template in the group chat',
      'Ink that smudges under a thumb on the day you hand them out',
      'Finding out too late that the envelope does not fit the card',
    ],
  },
  'Educate / Tips': {
    rsvp: [
      'What belongs on an RSVP form: name, guests, meal, contact',
      'How to keep a guest list from growing on its own',
      'Why three weeks before the event is the right RSVP deadline',
      'How to say adults-only without offending anyone',
      'Why meal preference belongs on the RSVP',
      'A planning timeline for six months out',
      'Turning RSVP data into a seating chart',
      'How long to wait before following up with people who never replied',
      'Splitting a guest list into an A-list and a B-list',
      'Why even close family needs a deadline',
      'Handling guests who bring someone unannounced',
      'How to read your numbers the week before the event',
      'What a "kindly reply by" line should actually say',
      'Where the RSVP link should live so nobody loses it',
      'What to do with the guests who reply after the deadline',
      'Tracking plus-ones without keeping a second list',
      'Getting a headcount your caterer will actually accept',
    ],
    craft: [
      'When to send invitations — six to eight weeks out',
      'How thick a card should be, and what gsm means in the hand',
      'Why craft paper takes some inks and refuses others',
      'How many extra invitations to print beyond the guest count',
      'Getting names and titles right before anything goes to print',
      'Where the QR code belongs on a card, and how small is too small',
      'Envelope sizes, and why the card is chosen first',
      'Save-the-date versus the formal invitation',
      'Wording for the principal sponsors on a Filipino invitation',
      'What to put on the back of the card, the side most people leave blank',
      'Why a proof should be checked on paper, never on a screen',
      'Deckled edges, embossing, foil — what each one actually adds',
      'How a debut invitation should differ from a wedding one',
      'Writing a dress code people will actually understand',
      'The invitation mistakes we see most often',
      'The detail most couples forget to put on the card',
    ],
  },
  'Product Showcase': {
    rsvp: [
      'A live guest counter you can check any time',
      'Mobile-first — it works on an old phone',
      'A colour palette matched to the event motif',
      'A message wall where guests leave their wishes',
      'A countdown to the day itself',
      'Venue map and directions, built in',
      'Meal preference tracking the caterer can use',
      'A guest list you can export',
      'A photo gallery on the RSVP page',
      'A password-protected page for a private event',
    ],
    craft: [
      'Craft paper texture under a thumb',
      'The QR code on a printed card that opens the RSVP page',
      'Vellum or twine as a wrap, and the events that suit it',
      'A monogram sized for the corner of a small card',
      'How sage and kraft look together in daylight',
      'Envelope, card, and insert as one set',
      'Deckled edges and what they do to the feel of the paper',
      'A card that stays on the refrigerator door for months',
    ],
  },
  'Objection Handling': {
    rsvp: [
      '"Is it expensive?" — set against the cost of over-catering',
      '"Can older guests manage it?" — a QR code and a very short form',
      '"What if a guest has poor signal?" — the printed card still stands',
      '"Is digital too impersonal?" — printed and digital work together',
      '"How does the process go, from booking to finished?"',
      '"Can it be edited later?" — yes, the page is live',
      '"What if the date changes?" — one update and everyone sees it',
      '"My guests are not tech people" — there is nothing to download',
      '"My event is small" — there is a setup for that',
    ],
    craft: [
      '"Is printing priced clearly?" — settled before you book',
      '"I already have a designer" — we can print from their file',
      '"Can I hold one before the whole run is printed?"',
      '"What if I need more copies later?"',
      '"Is craft paper too plain for a formal wedding?"',
      '"Can you print a colour that matches my motif?"',
      '"I want something physical" — this is exactly that',
      '"Do the cards have to match the website?"',
    ],
  },
  'Engagement': {
    rsvp: [
      'How many are on your guest list right now? Comment the number',
      'The particular pain of someone who said yes and never came',
      'What is your event motif? Sage green?',
      'Tag your partner if you have started planning',
      'What is the most stressful part of planning for you right now?',
      'Is a debut or a wedding next for you?',
      'How many months until your event?',
      'What is the first song at your reception?',
      'That face when the caterer says the final count is due',
    ],
    craft: [
      'Team printed invitation or team digital?',
      'Gold, sage, or craft brown — which one is yours?',
      'The most memorable invitation you have ever received',
      'Do you still keep an invitation from a wedding you attended?',
      'Smooth paper or textured — which one do you reach for?',
      'How many invitations are you printing?',
      'Show us your motif and we will guess your paper',
      'Handwritten names on the envelope, or printed?',
    ],
  },
  'Offer / CTA': {
    rsvp: [
      'There are still slots open this month',
      'A free preview of the RSVP site before you decide',
      'Now booking events for next month',
      'Send your event date and we will answer the same day',
      'See a sample RSVP site at the link',
      'A setup that suits about a hundred guests',
      'Rush service when the event is close',
      'Know someone getting married? Send them this',
      'A custom quote within a day',
    ],
    craft: [
      'Message us for a sample of the craft card',
      'Printed craft cards and the RSVP website together',
      'Send your motif and we will show you paper that suits it',
      'A card and envelope set for about a hundred guests',
      'Bring the file from your designer, we will handle the printing',
      'Peak season for printing — book while it is early',
      'A custom quote on printing within a day',
      'See and hold the paper before you commit',
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Pumili ng laman para sa isang araw                                   */
/* ------------------------------------------------------------------ */

const ALL_VARIANTS = ['quote', 'tips', 'stat', 'compare', 'question', 'feature', 'cta'];
const SHAPES = ['cold_open', 'one_breath', 'three_beats', 'plain_answer', 'noticing'];
const PAPERS = ['cream', 'kraft', 'chalk'];
const TZ = 'Asia/Manila';

/**
 * Deterministic — pareho ang lalabas sa parehong petsa, saanman patakbuhin.
 * Iyon ang dahilan kung bakit kayang subukan ito nang walang AI.
 */
function pick(when = new Date(), variation = 0) {
  const now = new Date(when.toLocaleString('en-US', { timeZone: TZ }));
  const dow = now.getDay();                       // 0 = Linggo
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now - start) / 604800000);
  const dayOfYear = Math.floor((now - start) / 86400000);

  const pillar = PILLARS[dow];

  // Dalawa ang serbisyo. Naghahalinhinan sila kada araw. Pito ang araw sa
  // isang linggo — gansal — kaya bumabaligtad kada linggo: ang Lunes na RSVP
  // ngayon ay craft na sa susunod.
  const subject = dayOfYear % 2 === 0 ? 'rsvp' : 'craft';
  const pool = ANGLES[pillar.name][subject];

  // Kada ikalawang linggo lumalabas ang parehong pares na (pillar, subject).
  // Ang slot ang pumipigil sa Martes at Sabado na magkapareho ng angle.
  const idx = Math.floor(week / 2) * pillar.perWeek + pillar.slot;

  // `variation` ay para sa "skip and generate". Zero ang normal na araw.
  // Inuusog nito ang angle, ang disenyo, ang hugis, at ang papel — kaya
  // tunay na ibang post ang lalabas, hindi lang ibang pagkakasulat ng
  // parehong bagay. Ang pillar ang natitira: iyon ang layunin ng araw.
  const v = Math.max(0, Math.floor(variation) || 0);

  const angle = pool[(idx + v) % pool.length];

  // Ang normal na araw ay sumusunod sa disenyong itinakda para sa pillar.
  // Ang pang-ulit ay lumalabas doon at kumukuha sa buong pitong disenyo —
  // kung hindi, dalawa lang ang paikot-ikot at pareho ang itsura ng v1 at v3.
  const occurrence = week * pillar.perWeek + pillar.slot;
  const first = pillar.variants[occurrence % pillar.variants.length];
  const variant = v === 0
    ? first
    : ALL_VARIANTS[(ALL_VARIANTS.indexOf(first) + v) % ALL_VARIANTS.length];

  // Umiikot nang hiwalay sa isa't isa: 7 araw x 5 hugis x 3 papel x 2 serbisyo.
  const shape = SHAPES[(dayOfYear + v) % SHAPES.length];
  const paper = PAPERS[(dayOfYear + v) % PAPERS.length];

  const pad = n => String(n).padStart(2, '0');
  const slug = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Ang base ay ang pangalan ng file. Ang unang subok ay ang petsa lang;
  // ang pang-ulit ay may -v2, -v3 — para hindi mabura ang naunang larawan
  // at manatiling tama ang mga lumang issue.
  const base = v === 0 ? slug : `${slug}-v${v + 1}`;

  return { pillar: pillar.name, subject, angle, variant, shape, paper,
           slug, base, variation: v, week, dow, dayOfYear };
}

/* ------------------------------------------------------------------ */
/* Ang request papuntang Gemini                                         */
/* ------------------------------------------------------------------ */

function geminiBody(p) {
  const focus = p.subject === 'craft'
    ? 'the PRINTED CRAFT INVITATION CARDS. Write about paper, ink, and the object in a hand. Mention the RSVP website once at most, and only if the angle asks for it.'
    : 'the LIVE RSVP WEBSITE. Mention the printed cards once at most, and only if the angle asks for it.';

  return {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text:
      'Content pillar for today: ' + p.pillar +
      '\nService in focus today: ' + focus +
      '\nAngle to follow: ' + p.angle +
      '\nDesign variant to use: ' + p.variant +
      '\nCaption shape to use: ' + p.shape +
      '\n\nWrite one post. Use exactly the variant and the caption shape given. ' +
      'Do not substitute either.' }] }],
    generationConfig: {
      temperature: 1.0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          variant:           { type: 'STRING' },
          eyebrow:           { type: 'STRING' },
          headline:          { type: 'STRING' },
          body:              { type: 'STRING' },
          items:             { type: 'ARRAY', items: { type: 'STRING' } },
          statValue:         { type: 'STRING' },
          statLabel:         { type: 'STRING' },
          compareLeftTitle:  { type: 'STRING' },
          compareLeft:       { type: 'ARRAY', items: { type: 'STRING' } },
          compareRightTitle: { type: 'STRING' },
          compareRight:      { type: 'ARRAY', items: { type: 'STRING' } },
          ctaLabel:          { type: 'STRING' },
          caption:           { type: 'STRING' },
          hashtags:          { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['variant', 'headline', 'caption', 'hashtags'],
      },
    },
  };
}

module.exports = { SYSTEM_PROMPT, PILLARS, ANGLES, ALL_VARIANTS, SHAPES, PAPERS, pick, geminiBody };
