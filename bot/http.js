/**
 * `fetch` na may ulit, may timeout, at may bibig.
 *
 * Dalawang magkaibang klase ng pagkabigo ang mayroon ang fetch:
 *
 *   1. Sumagot ang server nang hindi maganda — nasa `res.status` iyon.
 *   2. Hindi man lang nakarating ang request — nagtatapon ito ng TypeError.
 *
 * Sa tatlong file dito, ang `await fetch(...)` ay nasa labas ng anumang try.
 * Kaya ang una ay inuulit, at ang pangalawa ay tumatalon palabas agad —
 * gayong ang pangalawa ang mas dapat ulitin. Isang sandaling pagkaputol ng
 * network ay agarang pagkabigo, walang ikalawang subok.
 *
 * Iyon ang bumagsak noong 2026-08-27. Tatlong run, iisang mensahe:
 * "fetch failed". Walang ibang sinabi, dahil itinatago ng Node ang tunay na
 * dahilan sa `error.cause` — at doon nakalagay ang ENOTFOUND o ECONNRESET na
 * magsasabi sana kung ano talaga ang nangyari.
 */

// Ang 429 at 5xx ay panandalian. Ang 400, 403, 404 ay hindi — walang saysay
// ulitin ang mali; ibinabalik natin sila para basahin ng tumawag.
const retryableStatus = s => s === 408 || s === 429 || s >= 500;

/**
 * Buksan ang buong kadena ng `cause`. Dito nakatago ang ENOTFOUND,
 * ECONNRESET, at ang mga katulad na tunay na nagsasabi ng nangyari.
 */
function describe(err) {
  const parts = [err.message];
  const seen = new Set();
  let c = err.cause;
  while (c && !seen.has(c)) {
    seen.add(c);
    const bit = [c.code, c.message].filter(Boolean).join(' ');
    if (bit && !parts.includes(bit)) parts.push(bit);
    c = c.cause;
  }
  return parts.join(' ← ');
}

/**
 * @returns {Promise<Response>} ang sagot, ok man o hindi — basta hindi na ito
 *   dapat ulitin. Ang tumawag ang bahalang magbasa ng status at ng laman.
 * @throws kapag naubos ang lahat ng subok. Nasa mensahe ang huling dahilan.
 */
async function fetchRetry(url, init = {}, opts = {}) {
  const { attempts = 3, timeoutMs = 60000, backoffMs = 5000, onRetry } = opts;
  let last;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Walang sariling timeout ang fetch. Kung wala ito, ang isang nakabiting
      // koneksyon ay uubos ng buong labinlimang minuto ng job.
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok || !retryableStatus(res.status)) return res;
      last = `HTTP ${res.status} — ${(await res.text()).slice(0, 500)}`;
    } catch (e) {
      last = describe(e);
    }

    if (attempt < attempts) {
      if (onRetry) onRetry(attempt, last);
      await new Promise(r => setTimeout(r, attempt * backoffMs));
    }
  }

  throw new Error(last);
}

module.exports = { fetchRetry, describe, retryableStatus };
