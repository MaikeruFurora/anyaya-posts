#!/usr/bin/env bash
# Ang mga utos na tinatanggap, at ang mga hindi. Patakbuhin bago mag-push.
set -u
cd "$(dirname "$0")/.."
fail=0
t() { # t <inaasahan> <comment> [pamagat]
  local want="$1" body="$2" title="${3:-Post para sa 2026-08-27 — approve?}"
  local got; got=$(bash bot/route.sh "$body" "$title" | grep '^action=' | cut -d= -f2)
  if [ "$got" = "$want" ]; then printf '✓ %-26s → %s\n' "'$body'" "$got"
  else printf '✗ %-26s → %s (dapat %s)\n' "'$body'" "$got" "$want"; fail=$((fail+1)); fi
}
f() { # f <field> <inaasahan> <pamagat>
  local got; got=$(bash bot/route.sh "post" "$3" | grep "^$1=" | cut -d= -f2)
  if [ "$got" = "$2" ]; then printf '✓ %-10s %s\n' "$1" "$got"
  else printf '✗ %-10s %s (dapat %s)\n' "$1" "$got" "$2"; fail=$((fail+1)); fi
}

t post  "post";      t post  "POST";       t post  "Post."
t post  "approve";   t post  "oo";         t post  "sige"
t skip  "skip";      t skip  "Skip";       t skip  "huwag"
t regen "skip and generate"
t regen "Skip And Generate."
t regen "skip  and   generate"
t regen "ulit";      t regen "iba naman";  t regen "generate"
t manual "posted";      t manual "manual";    t manual "Posted na."
t manual "na-post ko na"; t manual "tapos"
t none  "ang ganda nito"
t none  "post it later"          # hindi eksakto — hindi dapat sumunod
t none  ""
# Ang unang linya lang ang binabasa.
t post  "$(printf 'post\nsalamat')"

f base      "2026-08-27"    "Post para sa 2026-08-27 — approve?"
f date      "2026-08-27"    "Post para sa 2026-08-27 — approve?"
f variation "1"             "Post para sa 2026-08-27 — approve?"
f base      "2026-08-27-v2" "Post para sa 2026-08-27-v2 — approve?"
f date      "2026-08-27"    "Post para sa 2026-08-27-v2 — approve?"
f variation "2"             "Post para sa 2026-08-27-v2 — approve?"
f variation "5"             "Post para sa 2026-08-27-v5 — approve?"

# Ang showcase ay may sariling pangalan at hindi dapat malito sa araw-araw.
f kind      "daily"                 "Post para sa 2026-08-27 — approve?"
f kind      "daily"                 "Post para sa 2026-08-27-v3 — approve?"
f kind      "showcase"              "Post para sa 2026-08-27-showcase — approve?"
f kind      "showcase"              "Post para sa 2026-08-27-showcase-v2 — approve?"
f base      "2026-08-27-showcase"   "Post para sa 2026-08-27-showcase — approve?"
f base      "2026-08-27-showcase-v2" "Post para sa 2026-08-27-showcase-v2 — approve?"
f date      "2026-08-27"            "Post para sa 2026-08-27-showcase-v2 — approve?"
f variation "2"                     "Post para sa 2026-08-27-showcase-v2 — approve?"

[ "$fail" = 0 ] && echo && echo "🎉 Lahat pumasa." || { echo; echo "⚠️  $fail na bumagsak."; }
exit "$fail"
