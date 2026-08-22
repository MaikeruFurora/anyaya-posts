# Anyaya Designs — Daily Post Automation

Isang post kada araw sa Facebook at Instagram. AI ang sumusulat, may branded na
design, ikaw lang mag-a-approve sa email. Libre lahat.

Basahin muna yung **`setup-guide.html`** — nandoon yung buong step-by-step.

---

## Ano yung laman

### Papunta sa GitHub repo mo (`anyaya-posts`)

```
render.js            ← JSON → JPEG (1080×1350). Puppeteer.
template.html        ← lahat ng design (7 variants). Dito mo palitan yung itsura.
fonts.css            ← naka-embed na Cormorant Garamond + Jost. Walang network call.
package.json
package-lock.json
build-fonts.js       ← gumagawa ulit ng fonts.css pag magpapalit ka ng typeface
samples.js           ← npm run samples → isang sample ng bawat variant

.github/workflows/
  render-post.yml    ← tinatawag ng n8n. Nagre-render, nagko-commit, nagho-host.
  daily-trigger.yml  ← yung alarm clock. Gigising sa n8n ng 6 AM.

docs/posts/          ← dito mapupunta yung mga image. GitHub Pages ang nagho-host.
```

### Para sayo lang, hindi kailangang i-upload

```
n8n/
  anyaya-daily-post.json  ← i-import ito sa n8n
  build-workflow.js       ← gumagawa ng JSON sa taas (dito mo i-edit ang angles/prompt)
  test-logic.js           ← pinapatakbo ang buong logic nang wala ang n8n

content/content-system.md ← yung 6 pillars, 56 angles, caption formula, guardrails
setup-guide.html          ← yung runbook
samples/                  ← preview ng pitong variant
```

---

## Mabilisang test sa makina mo

```bash
npm install
npm run samples          # nagre-render ng 7 sample sa samples/
```

Isang post lang:

```bash
echo '{"variant":"quote","eyebrow":"Ang totoo lang",
       "headline":"Hindi mo kailangan ng *mas maraming* group chat.",
       "body":"Kailangan mo ng isang lugar kung saan nakatala lahat ng sagot."}' \
  | node render.js --out test.jpg
```

## Pag may binago ka

```bash
node n8n/build-workflow.js   # gagawa ulit ng workflow JSON
node n8n/test-logic.js       # tinetest ang rotation, guardrails, at 7 variants
```

Dapat lahat ✓ bago mo i-import ulit sa n8n.

---

## Mga desisyon at bakit

**Bakit GitHub yung nagre-render, hindi yung n8n?**
Hindi tumatanggap ng file upload yung Instagram Content Publishing API — public
URL lang kinukuha nito. Kailangan ng image ng bahay na may address. Libre yung
GitHub Actions sa public repo, at agad nagiging URL yung na-commit na file sa
GitHub Pages — kaya isang step lang ang render at hosting.

**Bakit webhook yung trigger, hindi cron?**
Natutulog yung Render pag 15 minutong walang traffic, kaya hindi maaasahan yung
cron sa loob ng n8n. Ang GitHub Actions ang orasan — libre, hindi natutulog, at
yung pagtawag nito ang gumigising sa Render.

**Bakit naka-embed yung fonts?**
Kung sa Google Fonts kukunin, may araw na babagal o mabibigo yung network at
tahimik na mag-iiba yung typeface ng post mo. Naka-base64 yung fonts sa
`fonts.css`, kaya parehas yung output sa GitHub Actions, sa laptop mo, at sa
server — habambuhay.

**Bakit may guardrails sa validator?**
Kayang mag-imbento ng AI ng presyo, testimonial, at statistics nang buong
kumpiyansa. Yung `I-validate at hugisin` node ay pumapalya nang malakas pag may
nakita nitong ganoon, kaya hindi ito nakakarating sa email mo — lalo na sa Page mo.

**Bakit hindi na lang isang malaking prompt?**
Kasi mauubusan ng sasabihin yung AI at magiging paulit-ulit. Yung araw ng linggo
ang pumipili ng pillar, tapos yung linggo ng taon ang pumipili ng angle mula sa
56 na nakasulat na. Deterministic ito — alam mo kung ano ang lalabas at kailan,
at kaya mong palitan kahit alin.
