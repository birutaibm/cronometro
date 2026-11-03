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

## Antes de qualquer implementação ou planejamento

- Execute um `git pull`
- Leia o README.md

## Após qualquer implementação

- Atualize o README.md, caso ele tenha ficado defasado
- Execute o lint e prettier, corrigindo inclusive warnings
- Execute o build
- Execute todos os testes (jest e e2e)
- Revise todos os arquivos pendentes de commit para ter certeza de não deixar arquivos que você tenha criado para auxiliar na implementação mas não devem fazer parte do projeto

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
- Use `loadURL` com `file://` para carregar HTML em apps empacotados (não use `loadFile`)
- Use `createWebHashHistory` no router para compatibilidade com URLs `file://`
- Use `app.isPackaged` / `app.getAppPath()` para resolução de caminhos em apps empacotados
- `afterPack.js` gera wrapper shell para AppImage com `--no-sandbox` e `--disable-dev-shm-usage`
- `remove-crossorigin.js` remove `crossorigin` do `index.html` build para evitar falhas em `file://`
- Não use `webgl: false` nas webPreferences

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
