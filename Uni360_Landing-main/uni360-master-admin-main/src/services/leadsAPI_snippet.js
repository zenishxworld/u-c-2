// ─── Leads / Contacts API (Superadmin) ───────────────────────────────────────
export const leadsAPI = {
  /**
   * Get all contact form submissions.
   * GET /api/v1/superadmin/contacts
   * @param {string} token – Bearer token
   */
  getContacts: async (token) => {
    try {
      const response = await apiRequest('/superadmin/contacts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // apiRequest unwraps .data already — response is the array
      return Array.isArray(response) ? response : (response?.data ?? []);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update the status of a contact submission.
   * PATCH /api/v1/superadmin/contacts/:id/status
   * @param {string} id     – contact UUID
   * @param {string} status – NEW | IN_PROGRESS | RESOLVED | CLOSED
   * @param {string} token  – Bearer token
   */
  updateStatus: async (id, status, token) => {
    try {
      const response = await apiRequest(`/superadmin/contacts/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
};