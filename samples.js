#!/usr/bin/env node
/** Renders one sample of every variant into ./samples/ — para makita mo ang itsura. */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const samples = {
  quote: {
    variant: 'quote',
    eyebrow: 'Ang totoo lang',
    headline: 'Hindi mo kailangan ng *mas maraming* group chat. Kailangan mo ng **isang sagot**.',
    body: 'Tuwing gabi, binibilang mo ulit kung sino na ang nag-confirm. Kinabukasan, may nagbago na naman.',
  },
  tips: {
    variant: 'tips',
    eyebrow: 'RSVP checklist',
    headline: 'Apat na bagay na dapat nasa RSVP form mo',
    items: [
      '**Pangalan at bilang ng kasama** — para eksakto ang headcount, hindi hula.',
      '**Meal preference** — mahalaga ito sa caterer at sa may allergy.',
      '**Deadline na malinaw** — tatlong linggo bago ang event, hindi mas huli.',
      '**Contact number** — para may mahahabol ka kung may biglaang pagbabago.',
    ],
  },
  stat: {
    variant: 'stat',
    eyebrow: 'Bakit mahalaga ang headcount',
    stat: { value: '1 in 5', label: 'na *na-confirm* na bisita ay hindi dumadalo' },
    body: 'Kaya ang live na RSVP na may deadline at reminder ay mas mura kaysa sa sobrang pagkain.',
  },
  compare: {
    variant: 'compare',
    eyebrow: 'Dati kumpara ngayon',
    headline: 'Group chat RSVP o live RSVP website?',
    compare: {
      leftTitle: 'Group chat',
      left: [
        'Nalulunod ang sagot sa daan-daang mensahe',
        'Manu-manong tally tuwing gabi',
        'Walang record ng meal preference',
        'Paulit-ulit na tanong tungkol sa venue',
      ],
      rightTitle: 'Anyaya RSVP',
      right: [
        'Isang link, isang malinis na listahan',
        'Live ang bilang — real time',
        'Meal at allergy naka-tala na',
        'Venue, map, at oras nasa page',
      ],
    },
  },
  question: {
    variant: 'question',
    eyebrow: 'Sagutin mo nga',
    headline: 'Ilan ang nasa guest list mo ngayon?',
    body: 'Comment lang ng number. Sasabihin namin kung anong RSVP setup ang bagay sa laki na iyan.',
  },
  feature: {
    variant: 'feature',
    eyebrow: 'Nasa loob ng RSVP site mo',
    headline: 'Hindi lang *form*. Isang buong **event page**.',
    items: [
      '**Live guest counter** na nakikita mo anumang oras',
      '**Venue map at direksyon** — tapos na ang paulit-ulit na tanong',
      '**Countdown timer** hanggang sa araw ng event',
      '**Message wall** kung saan nag-iiwan ng bati ang bisita',
    ],
  },
  cta: {
    variant: 'cta',
    eyebrow: 'Bukas na ang booking',
    headline: 'Ipadala mo lang ang *petsa* ng event mo.',
    body: 'Sasagutin ka namin sa loob ng isang araw, kasama na ang sample ng RSVP site at kraft card.',
    cta: 'Message us',
    seal: { top: 'Ready', bottom: 'In days' },
  },
};

const outDir = path.join(__dirname, 'samples');
fs.mkdirSync(outDir, { recursive: true });

for (const [name, data] of Object.entries(samples)) {
  const tmp = path.join(outDir, `${name}.json`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  execFileSync('node', [
    path.join(__dirname, 'render.js'),
    '--in', tmp,
    '--out', path.join(outDir, `${name}.jpg`),
  ], { stdio: 'inherit' });
}
console.log(`\nTapos. Nasa ${outDir}`);
