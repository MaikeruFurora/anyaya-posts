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
          Nag-comment ka ng "post"
            ↓
          "Publish post" — Facebook + Instagram
```

Wala ni isang hakbang na nangangailangan ng serverong gising.

---

## Ang mga file

```
.github/workflows/
  daily-post.yml     ← 6 AM. Sumusulat, nagre-render, nagbubukas ng issue.
  publish-post.yml   ← Tumatakbo kapag nag-comment ka. Nagpo-post.

bot/
  content.js         ← 6 pillars, 121 angles, ang system prompt. DITO mag-edit.
  validate.js        ← ang 11 guardrails
  generate.js        ← pick → Gemini → validate → design.json
  publish.js         ← Facebook at Instagram
  issue-body.js      ← ang itsura ng approval issue
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
node bot/test.js
```

35 na test. Dapat lahat ✓ bago mag-push.

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

**Bakit deterministic ang pagpili?**
Dahil kayang subukan ang deterministic na sistema. Alam natin kung ano ang
lalabas sa Setyembre 14 nang hindi hinihintay ang Setyembre 14 — at alam
nating hindi ito mauulit sa loob ng 105 araw.
