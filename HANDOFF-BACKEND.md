# Handoff backend — Dress To (mKFashion+)

**Para:** dev backend  
**Versão front:** `0.1.9`  
**Contexto:** protótipo front estático pronto para operação assistida; **não existe API hoje**.  
**Repo:** https://github.com/flaviobianchi-mK/dress-to.git  
**Live:** https://mkfashion-dress-to.web.app/ · Hosting Firebase `mkfashion-dress-to`

Linear de referência: [PROD-2481](https://linear.app/metakosmos/issue/PROD-2481/dress-to-mkf-inserir-recomendacao-de-tamanho-na-jornada) — recomendação de tamanho na jornada.

---

## TL;DR

Ferramenta de **personal shopper** (não loja): monta look Dress To (≤3 peças), sobe foto da cliente + medidas, mostra **recomendação de tamanho por peça** (stub), gera provador virtual, copia imagem + refs para colar no **Omnichat/WhatsApp**.

O front é Vue 3 CDN, sem bundler, sem SDK Firebase no runtime. Auth, catálogo, try-on, tamanho e biblioteca são **mocks locais**. Seu trabalho é definir e entregar a camada de servidor (e contratos) para substituir esses mocks.

Leia primeiro: `README.md` → `js/app.js` → `js/catalog-data.js` → `js/clipboard.js` → `js/size-recommend.js` → `js/looks-store.js`.

---

## Fluxo do produto (modo atual)

```
Login
  → Catálogo (busca / multi-SKU / filtros + lookbar)
      → Workspace (foto + crop opcional 9:16 + medidas + tamanhos | Gerar | resultado)
  ↔ Biblioteca (favoritos | histórico) — também exibe tamanhos por peça
```

| Etapa | O que a shopper faz | O que o backend precisa pensar |
|-------|---------------------|--------------------------------|
| Login | email + senha | Auth real |
| Catálogo | busca por nome/SKU, filtros Dress To, monta look | Fonte de verdade do catálogo (VTEX/Dress To?) |
| Workspace | foto + altura/peso/idade + vê tamanho por peça | Storage de foto + **API de tamanho** + pipeline de geração |
| Resultado | copiar imagem / refs / favoritar | Persistência de looks; Omnichat opcional |
| Biblioteca | reabrir looks com tamanhos sugeridos | History/favorites por shopper (+ `recommendedSize`) |

**Regra do look:** no máx. 1 peça por slot — `cima` | `baixo` | `acessorio`.

**Lookbar (UI):** busca/continuar no topo → look montado → painel de filtros abaixo do look.

---

## Arquitetura atual (front)

| Camada | Realidade |
|--------|-----------|
| UI | Vue 3 CDN, Options API, ES modules |
| CSS | `app.css` importa folhas por domínio (`base`, `catalog`, `workspace`, `library`…) |
| Classes | kebab-case (`dt-lookbar-search`); modifiers `--` (`dt-btn--primary`) |
| Build | Nenhum |
| Backend | **Não existe** |
| Persistência | `sessionStorage` (auth) + `localStorage` (looks) |
| Hosting | Firebase Hosting · CI no merge em `main` |
| Env runtime | Nenhum `.env` usado pelo app |

---

## Contratos que o front já “espera”

Não há rotas HTTP. Shapes e call sites abaixo são os alvos de integração.

### 1. Peça do catálogo

Fonte: `js/catalog-data.js` (`CATALOG`)

```js
{
  id: 'dt-48624',
  ref: '07.23.1137_2109',
  name: 'Macacão Punho Barra',
  category: 'cima',         // 'cima' | 'baixo' | 'acessorio'
  color: 'vermelho',
  price: 599,
  image: './assets/catalog/dt-48624.png',
  boost: 100,               // opcional
  url: 'https://www.dressto.com.br/...' // opcional
}
```

Busca FE (`CatalogScreen.js`): nome / ref / id; multi-SKU; filtros `FILTER_KEYWORDS` / `VESTIDO_FILTERS`; ranking `boost` + tokens.

→ `GET /catalog/search?q=&filters=` (ou sync) devolvendo esse shape.

### 2. Auth shopper

Hoje: qualquer email+senha → `{ email, name }` em `sessionStorage` (`dt-shopper-auth`).

→ Login real + sessão/token.

### 3. Foto da cliente

Browser (`js/image.js`): JPG/PNG/WEBP, máx. 12 MB; crop opcional → JPEG **1080×1920 (9:16)**.

→ Storage + política PII se a geração for no servidor.

### 4. Medidas + recomendação de tamanho (PROD-2481)

Medidas na UI:

```js
{ heightCm: '', weightKg: '', age: '' }  // strings
```

**Stub atual** (`js/size-recommend.js`):

```js
EXAMPLE_SIZES = ['M', '38', 'U']

buildSizeRecommendations(pieces) → [{
  piece,
  pieceLabel: 'Peça 1',   // Peça N
  sizeLabel: 'M',         // ou piece.recommendedSize
  pending: false
}]
```

Exibido no **workspace** (abaixo das medidas) e na **biblioteca** (histórico/favoritos).

**Atenção:** no workspace, `canGenerate` exige só foto + ≥1 peça — medidas **não** bloqueiam. No upload clássico, medidas bloqueiam o continue. Alinhar regra de produto.

→ API real: input medidas (+ categoria/SKU da peça) → tamanho recomendado por peça. Substituir `exampleSizeForIndex` / `buildSizeRecommendations`.

### 5. Provador virtual (maior gap)

`runGeneration` → `composeTryOn(photoUrl, pieces)` → sempre `assets/results/try-on-result.png`.

```js
{ dataUrl: string, blob: Blob }
```

**Não envia hoje:** medidas, shopperId, lookId, tamanhos.

→ Job sync/async com URL estável (evitar data URL gigante no histórico).

### 6. Registro de look

`js/looks-store.js` — `localStorage`, máx. 24:

```js
{
  id: 'look-{ts}-{rand}',
  createdAt: number,
  resultUrl: string,  // data URL PNG hoje
  pieces: [{
    id, ref, name, category, color, price, image,
    recommendedSize  // ex.: 'M' | '38' | 'U' (stub)
  }]
}
```

→ Persistência por shopper + `resultUrl` hospedada + `recommendedSize` vindo da API de tamanho.

### 7. Omnichat

Sem API — Clipboard (imagem PNG + `piece.ref` texto + download). Integração send seria feature nova.

---

## O que está mock vs real

| Área | Status |
|------|--------|
| Login | Mock |
| Catálogo / busca / filtros | Mock local |
| Montagem do look | Client-only (OK) |
| Upload / crop de foto | Real no browser |
| Try-on / geração | Mock (PNG fixo) |
| Recomendação de tamanho | Stub UI + exemplos (`size-recommend.js`) |
| Cópia Omnichat | Clipboard manual |
| Histórico / favoritos | localStorage (+ `recommendedSize`) |
| Firebase Auth/DB/Storage | Não usados |

---

## Sugestão de escopo backend (prioridade)

### Must-have

1. **Catálogo vivo** — VTEX/Dress To; search SKU (batch) e nome  
2. **Pipeline de try-on** — foto + peças (+ medidas/tamanhos?) → imagem  
3. **Storage** — fotos cliente + resultados (retenção/PII)  
4. **Auth shopper**  

### Should-have

5. **Histórico & favoritos** server-side  
6. **API de recomendação de tamanho** (tabelas Dress To) — desbloqueia PROD-2481 de verdade  

### Nice-to-have

7. Omnichat send / deep-link  
8. Estoque / preço / variantes  

---

## Decisões em aberto

1. Fonte do catálogo: VTEX ao vivo vs DB espelhado?  
2. Try-on: vendor, sync vs fila, SLA?  
3. Medidas obrigatórias na geração? (UI coleta; workspace ainda não bloqueia)  
4. Onde roda a API? (FE permanece no Hosting)  
5. Histórico server-side na V1?  
6. Omnichat: clipboard ou integração?  
7. Quem define / versiona tabelas de tamanho Dress To?  

---

## Arquivos para ler

| Arquivo | Por quê |
|---------|---------|
| `README.md` | Produto, fluxo, limitações, versão |
| `js/app.js` | Estado, `runGeneration`, auth, favorite com `recommendedSize` |
| `js/catalog-data.js` | Schema da peça |
| `js/clipboard.js` | `composeTryOn` |
| `js/size-recommend.js` | Contrato do stub de tamanho |
| `js/looks-store.js` | Snapshot do look (+ `recommendedSize`) |
| `js/image.js` | Foto 9:16 |
| `components/CatalogScreen.js` | Busca + lookbar |
| `components/WorkspaceScreen.js` | Medidas + lista de tamanhos + gerar |
| `components/LooksLibraryScreen.js` | Tamanhos no histórico/favoritos |
| `firebase.json` / `.firebaserc` | Hosting only |

**Seams:** `CATALOG`, `composeTryOn`, `buildSizeRecommendations` / `exampleSizeForIndex`, `createLookRecord`, `onLogin`.

---

## Como rodar o front

```bash
npx serve .
# ou: python -m http.server 8080
```

Login de teste: qualquer email + senha.

---

## Nota de UI (não bloqueia backend)

- Classes CSS em kebab-case (`dt-size-rec-size`), sem `__` BEM element.  
- Lookbar: busca → look → filtros.  
- Header: logo + nav biblioteca + sessão — sem brand-mode (“Personal shopper · Dress To”); sem `LookFloatingBar`.  
- Workspace: conteúdo máx. **1280px**; “Look e foto prontos”; copiar imagem/refs no próprio canvas/dock.  
- Responsivo: **≤1100px** empilha colunas do workspace e libera scroll; dock em 1 coluna; nav compacta. **≤899px** refina canvas/medidas.  
- Biblioteca: tamanhos sugeridos nos cards.

---

## Próximo passo sugerido

1. Alinhar decisões em aberto (30–45 min com PM) — em especial **API de tamanho** (PROD-2481) e obrigatoriedade de medidas.  
2. OpenAPI draft: auth, catalog search, size recommend, generate, looks.  
3. Adapter mínimo no FE: começar por `composeTryOn` + `CATALOG` + `buildSizeRecommendations`.
