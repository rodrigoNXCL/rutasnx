import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadSecret(name) {
  try {
    const env = readFileSync(join(root, '.env.local'), 'utf8')
    const match = env.match(new RegExp(`^${name}\\s*=\\s*(.+)$`, 'm'))
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

const name = 'SUPABASE_SERVICE_ROLE_KEY'
const value = loadSecret(name)

if (!value) {
  console.error(`[deploy-secrets] ERROR: ${name} no encontrada en .env.local`)
  process.exit(1)
}

const result = spawnSync('npx', ['wrangler', 'secret', 'put', name], {
  cwd: root,
  input: value + '\n',
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: process.platform === 'win32',
  encoding: 'utf8',
})

if (result.error || result.status !== 0) {
  console.error('[deploy-secrets] ERROR al configurar el secreto.')
  process.exit(result.status || 1)
}

console.log(`[deploy-secrets] ${name} configurado correctamente.`)