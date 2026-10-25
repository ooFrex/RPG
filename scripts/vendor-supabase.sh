#!/bin/sh
# Baixa o supabase-js UMA vez para js/vendor/supabase.js e mostra o hash.
# Depois disso o site deixa de depender do jsDelivr (o index.html/coc.html já procuram esse arquivo primeiro;
# se ele não existir, caem no CDN como antes). Rode na raiz do projeto:  sh scripts/vendor-supabase.sh
set -e
V=2.100.1
mkdir -p js/vendor
curl -fsSL "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@$V" -o js/vendor/supabase.js
test -s js/vendor/supabase.js || { echo "download vazio"; exit 1; }
echo "OK: js/vendor/supabase.js ($(wc -c < js/vendor/supabase.js) bytes)"
echo "sha384-$(openssl dgst -sha384 -binary js/vendor/supabase.js | openssl base64 -A)"
echo "Agora publique o projeto com esse arquivo junto."
