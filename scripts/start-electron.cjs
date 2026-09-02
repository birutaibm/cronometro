#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const electronPath = path.join(projectRoot, 'node_modules/.bin/electron')

const vite = spawn('npx', ['vite', '--port', '5173'], {
  cwd: projectRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
  detached: true,
})

let vitePort = 5173
let viteReady = false

vite.stdout.on('data', (data) => {
  const output = data.toString()
  if (!viteReady) {
    if (output.includes('Local:')) {
      const match = output.match(/http:\/\/localhost:(\d+)/)
      if (match) {
        vitePort = parseInt(match[1])
        viteReady = true
      }
    }
    if (output.includes('ready in')) {
      viteReady = true
    }
  }
})

vite.stderr.on('data', (data) => {
  console.error(`Vite: ${data}`)
})

function startElectron() {
  const electron = spawn(electronPath, ['.', '--disable-gpu'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: `http://localhost:${vitePort}`,
    },
  })

  electron.on('exit', (code) => {
    vite.kill()
    process.exit(code)
  })
}

const timeout = setTimeout(() => {
  if (!viteReady) {
    console.error('Vite did not start in time')
    vite.kill()
    process.exit(1)
  }
}, 30000)

const poll = () => {
  if (viteReady) {
    clearTimeout(timeout)
    startElectron()
  } else {
    setTimeout(poll, 500)
  }
}

setTimeout(poll, 500)