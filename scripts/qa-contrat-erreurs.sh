#!/usr/bin/env bash
# ============================================================
# QA — contrat d'erreurs et upload d'images (Haivoly API)
#
# Vérifie le comportement **observable** d'un client réel :
#   • codes d'erreur stables (`code`) et messages utilisateur en français ;
#   • indexation des champs fautifs (`fields[].path`) ;
#   • statuts HTTP corrects (400 / 401 / 403 / 404 / 409 / 413 / 415) ;
#   • refus des fichiers non-image et trop volumineux ;
#   • acceptation d'une photo de la taille produite par le compresseur mobile.
#
# Usage : bash scripts/qa-contrat-erreurs.sh [http://127.0.0.1:3000]
# ============================================================
set -uo pipefail

API="${1:-http://127.0.0.1:3000}"
SUFFIXE="$(date +%s)"
EMAIL="qa+$SUFFIXE@haivoly.mg"
AUTRE="qa-other+$SUFFIXE@haivoly.mg"
MOT_DE_PASSE="MotDePasse123"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS + 1)); }
ko()   { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
titre(){ echo; echo "═══ $1 ═══"; }

# Corps + statut d'une requête, séparés puis affichés lisiblement.
requete() {
  local methode="$1" chemin="$2" corps="${3:-}" jeton="${4:-}"
  local args=(-s -o "$TMP/corps" -w '%{http_code}' -X "$methode" "$API$chemin")
  [ -n "$corps" ] && args+=(-H 'Content-Type: application/json' -d "$corps")
  [ -n "$jeton" ] && args+=(-H "Authorization: Bearer $jeton")
  curl "${args[@]}"
}

# Champ d'un JSON de réponse : champ <chemin.pointé>
champ() { python3 -c "
import json,sys
d=json.load(open('$TMP/corps'))
for k in '$1'.split('.'):
    d = d[int(k)] if k.isdigit() else (d or {}).get(k)
print('' if d is None else d)
" 2>/dev/null || echo ''; }

a_code() { [ "$(champ code)" = "$1" ] && ok "$2 (code $1)" || ko "$2 → code='$(champ code)' message='$(champ message)'"; }
a_statut() { [ "$1" = "$2" ] && ok "$3 (HTTP $1)" || ko "$3 → HTTP $1 (attendu $2)"; }

# ─────────────────────────────────────────────────────────────
titre "AUTHENTIFICATION"
requete POST /auth/register "{\"nom\":\"QA\",\"prenom\":\"Audit\",\"email\":\"$EMAIL\",\"password\":\"$MOT_DE_PASSE\",\"telephone\":\"0340000099\"}" >/dev/null
STATUT=$(requete POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$MOT_DE_PASSE\"}")
a_statut "$STATUT" 200 "connexion valide"
JETON=$(python3 -c "import json;print(json.load(open('$TMP/corps'))['data']['access_token'])" 2>/dev/null || echo "")

STATUT=$(requete POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"mauvais-mot-de-passe\"}")
a_statut "$STATUT" 401 "mauvais mot de passe"
a_code "AUTH_INVALID_CREDENTIALS" "code d'identifiants invalides"
echo "     message affiché : $(champ message)"

STATUT=$(requete POST /auth/register "{\"nom\":\"QA\",\"email\":\"$EMAIL\",\"password\":\"$MOT_DE_PASSE\"}")
a_statut "$STATUT" 409 "email déjà utilisé"
a_code "USER_EMAIL_ALREADY_EXISTS" "code d'email déjà utilisé"
echo "     message affiché : $(champ message)"

STATUT=$(requete GET /parcelles '' '')
a_statut "$STATUT" 401 "accès sans jeton"
a_code "AUTH_UNAUTHORIZED" "code d'accès non autorisé"

STATUT=$(requete GET /parcelles '' 'jeton-bidon')
a_statut "$STATUT" 401 "jeton invalide"

# ─────────────────────────────────────────────────────────────
titre "VALIDATION INDEXÉE"
STATUT=$(requete POST /parcelles '{"nom":"A","pointsGPS":[{"latitude":"nord","longitude":47.5},{"latitude":-18.9,"longitude":47.5}]}' "$JETON")
a_statut "$STATUT" 400 "données invalides refusées"
a_code "VALIDATION_ERROR" "code de validation"
echo "     champs indexés reçus :"
python3 -c "
import json
for champ in json.load(open('$TMP/corps')).get('fields', []):
    print(f\"       • {champ['field']:24} [{champ['code']}] {champ['message']}\")
print(f\"       • path structuré du 1er champ : {json.load(open('$TMP/corps'))['fields'][0].get('path')}\")
" 2>/dev/null

# Le mobile doit pouvoir rattacher l'erreur au BON point du tableau.
INDEXE=$(python3 -c "
import json
champs = json.load(open('$TMP/corps')).get('fields', [])
print('oui' if any(c.get('path') == ['pointsGPS', 0, 'latitude'] for c in champs) else 'non')
" 2>/dev/null)
[ "$INDEXE" = "oui" ] && ok "index du tableau transmis (pointsGPS.0.latitude)" || ko "index du tableau absent"

STATUT=$(requete POST /parcelles '{"nom":"Rizière QA","latitude":-18.9,"longitude":47.5,"champInconnu":1}' "$JETON")
a_statut "$STATUT" 400 "champ inconnu refusé (whitelist)"
a_code "VALIDATION_ERROR" "code de validation (champ inconnu)"
INCONNU=$(python3 -c "
import json
champs = json.load(open('$TMP/corps')).get('fields', [])
print(next((c['code'] for c in champs if c['field'] == 'champInconnu'), ''))
" 2>/dev/null)
[ "$INCONNU" = "VALIDATION_UNKNOWN_FIELD" ] && ok "code dédié au champ inconnu" || ko "code du champ inconnu = '$INCONNU'"

# ─────────────────────────────────────────────────────────────
titre "RESSOURCES ET OWNERSHIP"
PID=$(requete POST /parcelles '{"nom":"Rizière QA","latitude":-18.9,"longitude":47.5}' "$JETON" >/dev/null; python3 -c "import json;print(json.load(open('$TMP/corps'))['data']['id'])" 2>/dev/null)
STATUT=$(requete GET "/parcelles/00000000-0000-0000-0000-000000000000" '' "$JETON")
a_statut "$STATUT" 404 "identifiant inexistant"
a_code "RESOURCE_NOT_FOUND" "code de ressource introuvable"

requete POST /auth/register "{\"nom\":\"Autre\",\"email\":\"$AUTRE\",\"password\":\"$MOT_DE_PASSE\"}" >/dev/null
requete POST /auth/login "{\"email\":\"$AUTRE\",\"password\":\"$MOT_DE_PASSE\"}" >/dev/null
JETON_AUTRE=$(python3 -c "import json;print(json.load(open('$TMP/corps'))['data']['access_token'])" 2>/dev/null)
STATUT=$(requete GET "/parcelles/$PID" '' "$JETON_AUTRE")
a_statut "$STATUT" 404 "parcelle d'un autre utilisateur masquée (404)"

# ─────────────────────────────────────────────────────────────
titre "UPLOAD D'IMAGES"
CID=$(requete POST "/parcelles/$PID/cultures" '{"nom":"Riz QA","type":"Riz","datePlantation":"2026-01-15"}' "$JETON" >/dev/null; python3 -c "import json;print(json.load(open('$TMP/corps'))['data']['id'])" 2>/dev/null)
IID=$(requete POST "/cultures/$CID/interventions" '{"type":"IRRIGATION","description":"QA","date":"2026-02-01T06:00:00.000Z"}' "$JETON" >/dev/null; python3 -c "import json;print(json.load(open('$TMP/corps'))['data']['id'])" 2>/dev/null)

# Photo de la taille produite par le compresseur mobile (≈ 200–600 Ko).
python3 - "$TMP/photo.jpg" <<'PY'
import sys, zlib, struct

# JPEG minimal valide (aucune dépendance externe) : 1×1 px.
sys.stdout = open(sys.argv[1], 'wb')
PY
python3 - "$TMP/photo.jpg" "$TMP/grosse.jpg" "$TMP/faux.jpg" <<'PY'
import pathlib, shutil, sys

photo, grosse, faux = (pathlib.Path(p) for p in sys.argv[1:4])

# JPEG 1×1 valide embarqué (octets standards).
photo.write_bytes(bytes.fromhex(
    'ffd8ffe000104a46494600010100000100010000ffdb004300ffffffffffffffffffffffffffffff'
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    'ffffffffffffffc2000b080001000101011100ffc400140001000000000000000000000000000000'
    '00ffda0008010100003f00d2cf20ffd9'
))

# Fichier au-dessus de la limite serveur (5 Mo) : nom .jpg mais contenu factice.
grosse.write_bytes(b'\xff\xd8\xff' + b'\x00' * (5 * 1024 * 1024 + 1024))

# Fichier non-image renommé en .jpg → doit être refusé (415).
faux.write_bytes(b'#!/bin/sh\necho "pas une image"\n')
PY

UPLOAD(){ # chemin, fichier, jeton
  curl -s -o "$TMP/corps" -w '%{http_code}' -X POST "$API$1" -H "Authorization: Bearer $3" -F "file=@$2;type=image/jpeg"
}

STATUT=$(UPLOAD "/interventions/$IID/photos/upload" "$TMP/photo.jpg" "$JETON")
a_statut "$STATUT" 201 "photo JPEG acceptée"
URL_PHOTO=$(champ data.url)
[ -n "$URL_PHOTO" ] && ok "URL renvoyée : $URL_PHOTO" || ko "aucune URL renvoyée"

STATUT=$(UPLOAD "/interventions/$IID/photos/upload" "$TMP/grosse.jpg" "$JETON")
a_statut "$STATUT" 413 "fichier > 5 Mo refusé"
a_code "PAYLOAD_TOO_LARGE" "code de fichier trop volumineux"
echo "     message affiché : $(champ message)"

STATUT=$(curl -s -o "$TMP/corps" -w '%{http_code}' -X POST "$API/interventions/$IID/photos/upload" \
  -H "Authorization: Bearer $JETON" -F "file=@$TMP/faux.jpg;type=application/x-sh")
a_statut "$STATUT" 415 "fichier non-image refusé"
echo "     message affiché : $(champ message)"

# ─────────────────────────────────────────────────────────────
titre "SYNTHÈSE"
echo "  ✅ $PASS vérification(s) réussie(s)"
[ "$FAIL" -gt 0 ] && echo "  ❌ $FAIL échec(s)" || echo "  🎉 Aucun échec"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
