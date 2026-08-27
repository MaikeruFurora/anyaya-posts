# Anyaya Designs — araw-araw na post

Isang post kada araw sa Facebook at Instagram. Sinusulat ng AI, may branded na
disenyo, at ikaw lang ang mag-a-approve. **Ang GitHub lang ang tumatakbo.**

Walang server. Walang database. Walang bayad.

---

## Paano gumagana

```
6:00 AM   GitHub Actions — "Daily post"
            ↓ pumipili ng pillar, serbisyo, angle, disenyo, papel, hugis
          Gemini — sumusulat ng caption at ng teksto sa disenyo
            ↓
          11 guardrails — kung may tumama, huminto. Walang post.
            ↓
          Puppeteer — HTML → JPEG 1080×1350 → commit sa docs/posts/
            ↓
          GitHub Issue — may larawan at caption, naka-assign sa iyo
            ↓ mag-e-email sa iyo ang GitHub
          Nag-comment ka ng "post", "skip and generate", o "skip"
            ↓
          "Publish post" — Facebook + Instagram
```

## Ang tatlong sagot mo

| I-comment | Mangyayari |
|---|---|
| `post` | Ilalabas sa Facebook at Instagram, tapos isasara ang issue. |
| `skip and generate` | Isasara ang luma at gagawa ng **bago** ngayong araw — ibang angle, ibang disenyo, ibang papel. Parehong pillar pa rin. |
| `skip` | Laktawan ang araw. |

Tinatanggap din: `approve`, `oo`, `sige` · `ulit`, `iba naman`, `generate` ·
`huwag`, `hindi`, `no`. Hindi mahalaga ang laki ng letra.

Ang pang-ulit ay nagiging `2026-08-27-v2.jpg` — hindi nabubura ang nauna.

Wala ni isang hakbang na nangangailangan ng serverong gising.

---

## Ang mga file

```
.github/workflows/
  daily-post.yml     ← 6 AM. Ang orasan lang.
  make-post.yml      ← Ang totoong paggawa. Ginagamit ng dalawa.
  showcase-post.yml  ← Ikaw ang nagpapatakbo. Totoong gawa.
  publish-post.yml   ← Ang sagot mo: post / skip and generate / skip.

bot/
  content.js         ← 6 pillars, 121 angles, ang system prompt. DITO mag-edit.
  showcase.js        ← totoong gawa: larawan mo + maikling kuwento → post
  validate.js        ← ang 11 guardrails
  generate.js        ← pick → Gemini → validate → design.json
  publish.js         ← Facebook at Instagram
  issue-body.js      ← ang itsura ng approval issue
  route.sh          ← binabasa ang comment mo: post / skip and generate / skip
  route.test.sh     ← 26 na kaso para diyan
  test.js            ← lahat, nasusubok nang walang AI at walang internet

render/
  render.js          ← JSON → JPEG. Puppeteer.
  template.html      ← LAHAT ng disenyo. May naka-embed na logo at 3 papel.
  fonts.css          ← Cormorant Garamond + Jost, base64. Walang network call.
  package.json  package-lock.json

docs/posts/          ← dito napupunta ang mga larawan at caption
```

---

## Setup

### 1. Settings → Secrets and variables → Actions → **Secrets**

| Secret | Saan galing |
|---|---|
| `GEMINI_API_KEY` | aistudio.google.com |
| `FB_PAGE_TOKEN` | ang page token na hindi nag-e-expire |
| `FB_PAGE_ID` | 1185505437979748 |
| `IG_USER_ID` | 17841410383099740 |

### 2. Settings → Secrets and variables → Actions → **Variables**

| Variable | Halaga |
|---|---|
| `FB_API_VERSION` | `v26.0` |
| `GEMINI_MODEL` | `gemini-3.6-flash` *(opsyonal — para madaling palitan kapag naretiro)* |

### 3. Settings → Pages

Source: **Deploy from a branch** → `main` → folder `/docs`

Kailangan ito. Public URL ang hinihingi ng Instagram — hindi ito tumatanggap
ng file upload.

### 4. Settings → Actions → General → Workflow permissions

