# Month Lock Modal (React + TypeScript)

Modal simples e tipado para **bloquear/desbloquear competências mensais em lote**. Ele é **agnóstico de back‑end** (você injeta as funções de `loadYear` e `onSave`), suporta **i18n via `labels`**, tem **toasts**, **confirmação de alterações**, e animações suaves — tudo com **React 18** + **TypeScript**. Os estilos utilizam classes Tailwind, mas podem ser trocados pelo CSS da sua base.

https://github.com/user-attachments/assets/dff5b8e6-78cc-4d98-be54-9dc578710240


> **Origem:** `src/components/MonthLockModal.tsx`  
> **Demo mínima:** ver `src/App.tsx` neste repositório.

---

## ✨ Features ✨

- Bloqueio/desbloqueio de **12 meses** de um ano, de forma rápida.
- **Diff inteligente** para confirmar apenas o que mudou (bloqueados vs desbloqueados).
- **i18n** completo via objeto `labels` (inclusive nomes dos meses).
- **Sem dependências** além de React. Tailwind é opcional (apenas classes CSS).
- **Acessibilidade básica:** `role="dialog"` e `aria-modal="true"`.
- **Animações suaves** (fade + scale, ~700ms) e **toasts** embutidos.
- **Agnóstico de domínio**: útil para ERP, fiscal, contábil, financeiro, RH etc.

---

## 📦 Instalação / Setup 📦

Este projeto usa **Vite + React 18 + TypeScript**. Para executar o exemplo incluído:

```bash
# instalar deps
npm install

# ambiente de desenvolvimento
npm run dev

# build de produção
npm run build

# pré-visualização do build
npm run preview
```

> Se você **não usa Tailwind**, o componente continua funcionando: basta manter as classes (sem efeito) ou substituir por suas classes/estilos.

---

---

## 🧠 Conceitos e Tipos 🧠

**Mapa de bloqueio** (`MonthLockMap`): `Record<number, boolean>` onde a **chave é o mês** (1–12) e o **valor** indica se o mês está **bloqueado** (`true`) ou **desbloqueado** (`false`).

**Payload ao salvar** (`MonthLockItem[]`): sempre envia **todos os 12 meses** do ano selecionado.

---

## 🔌 API do Componente 🔌

```ts
export interface MonthLockModalProps {
  /** Ano inicial exibido (default: ano atual) */
  initialYear?: number;

  /** Estado inicial de bloqueio (1..12). Se ausente, inicia tudo bloqueado. */
  initialLockMap?: MonthLockMap;

  /** Função para carregar o mapa de bloqueio de um ano (pode ser assíncrona). */
  loadYear?: (year: number) => Promise<MonthLockMap> | MonthLockMap;

  /** Callback ao salvar. Envia os 12 itens (competência ISO + status). */
  onSave?: (items: MonthLockItem[]) => void;

  /** Obrigatório: fecha o modal (chamado após fade-out). */
  onClose: () => void;

  /** i18n e textos da UI. Todos opcionais. */
  labels?: {
    title?: string;
    year?: string;
    blocked?: string;
    unblocked?: string;
    save?: string;
    close?: string;
    confirmTitle?: string;
    confirmDesc?: string;
    confirmYes?: string;
    confirmNo?: string;
    noneChanged?: string;
    monthNames?: string[]; // tamanho 12
  };
}
```

### Comportamento
- **Ano**: combobox com 6 opções (do `anoAtual - 2` ao `anoAtual + 3`).  
- **Estados**: por padrão, se nada for carregado, **todos os meses iniciam bloqueados**.  
- **Salvar**: abre um **diálogo de confirmação** com o diff:
  - *Serão desbloqueados:* lista `MM/YYYY` dos que ficaram `false`.
  - *Serão bloqueados:* lista `MM/YYYY` dos que ficaram `true`.
- **Sem mudanças**: mostra toast com `labels.noneChanged` e fecha.  
- **Payload**: `onSave` recebe **todos os 12 meses**, mesmo que apenas alguns tenham mudado. Isso simplifica a persistência no back‑end.  
- **Animações**: fechamento aguarda ~700ms antes de desmontar (fade/scale controlado por estado interno).

---

## 🌐 Integração com Back‑end (exemplos) 🌐

### 1) Buscar estado de bloqueio por ano
```ts
async function loadYear(year: number): Promise<MonthLockMap> {
  const res = await fetch(`/api/month-lock?year=${year}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar ano');
  // O endpoint deve retornar algo como: { "1": true, "2": false, ..., "12": true }
  const data = await res.json() as Record<string, boolean>;
  // Converte chaves string -> number
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [Number(k), !!v])
  ) as MonthLockMap;
}
```

### 2) Persisitir alterações em lote
```ts
async function onSave(items: MonthLockItem[]) {
  // items => 12 objetos: { competencia: '2025-01-01', bloqueado: true|false }
  const res = await fetch('/api/month-lock/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error('Falha ao salvar alterações');
}
```

> **Formato da competência**: `yyyy-MM-01` (ISO). Útil para chaves únicas por mês e operações de banco.

---

## 🎛️ Customização e Estilos 🎛️

- As **classes Tailwind** podem ser trocadas por classes próprias sem quebrar a lógica.
- Ícones usam **emoji** (`🔒/🔓`); da pra substituir por seu set de ícones, se quiser.
- Para **temas**, ajuste classes nos estados `bloqueado`/`desbloqueado` (ver botões de mês).

### Acessibilidade (A11y)
- Modal principal usa `role="dialog"` e `aria-modal="true"`.
- **Pontos a melhorar (se necessário)**: focus trap, foco inicial no título, `Esc` para fechar e rolagem bloqueada no body. O componente não força isso para manter agnosticismo.

---

## 🧪 Testes (ideias) 🧪

- Renderiza 12 meses com os rótulos corretos (`labels.monthNames`).  
- Alternar um mês muda o estado visual (classe/emoji).  
- `Salvar` sem mudanças → mostra toast `noneChanged` e fecha.  
- `Salvar` com mudanças → abre confirmação listando `MM/YYYY`.  
- `onSave` recebe exatamente **12** itens com `competencia` ISO e `bloqueado` correto.  
- Trocar `year` dispara `loadYear` e repopula o mapa.

Exemplo com Testing Library (esboço):
```ts
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ...montar MonthLockModal com labels de teste e checar elementos/fluxos...
```

---

## 🧭 Roadmap Sugerido (opcional) 🧭

- Desabilitar meses futuros/passados por regra.  
- Permitir intervalos (ex.: bloquear jan–mar com 1 clique).  
- Focus trap e navegação por teclado.  
- Controle externo de estado (modo "controlado").  
- `minYear` / `maxYear` configuráveis.  
- Slots para header/footer customizados.

---

## 📂 Estrutura relevante 📂

```
month-lock/
├─ src/
│  ├─ components/
│  │  └─ MonthLockModal.tsx   # componente principal
│  ├─ App.tsx                  # demo mínima
│  ├─ main.tsx
│  └─ index.css                # Tailwind (opcional)
├─ index.html
├─ package.json
├─ tailwind.config.js
├─ tsconfig.json
└─ vite.config.ts
```
