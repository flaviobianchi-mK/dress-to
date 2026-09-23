# Handoff backend — Dress To (mKFashion+)

**Para:** dev backend  
**Contexto:** protótipo front estático pronto para operação assistida; **não existe API hoje**.  
**Repo:** `dress-to` · Hosting: Firebase `mkfashion-dress-to` (só static)

---

## TL;DR

Ferramenta de **personal shopper** (não loja): monta look Dress To (≤3 peças), sobe foto da cliente + medidas, gera provador virtual, copia imagem + refs para colar no **Omnichat/WhatsApp**.

O front é Vue 3 CDN, sem bundler, sem SDK Firebase no runtime. Auth, catálogo, try-on, histórico e favoritos são **mocks locais**. Seu trabalho é definir e entregar a camada de servidor (e contratos) para substituir esses mocks.

Leia primeiro: `README.md` → `js/app.js` → `js/catalog-data.js` → `js/clipboard.js` → `js/looks-store.js`.

---

## Fluxo do produto (modo atual)

```
Login
  → Catálogo (busca / multi-SKU / filtros + lookbar)
      → Workspace (foto + crop opcional 9:16 + medidas | Gerar | resultado)
  ↔ Biblioteca (favoritos | histórico)
```

| Etapa | O que a shopper faz | O que o backend precisa pensar |
|-------|---------------------|--------------------------------|
| Login | email + senha | Auth real (hoje qualquer credencial “válida”) |
| Catálogo | busca por nome/SKU, filtros Dress To, monta look | Fonte de verdade do catálogo (VTEX/Dress To?) |
| Workspace | foto cliente + altura/peso/idade | Storage de foto + pipeline de geração |
| Resultado | copiar imagem / refs / favoritar | Persistência de looks; Omnichat opcional |
| Biblioteca | reabrir looks | History/favorites por shopper |

**Regra do look:** no máx. 1 peça por slot — `cima` | `baixo` | `acessorio`. Trocar da mesma categoria substitui.

---

## Arquitetura atual (front)

| Camada | Realidade |
|--------|-----------|
| UI | Vue 3 CDN, Options API, ES modules |
| Build | Nenhum — abre `index.html` |
| Backend | **Não existe** |
| Persistência | `sessionStorage` (auth) + `localStorage` (looks) |
| Hosting | Firebase Hosting only · CI no merge em `main` |
| Env runtime | Nenhum `.env` usado pelo app |

Deploy: `.github/workflows/firebase-hosting-*.yml` → canal `live` / preview de PR.  
Não há Cloud Functions, Firestore, Auth ou Storage configurados no app.

---

## Contratos que o front já “espera” (substituir mocks)

Não há rotas HTTP. Abaixo estão os **shapes e call sites** que o front usa hoje — alvos naturais de integração.

### 1. Peça do catálogo

Fonte: `js/catalog-data.js` (`CATALOG`)

```js
{
  id: 'dt-48624',
  ref: '07.23.1137_2109',   // SKU copiado pro Omnichat
  name: 'Macacão Punho Barra',
  category: 'cima',         // 'cima' | 'baixo' | 'acessorio'
  color: 'vermelho',        // preto|branco|rosa|bege|azul|vermelho
  price: 599,
  image: './assets/catalog/dt-48624.png', // URL absoluta no mundo real
  boost: 100,               // opcional — ranking de busca
  url: 'https://www.dressto.com.br/...'   // opcional
}
```

**Busca no FE hoje** (`CatalogScreen.js`):

- Nome, `ref`/SKU ou `id` (sem acento)
- Várias SKUs coladas (``, `;`, `\n`, `|` ou espaço se parecer SKU)
- Filtros por keywords do menu Dress To (`FILTER_KEYWORDS` / `VESTIDO_FILTERS`)
- Ranking: `boost` + score de tokens

→ Backend mínimo útil: `GET /catalog/search?q=&filters=` (ou sync full + search server-side) devolvendo esse shape.

### 2. Auth shopper

Hoje: qualquer email+senha não vazios → `{ email, name }` em `sessionStorage` (`dt-shopper-auth`).

→ Precisa: login real + sessão/token. Logout limpa look atual; histórico local hoje permanece no browser.

### 3. Foto da cliente

Processamento **já é no browser** (`js/image.js`):

- JPG/PNG/WEBP, máx. **12 MB**
- Crop opcional → JPEG **1080×1920 (9:16)**

→ Se a geração for no servidor: aceitar blob original ou 9:16; definir retention/PII (rosto da cliente).

### 4. Medidas

```js
{ heightCm: '', weightKg: '', age: '' }  // strings na UI
```

Coletadas no workspace. UI de recomendação de tamanho mostra **“Pendente”** — tabelas Dress To **não integradas**.

