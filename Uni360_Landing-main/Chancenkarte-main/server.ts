import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.VITE_DATABASE_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates in dev
})

interface ChancenkarteSubmission {
  id: string
  full_name?: string | null
  email?: string | null
  eligibility_answers: Record<string, string>
  is_eligible: boolean
  calendly_scheduled: boolean
  submission_date?: string | null
  created_at: string
  updated_at: string
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({
      status: 'ok',
      timestamp: result.rows[0].now,
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: (error as any).message,
    })
  }
})

// Save eligibility answers
app.post('/api/submissions/eligibility', async (req, res) => {
  try {
    const { answers } = req.body

    if (!answers) {
      return res.status(400).json({ error: 'answers required' })
    }

    const query = `
      INSERT INTO chancenkarte_submissions 
      (eligibility_answers, is_eligible, calendly_scheduled)
      VALUES ($1, $2, $3)
      RETURNING id
    `
    const result = await pool.query(query, [
      JSON.stringify(answers),
      true,
      false,
    ])

    res.json({ id: result.rows[0].id })
  } catch (error) {
    res.status(500).json({ error: (error as any).message })
  }
})

// Attach user and mark Calendly scheduled
app.post('/api/submissions/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params
    const { fullName, email } = req.body

    if (!fullName || !email) {
      return res.status(400).json({ error: 'fullName and email required' })
    }

    const query = `
      UPDATE chancenkarte_submissions
      SET full_name = $1, email = $2, calendly_scheduled = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `
    const result = await pool.query(query, [fullName, email, true, id])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    const row = result.rows[0]
    const submission: ChancenkarteSubmission = {
      ...row,
      eligibility_answers: typeof row.eligibility_answers === 'string'
        ? JSON.parse(row.eligibility_answers)
        : row.eligibility_answers,
    }

    res.json(submission)
  } catch (error) {
    res.status(500).json({ error: (error as any).message })
  }
})

// Save complete submission
app.post('/api/submissions', async (req, res) => {
  try {
    const { answers, fullName, email } = req.body

    if (!answers) {
      return res.status(400).json({ error: 'answers required' })
    }

    const query = `
      INSERT INTO chancenkarte_submissions 
      (eligibility_answers, is_eligible, calendly_scheduled, full_name, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await pool.query(query, [
      JSON.stringify(answers),
      true,
      fullName && email ? true : false,
      fullName || null,
      email || null,
    ])

    const row = result.rows[0]
    const submission: ChancenkarteSubmission = {
      ...row,
      eligibility_answers: typeof row.eligibility_answers === 'string'
        ? JSON.parse(row.eligibility_answers)
        : row.eligibility_answers,
    }

    res.json(submission)
  } catch (error) {
    res.status(500).json({ error: (error as any).message })
  }
})

// Get submission by ID
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params

    const query = `SELECT * FROM chancenkarte_submissions WHERE id = $1`
    const result = await pool.query(query, [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    const row = result.rows[0]
    const submission: ChancenkarteSubmission = {
      ...row,
      eligibility_answers: typeof row.eligibility_answers === 'string'
        ? JSON.parse(row.eligibility_answers)
        : row.eligibility_answers,
    }

    res.json(submission)
  } catch (error) {
    res.status(500).json({ error: (error as any).message })
  }
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`📝 Health check: GET http://localhost:${PORT}/health`)
})
