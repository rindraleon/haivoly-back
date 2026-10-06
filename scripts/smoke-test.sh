#!/usr/bin/env bash
# ============================================================
# Smoke test de bout en bout — Haivoly API (NestJS + TypeORM)
# Usage : bash scripts/smoke-test.sh [http://127.0.0.1:3000]
# ============================================================
set -uo pipefail

API="${1:-http://127.0.0.1:3000}"
EMAIL="smoke+$(date +%s)@haivoly.mg"
PASSWORD="MotDePasse123"

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAILED=1; }
FAILED=0

json() { python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(d)[:320])"; }
field() { python3 -c "import sys,json;d=json.load(sys.stdin);
v=d
for k in '$1'.split('.'):
    v = v[int(k)] if k.isdigit() else v[k]
print(v)"; }

echo "═══ HEALTH ═══"
HEALTH=$(curl -s "$API/health")
echo "$HEALTH" | grep -q '"database":"up"' && pass "base de données joignable" || fail "$HEALTH"

echo "═══ AUTH ═══"
REG=$(curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"nom\":\"Smoke\",\"prenom\":\"Test\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"telephone\":\"0340000001\"}")
echo "$REG" | grep -q '"success":true' && pass "register" || fail "register → $REG"

LOGIN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null || echo "")
[ -n "$TOKEN" ] && pass "login (JWT émis)" || fail "login → $LOGIN"
AUTH="Authorization: Bearer $TOKEN"

curl -s "$API/auth/me" -H "$AUTH" | grep -q "\"email\":\"$EMAIL\"" && pass "GET /auth/me" || fail "GET /auth/me"

BAD=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"mauvais\"}")
echo "$BAD" | grep -q '"statusCode":401' && pass "mauvais mot de passe rejeté (401)" || fail "sécurité login → $BAD"

echo "═══ PARCELLES ═══"
PID=$(curl -s -X POST "$API/parcelles" -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "nom":"Rizière smoke","typeSol":"argileux","description":"Test automatisé",
  "latitude":-18.8792,"longitude":47.5079,
  "pointsGPS":[{"latitude":-18.8792,"longitude":47.5079,"ordre":0},
               {"latitude":-18.8795,"longitude":47.5085,"ordre":1},
               {"latitude":-18.8799,"longitude":47.5082,"ordre":2}]}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
[ -n "$PID" ] && pass "create (id=$PID)" || fail "create parcelle"

curl -s "$API/parcelles/$PID" -H "$AUTH" | grep -q '"pointsGPS"' && pass "read détail + points GPS" || fail "read détail"

curl -s -X PATCH "$API/parcelles/$PID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Rizière smoke modifiée"}' | grep -q 'modifiée' && pass "update" || fail "update"

curl -s -X PUT "$API/parcelles/$PID/delimitation" -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "pointsGPS":[{"latitude":-18.8790,"longitude":47.5070,"ordre":0},
               {"latitude":-18.8794,"longitude":47.5090,"ordre":1},
               {"latitude":-18.8800,"longitude":47.5080,"ordre":2},
               {"latitude":-18.8796,"longitude":47.5065,"ordre":3}]}' \
  | grep -q '"superficie"' && pass "délimitation (polygone + superficie)" || fail "délimitation"

