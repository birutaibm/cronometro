#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

// Project root directory
const projectRoot = path.join(__dirname, '..')
const electronPath = path.join(projectRoot, 'node_modules/.bin/electron')

// Start Vite in the background
const vite = spawn('npx', ['vite', '--port', '5173'], {
  cwd: projectRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: true
})

let vitePort = 5173
let viteReady = false

vite.stdout.on('data', (data) => {
  const output = data.toString()
  // Check if Vite is ready and extract the port
  if (!viteReady && output.includes('Local:')) {
    const match = output.match(/http:\/\/localhost:(\d+)/)
    if (match) {
      vitePort = parseInt(match[1])
      viteReady = true
    }
  }
})

// Wait for Vite to be ready, then start Electron
setTimeout(() => {
  // Kill Vite if we can't parse the port in time
  vite.kill()

  // Start Electron with the correct VITE_DEV_SERVER_URL and disable-gpu
  const electron = spawn(electronPath, ['.', '--disable-gpu'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: `http://localhost:${vitePort}`
    }
  })

  electron.on('exit', (code) => {
    process.exit(code)
  })
}, 8000)