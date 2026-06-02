import api from "./api";

/**
 * Superadmin Query Service
 * Handles all API calls for the query management section.
 */

/**
 * GET /api/v1/superadmin/queries
 * Fetch all open queries visible to the superadmin.
 */
export const getAllQueries = async () => {
  const response = await api.get("/api/v1/superadmin/queries");
  return response.data;
};

/**
 * PUT /api/v1/superadmin/queries/{id}/reply
 * Send a reply to an admin's query.
 * @param {string|number} id - query id
 * @param {string} reply - reply text
 */
export const replyToQuery = async (id, reply) => {
  const response = await api.put(`/api/v1/superadmin/queries/${id}/reply`, {
    reply,
  });
  return response.data;
};

/**
 * PUT /api/v1/superadmin/queries/{id}/close
 * Close a query (sets status to CLOSED).
 * @param {string|number} id - query id
 */
export const closeQuery = async (id) => {
  const response = await api.put(`/api/v1/superadmin/queries/${id}/close`, {});
  return response.data;
};
