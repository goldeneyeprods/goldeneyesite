// ============================================================================
//  npm run db:setup
//  Cria as tabelas rodando o schema.sql. Pode rodar mais de uma vez sem
//  quebrar nada (tudo é "create table if not exists").
// ============================================================================

import postgres from 'postgres'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

// Carrega o .env.local sem depender de pacote externo
try {
  const env = readFileSync(join(raiz, '.env.local'), 'utf8')
  for (const linha of env.split('\n')) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  console.error('⚠  .env.local não encontrado. Copie o .env.example primeiro.')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('⚠  DATABASE_URL não configurada no .env.local')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false })

console.log('→ Criando as tabelas…')
await sql.unsafe(readFileSync(join(raiz, 'schema.sql'), 'utf8'))
console.log('✓ Banco pronto.')
console.log('  Próximo passo: npm run db:seed')

await sql.end()
