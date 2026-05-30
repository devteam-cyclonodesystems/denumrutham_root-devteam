/* =====================
   TEMPLE SERVICE
   CRUD operations for /temples endpoint
   ===================== */

window.TempleService = {
    /**
     * Get all temples (paginated).
     * @param {number} skip
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getAll(skip = 0, limit = 100) {
        return await apiGet('/temples', { skip, limit });
    },

    /**
     * Create a new temple.
     * @param {object} data - { name, domain }
     * @returns {Promise<object>}
     */
    async create(data) {
        return await apiPost('/temples', data);
    }
};

console.log('[Services] templeService.js loaded');