**Read and write permissions.** Kailangan para makapag-commit ng larawan at
makapagbukas ng issue.

---

## Subukan bago hintayin ang umaga

Actions → **Daily post** → Run workflow → lagyan ng check ang `dry`.

Hindi nito tatawagan ang Gemini — halimbawang teksto ang gagamitin, pero
tototohanin ang lahat: ang pagpili, ang pag-render, ang GitHub Pages, at ang
pagbukas ng issue. Kung may sablay sa setup, dito ito lalabas.

Kapag ayos na, patakbuhin ulit nang walang `dry`.

---

## Kapag may binago ka sa laman

```bash
cd render && npm ci && cd ..
node bot/test.js        # 50 na test
./bot/route.test.sh     # 26 na kaso ng utos
```

Dapat lahat ✓ bago mag-push.

---

## Showcase — totoong gawa

Hindi ito bahagi ng araw-araw na ikot. Walang AI na makakaimbento ng totoong
trabaho, kaya ikaw ang nagbibigay ng larawan at ng maikling kuwento.

1. Ilagay ang larawan sa `assets/showcase/` at i-commit
2. **Actions → Showcase post → Run workflow**
3. `images`: `assets/showcase/hero.png,assets/showcase/countdown.png`
   (hanggang tatlo — ang **una** ang mapupunta sa gitna)
4. `brief`: ano ang nasa larawan, sa sarili mong salita
5. `paper`: cream, kraft, o chalk

Bubuksan nito ang parehong approval issue. Mag-comment ng `post` o `skip`.
Kung ayaw mo sa pagkakasulat, patakbuhin ulit na may parehong `images` at
taasan ang `variation`.

**Bago ka kumuha ng screenshot: gawin mo sa incognito window.** Kapag naka-sign
in ka sa Google, lumalabas ang email mo sa mga naka-embed na Google Form.
Nahuli namin ito minsan sa RSVP section ng isang kliyente — nasa Facebook na
sana ang email kung hindi napansin. Nasa `assets/showcase/README.md` ang buong
listahan ng dapat tingnan.

---

## Ang mga desisyon at bakit

**Bakit GitHub Actions, hindi n8n?**
Sa unang limang araw, apat sa anim na pagkabigo ay may kinalaman sa n8n o sa
serverong pinagpapatakbuhan nito: hindi kayang basahin ng parser ang malaking
expression, napatay ang logging sa settings nito, hinaharangan ng Render ang
SMTP, at dalawang beses naubusan ng memory ang 512 MB na instance. Ang GitHub
Actions ay may 7 GB, hindi natutulog, at libre sa public repo.

**Bakit issue ang approval, hindi email?**
Kailangan ng email approval ng serverong nakikinig sa pindot mo. Iyon ang
huling bagay na nangangailangan ng gising na makina. Ang issue ay nasa GitHub
na — mag-e-email pa rin ito sa iyo na may larawan, at ang sagot mo ay isang
salita mula sa cellphone.

**Bakit naka-embed ang fonts at ang logo?**
Kung sa internet kukunin, may araw na mabibigo ang network at tahimik na
mag-iiba ang itsura ng post mo. Naka-base64 lahat.

**Bakit may guardrails?**
Kayang mag-imbento ng AI ng presyo, testimonial, at istatistika nang buong
kumpiyansa. Mas mabuti nang walang post ngayong araw kaysa sa isang post na
nagsisinungaling para sa negosyo mo.

**Bakit hiwalay ang showcase sa araw-araw?**
Ang araw-araw ay may 121 angle na kayang magpatakbo ng sarili nito magpakailanman.
Ang showcase ay nangangailangan ng bagay na wala ang makina: isang bagay na
totoong ginawa mo. Kung isinama natin ito sa ikot, mauubusan ito at
mag-iimbento — at iyon mismo ang pinakamasamang pwedeng mangyari sa isang post
na ang buong halaga ay ang pagiging totoo.

**Bakit deterministic ang pagpili?**
Dahil kayang subukan ang deterministic na sistema. Alam natin kung ano ang
lalabas sa Setyembre 14 nang hindi hinihintay ang Setyembre 14 — at alam
nating hindi ito mauulit sa loob ng 105 araw.
