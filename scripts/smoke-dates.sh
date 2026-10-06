#!/usr/bin/env bash
# ============================================================
# Smoke test « contrat de dates + règles métier » — Haivoly API
#
# Vérifie de bout en bout ce que le mobile ne doit jamais calculer lui-même :
#   • date métier  → « AAAA-MM-JJ » strict (aucun instant ISO accepté)
#   • horodatage   → instant ISO-8601 strict (aucune date sans heure)
#   • statut d'intervention calculé par le serveur (date passée/future)
#   • récolte → culture `RECOLTEE` dans la même transaction
#   • délimitation → superficie recalculée
#   • cloisonnement : une parcelle d'un autre utilisateur reste inaccessible
#
# Usage : bash scripts/smoke-dates.sh [http://127.0.0.1:3000]
# ============================================================
set -uo pipefail

API="${1:-http://127.0.0.1:3000}"
SUFFIXE="$(date +%s)"
EMAIL="dates+${SUFFIXE}@haivoly.mg"
EMAIL_2="dates2+${SUFFIXE}@haivoly.mg"
PASSWORD="MotDePasse123"

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAILED=1; }
FAILED=0

code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "═══ AUTH ═══"
TOKEN=$(
  curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"nom\":\"Dates\",\"prenom\":\"Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    | jq -r '.data.access_token // empty'
)
[ -n "$TOKEN" ] || TOKEN=$(
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.data.access_token // empty'
)
[ -n "$TOKEN" ] && pass "jeton obtenu" || { fail "authentification impossible"; exit 1; }
AUTH="Authorization: Bearer $TOKEN"

