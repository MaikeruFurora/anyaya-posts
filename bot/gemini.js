/**
 * Isang tawag sa Gemini na may kapalit na modelo.
 *
 * Noong 2026-09-07 ay limang beses bumagsak ang buong araw, at iisa ang
 * sinabi ng Google sa lahat:
 *
 *   HTTP 503 — "This model is currently experiencing high demand.
 *               Spikes in demand are usually temporary."
 *
 * Walang mali sa hiling, sa susi, o sa laman. Nabarahan lang ang isang
 * makina. Pero pitong oras itong nagtagal — kaya lahat ng tatlong alarma ay
 * tumama sa parehong saradong pinto, at walang post ang araw na iyon.
 *
 * Ang ulit sa loob ng isang modelo ay walang silbi rito: kapag punuan ang
 * `gemini-3.6-flash`, punuan pa rin ito makalipas ang sampung segundo. Ang
 * kapalit ay ibang makina at ibang pila, kaya madalas itong dumaan kahit
 * sarado ang una.
 *
 * Mas mabuti nang post galing sa pangalawang modelo kaysa walang post.
 * Nakabantay pa rin ang labing-isang guardrail sa kung ano ang lumabas.
 */
const { fetchRetry } = require('./http');

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.7-flash'];

// Function, hindi const: para mabasa ang env sa oras ng tawag at hindi sa
// oras ng require. Iyon ang nagpapasubok dito nang walang internet.
const baseUrl = () => process.env.GEMINI_BASE_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Ang susubukang modelo, sunod-sunod.
 *
 * Ang repo variable na GEMINI_MODEL ay NAGPIPILI NG UNA — hindi ito bumubura
 * ng kapalit. Idinudugtong pa rin ang buong default sa likod nito.
 *
 * Mahalaga ang pagkakaiba. Noong 2026-09-07, nakatakda ang variable sa iisang
 * `gemini-3.6-flash`, kaya ang unang bersyon nito — na kinukuha ang variable
 * bilang buong listahan — ay tahimik na pinatay ang buong kapalit. Barado ang
 * 3.6 buong araw, at ang lunas ay nakaupo lang sa repo na hindi tumatakbo.
 *
 * Ang isang setting ay hindi dapat kayang patayin ang safety net. Kung talagang
 * iisang modelo ang gusto, ang tanggihan ang kapalit ay dapat sinasadya at
 * malakas ang sinasabi — hindi bunga ng isang naiwang variable.
 */
function models() {
  const raw = (process.env.GEMINI_MODEL || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
  return [...new Set([...raw, ...DEFAULT_MODELS])];
}

/**
 * Sulit ba ang kapalit na modelo?
 *
 * Hindi sa 400 at 403 — mali ang hiling o ang susi, at pareho iyon sa lahat
 * ng modelo. Sayang lang ang oras, at itinatago pa nito ang tunay na dahilan
 * sa likod ng dalawa pang pagkabigo.
 *
 * Oo sa 404. Doon nagpapakita ang naretirong modelo, at iyon mismo ang
 * pagkakataong may kapalit.
 */
const worthAnotherModel = status => status !== 400 && status !== 403;

/**
 * @param {object} body ang katawan ng generateContent
 * @param {string} key  ang API key
 * @param {{log?: function, base?: string, list?: string[]}} opts
 *   Ang `base` at `list` ay para sa test — doon lokal na server ang Gemini.
 * @returns {Promise<object>} ang JSON na sagot ng unang modelong tumugon
 * @throws kapag walang natirang modelo. Nasa mensahe ang huling dahilan.
 */
async function callGemini(body, key, opts = {}) {
  const { log = console.error, base = baseUrl(), list = models() } = opts;
  log(`   modelo: ${list.join(' → ')}`);
  let last;

  for (const [i, model] of list.entries()) {
    // Dalawang subok kada modelo, hindi tatlo. Tatlong modelo ang mayroon,
    // kaya anim na subok ito sa kabuuan — at kailangang kasya ang lahat sa
    // labinlimang minutong hangganan ng job.
    let res;
    try {
      res = await fetchRetry(`${base}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, {
        attempts: 2,
        timeoutMs: 60000,
        onRetry: (n, why) => log(`   ${model} subok ${n} — ${why.slice(0, 160)}`),
      });
    } catch (e) {
      // Hindi man lang nakarating. Baka ang susunod ay makarating.
      last = new Error(`Hindi naabot ang ${model}: ${e.message}`);
      log('   ' + last.message.slice(0, 200));
      continue;
    }

    if (res.ok) {
      if (i > 0) log(`   (kapalit na modelo: ${model})`);
      return res.json();
    }

    // Inilalabas nang buo ang mensahe ng Google. Noong Agosto ay doon mismo
    // nakasulat kung anong modelo ang kapalit ng naretiro, at tatlong araw
    // kaming bulag dahil pinutol natin ang teksto.
    const text = await res.text();
    last = new Error(`Hindi tumugon ang ${model}: HTTP ${res.status} — ${text.slice(0, 500)}`);
    if (!worthAnotherModel(res.status)) throw last;
    log('   ' + last.message.slice(0, 200));
  }

  throw last;
}

module.exports = { callGemini, models, baseUrl, worthAnotherModel, DEFAULT_MODELS };
