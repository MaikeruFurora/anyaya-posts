#!/usr/bin/env node
/**
 * Ang katawan ng GitHub Issue na siyang magiging approval screen.
 * Ito rin ang eksaktong makikita mo sa email na ipapadala ng GitHub.
 *
 *   node bot/issue-body.js --post /tmp/post/post.json --image-url https://…jpg
 */
const fs = require('fs');
const arg = (f, d) => { const i = process.argv.indexOf(f); return i > -1 && process.argv[i+1] ? process.argv[i+1] : d; };

const post = JSON.parse(fs.readFileSync(arg('--post', '/tmp/post/post.json'), 'utf8'));
const img = arg('--image-url');

const SERBISYO = { rsvp: 'RSVP website', craft: 'Craft invitation cards' };

// Blockquote — kaya nitong hawakan ang maraming parapo nang hindi nasisira,
// at ganito rin ang itsura sa email ng GitHub.
const quoted = post.caption.split('\n').map(l => '> ' + l).join('\n');

// Kapag sample, ang babala ang unang bagay na makikita — sa issue at sa
// email. Dating walang pinagkaiba ang itsura ng sample at ng totoo.
const warn = post.dry ? [
  '> [!CAUTION]',
  '> **SAMPLE lang ito — huwag i-post.**',
  '>',
  '> Ginawa ito na may naka-check na `dry`, kaya halimbawang teksto ang laman.',
  '> Hindi ito tinawagan sa Gemini at walang kinalaman sa negosyo mo.',
  '>',
  '> Kahit mag-comment ka ng `post`, tatanggi ang publisher. I-`skip` mo na lang',
  '> ito, tapos patakbuhin ulit nang **walang** `dry`.',
  '', '',
].join('\n') : '';

process.stdout.write(`${warn}![post](${img})

${quoted}

---

| | |
|---|---|
| **Araw** | ${post.slug}${post.variation ? ` — ulit #${post.variation + 1}` : ''} |
| **Serbisyo** | ${SERBISYO[post.subject] || post.subject} |
| **Pillar** | ${post.pillar} |
| **Angle** | ${post.angle} |
| **Disenyo** | \`${post.variant}\` sa \`${post.paper}\` na papel |
| **Hugis ng caption** | \`${post.shape}\` |

---

### Ano ang gagawin mo

Mag-comment ng isa sa mga ito:

| I-comment | Mangyayari |
|---|---|
| \`post\` | Ilalabas sa Facebook at Instagram |
| \`posted\` | Ikaw mismo ang nag-post — isasara lang ang issue |
| \`skip and generate\` | Gagawa ng **bagong** post ngayong araw — ibang angle, ibang disenyo, ibang papel |
| \`skip\` | Laktawan ang araw na ito |

Kung wala kang gagawin, mananatili itong bukas at walang mapo-post.

<details><summary>Ang caption, para kopyahin</summary>

\`\`\`
${post.caption}
\`\`\`

</details>
`);
