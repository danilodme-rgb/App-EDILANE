# Instruções do projeto

Base para qualquer trabalho neste repositório.

## 1. O app publicado tem que se atualizar sozinho

Regra principal: **quando alguma coisa muda, quem já usa o app recebe a
mudança sem precisar reinstalar, limpar cache ou apertar nada.**

O que isso exige, e que já está implementado — não regrida nenhum destes pontos:

- **Service worker em "rede primeiro"** (`sw.js`). Cache-first congela o app
  na versão antiga para sempre. O cache existe só como reserva para uso
  offline, nunca como fonte principal.
- **Bypass do cache HTTP** no `fetch` do service worker
  (`new Request(req, { cache: 'no-store' })`). Sem isso o GitHub Pages serve
  a versão anterior por até 10 minutos (`Cache-Control: max-age=600`).
- **Nome de cache versionado por build.** O CI substitui `__BUILD__` pelo SHA
  do commit, e o `activate` apaga os caches antigos.
- **`skipWaiting()` + `clients.claim()`**, para a versão nova assumir na hora
  em vez de esperar todas as abas fecharem.
- **Recarregamento automático** da página no evento `controllerchange`
  (`app.js`), ignorando a primeira tomada de controle, que é a instalação e
  não uma atualização.
- **Publicação automática**: `.github/workflows/pages.yml` publica no GitHub
  Pages a cada push na `main`. Nenhum passo manual de deploy.

Ao mexer em cache, service worker ou workflow, teste o ciclo completo:
instalar a versão 1, publicar a versão 2, confirmar que a tela mudou sozinha,
e confirmar que o app **ainda abre offline**.

## 2. Sem dependências e sem build

HTML, CSS e JavaScript puros, servidos como arquivos estáticos. Não introduza
framework, bundler, gerenciador de pacotes ou etapa de compilação sem pedido
explícito. Rodar o app é abrir o `index.html`.

## 3. Idioma

Interface, mensagens, comentários de código, commits e nomes de variáveis em
**português do Brasil**. Este app é entregue a uma usuária final, não a
desenvolvedores: os textos falam a língua dela.

## 4. Os dados são da usuária

Tudo em `localStorage`, no aparelho. Nada de servidor, telemetria, analytics
ou envio de dados para terceiros. Ao mudar o formato do estado, mantenha a
leitura tolerante a dados antigos (o `load()` valida campo a campo e cai em
padrão quando falta).

## 5. Identidade visual

Paleta verde nos tons escuro e claro, com tema claro e escuro completos. Toda
cor sai dos tokens CSS no `:root`; nenhuma cor definida apenas dentro de um
bloco de tema, senão um dos dois temas quebra. O app tem identidade própria
(nome, símbolo de folha, saudação) — não é cópia de marca de outro app.

## 6. Testar no navegador antes de publicar

Mudança de interface se verifica renderizando de verdade, com Chromium
headless (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`), não só lendo
o código. Confira o console limpo, e meça o comportamento, não a aparência
dele: para rolagem, meça a posição real do elemento na tela — `window.scrollY`
mente quando o `body` está travado com `position: fixed`.

## 7. Fluxo de git

- Desenvolver em branch, abrir PR para a `main`, e deixar o merge para o dono
  do repositório.
- O merge na `main` publica em produção automaticamente. Trate a `main` como
  o app no ar.