echo "═══ CULTURES ═══"
CID=$(curl -s -X POST "$API/parcelles/$PID/cultures" -H "$AUTH" -H 'Content-Type: application/json' -d '{
  "nom":"Riz Makalioka","type":"Riz","variete":"Makalioka 34",
  "datePlantation":"2026-01-15","datePrevueRecolte":"2026-05-20",
  "statut":"EN_COURS","stade":"Croissance"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
[ -n "$CID" ] && pass "create (date YYYY-MM-DD acceptée)" || fail "create culture"

echo "═══ INTERVENTIONS — statut automatique ═══"
FUTURE=$(curl -s -X POST "$API/cultures/$CID/interventions" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"type":"IRRIGATION","description":"Programmée","date":"2027-01-01T06:00:00.000Z","produit":"Eau","quantite":500,"unite":"L"}')
echo "$FUTURE" | grep -q '"statut":"PLANIFIEE"' && pass "intervention future → PLANIFIEE" || fail "statut futur → $FUTURE"
IID=$(echo "$FUTURE" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")

PAST=$(curl -s -X POST "$API/cultures/$CID/interventions" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"type":"FERTILISATION","description":"NPK","date":"2026-02-01T06:00:00.000Z","produit":"NPK","quantite":25,"unite":"kg","cout":75000}')
echo "$PAST" | grep -q '"statut":"EN_COURS"' && pass "intervention passée → EN_COURS" || fail "statut passé → $PAST"

INVALID=$(curl -s -X POST "$API/cultures/$CID/interventions" -H "$AUTH" -H 'Content-Type: application/json' -d '{"type":"INCONNU"}')
echo "$INVALID" | grep -q '"statusCode":400' && pass "type d'intervention invalide rejeté (400)" || fail "validation type → $INVALID"

curl -s "$API/cultures/$CID/interventions" -H "$AUTH" | grep -q '"IRRIGATION"' && pass "list interventions" || fail "list interventions"

echo "═══ OBSERVATIONS ═══"
OBS=$(curl -s -X POST "$API/cultures/$CID/observations" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"description":"Pucerons détectés","date":"2026-03-01T06:00:00.000Z"}')
echo "$OBS" | grep -q '"description"' && pass "create observation" || fail "create observation"
OID=$(echo "$OBS" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")

echo "═══ CONTRAT DE DATES ═══"
# Une date calendaire doit être un AAAA-MM-JJ strict : un instant ISO complet
# est refusé (il laisserait passer un décalage d'un jour selon le fuseau).
curl -s -o /dev/null -w '%{http_code}' -X POST "$API/parcelles/$PID/cultures" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"nom":"Décalage","datePlantation":"2026-05-18T00:00:00.000Z"}' | grep -q '^400$' \
  && pass "instant ISO refusé pour datePlantation" || fail "instant ISO refusé pour datePlantation"
# Un horodatage doit être un instant ISO-8601 complet.
curl -s -o /dev/null -w '%{http_code}' -X POST "$API/cultures/$CID/observations" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"description":"Date nue","date":"2026-03-01"}' | grep -q '^400$' \
  && pass "date nue refusée pour observation.date" || fail "date nue refusée pour observation.date"

echo "═══ ROUTES PLATES /cultures/:id, /interventions/:id, /observations/:id ═══"
# Le mobile manipule les ressources par leur identifiant seul (édition et
# suppression d'une intervention ou d'une observation). Ces routes doivent
# exister et appliquer exactement le même contrôle d'ownership que les routes
# imbriquées.
curl -s "$API/cultures/$CID" -H "$AUTH" | grep -q '"nom"' \
  && pass "GET /cultures/:id" || fail "GET /cultures/:id"
curl -s "$API/interventions/$IID" -H "$AUTH" | grep -q '"type"' \
  && pass "GET /interventions/:id" || fail "GET /interventions/:id"
curl -s -X PATCH "$API/interventions/$IID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"description":"Programmée (modifiée)"}' | grep -q 'modifiée' \
  && pass "PATCH /interventions/:id" || fail "PATCH /interventions/:id"
curl -s "$API/observations/$OID" -H "$AUTH" | grep -q '"description"' \
  && pass "GET /observations/:id" || fail "GET /observations/:id"
curl -s -X PATCH "$API/observations/$OID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"description":"Pucerons traités"}' | grep -q 'traités' \
  && pass "PATCH /observations/:id" || fail "PATCH /observations/:id"

# Suppressions : sur des ressources jetables, pour ne pas casser la suite.
DEL_OBS=$(curl -s -X POST "$API/cultures/$CID/observations" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"description":"À supprimer","date":"2026-03-02T06:00:00.000Z"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
curl -s -X DELETE "$API/observations/$DEL_OBS" -H "$AUTH" | grep -q '"deleted":true' \
  && pass "DELETE /observations/:id" || fail "DELETE /observations/:id"

DEL_INT=$(curl -s -X POST "$API/cultures/$CID/interventions" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"type":"IRRIGATION","description":"À supprimer","date":"2027-02-01T06:00:00.000Z"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
curl -s -X DELETE "$API/interventions/$DEL_INT" -H "$AUTH" | grep -q '"deleted":true' \
  && pass "DELETE /interventions/:id" || fail "DELETE /interventions/:id"

echo "═══ RÉCOLTES — règle métier transactionnelle ═══"
curl -s -X POST "$API/cultures/$CID/recolte" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"dateRecolte":"2026-05-18","quantite":1200,"unite":"kg","prixVente":2400000,"coutRecolte":300000}' \
  | grep -q '"quantite"' && pass "create récolte" || fail "create récolte"

STATUT=$(curl -s "$API/parcelles/$PID/cultures/$CID" -H "$AUTH" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['statut'])" 2>/dev/null || echo "?")
[ "$STATUT" = "RECOLTEE" ] && pass "culture automatiquement RECOLTEE" || fail "statut culture = $STATUT"

DUP=$(curl -s -X POST "$API/cultures/$CID/recolte" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"dateRecolte":"2026-05-19","quantite":10,"unite":"kg"}')
echo "$DUP" | grep -q '"statusCode":4' && pass "deuxième récolte refusée" || fail "doublon récolte → $DUP"

echo "═══ SYNCHRONISATION / IDEMPOTENCE ═══"
CLIENT_ID="smoke-$(date +%s)-1"
SYNC_BODY="{\"deviceId\":\"smoke-device\",\"actions\":[{
  \"clientId\":\"$CLIENT_ID\",\"actionType\":\"CREATE\",\"entityType\":\"PARCELLE\",
  \"payload\":{\"nom\":\"Parcelle offline\",\"latitude\":-18.9,\"longitude\":47.5}}]}"

R1=$(curl -s -X POST "$API/sync" -H "$AUTH" -H 'Content-Type: application/json' -d "$SYNC_BODY")
echo "$R1" | grep -q '"status":"SYNCED"' && pass "action offline appliquée (POST /sync)" || fail "sync → $R1"

R2=$(curl -s -X POST "$API/sync" -H "$AUTH" -H 'Content-Type: application/json' -d "$SYNC_BODY")
echo "$R2" | grep -q '"status":"DUPLICATE"' && pass "rejeu détecté (DUPLICATE, pas de doublon)" || fail "idempotence → $R2"

COUNT=$(curl -s "$API/parcelles?limit=200" -H "$AUTH" \
  | python3 -c "import sys,json;items=json.load(sys.stdin)['data']['items'];print(sum(1 for p in items if p['nom']=='Parcelle offline'))")
[ "$COUNT" = "1" ] && pass "exactement 1 parcelle créée malgré 2 envois" || fail "$COUNT parcelles créées (attendu 1)"

echo "═══ OWNERSHIP ═══"
OTHER_EMAIL="smoke-other+$(date +%s)@haivoly.mg"
curl -s -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d "{\"nom\":\"Autre\",\"email\":\"$OTHER_EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null
OTHER_TOKEN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$OTHER_EMAIL\",\"password\":\"$PASSWORD\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['access_token'])")

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/parcelles/$PID" -H "Authorization: Bearer $OTHER_TOKEN")
[ "$CODE" = "404" ] && pass "accès à la parcelle d'un autre utilisateur refusé (404)" || fail "ownership → HTTP $CODE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$API/parcelles/$PID" \
  -H "Authorization: Bearer $OTHER_TOKEN" -H 'Content-Type: application/json' -d '{"nom":"Piratage"}')
