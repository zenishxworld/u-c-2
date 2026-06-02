/**
 * vite-api-plugin.ts
 *
 * Embeds all backend API routes directly into the Vite dev server.
 * No separate `npm run server` is needed — just `npm run dev`.
 *
 * Uses a lazy require() for 'pg' so it's always treated as a
 * Node.js-only module and never processed by Vite's bundler.
 */
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { createRequire } from 'module'
import path from 'path'

const _require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null

// Lazily initialise the pg Pool using the connection string from the .env file.
// loadEnv() is used because Vite does NOT expose VITE_* vars to process.env —
// they are only injected into the browser bundle via import.meta.env.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPool(connectionString: string): any {
  if (!pool) {
    const { Pool } = _require('pg')

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    })

    console.log('[API] PostgreSQL pool initialised ✅')
  }
  return pool
}

// Parse JSON body from an incoming Node request
async function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => (data += chunk.toString()))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

// Send a JSON response
function sendJson(res: any, status: number, body: unknown) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  })
  res.end(json)
}

export function apiPlugin(): Plugin {
  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      // Read .env ourselves — Vite only injects VITE_* vars into the browser bundle,
      // not into process.env for server/plugin code.
      const env = loadEnv('development', path.resolve(process.cwd()), '')
      const connectionString = env.VITE_DATABASE_URL || env.DATABASE_URL || process.env.DATABASE_URL

      if (!connectionString) {
        console.error('[API] ❌ VITE_DATABASE_URL not found in .env — API routes will return 500')
      } else {
        console.log('[API] ✅ Database URL loaded from .env')
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''

        // ── GET /api/health ───────────────────────────────────────────────────
        if (req.method === 'GET' && url === '/api/health') {
          try {
            const result = await getPool(connectionString).query('SELECT NOW()')
            sendJson(res, 200, { status: 'ok', timestamp: result.rows[0].now })
          } catch (err: any) {
            console.error('[API] /api/health error:', err.message)
            sendJson(res, 500, { status: 'error', message: err.message })
          }
          return
        }

        // ── POST /api/submissions/eligibility ─────────────────────────────────
        if (req.method === 'POST' && url === '/api/submissions/eligibility') {
          try {
            const body = await parseBody(req)
            const { answers } = body

            if (!answers) {
              sendJson(res, 400, { error: 'answers required' })
              return
            }

            const result = await getPool(connectionString).query(
              `INSERT INTO chancenkarte_submissions
               (eligibility_answers, is_eligible, calendly_scheduled)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [JSON.stringify(answers), true, false]
            )
            sendJson(res, 200, { id: result.rows[0].id })
          } catch (err: any) {
            console.error('[API] /api/submissions/eligibility error:', err.message)
            sendJson(res, 500, { error: err.message })
          }
          return
        }

        // ── POST /api/submissions/:id/schedule ────────────────────────────────
        const scheduleMatch = url.match(/^\/api\/submissions\/([^/]+)\/schedule$/)
        if (req.method === 'POST' && scheduleMatch) {
          try {
            const id = scheduleMatch[1]
            const body = await parseBody(req)
            const { fullName, email } = body

            if (!fullName || !email) {
              sendJson(res, 400, { error: 'fullName and email required' })
              return
            }

            const result = await getPool(connectionString).query(
              `UPDATE chancenkarte_submissions
               SET full_name = $1, email = $2, calendly_scheduled = $3, updated_at = NOW()
               WHERE id = $4
               RETURNING *`,
              [fullName, email, true, id]
            )

            if (result.rowCount === 0) {
              sendJson(res, 404, { error: 'Submission not found' })
              return
            }

            const row = result.rows[0]
            sendJson(res, 200, {
              ...row,
              eligibility_answers:
                typeof row.eligibility_answers === 'string'
                  ? JSON.parse(row.eligibility_answers)
                  : row.eligibility_answers,
            })
          } catch (err: any) {
            console.error('[API] /api/submissions/:id/schedule error:', err.message)
            sendJson(res, 500, { error: err.message })
          }
          return
        }

        // ── POST /api/submissions ─────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/submissions') {
          try {
            const body = await parseBody(req)
            const { answers, fullName, email } = body

            if (!answers) {
              sendJson(res, 400, { error: 'answers required' })
              return
            }

            const result = await getPool(connectionString).query(
              `INSERT INTO chancenkarte_submissions
               (eligibility_answers, is_eligible, calendly_scheduled, full_name, email)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING *`,
              [
                JSON.stringify(answers),
                true,
                fullName && email ? true : false,
                fullName || null,
                email || null,
              ]
            )

            const row = result.rows[0]
            sendJson(res, 200, {
              ...row,
              eligibility_answers:
                typeof row.eligibility_answers === 'string'
                  ? JSON.parse(row.eligibility_answers)
                  : row.eligibility_answers,
            })
          } catch (err: any) {
            console.error('[API] /api/submissions error:', err.message)
            sendJson(res, 500, { error: err.message })
          }
          return
        }

        // ── GET /api/submissions/:id ───────────────────────────────────────────
        const getMatch = url.match(/^\/api\/submissions\/([^/]+)$/)
        if (req.method === 'GET' && getMatch) {
          try {
            const id = getMatch[1]
            const result = await getPool(connectionString).query(
              'SELECT * FROM chancenkarte_submissions WHERE id = $1',
              [id]
            )

            if (result.rowCount === 0) {
              sendJson(res, 404, { error: 'Submission not found' })
              return
            }

            const row = result.rows[0]
            sendJson(res, 200, {
              ...row,
              eligibility_answers:
                typeof row.eligibility_answers === 'string'
                  ? JSON.parse(row.eligibility_answers)
                  : row.eligibility_answers,
            })
          } catch (err: any) {
            console.error('[API] /api/submissions/:id error:', err.message)
            sendJson(res, 500, { error: err.message })
          }
          return
        }

        // Not an API route — pass through to Vite
        next()
      })
    },
  }
}
