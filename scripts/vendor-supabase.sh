#!/bin/sh
# Atalho: o mesmo que "npm install && npm run vendor" (copia o supabase-js fixado para js/vendor/supabase.js).
set -e
npm install
npm run vendor
