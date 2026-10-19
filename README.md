# Ficha RPG

Duas fichas num só projeto: **Ordem Paranormal** (`index.html`) e **Call of Cthulhu** (`coc.html`, aberto dentro do menu).

## Como abrir
Precisa de servidor (não abre mais com duplo clique, porque o CoC roda num iframe). Na pasta:

    python3 -m http.server 8000     # depois abra http://localhost:8000

Ou publique a pasta inteira (GitHub Pages, Netlify, etc.).

## Estrutura
    index.html        ficha Ordem Paranormal (só a marcação)
    coc.html          ficha Call of Cthulhu
    css/op.css        estilos da OP
    css/coc.css       estilos do CoC
    js/config.js      URL/chave do Supabase, tabela, bucket (um lugar só)
    js/cloud.js       nuvem compartilhada: 1 cliente Supabase, saveSheet() com controle de conflito, indicador de status
    js/announce.js    aviso em pop-up no menu (lê public.announcements; teste: ?anuncio=demo)
    supabase/announcements.sql  tabela dos avisos (aplicar uma vez)
    js/util.js        utilitários comuns ($, $$, wait, rnd, clamp, esc, fmt, cloudError)
    js/op.js          lógica da OP
    js/coc.js         lógica do CoC
    js/dicefx.js      dados 3D com física (OP e CoC, paleta própria de cada um); carrega js/vendor/* sob demanda
    js/assets.js      imagens de fundo da OP
    js/vendor/        three.js, cannon.js, motor de dados
    img/ e assets/    imagens e som dos dados (antes eram base64 dentro do HTML)

## Nuvem (js/cloud.js)
- Um único cliente Supabase: o CoC reaproveita o da página-mãe (evita duas sessões brigando pelo mesmo token).
- OP e CoC gravam pelo mesmo `Cloud.saveSheet` (com controle de conflito).
- Indicador fixo no topo: sincronizando / salvo / falhou / conflito. Após 3 falhas seguidas a OP também mostra aviso na tela.
- CoC agora guarda a versão (`updated_at`) da ficha aberta e pausa a sincronização se a nuvem mudou (como a OP já fazia).

## Supabase (conferido em 19/10/2026)
- `character_sheets`: RLS ligado, políticas só do próprio `user_id`; coluna `campaign` ('op' | 'coc').
- `user_profiles`: RLS, cada usuário só lê/grava o próprio perfil.
- Buckets: `ficha-assets` (público, só leitura) e `account-avatars` (privado, cada usuário só mexe na própria pasta `<user_id>/`).
- Catálogos (`catalog_*`, `game_catalogs`): leitura pública, sem escrita.
- `campaigns`: RLS ligado e sem políticas (fechada); este front não usa.
- Todas as imagens do CoC (logo, fundo, card em Sistemas/Meus agentes e ícones) vêm do bucket `ficha-assets`; nada depende do GitHub e não há mais imagem local do CoC (só o som dos dados, `assets/dice.mp3`).
- Falta (painel Auth): ligar "Leaked password protection" (baixo impacto, o login é por link no e-mail).

## Pendente
- Os helpers específicos de cada sistema (toast, modais, edge, shake, parseF/evalF) continuam em op.js e coc.js porque o HTML e o comportamento são diferentes.

## Dentro da ficha (OP)
- O botão de novo agente do topo da ficha fica escondido (o menu continua criando fichas por ele, por isso o elemento existe).
- Engrenagem e backup abrem as configurações sem a barra do menu, com "Voltar à ficha" (Esc também volta para a ficha). Pelo menu, continua como antes.
