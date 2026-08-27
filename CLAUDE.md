# Anyaya Designs — araw-araw na post

Basahin ito bago gumalaw. Ito ang naipong konteksto ng proyekto: kung ano ang
gumagana, kung ano ang huwag galawin, at kung anong mga bitag ang nasagasaan
na namin. Ang bawat babala rito ay galing sa isang bagay na tunay na nasira.

---

## Ano ito

Isang post kada araw sa Facebook at Instagram para sa **Anyaya Designs** —
isang maliit na negosyong Pilipino na gumagawa ng **live RSVP websites** at
**craft printed invitation cards**.

Sinusulat ng AI, may branded na disenyo, at ang may-ari ang nag-a-approve.
**GitHub Actions lang ang tumatakbo** — walang server, walang database.

- Repo: `anyaya-posts` (public) · Pages mula sa `/docs`
- Website: anyayadesigns.github.io/flow
- Runbook: https://claude.ai/code/artifact/43cd4bc5-f566-4f5a-848a-01056954763a

---

## Ang mapa

```
.github/workflows/
  daily-post.yml      Tatlong alarma (6:00, 7:15, 8:45 AM Maynila). Orasan lang.
  make-post.yml       Ang totoong paggawa. Tinatawag ng daily-post at ng regen.
  showcase-post.yml   Manu-mano. Totoong gawa: screenshot o litrato ng card.
  publish-post.yml    Ang sagot mo sa issue: post / posted / skip and generate / skip

bot/
  content.js          6 pillar, 121 angle, ang system prompt. DITO ang laman.
  validate.js         11 guardrail. Nagtatapon ng error — sinasadya iyon.
  generate.js         pick → Gemini → validate → design.json
  showcase.js         larawan mo + maikling kuwento → post
  publish.js          Facebook + Instagram. NAKATULOG — tingnan ang "Meta" sa baba.
  issue-body.js       ang itsura ng approval issue
  index-posts.js      gumagawa ng docs/posts/index.json para sa dashboard
  route.sh            binabasa ang comment sa issue
  route.test.sh       39 na kaso para diyan
  test.js             70 test — walang AI, walang internet

render/
  render.js           JSON → JPEG 1080x1350. Puppeteer.
  template.html       LAHAT ng disenyo. 8 variant, 3 papel, 3 frame, naka-embed na logo.
  fonts.css           Cormorant Garamond + Jost, base64.

docs/
  admin.html          dashboard: download larawan, copy caption, tickmark
  privacy.html        para sa Meta app review
  posts/              ang mga nagawang larawan, caption, at index.json

assets/showcase/      dito inilalagay ang litrato at screenshot
```

---

## Bago mag-push, palagi

```bash
cd render && npm ci && cd ..
node bot/test.js        # 70 test
bash bot/route.test.sh  # 39 kaso
```

Hindi ito palamuti. Lahat ng nasa ibaba ay nahuli ng test na ito matapos
masira sa produksyon. Kapag may binago ka, patakbuhin ito.

---

## Mga bitag na nasagasaan na — huwag ulitin

**Huwag umasa sa executable bit.**
`bash bot/route.sh`, hindi `bot/route.sh`. Nawawala ang bit kapag dumaan ang
file sa zip at Windows, at ang lumalabas ay `exit code 126` — walang sinasabi
tungkol sa dahilan. May test na naghahanap ng tawag sa `.sh` na walang `bash`.

**Ang `--dry` ay hindi dapat makalabas.**
Isang sample na post ang nailabas sa totoong Facebook page noong Agosto 27.
Tatlong harang ngayon: marka sa pamagat, babala sa issue, at tumatanggi ang
`publish.js` kapag `post.dry === true`. Huwag alisin ang alinman.

**Isang alarma ay hindi sapat.**
Sa public repo, ang scheduled workflow ng GitHub ay nahuhuli nang ilang oras
at minsan hindi na tumatakbo. Tatlong cron ngayon, at may guard sa
`make-post.yml` laban sa dobleng post (`docs/posts/<petsa>.json`).

**Huwag ilagay ang logic sa loob ng YAML.**
Hindi masusubok ang nakabaon sa workflow. Kaya nasa `bot/route.sh` ang pagbasa
ng comment — may 39 na kaso doon.

**English ang prompt, English ang output.**
Ginagaya ng modelo ang wika ng tagubilin. Noong Tagalog ang prompt, corny at
malalim ang lumalabas. English na ngayon ang tagubilin; English na may kaunting
Filipino ang output. Huwag itong ibalik sa Tagalog.

**Hindi kailanman ipinapasa ang caption sa `innerHTML`.**
Galing sa AI iyon. `textContent` lang. Tingnan ang `docs/admin.html`.

---

## Ang privacy ng kliyente — hindi ito opsyonal

Ang mga screenshot at litrato ay may lamang totoong tao.

- **Kumuha ng screenshot sa incognito.** Kapag naka-sign in ka sa Google,
  lumalabas ang email mo sa mga naka-embed na Google Form. Muntik na itong
  makalabas sa Facebook.
- **Bawal ang listahan ng entourage, mass offerors, at anumang pangalan ng
  ibang tao.** Gamitin ang `blur_below` — hiwalay kada larawan: `0,0,0,25`.
- **Bawal ang QR code ng GCash o Maya.**
- Tsekin gamit ang OCR bago i-post:
  `tesseract post.jpg - | grep -iE "gmail|pangalan|gcash"`

---

## Meta — bakit natutulog ang API

Ang Meta app (`AnyayaDesigns`, ID 1760156962237219) ay nasa **Development
Mode**. Ayon sa dokumento ng Meta, ang laman na ginawa habang Development Mode
ay **nakikita lang ng mga role user**. Kumpirmado sa incognito: hindi nakikita
ng estranghero ang mga post.

Para maging Live, tatlo ang kailangan:

| Kailangan | Estado |
|---|---|
| Privacy policy URL | ✅ `docs/privacy.html` |
| Data deletion URL | ✅ parehong pahina, `#data-deletion` |
| **Business verification** | ❌ kailangan ng DTI o SEC registration |

Walang rehistro ang may-ari sa ngayon. Kaya:

**Hanggang matapos ang verification, manu-mano ang pag-post.** Ang buong
sistema ay gumagana pa rin — ang `docs/admin.html` ang nagbibigay ng larawan
at caption, at ipinapasok niya ito sa Meta Business Suite.

**HUWAG BURAHIN ang `bot/publish.js` at ang `post` na utos.** Natutulog lang
sila. Ang araw na matapos ang verification, gagana ito nang walang babaguhing
kodigo.

---

## Ang ikot ng laman

Apat na gulong na magkakaiba ang haba, sabay umiikot:

| Gulong | Ilan | Kailan |
|---|---|---|
| Pillar | 6 | araw ng linggo |
| Serbisyo | 2 | kada araw — RSVP at craft, 50/50 |
| Hugis ng caption | 5 | kada araw |
| Kulay ng papel | 3 | kada araw |

7 × 5 × 3 = **105 araw** bago maulit ang eksaktong kombinasyon. 121 angle,
walang naulit nang higit sa dalawang beses sa kalahating taon.

Deterministic ang lahat — kaya ito masusubok nang hindi hinihintay ang araw.

---

## Estilo

Sumulat ng komento na nagpapaliwanag ng **bakit**, hindi ng **ano**. Ang
kodigo ay nagsasabi na ng ano. Ang mga komento rito ay nakasulat sa Filipino
dahil ang may-ari ang nagbabasa nito.
