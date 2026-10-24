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
    supabase/catalog_coc_items.sql  biblioteca de itens/armas do CoC (aplicar uma vez; 449 itens)
    supabase/updated_at_trigger.sql  trigger que carimba updated_at no servidor (aplicar ANTES de publicar esta versão)
    supabase/user_systems.sql  sistemas próprios sincronizados com a conta (aplicar uma vez; precisa do updated_at_trigger.sql)
    js/util.js        utilitários comuns ($, $$, wait, rnd, clamp, esc, fmt, cloudError, warn)
    js/op.js          lógica da OP
    js/coc.js         lógica do CoC
    js/dicefx.js      dados 3D com física (OP e CoC, paleta própria de cada um); carrega js/vendor/* sob demanda
    js/assets.js      imagens de fundo da OP
    js/vendor/        three.js, cannon.js, motor de dados
    img/ e assets/    imagens e som dos dados (antes eram base64 dentro do HTML)

## Nuvem (js/cloud.js)
- Um único cliente Supabase: o CoC reaproveita o da página-mãe (evita duas sessões brigando pelo mesmo token).
- OP e CoC gravam pelo mesmo `Cloud.saveSheet` (com controle de conflito).
- `updated_at` é carimbado pelo Postgres (trigger em `character_sheets` e `user_profiles`, ver `supabase/updated_at_trigger.sql`); o front não envia mais esse campo, só compara a versão devolvida. Sem o trigger o conflito não é detectado (o console avisa).
- Falhas que antes eram engolidas (`catch{}`) ao gravar, sincronizar ou excluir agora vão para o console via `Util.warn(contexto, erro)` (no máx. 1 aviso por contexto a cada 30 s). `catch{}` vazio ficou só onde é inofensivo (foco, scroll, vibração, leitura de `localStorage`).
- Indicador fixo no topo: sincronizando / salvo / falhou / conflito. Após 3 falhas seguidas a OP também mostra aviso na tela.
- CoC agora guarda a versão (`updated_at`) da ficha aberta e pausa a sincronização se a nuvem mudou (como a OP já fazia).

## Personagens na conta (login com Google)
Quem entra na conta tem todos os personagens sincronizados sozinho, sem apertar nada:
- Ao entrar, os personagens deste aparelho (ficha aberta + guardados, OP e CoC) sobem para a conta; os que só existem na conta descem para o aparelho.
- Cada alteração da ficha aberta é enviada em ~1 s. Ao voltar para a aba/app ou quando a internet volta, confere o que mudou em outros aparelhos (no máx. a cada 20 s).
- Mudou nos dois lugares: guarda as duas versões ("… (da nuvem)"), nunca sobrescreve em silêncio.
- Excluir um personagem aqui também exclui da conta (fica na fila e vai quando houver internet); excluído em outro aparelho some aqui se não foi mexido.
- Entrar com outra conta no mesmo aparelho pergunta antes de enviar os personagens dele para a conta nova.
- O retrato (OP e CoC) fica no bucket privado `account-avatars`, e a ficha guarda só o caminho (`sb:<user_id>/…`). Sem login, ou se o envio falhar, o retrato fica dentro da ficha e é movido para o bucket no próximo sincronismo. A OP leva o sistema (molde) dentro da ficha.
- Os vínculos ficam em `D.cl` (OP, dentro da ficha) e em `coc-cloud-v1` (CoC). O motor está em `js/cloud.js` (`syncAll`, `pushLive`).
- Ainda não sincronizam: a biblioteca de sistemas personalizados da OP (`LIBK`) e as preferências de aparência.

## Biblioteca do CoC no Supabase
`js/coc.js` lê `catalog_coc_items` (leitura pública, como os catálogos da OP). Rode `supabase/catalog_coc_items.sql` uma vez. Se a tabela estiver vazia ou o Supabase falhar, usa o último download em cache (`coc-catalog-v1`) e, sem isso, a lista embutida no `coc.js`. Para corrigir/adicionar item, edite a linha na tabela (campo `weapon` só para armas).

## Supabase (conferido em 19/10/2026)
- `character_sheets`: RLS ligado, políticas só do próprio `user_id`; coluna `campaign` ('op' | 'coc').
- `user_profiles`: RLS, cada usuário só lê/grava o próprio perfil.
- Buckets: `ficha-assets` (público, só leitura) e `account-avatars` (privado, cada usuário só mexe na própria pasta `<user_id>/`).
- Catálogos (`catalog_*`, `game_catalogs`): leitura pública, sem escrita.
- `campaigns`: RLS ligado e sem políticas (fechada); este front não usa.
- Todas as imagens do CoC (logo, fundo, card em Sistemas/Meus agentes e ícones) vêm do bucket `ficha-assets`; nada depende do GitHub e não há mais imagem local do CoC (só o som dos dados, `assets/dice.mp3`).
- O login é só pelo Google (não há senha nem link por e-mail), então "Leaked password protection" não se aplica. No painel Auth, o provedor Email pode ser desativado para não deixar a porta aberta.

## Pendente
- Os helpers específicos de cada sistema (toast, modais, edge, shake, parseF/evalF) continuam em op.js e coc.js porque o HTML e o comportamento são diferentes.

## Dentro da ficha (OP)
- O botão de novo agente do topo da ficha fica escondido (o menu continua criando fichas por ele, por isso o elemento existe).
- Engrenagem e backup abrem as configurações sem a barra do menu, com "Voltar à ficha" (Esc também volta para a ficha). Pelo menu, continua como antes.

## Segurança (notas)
- Toda ficha que entra de fora (importar arquivo, código `RPG1:`, nuvem) passa por `normalize()`, que força IDs numéricos, limita textos, valida avatar e descarta `__proto__`. Não renderize dados de ficha sem passar por ele.
- Pendente: o `supabase-js` vem do jsDelivr sem SRI. Gere o hash e coloque no `<script>` de `index.html` e `coc.html`:
  `curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.100.1 | openssl dgst -sha384 -binary | openssl base64 -A`
  (use `integrity="sha384-HASH" crossorigin="anonymous"`) ou copie o arquivo para `js/vendor/`.
- Pendente: exporte as políticas de RLS de `character_sheets`, `user_profiles` e dos buckets para `supabase/*.sql`.

## Biblioteca online (marketplace + links)
Menu → **Biblioteca** (também no menu inicial). Ao clicar em **Compartilhar** (personagem ou sistema) a pessoa escolhe **Só por link** ou **Marketplace**, e se inclui a foto (miniatura JPEG guardada na própria linha, coluna `thumb`).
- Marketplace: catálogo aberto com busca, filtros e ordenação. Clicar abre o detalhe (nome, foto, descrição, atributos básicos) com **Adicionar à minha biblioteca** ou **Ver tudo** (ficha completa somente leitura). Quem não tem conta também vê e copia.
- `supabase/shared_items.sql`: tabela, RLS e funções (`get_shared`, `register_copy`, `report_shared`). Aplique **antes** de publicar o front. Pode rodar mais de uma vez (também serve de atualização); precisa do `updated_at_trigger.sql` antes.
- `js/share.js`: acesso ao Supabase. As telas ficam no bloco "BIBLIOTECA ONLINE" do `js/op.js`. `js/coc-names.js` só guarda os nomes das perícias do CoC para a visualização somente leitura (regenere se mudar `SK0` em `coc.js`).
- Limites no servidor: 60 itens por conta, 30 no marketplace, 15 publicações por hora, 400 kB por item, miniatura até 40 kB.
- Moderação: 5 denúncias de contas diferentes escondem o item sozinho; você revisa e restaura no SQL Editor (comandos no fim do `shared_items.sql`).
- O que chega de fora nunca é confiado: sistemas passam por `cleanMold()`, fichas por `normalize()` ao abrir, e a visualização somente leitura monta só valores limpos, via `textContent`.
- O JSON/código `RPG1:` continua como backup offline (Configurações e editor de sistemas).

## Publicar vários personagens / capa do sistema (v18)
- Cada personagem tem um `pid` próprio e é publicado com a chave `pid:…` (não muda quando a ficha ganha vínculo com a nuvem). Cópias com o mesmo `pid` (ex.: "… (da nuvem)") ganham um pid novo ao publicar, então uma publicação nunca troca o conteúdo de outra.
- A janela de publicar tem "Atualizar a publicação existente" ou "Publicar como novo item" (`asNew` em `Share.publish`).
- Sistemas próprios aceitam imagem de capa: botão direto no detalhe do sistema (Sistemas) e no editor. A capa vira a foto do sistema ao compartilhar.
- O card "Ficha aberta" da tela Sistemas foi removido.

## Imagens: enquadrar antes de confirmar (v19)
- `js/imgcrop.js` (usado por `index.html` e `coc.html`): janela para arrastar, ampliar (roda, pinça ou controle) e confirmar. Vale para o retrato da ficha (OP e CoC), a foto e o banner do perfil e as imagens do sistema.
- Sistemas próprios têm três imagens: foto (quadrada), banner e logo (campos `pic`, `img`, `logo` na biblioteca). Cada uma aceita envio ou um padrão do site (`site:id`); sem escolha vale o padrão do site (banner `img/for.jpg`, logo do site). Sincronizam com a conta e vão junto ao compartilhar.