[ "$CODE" = "404" ] && pass "modification refusée (404)" || fail "ownership update → HTTP $CODE"

for CHEMIN in "cultures/$CID" "interventions/$IID" "observations/$OID"; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/$CHEMIN" -H "Authorization: Bearer $OTHER_TOKEN")
  [ "$CODE" = "404" ] && pass "route plate /$CHEMIN protégée (404)" || fail "ownership /$CHEMIN → HTTP $CODE"
done

echo "═══ RECOMMANDATIONS ═══"
RECOS=$(curl -s "$API/recommendations/me" -H "$AUTH")
echo "$RECOS" | grep -q '"success":true' && pass "GET /recommendations/me" || fail "recommandations → $RECOS"

echo "═══ SUPPRESSION LOGIQUE ═══"
curl -s -X DELETE "$API/parcelles/$PID" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"raison":"Fin du smoke test"}' | grep -q '"statut":"SUPPRIMEE"' \
  && pass "suppression logique (statut SUPPRIMEE)" || fail "suppression"

echo "═══ MOT DE PASSE OUBLIÉ ═══"
FORGOT=$(curl -s -X POST "$API/auth/forgot-password" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}")
echo "$FORGOT" | grep -q '"message"' && pass "forgot-password (réponse générique)" || fail "forgot-password → $FORGOT"

echo
if [ "$FAILED" = "0" ]; then
  echo "🎉 Tous les tests de fumée ont réussi."
  exit 0
else
  echo "⚠️  Certains tests ont échoué."
  exit 1
fi
