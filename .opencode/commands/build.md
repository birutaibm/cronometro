---
description: 'Build the project for development or production'
agent: builder
---

Build the Cronômetro project.

Execute `npm run build:main` to compile the Electron main process TypeScript, then `npm run build` to compile the Vite frontend.

Verify both builds succeed. If errors occur, report them with file paths and suggested fixes.

For production packaging, use `npm run electron:build`.
