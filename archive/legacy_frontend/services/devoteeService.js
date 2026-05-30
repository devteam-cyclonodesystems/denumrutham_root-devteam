/* =====================
   DEVOTEE SERVICE
   CRUD operations for /devotees endpoint
   ===================== */

window.DevoteeService = {
    /**
     * Get all devotees (paginated).
     * @param {number} skip - offset
     * @param {number} limit - max results
     * @returns {Promise<Array>}
     */
    async getAll(skip = 0, limit = 100) {
        return await apiGet('/devotees', { skip, limit });
    },

    /**
     * Create a new devotee.
     * @param {object} data - { first_name, last_name?, phone?, email?, star_sign_nakshatram?, gotram? }
     * @returns {Promise<object>}
     */
    async create(data) {
        return await apiPost('/devotees', data);
    },

    /**
     * Update a devotee by ID.
     * @param {string} id - UUID
     * @param {object} data - partial update fields
     * @returns {Promise<object>}
     */
    async update(id, data) {
        return await apiPut(`/devotees/${id}`, data);
    },

    /**
     * Delete a devotee by ID.
     * @param {string} id - UUID
     * @returns {Promise<null>}
     */
    async delete(id) {
        return await apiDelete(`/devotees/${id}`);
    }
};

console.log('[Services] devoteeService.js loaded');
