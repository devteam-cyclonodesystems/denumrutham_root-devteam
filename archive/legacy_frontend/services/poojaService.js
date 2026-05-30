/* =====================
   POOJA SERVICE
   CRUD operations for /poojas endpoint
   ===================== */

window.PoojaService = {
    /**
     * Get all poojas (paginated).
     * @param {number} skip
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getAll(skip = 0, limit = 100) {
        return await apiGet('/poojas', { skip, limit });
    },

    /**
     * Create a new pooja.
     * @param {object} data - { name, base_price, is_active? }
     * @returns {Promise<object>}
     */
    async create(data) {
        return await apiPost('/poojas', data);
    }
};

console.log('[Services] poojaService.js loaded');
