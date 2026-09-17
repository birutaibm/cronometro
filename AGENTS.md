# AGENTS.md — Instruções para Agentes de IA

## Visão Geral do Projeto

**Cronômetro** é um aplicativo de desktop Electron que permite ao usuário definir um tempo em minutos e iniciar uma contagem regressiva. O tempo é controlado pelo processo principal do Electron, garantindo que a contagem continue mesmo com a janela em background.

## Stack Tecnológico

- **Vue 3** + **TypeScript** — Frontend
- **Electron** — Processo principal (main) e pré-load (preload)
- **Pinia** — Gerenciamento de estado
- **Vue Router** — Roteamento
- **Vite** — Build tool e dev server
- **Jest** — Testes unitários
- **Playwright** — Testes de integração/E2E
- **ESLint + Prettier** — Linting e formatação

## Estrutura de Diretórios

```
cronometro/
├── electron/                    # Processo principal do Electron
│   ├── main.ts                  # Entry point — cria janelas e gerencia timer
│   ├── preload.ts               # Expõe API Electron ao renderer via contextBridge
│   └── alert-preload.ts         # Pré-load para janela de alerta
├── src/                         # Código-fonte do frontend Vue
│   ├── main.ts                  # Inicialização do app Vue
│   ├── App.vue                  # Componente raiz
│   ├── env.d.ts                 # Declarações de tipo do Vite
│   ├── components/
│   │   ├── TimerPage.vue        # Página do cronômetro
│   │   └── TimeInput.vue        # Página de entrada de tempo
│   ├── router/
│   │   └── index.ts             # Rotas: / e /timer/:seconds
│   └── stores/
│       └── counter.ts           # Store Pinia do cronômetro
├── tests/
│   ├── unit/                    # Testes unitários (Jest)
│   └── integration/             # Testes de integração (Playwright)
├── scripts/                     # Scripts auxiliares
├── public/                      # Assets estáticos
├── dist/                        # Build do Vite (gerado)
├── dist-electron/               # Build do Electron (gerado)
└── release/                     # Aplicativos empacotados (gerado)
```

## Convenções e Boas Práticas

### TypeScript

- Use strict mode (`strict: true` em tsconfig.json)
- Tipagem explícita em funções e parâmetros
- Nunca use `any` — use tipos adequados ou `unknown`
- Use `import type` para imports de tipo puro

### Vue 3

- Use Composition API (`<script setup>`) com `<script setup lang="ts">`
- Use Pinia stores para estado compartilhado
- Use props com tipagem para comunicação pai-filho
- Nomes de componentes em PascalCase

### Electron

- Sempre use `contextIsolation: true` nas webPreferences
- Use `contextBridge` para expor APIs do main ao renderer
- Nunca exponha `require` diretamente no renderer
- IPC handlers no `main.ts` com `ipcMain.handle` e `ipcMain.on`
- Limpe intervals e listeners quando não necessários

### Código

- Use camelCase para variáveis e funções
- Use PascalCase para classes e componentes Vue
- Use UPPER_SNAKE_CASE para constantes
- Comentários em português são aceitáveis
- Siga o padrão de 2 espaços para indentação

### Testes

- Testes unitários em `tests/unit/` usando Jest
- Testes de integração em `tests/integration/` usando Playwright
- Nomes de arquivos de teste: `nome.do.componente.test.ts`
- Use mocks do `__mocks__/` quando necessário
- Cobertura de código deve ser mantida

### Build

- Build do main: `npm run build:main` (compila tsconfig.main.json e tsconfig.preload.json)
- Build do frontend: `npm run build` (Vite)
- Empacotamento: `npm run electron:build`
- Sempre rode `npm run lint` antes de commitar

### Commits

- Use convenções de commit semântico (feat, fix, chore, docs, refactor)
- Mensagens em português ou inglês são aceitáveis
- Cada commit deve ter um propósito claro e isolado

## Comandos Essenciais

| Comando                    | Descrição                           |
| -------------------------- | ----------------------------------- |
| `npm run dev`              | Servidor Vite dev (frontend apenas) |
| `npm run electron:dev`     | Vite + Electron simultâneos         |
| `npm run build`            | Build do frontend                   |
| `npm run build:main`       | Build do processo principal         |
| `npm run test`             | Roda todos os testes                |
| `npm run test:unit`        | Testes unitários                    |
| `npm run test:integration` | Testes E2E                          |
| `npm run lint`             | ESLint                              |
| `npm run lint:fix`         | ESLint com correção automática      |
| `npm run format`           | Prettier                            |

## Padrão IPC

O processo principal expõe eventos via IPC:

- `timer:tick` — Envia segundos restantes ao renderer
- `timer:finished` — Notifica que o timer acabou
- `timer:start` — Inicia o timer (handler)
- `timer:cancel` — Cancela o timer (handler)
- `alert:action` — Ação da janela de alerta (ok, reabrir, finalizar)
- `main:hide` — Esconde a janela principal

## Dicas para Agentes

1. **Antes de codificar**, leia os arquivos relevantes para entender o contexto
2. **Sempre verifique** se o código compila com `npm run build` após mudanças
3. **Teste as mudanças** com `npm run test` antes de considerar o trabalho completo
4. **Mantenha a tipagem** rigorosa — o projeto usa TypeScript strict mode
5. **Não modifique** `package.json` sem consultar o usuário
6. **Siga a arquitetura** descrita na README.md — o timer roda no processo principal, não no frontend

## Herança de LLM

Sub-agentes não possuem modelo próprio — eles herdam automaticamente a LLM escolhida pelo usuário através do agente pai que os criou. Nenhum campo `model` deve ser especificado nas definições de sub-agentes.
