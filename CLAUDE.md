# PromptStudio — Guia para Claude Code

## O que é este projeto
Biblioteca de prompts de IA para fotografia profissional. Fotógrafos usam o app para guardar, organizar e copiar prompts de geração de imagem com IA (Nano Banana, Flux, Imagen, etc).

## Stack
- React 18 + TypeScript + Vite
- Firebase Firestore (banco de dados)
- Firebase Storage (imagens dos prompts)
- react-router-dom (navegação)
- @hello-pangea/dnd (drag and drop no admin)
- lucide-react (ícones)

## Firebase
- Project ID: promptstudio-91999
- Realtime DB (legado, só pra migração): https://promptstudio-91999-default-rtdb.firebaseio.com
- Firestore: coleções `sections` e `prompts`
- Storage: bucket padrão, pasta `prompts/` para imagens

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
  model: string;       // 'Nano Banana 2' | 'Nano Banana Pro' | 'Flux' | 'Imagen 4' | 'Outro'
  ratio: string;       // '9:16' | '1:1' | '4:5' | '16:9'
  image?: string;      // URL do Firebase Storage
  sectionId: string;
  tags: string[];
  peopleCount?: number; // 1-6
  copies: number;      // quantas vezes foi copiado
  updatedAt: number;
  createdAt: number;
}
```

## Paleta de cores (sempre usar estas variáveis CSS)
- `--red`: #E53935
- `--red-dark`: #B71C1C
- `--red-light`: #FFEBEE
- `--red-mid`: #FFCDD2
- `--text`: #111111
- `--text2`: #555555
- `--text3`: #999999
- `--border`: #E5E5E5
- `--bg`: #FFFFFF
- `--bg2`: #F9F9F9
- `--bg3`: #F3F3F3

## Regras de código
- Sempre TypeScript estrito, nunca `any`
- Componentes em PascalCase, hooks em camelCase com prefixo `use`
- CSS Modules para estilos (arquivo `.module.css` por componente)
- Nunca inline styles exceto valores dinâmicos
- Imagens sempre via Firebase Storage, nunca base64
- Todos os textos em português (pt-BR)

## Comandos úteis
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run migrate` — migrar dados do Realtime DB para Firestore (rodar 1x só)

## Decisões arquiteturais
- Firestore como fonte de verdade, sem cache local complexo
- Upload de imagem: comprime para max 800px antes de enviar ao Storage
- Drag & drop no admin usa @hello-pangea/dnd
- Favoritos salvos em localStorage (simples, sem auth por enquanto)
