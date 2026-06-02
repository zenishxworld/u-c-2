/**
 * PostgreSQL database client (via API)
 * This uses a backend API to communicate with PostgreSQL
 * instead of direct connection from the frontend
 */

// API routes are now served directly by the Vite dev server (see vite-api-plugin.ts)
// Use an empty string so fetch calls are relative to the current origin.
const API_BASE = ''

export interface ChancenkarteSubmission {
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

/**
 * Step 1 — Save answers when user completes the eligibility checker
 * Returns the generated submission ID so we can update it later with user info.
 */
export const saveEligibilityAnswers = async (
  answers: Record<string, string>
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/submissions/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error('Error saving eligibility answers:', error)
    throw error
  }
}

/**
 * Step 2 — Attach name + email and mark Calendly as scheduled
 * Called after the BookingForm is submitted.
 */
export const attachUserAndSchedule = async (
  submissionId: string,
  userData: { fullName: string; email: string }
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE}/api/submissions/${submissionId}/schedule`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    await response.json()
  } catch (error) {
    console.error('Error attaching user to submission:', error)
    throw error
  }
}

/**
 * Combined helper (legacy / single-shot use)
 */
export const saveChancenkarteSubmission = async (
  answers: Record<string, string>,
  userData?: { fullName: string; email: string }
): Promise<ChancenkarteSubmission> => {
  try {
    const response = await fetch(`${API_BASE}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
        fullName: userData?.fullName,
        email: userData?.email,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error saving chancenkarte submission:', error)
    throw error
  }
}

/**
 * Get a submission by ID
 */
export const getSubmissionById = async (
  id: string
): Promise<ChancenkarteSubmission | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/submissions/${id}`)

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching submission:', error)
    throw error
  }
}

/**
 * Test backend connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`)
    if (response.ok) {
      const data = await response.json()
      
      return true
    }
    console.error('❌ Backend health check failed')
    return false
  } catch (error) {
    console.error('❌ Backend connection failed:', error)
    return false
  }
}
