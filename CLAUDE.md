# PromptStudio — Guia para Claude Code

## O que é este projeto
Biblioteca de prompts de IA para fotografia profissional. Fotógrafos usam o app para guardar, organizar, copiar e **gerar imagens** com IA (Nano Banana, GPT Image). Inclui histórico de gerações, favoritos, dark mode e painel admin.

## Stack
- React 18 + TypeScript + Vite 6
- Firebase Firestore (banco de dados)
- Firebase Storage (imagens dos prompts e gerações)
- @hello-pangea/dnd (drag and drop no admin)
- lucide-react (ícones)
- `@google/genai` — geração de imagem via Gemini
- `@vercel/node` — serverless functions em `/api/`
- Fonte: Plus Jakarta Sans (Google Fonts)

> `react-router-dom` está instalado mas **não é usado** — navegação é por estado (`view`) + `BottomNav`.

## Firebase
- Project ID: promptstudio-91999
- Realtime DB (legado, só pra migração): https://promptstudio-91999-default-rtdb.firebaseio.com
- Firestore: coleções `sections` e `prompts`
- Storage: bucket padrão, pasta `prompts/` para imagens

## Estrutura de pastas
```
api/                       Serverless functions (Vercel)
  generate-gemini.ts       Geração via Google (Nano Banana)
  generate-openai.ts       Geração via OpenAI (GPT Image)
scripts/                   Scripts utilitários (tsx)
  migrate.ts               Realtime DB → Firestore
  detectPeople.ts          Detecta nº de pessoas em prompts
  applyPeople.ts           Aplica metadata de peopleCount
src/
  App.tsx                  Root, gerencia view + modais
  components/              BottomNav, Header, PromptCard, DetailModal, PromptModal,
                           SectionModal, Toast, Filters, Slider, Logo, ImageLightbox,
                           MobileSearch, Sidebar, Skeleton, StatsBar, Form
  pages/                   LibraryPage, AdminPage, GeneratePage, HistoryPage, ProfilePage
  hooks/                   usePrompts, useFavorites, useGenerationQueue, useTheme
  lib/                     firebase, types, identityBoost
```

## Views (BottomNav)
- `library` — grade de prompts com filtros (seção, pessoas, ordenação, favoritos, busca)
- `admin` — CRUD e reordenação de prompts/seções via drag & drop
- `generate` — gera imagem a partir de um prompt ou prompt livre
- `history` — fila de gerações em andamento/concluídas
- `profile` — estatísticas + toggle de tema

## Estrutura de dados

### Section
```ts
interface Section {
  id: string;
  name: string;
  icon: string;
  color: 'red' | 'gray' | 'blue' | 'green' | 'pink';
  order: number;
}
```

### Prompt
```ts
interface Prompt {
  id: string;
  title: string;
  prompt: string;
  negative?: string;
  model: string;       // texto livre (referência do model que inspirou o prompt)
  ratio: string;       // '9:16' | '1:1' | '4:5' | '16:9'
  image?: string;      // URL do Firebase Storage
  sectionId: string;
  tags: string[];
  peopleCount?: number; // 1-6
  copies: number;       // quantas vezes foi copiado
  updatedAt: number;
  createdAt: number;
}
```

### GenerationJob (fila local)
```ts
interface GenerationJob {
  id: string;
  promptId: string;
  promptTitle: string;
  promptText: string;
  referenceImages: string[];
  identityBoost: boolean;
  provider: 'google' | 'openai';
  model: GeminiModel | OpenAIModel;
  resolution: '1K' | '2K' | '4K';
  count: number;
  status: 'pending' | 'generating' | 'done' | 'error';
  results: string[];
  error?: string;
  createdAt: number;
  completedAt?: number;
}
```

## Modelos de geração (lib/types.ts → MODEL_LABELS)
- **Google**: `gemini-2.5-flash-image` (Nano Banana), `gemini-3.1-flash-image` (Nano Banana 2), `gemini-3-pro-image` (Nano Banana Pro)
- **OpenAI**: `gpt-image-1-mini`, `gpt-image-1.5`, `gpt-image-2`

## Tema (light/dark)
- Hook `useTheme` define `data-theme="light" | "dark"` no `<html>`
- Toggle na `ProfilePage`
- Variáveis CSS redefinidas em `[data-theme="dark"]` (ver `src/index.css`)

## Paleta de cores (sempre via variáveis CSS — light)
- `--red`: #E53935  |  `--red-dark`: #B71C1C  |  `--red-light`: #FFEBEE  |  `--red-mid`: #FFCDD2
- `--text`: #111111  |  `--text2`: #555555  |  `--text3`: #999999
- `--bg`: #FFFFFF  |  `--bg2`: #F9F9F9  |  `--bg3`: #F3F3F3
- `--border`: #E5E5E5  |  `--card-bg`: #FFFFFF
- `--shadow-sm`, `--shadow-md`, `--shadow-red`

> No dark mode os mesmos nomes mudam de valor — nunca hard-code hex em componente, use a var.

## Layout tokens
- `--sidebar-width`: 240px
- `--header-height`: 64px
- `--bottom-nav-height`: 68px (mobile: 64px)
- `--radius`: 12px  |  `--radius-lg`: 16px
- `--transition`: 0.18s ease

## Regras de código
- TypeScript estrito, nunca `any` (única exceção: `migrateJobShape` em `types.ts` para legado)
- Componentes em PascalCase, hooks em camelCase com prefixo `use`
- CSS Modules por componente (`.module.css` ao lado do `.tsx`)
- Nunca inline styles exceto valores dinâmicos
- Imagens de prompt sempre via Firebase Storage, nunca base64
- Imagens de referência da geração trafegam como data URL para `/api/` e são persistidas no Storage no retorno
- Todos os textos em português (pt-BR)

## Comandos
- `npm run dev` — desenvolvimento
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — eslint
- `npm run preview` — preview do build
- `npm run migrate` — migra Realtime DB → Firestore (rodar 1x só)
- `npm run detect-people` — varre prompts e detecta nº de pessoas
- `npm run apply-people` — aplica `peopleCount` resultante no Firestore

## Deploy
- Vercel (`vercel.json`, `.vercelignore`)
- Serverless functions em `/api/` (runtime Node via `@vercel/node`)
- Variáveis de ambiente: chaves Firebase + chaves dos providers (`GOOGLE_API_KEY`, `OPENAI_API_KEY`)

## Decisões arquiteturais
- Firestore como fonte de verdade, sem cache local complexo
- Upload de imagem do prompt: comprime para max 800px antes de enviar ao Storage
- Drag & drop no admin usa `@hello-pangea/dnd`
- Favoritos em `localStorage` (sem auth)
- Fila de gerações em `localStorage` via `useGenerationQueue` — sobrevive reload
- Identity boost (`lib/identityBoost.ts`) injeta instruções pra preservar rosto/identidade quando há imagens de referência
- Geração é assíncrona: UI manda o job pra fila → fila chama `/api/generate-*` → toast/badge quando termina
