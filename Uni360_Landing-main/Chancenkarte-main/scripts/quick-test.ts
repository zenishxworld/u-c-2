/**
 * Simple connection test using curl/HTTP
 * Tests if the database credentials and setup are correct
 */

import 'dotenv/config'
import { Pool } from 'pg'

async function quickTest() {
  const dbUrl = process.env.VITE_DATABASE_URL || process.env.DATABASE_URL

  console.log('📋 Database Configuration:')
  console.log('===============================')

  if (!dbUrl) {
    console.error('❌ VITE_DATABASE_URL not found in .env file')
    process.exit(1)
  }

  // Parse connection string
  const url = new URL(dbUrl)
  console.log('✓ User:', url.username)
  console.log('✓ Host:', url.hostname)
  console.log('✓ Port:', url.port || '5432')
  console.log('✓ Database:', url.pathname.replace('/', ''))
  console.log('✓ Full URL:', dbUrl.replace(/:[^@]*@/, ':****@'))

  console.log('\n⏳ Attempting connection...')

  const pool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }, // Allow self-signed certificates in dev
  })

  try {
    const result = await pool.query('SELECT NOW()')
    console.log('\n✅ CONNECTION SUCCESSFUL!')
    console.log('Server time:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED!')
    console.error('\nError details:', (error as any).message)

    console.log('\n🔧 Troubleshooting steps:')
    console.log('1. Verify RDS instance is running in AWS Console')
    console.log('2. Check RDS Security Group allows inbound traffic on port 5432')
    console.log('3. Add your IP to the RDS security group inbound rules')
    console.log('4. Verify credentials are correct: username and password')
    console.log('5. Check if RDS database name exists')
    console.log('6. Test locally if RDS instance allows public access')

    return false
  } finally {
    await pool.end()
  }
}

quickTest().then((success) => {
  process.exit(success ? 0 : 1)
})
