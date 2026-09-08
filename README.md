# Cronômetro

Aplicação de cronômetro/desconto de tempo embasada em Electron, construída com Vue 3, TypeScript e Vite.

## Sobre o Projeto

O **Cronômetro** é um aplicativo de desktop que permite ao usuário definir um tempo em minutos e iniciar uma contagem regressiva. Ele exibe o tempo restante em formato MM:SS e oferece botões para parar e reiniciar a contagem. O tempo é controlado pelo processo principal do Electron, garantindo que a contagem continue mesmo que a janela do navegador esteja em background.

## Tecnologias Utilizadas

- **Vue 3** — Framework frontend para a interface de usuário
- **TypeScript** — Tipagem estática em todo o código
- **Vite** — Empacotador e servidor de desenvolvimento
- **Electron** — Framework para construção de aplicativos desktop multiplataforma
- **Pinia** — Gerenciamento de estado
- **Vue Router** — Roteamento no frontend
- **Electron Builder** — Empacotamento para distribuição

## Arquitetura e Organização dos Arquivos

```
cronometro/
├── electron/                    # Processo principal do Electron
│   ├── main.ts                  # Entry point do Electron — cria a janela e gerencia a lógica do timer
│   └── preload.ts               # Script de pré-carregamento — expõe a API do Electron ao renderer via contextBridge
├── src/                         # Código-fonte do frontend Vue
│   ├── main.ts                  # Inicialização do app Vue (Pinia, Router, montagem)
│   ├── App.vue                  # Componente raiz
│   ├── env.d.ts                 # Declarações de tipo do Vite
│   ├── components/              # Componentes Vue
│   │   ├── TimerPage.vue        # Página do cronômetro — exibe o tempo e os botões de controle
│   │   └── TimeInput.vue        # Página de entrada — permite definir o tempo em minutos
│   ├── router/                  # Configuração de rotas
│   │   └── index.ts             # Definição das rotas (/* e /timer/:seconds)
│   └── stores/                  # Pinia stores
│       └── counter.ts           # Store de estado do cronômetro (tempo, execução, formatação)
├── public/                      # Assets estáticos
├── scripts/                     # Scripts auxiliares de build/inicialização
│   └── start-electron.cjs       # Script para iniciar Vite + Electron simultaneamente no modo dev
├── dist/                        # Saída do build do Vite (gerado)
├── dist-electron/               # Saída do build do processo principal do Electron (gerado)
├── release/                     # Aplicativos empacotados (gerado pelo electron-builder)
├── index.html                   # HTML base do app
├── package.json                 # Dependências e scripts
├── tsconfig.json                # Configuração do TypeScript (frontend)
├── tsconfig.main.json           # Configuração do TypeScript (processo principal do Electron)
└── vite.config.ts               # Configuração do Vite
```

### Fluxo da Aplicação

1. O usuário acessa a rota `/` e insere o tempo em minutos no componente `TimeInput.vue`.
2. Ao clicar em "Iniciar", o tempo é convertido para segundos e armazenado na Pinia store `counter`.
3. O app navega para a rota `/timer`, onde `TimerPage.vue` se conecta aos eventos IPC do Electron.
4. O processo principal (`electron/main.ts`) inicia um `setInterval` de 1 segundo e envia os eventos `timer:tick` e `timer:finished` para o renderer.
5. O pré-load (`electron/preload.ts`) expõe a API `window.electronAPI` ao renderer via `contextBridge`, garantindo isolamento de contexto.

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

Os arquivos de instalação serão gerados na pasta `release/`.

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Compila o frontend com Vite |
| `npm run preview` | Previsualiza o build localmente |
| `npm run build:main` | Compila o TypeScript do processo principal do Electron |
| `npm run electron:dev` | Inicia o app em modo dev (Vite + Electron) |
| `npm run electron:build` | Compila e empacota o app para distribuição |
| `npm run postinstall` | Instala dependências nativas do Electron Builder |

## Licença

Este projeto é licenciado sob a licença **ISC**.

> Use por sua conta e risco como desejar. O software é fornecido "como está", sem garantias de qualquer tipo, expressas ou implícitas. Os autores ou detentores dos direitos não serão responsabilizados por quaisquer danos, reclamações ou obrigações decorrentes do uso ou da incapacidade de uso deste software.
