/**
 * Database connection test script
 * Run this to verify PostgreSQL connection and table structure
 * 
 * Usage: npx ts-node scripts/test-connection.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'

async function testConnection() {
  const pool = new Pool({
    connectionString:
      process.env.VITE_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Allow self-signed certificates in dev
  })

  try {
    console.log('🔄 Testing PostgreSQL connection...')
    console.log(
      'Database URL:',
      process.env.VITE_DATABASE_URL?.replace(
        /:[^@]*@/,
        ':****@'
      ) || 'Not set'
    )

    // Test 1: Basic connection
    console.log('\n📝 Test 1: Basic Connection')
    const timeResult = await pool.query('SELECT NOW() as current_time')
    console.log('✅ Connection successful!')
    console.log('   Server time:', timeResult.rows[0].current_time)

    // Test 2: Check if table exists
    console.log('\n📝 Test 2: Checking chancenkarte_submissions table')
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'chancenkarte_submissions'
      );
    `
    const tableExists = await pool.query(tableExistsQuery)
    if (tableExists.rows[0].exists) {
      console.log('✅ Table exists!')

      // Get table info
      const tableInfoQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'chancenkarte_submissions'
        ORDER BY ordinal_position;
      `
      const tableInfo = await pool.query(tableInfoQuery)
      console.log('\n📋 Table columns:')
      console.table(tableInfo.rows)

      // Get row count
      const countQuery = `SELECT COUNT(*) as row_count FROM chancenkarte_submissions;`
      const countResult = await pool.query(countQuery)
      console.log(
        `\n📊 Records in table: ${countResult.rows[0].row_count}`
      )
    } else {
      console.log('⚠️  Table does not exist. Please run: npm run init-db')
    }

    // Test 3: Test insert
    console.log('\n📝 Test 3: Test Insert Operation')
    const testAnswers = { country: 'Germany', age: '25' }
    const insertQuery = `
      INSERT INTO chancenkarte_submissions 
      (eligibility_answers, is_eligible, calendly_scheduled)
      VALUES ($1, $2, $3)
      RETURNING id, created_at;
    `

    try {
      const insertResult = await pool.query(insertQuery, [
        JSON.stringify(testAnswers),
        true,
        false,
      ])
      console.log('✅ Insert successful!')
      console.log('   Record ID:', insertResult.rows[0].id)
      console.log('   Created at:', insertResult.rows[0].created_at)

      // Test 4: Test read
      console.log('\n📝 Test 4: Test Read Operation')
      const readQuery = `SELECT * FROM chancenkarte_submissions WHERE id = $1;`
      const readResult = await pool.query(readQuery, [insertResult.rows[0].id])
      console.log('✅ Read successful!')
      console.log('   Data:', readResult.rows[0])

      // Test 5: Test update
      console.log('\n📝 Test 5: Test Update Operation')
      const updateQuery = `
        UPDATE chancenkarte_submissions 
        SET full_name = $1, email = $2, calendly_scheduled = $3
        WHERE id = $4
        RETURNING *;
      `
      const updateResult = await pool.query(updateQuery, [
        'John Doe',
        'john@example.com',
        true,
        insertResult.rows[0].id,
      ])
      console.log('✅ Update successful!')
      console.log('   Updated data:', updateResult.rows[0])

      // Test 6: Test delete
      console.log('\n📝 Test 6: Test Delete Operation')
      const deleteQuery = `DELETE FROM chancenkarte_submissions WHERE id = $1;`
      await pool.query(deleteQuery, [insertResult.rows[0].id])
      console.log('✅ Delete successful!')
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('⚠️  Table does not exist. Please run: npm run init-db')
      } else {
        throw error
      }
    }

    console.log('\n🎉 All tests passed!')
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()
