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

process.stdout.write(`![post](${img})

${quoted}

---

| | |
|---|---|
| **Araw** | ${post.slug} |
| **Serbisyo** | ${SERBISYO[post.subject] || post.subject} |
| **Pillar** | ${post.pillar} |
| **Angle** | ${post.angle} |
| **Disenyo** | \`${post.variant}\` sa \`${post.paper}\` na papel |
| **Hugis ng caption** | \`${post.shape}\` |

---

### Ano ang gagawin mo

Mag-comment ng isang salita sa ibaba:

- **\`post\`** — ilalabas ito sa Facebook at Instagram
- **\`skip\`** — laktawan ang araw na ito

Kung wala kang gagawin, mananatili itong bukas at walang mapo-post.

<details><summary>Ang caption, para kopyahin</summary>

\`\`\`
${post.caption}
\`\`\`

</details>
`);
