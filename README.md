# Cronômetro

Aplicativo de cronômetro desktop construído com Electron, Vue 3, TypeScript, Vite, Vuetify e Pinia.

## Sobre o Projeto

O **Cronômetro** é um aplicativo de desktop que permite ao usuário definir um tempo em horas, minutos e segundos, além de um título opcional, e iniciar uma contagem regressiva. Ele exibe o tempo restante em formato HH:MM:SS e oferece botões para parar e reiniciar a contagem. O tempo é controlado pelo processo principal do Electron, garantindo que a contagem continue mesmo que a janela do navegador esteja em background.

Quando o timer termina, uma janela de alerta é exibida com opções de ação (**ok**, **reabrir** ou **finalizar**). O tempo é gerenciado por uma Pinia store e a comunicação entre o processo principal e o renderer é feita via IPC com `contextBridge`.

## Tecnologias Utilizadas

- **Vue 3** — Framework frontend para a interface de usuário
- **TypeScript** — Tipagem estática em todo o código
- **Vite** — Empacotador e servidor de desenvolvimento
- **Electron** — Framework para construção de aplicativos desktop multiplataforma
- **Pinia** — Gerenciamento de estado

## Arquitetura e Organização dos Arquivos

```
cronometro/
├── electron/                          # Processo principal do Electron
│   ├── main.ts                        # Entry point — cria janelas e gerencia a lógica do timer
│   ├── preload.ts                     # Pré-load — expõe a API do Electron ao renderer via contextBridge
│   └── alert-preload.ts               # Pré-load para a janela de alerta
├── src/                               # Código-fonte do frontend Vue
│   ├── main.ts                        # Inicialização do app Vue (Pinia, Router, Vuetify, montagem)
│   ├── App.vue                        # Componente raiz
│   ├── env.d.ts                       # Declarações de tipo do Vite
│   ├── electron-api.d.ts              # Tipagem da API Electron exposta ao renderer
│   ├── components/                    # Componentes Vue
│   │   ├── TimerPage.vue              # Página do cronômetro — exibe o tempo e os botões de controle
│   │   └── TimeInput.vue              # Página de entrada — permite definir horas, minutos, segundos e título
│   ├── router/                        # Configuração de rotas
│   │   └── index.ts                   # Definição das rotas (/* e /timer/:seconds)
│   └── stores/                        # Pinia stores
│       └── counter.ts                 # Store de estado do cronômetro (tempo, execução, título)
├── tests/                             # Testes
│   ├── unit/                          # Testes unitários (Jest)
│   │   ├── __mocks__/                 # Mocks para testes
│   │   ├── alert-preload.test.ts      # Testes do pré-load de alerta
│   │   ├── counter.test.ts            # Testes da store counter
│   │   ├── helpers.ts                 # Utilidades para testes
│   │   ├── main.test.ts               # Testes do processo principal
│   │   ├── preload.test.ts            # Testes do pré-load
│   │   ├── router.test.ts             # Testes de rotas
│   │   └── timer.test.ts              # Testes da lógica do timer
│   └── integration/                   # Testes de integração/E2E (Playwright)
│       └── e2e.test.ts                # Testes end-to-end
├── scripts/                           # Scripts auxiliares
│   ├── afterPack.js                   # Wrapper para AppImage (no-sandbox, disable-dev-shm)
│   ├── remove-crossorigin.js          # Remove crossorigin do index.html build
│   └── start-electron.cjs            # Script para iniciar Vite + Electron simultaneamente no modo dev
├── public/                            # Assets estáticos
├── dist/                              # Saída do build do Vite e apps empacotados (gerado pelo electron-builder)
├── dist-electron/                     # Saída do build do processo principal do Electron (gerado)
├── index.html                         # HTML base do app
├── package.json                       # Dependências e scripts
├── tsconfig.json                      # Configuração do TypeScript (frontend)
├── tsconfig.main.json                 # Configuração do TypeScript (processo principal)
├── tsconfig.preload.json              # Configuração do TypeScript (pré-load)
├── jest.config.js                     # Configuração do Jest
├── playwright.config.ts               # Configuração do Playwright
├── eslint.config.js                   # Configuração do ESLint
├── .prettierrc                        # Prettier config
├── .prettierignore                    # Prettier ignore
├── .gitignore                         # Git ignore
├── vite.config.mjs                    # Configuração do Vite
```

### Fluxo da Aplicação

1. O usuário acessa a rota `/` e insere horas, minutos, segundos e um título opcional no componente `TimeInput.vue`.
2. Ao clicar em "Iniciar", o tempo é convertido para segundos e armazenado na Pinia store `counter`.
3. O app navega para a rota `/timer`, onde `TimerPage.vue` conecta-se aos métodos IPC via `window.electronAPI`.
4. O processo principal (`electron/main.ts`) recebe o comando `timer:start` via `ipcMain.handle` e inicia um `setInterval` de 1 segundo.
5. O pré-load (`electron/preload.ts`) expõe a API `window.electronAPI` ao renderer via `contextBridge`, com métodos `startTimer`, `cancelTimer`, `hideMainWindow`, `onTick`, `onFinished` e `sendAction`.
6. Quando o timer termina, o processo principal envia `timer:finished` e abre uma janela de alerta com opções de ação.
7. O `electron/alert-preload.ts` expõe `sendAction` para comunicação da janela de alerta de volta ao processo principal.