echo "═══ PARCELLE ═══"
PARCELLE=$(curl -s -X POST "$API/parcelles" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Parcelle contrat dates","description":"Smoke","typeSol":"ARGILEUX","latitude":-18.9136,"longitude":47.5361}')
PARCELLE_ID=$(echo "$PARCELLE" | jq -r '.data.id // empty')
[ -n "$PARCELLE_ID" ] && pass "creation parcelle ($PARCELLE_ID)" || fail "creation parcelle → $PARCELLE"

echo "═══ DÉLIMITATION (superficie recalculée) ═══"
DELIM=$(curl -s -X POST "$API/parcelles/$PARCELLE_ID/points-gps" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"pointsGPS":[{"latitude":-18.9136,"longitude":47.5361},{"latitude":-18.9140,"longitude":47.5370},{"latitude":-18.9150,"longitude":47.5360}]}')
SUPERFICIE=$(curl -s "$API/parcelles/$PARCELLE_ID" -H "$AUTH" | jq -r '.data.superficie // 0')
echo "$DELIM" | grep -q '"success":true' && pass "3 points GPS enregistres" || fail "points GPS → $DELIM"
python3 -c "import sys; sys.exit(0 if float('$SUPERFICIE') > 0 else 1)" \
  && pass "superficie calculée par le serveur ($SUPERFICIE m²)" \
  || fail "superficie non calculée ($SUPERFICIE)"

echo "═══ CULTURE : date métier au format AAAA-MM-JJ ═══"
CULTURE=$(curl -s -X POST "$API/parcelles/$PARCELLE_ID/cultures" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Maïs","type":"MAIS","variete":"Jaune","datePlantation":"2026-05-18","datePrevueRecolte":"2026-09-18"}')
CULTURE_ID=$(echo "$CULTURE" | jq -r '.data.id // empty')
[ -n "$CULTURE_ID" ] && pass "creation culture avec dates AAAA-MM-JJ" || fail "creation culture → $CULTURE"

STATUT_ISO=$(code -X POST "$API/parcelles/$PARCELLE_ID/cultures" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Culture date invalide","datePlantation":"2026-05-18T00:00:00.000Z"}')
[ "$STATUT_ISO" = "400" ] \
  && pass "instant ISO refusé pour une date métier (400)" \
  || fail "instant ISO accepté pour datePlantation ($STATUT_ISO)"

STATUT_TEXTE=$(code -X POST "$API/parcelles/$PARCELLE_ID/cultures" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Culture date invalide 2","datePlantation":"18/05/2026"}')
[ "$STATUT_TEXTE" = "400" ] \
  && pass "date non normalisée refusée (400)" \
  || fail "date « 18/05/2026 » acceptée ($STATUT_TEXTE)"

echo "═══ INTERVENTION : statut déduit par le serveur ═══"
PASSEE=$(curl -s -X POST "$API/cultures/$CULTURE_ID/interventions" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"type":"IRRIGATION","description":"Smoke passé","date":"2026-01-15T08:00:00.000Z","quantite":10,"unite":"L"}')
STATUT_PASSEE=$(echo "$PASSEE" | jq -r '.data.statut // empty')
[ "$STATUT_PASSEE" = "EN_COURS" ] \
  && pass "intervention passée → statut EN_COURS (calculé serveur)" \
  || fail "statut intervention passée = « $STATUT_PASSEE » → $PASSEE"

FUTURE=$(curl -s -X POST "$API/cultures/$CULTURE_ID/interventions" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"type":"FERTILISATION","description":"Smoke futur","date":"2027-03-01T08:00:00.000Z"}')
STATUT_FUTURE=$(echo "$FUTURE" | jq -r '.data.statut // empty')
[ "$STATUT_FUTURE" = "PLANIFIEE" ] \
  && pass "intervention future → statut PLANIFIEE (calculé serveur)" \
  || fail "statut intervention future = « $STATUT_FUTURE » → $FUTURE"

STATUT_DATE_SEULE=$(code -X POST "$API/cultures/$CULTURE_ID/interventions" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"type":"AUTRE","date":"2026-05-18"}')
[ "$STATUT_DATE_SEULE" = "400" ] \
  && pass "date sans heure refusée pour un horodatage (400)" \
  || fail "date « 2026-05-18 » acceptée pour une intervention ($STATUT_DATE_SEULE)"

echo "═══ OBSERVATION : horodatage ISO-8601 de bout en bout ═══"
OBSERVATION=$(curl -s -X POST "$API/cultures/$CULTURE_ID/observations" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"description":"Feuilles jaunes sur 3 rangs","date":"2026-10-06T06:30:00.000Z"}')
echo "$OBSERVATION" | jq -e '.data.id' >/dev/null 2>&1 \
  && pass "observation créée avec un instant ISO" \
  || fail "création observation → $OBSERVATION"

echo "$OBSERVATION" | jq -r '.data.date // empty' | grep -Eq '^2026-10-06' \
  && pass "date d'observation restituée sans décalage" \
  || fail "date restituée = « $(echo "$OBSERVATION" | jq -r '.data.date') »"

echo "═══ RÈGLE MÉTIER : statut de culture recalculé par le serveur ═══"
# Le mobile n'envoie jamais de statut : une culture PLANIFIEE dont la date de
# plantation est atteinte bascule en EN_COURS (à la création comme à la lecture).
CULTURE_PASSEE=$(curl -s -X POST "$API/parcelles/$PARCELLE_ID/cultures" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Culture plantation atteinte","type":"MAIS","datePlantation":"2020-01-15"}')
ID_PASSEE=$(echo "$CULTURE_PASSEE" | jq -r '.data.id // empty')
STATUT_RENVOYE=$(echo "$CULTURE_PASSEE" | jq -r '.data.statut // empty')
STATUT_RELU=$(curl -s "$API/parcelles/$PARCELLE_ID/cultures/$ID_PASSEE" -H "$AUTH" | jq -r '.data.statut // empty')
[ "$STATUT_RENVOYE" = "EN_COURS" ] \
  && pass "plantation atteinte → EN_COURS renvoyé dès la création" \
  || fail "statut renvoyé = « $STATUT_RENVOYE »"
[ "$STATUT_RELU" = "EN_COURS" ] \
  && pass "plantation atteinte → EN_COURS confirmé à la relecture" \
  || fail "statut relu = « $STATUT_RELU »"

CULTURE_FUTURE=$(curl -s -X POST "$API/parcelles/$PARCELLE_ID/cultures" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Culture plantation à venir","type":"MAIS","datePlantation":"2099-01-15"}')
ID_FUTURE=$(echo "$CULTURE_FUTURE" | jq -r '.data.id // empty')
STATUT_FUTUR=$(curl -s "$API/parcelles/$PARCELLE_ID/cultures/$ID_FUTURE" -H "$AUTH" | jq -r '.data.statut // empty')
[ "$STATUT_FUTUR" = "PLANIFIEE" ] \
  && pass "plantation à venir → PLANIFIEE (inchangé)" \
  || fail "statut culture future = « $STATUT_FUTUR »"

echo "═══ SYNCHRONISATION HORS-LIGNE : contrat d'action du serveur ═══"
# Le serveur n'accepte que CREATE/UPDATE/DELETE sur une ressource métier : le
# moteur mobile marque « INVALID » toute autre action au lieu de la rejouer.
SYNC_HORS_CONTRAT=$(code -X POST "$API/sync" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"deviceId":"smoke-dates","actions":[{"clientId":"smoke-hors-contrat","actionType":"OTHER","entityType":"UTILISATEUR","payload":{}}]}')
[ "$SYNC_HORS_CONTRAT" = "400" ] \
  && pass "action hors contrat refusée (400)" \
  || fail "actionType/entityType hors contrat accepté ($SYNC_HORS_CONTRAT)"

# Comptage avant/après : la clé d'idempotence garantit qu'un rejeu ne crée rien.
COMPTER_OBS="curl -s \"$API/cultures/$CULTURE_ID/observations\" -H \"$AUTH\" | jq -r '.data | if type == \"array\" then length else (.items | length) end'"
NB_OBS_AVANT=$(eval "$COMPTER_OBS")

CLIENT_ID="smoke-obs-$SUFFIXE"
SYNC_1=$(curl -s -X POST "$API/sync" -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"deviceId\":\"smoke-dates\",\"actions\":[{\"clientId\":\"$CLIENT_ID\",\"actionType\":\"CREATE\",\"entityType\":\"OBSERVATION\",\"payload\":{\"cultureId\":\"$CULTURE_ID\",\"description\":\"Observation synchronisée\",\"date\":\"2026-10-06T07:15:00.000Z\"},\"timestamp\":\"2026-10-06T07:15:00.000Z\"}]}")
STATUT_SYNC_1=$(echo "$SYNC_1" | jq -r '.data.results[0].status // empty')
NB_OBS_APRES_1=$(eval "$COMPTER_OBS")
[ "$STATUT_SYNC_1" = "SYNCED" ] \
  && pass "CREATE/OBSERVATION synchronisée (vocabulaire du mobile accepté)" \
  || fail "première synchronisation → $SYNC_1"

SYNC_2=$(curl -s -X POST "$API/sync" -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"deviceId\":\"smoke-dates\",\"actions\":[{\"clientId\":\"$CLIENT_ID\",\"actionType\":\"CREATE\",\"entityType\":\"OBSERVATION\",\"payload\":{\"cultureId\":\"$CULTURE_ID\",\"description\":\"Observation synchronisée\",\"date\":\"2026-10-06T07:15:00.000Z\"}}]}")
STATUT_SYNC_2=$(echo "$SYNC_2" | jq -r '.data.results[0].status // empty')
[ "$STATUT_SYNC_2" = "DUPLICATE" ] \
  && pass "rejeu du même clientId → DUPLICATE (idempotence)" \
  || fail "rejeu → $SYNC_2"

NB_OBS_APRES_2=$(eval "$COMPTER_OBS")
[ "$NB_OBS_APRES_1" = "$((NB_OBS_AVANT + 1))" ] \
  && pass "une observation créée par la synchronisation ($NB_OBS_AVANT → $NB_OBS_APRES_1)" \
  || fail "comptage après synchronisation : $NB_OBS_AVANT → $NB_OBS_APRES_1"

[ "$NB_OBS_APRES_2" = "$NB_OBS_APRES_1" ] \
  && pass "aucun doublon après rejeu (toujours $NB_OBS_APRES_2 observations)" \
  || fail "le rejeu a créé un doublon ($NB_OBS_APRES_1 → $NB_OBS_APRES_2)"

echo "═══ RÉCOLTE : culture RECOLTEE dans la même transaction ═══"
RECOLTE=$(curl -s -X POST "$API/cultures/$CULTURE_ID/recolte" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"dateRecolte":"2026-10-01","quantite":1250,"unite":"kg","description":"Smoke récolte"}')
echo "$RECOLTE" | jq -e '.data.id' >/dev/null 2>&1 && pass "récolte créée sans statut envoyé" || fail "récolte → $RECOLTE"

STATUT_CULTURE=$(curl -s "$API/parcelles/$PARCELLE_ID/cultures/$CULTURE_ID" -H "$AUTH" | jq -r '.data.statut // empty')
[ "$STATUT_CULTURE" = "RECOLTEE" ] \
  && pass "culture basculée en RECOLTEE par le serveur" \
  || fail "statut culture après récolte = « $STATUT_CULTURE »"

STOCK=$(curl -s "$API/cultures/$CULTURE_ID/recolte" -H "$AUTH")
echo "$STOCK" | grep -q '"quantite"' && pass "récolte relue via GET /cultures/:id/recolte" || fail "GET récolte → $STOCK"

echo "═══ CLOISONNEMENT DES DONNÉES ═══"
curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"nom\":\"Intrus\",\"email\":\"$EMAIL_2\",\"password\":\"$PASSWORD\"}" >/dev/null
TOKEN_2=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_2\",\"password\":\"$PASSWORD\"}" | jq -r '.data.access_token // empty')
if [ -n "$TOKEN_2" ]; then
  CODE_INTRUS=$(code "$API/parcelles/$PARCELLE_ID" -H "Authorization: Bearer $TOKEN_2")
  case "$CODE_INTRUS" in
    403|404) pass "parcelle d'un autre utilisateur inaccessible ($CODE_INTRUS)" ;;
    *) fail "cloisonnement : code inattendu $CODE_INTRUS" ;;
  esac
else
  fail "second utilisateur non créé"
fi

echo
if [ "$FAILED" = "0" ]; then
  echo "✅ Contrat de dates et règles métier : tout est conforme."
else
  echo "❌ Des vérifications ont échoué."
fi
exit "$FAILED"
