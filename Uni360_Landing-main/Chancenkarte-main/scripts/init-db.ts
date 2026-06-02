/**
 * Database initialization script
 * Run this to create the chancenkarte_submissions table in PostgreSQL
 * 
 * Usage: npx ts-node scripts/init-db.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.VITE_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates in dev
})

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to PostgreSQL...')

    // Test connection
    const testResult = await pool.query('SELECT NOW()')
    console.log('✅ Connected to database at:', testResult.rows[0].now)

    console.log('\n🔄 Creating chancenkarte_submissions table...')

    // Create table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chancenkarte_submissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        eligibility_answers JSONB NOT NULL,
        is_eligible BOOLEAN NOT NULL DEFAULT true,
        calendly_scheduled BOOLEAN NOT NULL DEFAULT false,
        submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `

    await pool.query(createTableQuery)
    console.log('✅ Table created successfully')

    // Create indexes for performance
    console.log('\n🔄 Creating indexes...')

    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_email ON chancenkarte_submissions(email);
      CREATE INDEX IF NOT EXISTS idx_created_at ON chancenkarte_submissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_is_eligible ON chancenkarte_submissions(is_eligible);
    `

    await pool.query(createIndexQuery)
    console.log('✅ Indexes created successfully')

    // Get table info
    console.log('\n📋 Table structure:')
    const tableInfoQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'chancenkarte_submissions'
      ORDER BY ordinal_position;
    `

    const tableInfo = await pool.query(tableInfoQuery)
    console.table(tableInfo.rows)

    // Get row count
    const countQuery = `SELECT COUNT(*) FROM chancenkarte_submissions;`
    const countResult = await pool.query(countQuery)
    console.log('\n📊 Current rows in table:', countResult.rows[0].count)

    console.log('\n✅ Database initialization complete!')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

initializeDatabase()
