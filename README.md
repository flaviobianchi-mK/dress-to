# Dress To — Fluxo assistido (mKFashion+)

Protótipo web para a **personal shopper** montar um look Dress To, gerar um provador virtual a partir da foto da cliente e copiar imagem + referências para colar no **Omnichat** (WhatsApp).

Não é loja do consumidor: é **modo operador** — atendimento assistido, um look por vez.

---

## O que o app faz

1. **Login** da shopper (protótipo: qualquer email/senha válidos).
2. **Monta o look** buscando peças no catálogo (SKU, nome ou várias refs de uma vez).
3. **Envia a foto** da cliente (ajuste 9:16 automático; recorte manual opcional) e **informa medidas** (altura, peso, idade).
4. **Gera o provador** (foto fixa de resultado no protótipo).
5. **Copia** a imagem e as referências das peças para colar no Omnichat.
6. **Guarda** histórico e favoritos no navegador para reabrir looks.

Catálogo com peças reais de [dressto.com.br](https://www.dressto.com.br), incluindo o [Macacão Punho Barra](https://www.dressto.com.br/macacao-punho-barra-07231137-2109/p) (primeiro resultado ao buscar “macacão”).

### Look

Um look tem no máximo **3 peças**, uma por categoria:

| Slot        | Exemplos                          |
|-------------|-----------------------------------|
| Parte de cima | blusa, vestido, macacão         |
| Parte de baixo | calça, short, saia              |
| Acessório   | bolsas                            |

Trocar uma peça da mesma categoria substitui a anterior.

---

## Fluxo do usuário (modo atual)

O layout padrão é o **workspace** (tela unificada). O modo clássico em etapas ainda existe no código, mas os toggles de layout ficam ocultos em produção.

```
Login
  → Catálogo (busca + lookbar)
      → Workspace
          · foto da cliente (upload; crop opcional) + medidas ao lado
          · resumo do look
          · Gerar look
          · resultado: copiar imagem / salvar / copiar refs / favoritar
  → Biblioteca (favoritos ou histórico) a qualquer momento
```

### Catálogo

- Entrada principal: **busca** por nome, SKU/ref ou várias SKUs coladas (separadas por vírgula).
- Filtros (categoria, cor, tipo) abrem na lookbar e animam no fluxo da página.
- Resultados: marcar/adicionar peça a peça; itens já no look ficam no topo.
- Lookbar: **busca + filtros + Continuar no topo**, depois thumbs do look.

### Workspace

- Coluna da foto **ao lado** do painel de medidas (altura, peso, idade) + coluna do resultado (quando houver geração).
- Upload aplica a foto na hora; **Recortar** abre o crop 9:16 só se a shopper quiser.
- Recomendação de tamanho: UI pronta, tabelas Dress To ainda **pendentes** (sem cálculo na V1).
- Look flutuante na base enquanto gera/copia.
- Ações pós-geração: **Copiar imagem** (foco para Omnichat), salvar PNG, copiar cada `ref`, favoritar, novo atendimento.

### Biblioteca

- **Histórico**: até 24 looks gerados (localStorage).
- **Favoritos**: até 24 looks marcados.
- Reabrir um look restaura peças + imagem do resultado.

---

## Como funciona por dentro

### Stack

| Camada        | Tecnologia                                      |
|---------------|-------------------------------------------------|
| UI            | Vue 3 (CDN `vue.global.prod.js`), Options API   |
| Estilo        | CSS tokens + folhas por domínio via `app.css`   |
| Hospedagem    | Firebase Hosting (`mkfashion-dress-to`)         |
| Deploy        | GitHub Actions no merge em `main`               |

SPA estática: abrir `index.html` carrega `js/app.js` como módulo ES. Sem build step.

### Arquivos principais

```
index.html                 # shell + Vue CDN
js/app.js                  # estado global, navegação, geração, cópia
js/catalog-data.js         # catálogo mock + categorias/cores
js/clipboard.js            # copiar texto/imagem + composeTryOn (mock)
js/looks-store.js          # histórico/favoritos (localStorage)
js/image.js                # validação/processamento de foto
components/                # telas e UI
css/
  tokens.css               # design tokens
  icons.css                # material symbols
  app.css                  # entry: @import das folhas abaixo
  base.css                 # reset, shell, surfaces
  buttons.css
  login.css
  upload.css
  catalog.css              # busca, filtros, grid
  catalog-cards.css        # cards grid/list
  lookbar.css
  generate-result.css
  workspace.css
  crop.css
  library.css
  feedback.css             # skeleton, loading, toast
  layout.css
  responsive.css
.github/workflows/         # deploy Firebase Hosting
```

### Estado e persistência

| Dado              | Onde              | Chave / nota                          |
|-------------------|-------------------|---------------------------------------|
| Sessão shopper    | `sessionStorage`  | `dt-shopper-auth`                     |
| Look atual        | memória (Vue)     | `selected`, `photo`, `clientMeasures`, `resultUrl` |
| Histórico         | `localStorage`    | `dt-looks-history` (máx. 24)          |
| Favoritos         | `localStorage`    | `dt-looks-favorites` (máx. 24)        |

Logout limpa a sessão, o look atual e as medidas; histórico/favoritos permanecem no browser.

### Provador virtual (mock)

`composeTryOn` em `js/clipboard.js` **sempre** devolve a foto fixa `assets/results/try-on-result.png`, independentemente da foto da cliente ou das peças.

Retorna `dataUrl` + `blob` para exibir, copiar, salvar e histórico. Trocar a imagem do asset (ou a função) basta para mudar o resultado do protótipo.

### Navegação (`step`)

Valores usados: `catalog` | `workspace` | `favorites` | `history`  
(e no modo clássico: `upload` | `generate` | `result`)

Regras em `canGoTo`: workspace exige peças ou resultado; gerar exige foto + peças + medidas (altura/peso/idade).

---

## Rodar local

Sem instalação:

```bash
# na pasta dress-to — qualquer servidor estático
npx serve .
# ou
python -m http.server 8080
```

Abra a URL no browser (HTTPS ou localhost para Clipboard API de imagem).

Login de teste: qualquer email + senha preenchidos.

---

## Deploy

Push/merge em `main` dispara `.github/workflows/firebase-hosting-merge.yml` → Firebase Hosting projeto `mkfashion-dress-to`, canal `live`.

PRs podem ganhar preview channel via `firebase-hosting-pull-request.yml`.

---

## Limitações do protótipo

- Login não autentica de verdade (só guarda sessão).
- Catálogo é mock local (imagens reutilizadas em variantes).
- Provador devolve sempre a mesma foto fixa (`assets/results/try-on-result.png`).
- Recomendação de tamanho: UI de medidas pronta; **tabelas Dress To ainda não integradas** (sem cálculo).
- Sem backend / Omnichat API — cópia manual via clipboard.
- Histórico e favoritos só neste browser.
