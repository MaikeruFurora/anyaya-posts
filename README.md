# Anyaya Designs — Daily Post Automation

Isang post kada araw sa Facebook at Instagram. AI ang sumusulat, may branded
na design na may logo mo, at ikaw lang ang mag-a-approve sa email. Libre lahat.

Basahin muna ang **`setup-guide.html`** kung may kailangan kang balikan.

---

## Ano ang ilalagay sa GitHub repo (`anyaya-posts`)

```
.github/workflows/
  render-post.yml      ← gumagawa ng larawan. Kusang hinahanap kung nasa
                         root o nasa render/ ang mga file.
  daily-trigger.yml    ← alarm clock. Ginigising ang n8n tuwing 6 AM.

render/
  render.js            ← JSON → JPEG (1080×1350). Puppeteer.
  template.html        ← LAHAT ng disenyo. May naka-embed na logo.
  fonts.css            ← Cormorant Garamond + Jost, base64. Walang network call.
  package.json
  package-lock.json    ← kailangan ng npm ci. Wag burahin.
  build-fonts.js       ← pang-palit ng typeface (bihira)
  samples.js           ← npm run samples → preview ng 7 variants

docs/posts/
  .gitkeep             ← dito mapupunta ang mga larawan
```

## Para sa iyo lang — huwag i-upload

```
n8n/
  anyaya-daily-post.json  ← i-import ito sa n8n
  build-workflow.js       ← dito i-edit ang prompt at ang 78 na angle
  test-logic.js           ← pinapatakbo ang lahat nang wala ang n8n

content/content-system.md ← ang 6 pillars at ang buong sistema
logo/                     ← original, monogram, at maputing bersyon
samples/                  ← preview ng pitong disenyo
setup-guide.html          ← ang runbook
```

---

## Mabilisang test

```bash
cd render && npm install && npm run samples
```

Pag may binago ka sa prompt o sa angles:

```bash
node n8n/build-workflow.js   # bubuo ulit ng workflow JSON
node n8n/test-logic.js       # 22 na test — dapat lahat ✓
```

---

## Paano gumagana

```
6:00 AM   GitHub Actions cron
            ↓ tinatawag ang n8n webhook (may lihim)
          n8n: pumipili ng pillar, angle, at caption shape para sa araw
            ↓
          Gemini: sumusulat ng caption at ng teksto sa disenyo
            ↓
          Validator: 11 guardrail. Kung may tumama, huminto.
            ↓
          GitHub Actions: HTML → JPEG → commit → GitHub Pages
            ↓
          Email sa iyo na may larawan at caption
            ↓ pinindot mo ang I-post na
          Facebook + Instagram
```

---

## Ang mga desisyon at bakit

**Bakit GitHub ang nagre-render, hindi ang n8n?**
Hindi tumatanggap ng file upload ang Instagram API — public URL lang. Kailangan
ng larawan ng bahay na may address. Libre ang GitHub Actions sa public repo, at
agad nagiging URL ang na-commit na file sa Pages.

**Bakit webhook, hindi cron sa loob ng n8n?**
Natutulog ang Render pag 15 minutong walang trapiko. Ang GitHub ang orasan —
libre, hindi natutulog, at ang tawag nito ang gumigising sa Render.

**Bakit naka-embed ang fonts at ang logo?**
Kung sa internet kukunin, may araw na mabibigo ang network at tahimik na
mag-iiba ang itsura ng post mo. Naka-base64 lahat, kaya pareho ang labas
saanman ito tumakbo.

**Bakit English ang prompt?**
Ginagaya ng modelo ang wika ng tagubilin. Noong Tagalog ang nakasulat sa prompt,
malalim at corny ang lumalabas kahit sinabing Taglish. Ngayon English ang
tagubilin, at English na may kaunting Filipino ang output.

**Bakit may limang caption shape?**
Hindi ang mga salita ang nagbibigay ng AI na dating — ang paulit-ulit na hugis.
Umiikot ang lima kada araw, at pito ang araw, kaya 35 araw bago maulit ang
parehong kombinasyon.

**Bakit may guardrails?**
Kayang mag-imbento ng AI ng presyo, testimonial, at istatistika nang buong
kumpiyansa. Labing-isang tseke ang tumatakbo bago pa umabot sa email mo —
kasama ang mga halatang tatak ng AI tulad ng "It's not X. It's Y."