**Atenção:** no workspace, `canGenerate` exige só foto + ≥1 peça (medidas **não** bloqueiam). No fluxo clássico, medidas bloqueiam. Alinhar regra de produto.

### 5. Provador virtual (maior gap)

Call site: `runGeneration` em `js/app.js` → `composeTryOn(photoUrl, pieces)` em `js/clipboard.js`.

Mock atual: **sempre** devolve `assets/results/try-on-result.png`.

Contrato de retorno que o FE usa:

```js
{ dataUrl: string, blob: Blob }
```

**Não envia hoje:** medidas, shopperId, lookId.

→ Substituir por job sync ou async que devolva imagem (URL hospedada ou blob). Preferir URL estável (não data URL gigante) para histórico.

### 6. Registro de look (histórico / favoritos)

`js/looks-store.js` — hoje só `localStorage` (máx. 24 cada):

```js
{
  id: 'look-{ts}-{rand}',
  createdAt: number,
  resultUrl: string,   // hoje data URL PNG
  pieces: [{ id, ref, name, category, color, price, image }]
}
```

→ Persistência por shopper + `resultUrl` em storage (GCS/Firebase Storage/S3).

### 7. Omnichat

**Sem API.** Só Clipboard:

- Copiar imagem PNG
- Copiar `piece.ref` como texto
- Download PNG

Integração Omnichat/WhatsApp (send API) seria **feature nova**, não substituição de mock.

---

## O que está mock vs real

| Área | Status |
|------|--------|
| Login | Mock |
| Catálogo / busca / filtros | Mock local (`catalog-data.js` + assets) |
| Montagem do look | Client-only (OK) |
| Upload / crop de foto | Real no browser |
| Try-on / geração | Mock (PNG fixo) |
| Cópia Omnichat | Clipboard manual |
| Histórico / favoritos | localStorage |
| Recomendação de tamanho | Stub UI |
| Firebase Auth/DB/Storage | Não usados |

---

## Sugestão de escopo backend (priorizado)

### Must-have (destravar produto)

1. **Catálogo vivo** — sync ou API Dress To/VTEX; search por SKU (batch) e nome  
2. **Pipeline de try-on** — input: foto + peças (+ medidas?); output: imagem do resultado  
3. **Storage** — fotos de cliente + resultados (política de retenção/PII)  
4. **Auth shopper** — contas reais / SSO conforme padrão metaKosmos  

### Should-have

5. **Histórico & favoritos** server-side por shopper  
6. **API de recomendação de tamanho** (tabelas Dress To)  

### Nice-to-have / produto decide

7. Deep-link / send Omnichat  
8. Estoque / preço em tempo real / variantes  

---

## Decisões em aberto (perguntar ao PM / time)

1. Fonte do catálogo: API VTEX Dress To ao vivo vs DB espelhado?  
2. Try-on: vendor/modelo, sync vs fila assíncrona, SLA?  
3. Medidas obrigatórias na geração? (README sugere sim; workspace atual não exige)  
4. Onde roda a API? (Cloud Run / Functions / serviço separado) — FE fica no Hosting  
5. Histórico fica no servidor ou continua local na V1?  
6. Omnichat: clipboard forever ou integração?  
7. Quem define tabelas de tamanho Dress To?

---

## Arquivos para o backend ler

| Arquivo | Por quê |
|---------|---------|
| `README.md` | Produto, limitações, fluxo |
| `js/app.js` | Estado, `runGeneration`, auth, cópia, library |
| `js/catalog-data.js` | Schema da peça + filtros |
| `js/clipboard.js` | `composeTryOn`, clipboard |
| `js/looks-store.js` | Shape do look persistido |
| `js/image.js` | Contrato da foto 9:16 |
| `components/CatalogScreen.js` | Comportamento de busca |
| `components/WorkspaceScreen.js` | Foto + medidas + gerar |
| `firebase.json` / `.firebaserc` | Só hosting |

**Seams de substituição (exports):** `CATALOG`, `composeTryOn`, `createLookRecord` / `addToHistory` / `addFavorite`, `onLogin`.

---

## Como rodar o front (para testar contratos)

```bash
npx serve .
# ou: python -m http.server 8080
```

Login de teste: qualquer email + senha preenchidos.

---

## Nota de UI recente (não bloqueia backend)

Na lookbar do catálogo (modo stage), a ordem visual passou a ser: **título do look → thumbs → busca/filtros/continuar**, com `justify-content: center` e sem borda inferior na área de busca. Não muda contratos de dados.

---

## Contato / próximo passo sugerido

1. Alinhar decisões da seção “em aberto” (30–45 min com PM).  
2. Definir OpenAPI draft dos endpoints must-have (auth, catalog search, generate, looks).  
3. Combinar com front o adapter mínimo (fetch layer) sem reescrever o Vue de uma vez — começar por `composeTryOn` + `CATALOG`.