### IPC (Comunicação Inter-Processos)

| Direção         | Canal            | Descrição                                         |
| --------------- | ---------------- | ------------------------------------------------- |
| Renderer → Main | `timer:start`    | Inicia o timer (invoke)                           |
| Renderer → Main | `timer:cancel`   | Cancela o timer (invoke)                          |
| Main → Renderer | `timer:tick`     | Envia segundos restantes                          |
| Main → Renderer | `timer:finished` | Notifica que o timer acabou                       |
| Renderer → Main | `main:hide`      | Esconde a janela principal (send)                 |
| Renderer → Main | `alert:action`   | Ação da janela de alerta (ok, reabrir, finalizar) |

## Pré-requisitos

Antes de executar o projeto, certifique-se de ter os seguintes programas instalados:

- **Node.js** (versão 18 ou superior recomendada)
- **npm** (vem junto com o Node.js)
- **Git** (para clonar o repositório)

## Instruções de Execução

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd cronometro
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Modo de desenvolvimento

Para executar o aplicativo em modo de desenvolvimento (com recarga automática):

```bash
npm run electron:dev
```

Este comando inicia o servidor Vite e o Electron simultaneamente. O aplicativo será aberto em uma janela nativa.

### 4. Modo de desenvolvimento apenas do frontend

Para rodar apenas o servidor de desenvolvimento do Vite (sem Electron):

```bash
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### 5. Build para produção

Para compilar o frontend e o processo principal do Electron:

```bash
npm run build:main
npm run build
```

### 6. Empacotar o aplicativo

Para gerar instaladores para Windows (NSIS), macOS (DMG) e Linux (AppImage):

```bash
npm run electron:build
```

Os arquivos de instalação serão gerados na pasta `dist/`.

### Notas sobre o Electron

O aplicativo utiliza as seguintes configurações para compatibilidade com AppImage e ambientes com permissões restritivas:

- **afterPack.js** — Wrapper shell que envolve o binário do Electron, injetando `--no-sandbox` e `--disable-dev-shm-usage` antes da execução. Isso é necessário porque o SUID sandbox do Chromium não funciona dentro de mounts FUSE de AppImages, e `/dev/shm` pode não ser acessível em alguns ambientes.
- **contextIsolation: true** — Isolamento de contexto habilitado nas `webPreferences`, com comunicação segura via `contextBridge` no pré-load.
- **createWebHashHistory** — O router Vue utiliza hash-based routing em vez de HTML5 history para garantir compatibilidade com URLs `file://` usadas ao carregar o app empacotado.
- **loadURL com `file://`** — O processo principal carrega o HTML via `loadURL` com protocolo `file://`, garantindo resolução correta de caminhos dentro do AppImage/ASAR.
- **app.isPackaged / app.getAppPath()** — Resolução de caminhos adaptada para apps empacotados vs. modo desenvolvimento.
- **remove-crossorigin.js** — Script de pós-build que remove o atributo `crossorigin` gerado pelo Vite do `index.html`, evitando falhas de carregamento de módulos em URLs `file://`.

## Scripts Disponíveis

| Comando                    | Descrição                                             |
| -------------------------- | ----------------------------------------------------- |
| `npm run dev`              | Inicia o servidor de desenvolvimento Vite             |
| `npm run build`            | Compila o frontend com Vite                           |
| `npm run preview`          | Previsualiza o build localmente                       |
| `npm run build:main`       | Compila o TypeScript do processo principal e pré-load |
| `npm run electron:dev`     | Inicia o app em modo dev (Vite + Electron)            |
| `npm run electron:build`   | Compila e empacota o app para distribuição            |
| `npm run postinstall`      | Instala dependências nativas do Electron Builder      |
| `npm run test`             | Roda todos os testes (unitários + integração)         |
| `npm run test:unit`        | Roda testes unitários com Jest                        |
| `npm run test:coverage`    | Roda testes unitários com cobertura                   |
| `npm run test:integration` | Roda testes E2E com Playwright                        |
| `npm run test:ui`          | Roda testes E2E com interface do Playwright           |
| `npm run lint`             | Executa ESLint                                        |
| `npm run lint:fix`         | Executa ESLint com correção automática                |
| `npm run format`           | Formata código com Prettier                           |

## Testes

O projeto utiliza dois frameworks de teste:

- **Jest** — Testes unitários em `tests/unit/`
- **Playwright** — Testes de integração/E2E em `tests/integration/`

Para executar todos os testes:

```bash
npm test
```

Para verificar a cobertura:

```bash
npm run test:coverage
```

## Linting e Formatação

- **ESLint** com configuração em `eslint.config.js`
- **Prettier** com configuração em `.prettierrc`

Para lintar e formatar o código:

```bash
npm run lint
npm run lint:fix
npm run format
```

## Licença

Este projeto é licenciado sob a licença **ISC**.

> Use por sua conta e risco como desejar. O software é fornecido "como está", sem garantias de qualquer tipo, expressas ou implícitas. Os autores ou detentores dos direitos não serão responsabilizados por quaisquer danos, reclamações ou obrigações decorrentes do uso ou da incapacidade de uso deste software.
