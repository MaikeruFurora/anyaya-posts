#!/usr/bin/env bash
# Binabasa ang comment mo at ang pamagat ng issue, at sinasabi kung ano ang
# gagawin. Hiwalay itong file para masubok — hindi nasusubok ang logic na
# nakabaon sa loob ng isang YAML.
#
#   bot/route.sh "<comment body>" "<issue title>"
#
# Naglalabas ng: action=… base=… date=… variation=…
set -u

BODY="${1-}"
TITLE="${2-}"

# Unang linya lang, maliit na letra, isang espasyo sa pagitan, walang tuldok
# sa dulo. Kaya nitong hawakan ang "Skip And Generate." at ang
# "skip  and  generate" nang pareho.
WORD=$(printf '%s' "$BODY" | tr -d '\r' | head -n1 \
       | tr '[:upper:]' '[:lower:]' \
       | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
             -e 's/[[:space:]][[:space:]]*/ /g' -e 's/[.!]*$//')

case "$WORD" in
  post|approve|oo|sige|go)
    ACTION=post ;;
  "skip and generate"|"skip and regenerate"|regenerate|generate|ulit|"iba naman"|iba)
    ACTION=regen ;;
  skip|huwag|hindi|no|wag)
    ACTION=skip ;;
  *)
    ACTION=none ;;
esac

# Ang pamagat ang may dala ng pangalan ng file:
#   "Post para sa 2026-08-27 — approve?"    → base 2026-08-27
#   "Post para sa 2026-08-27-v2 — approve?" → base 2026-08-27-v2
BASE=$(printf '%s' "$TITLE" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}(-v[0-9]+)?' | head -n1)
DATE=$(printf '%s' "$BASE" | cut -c1-10)

# Ang v2 ay variation 1. Ang susunod na ulit ay isa pa sa taas.
N=$(printf '%s' "$BASE" | grep -oE 'v[0-9]+$' | tr -d 'v')
[ -z "$N" ] && N=1

printf 'action=%s\nbase=%s\ndate=%s\nvariation=%s\n' "$ACTION" "$BASE" "$DATE" "$N"
