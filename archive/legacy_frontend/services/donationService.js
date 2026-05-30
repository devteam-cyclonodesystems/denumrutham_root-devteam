/* =====================
   DONATION SERVICE
   CRUD operations for /donations endpoint
   ===================== */

window.DonationService = {
    /**
     * Get all donations (paginated).
     * @param {number} skip
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getAll(skip = 0, limit = 100) {
        return await apiGet('/donations', { skip, limit });
    },

    /**
     * Create a new donation.
     * @param {object} data - { devotee_id?, amount, notes? }
     * @returns {Promise<object>}
     */
    async create(data) {
        return await apiPost('/donations', data);
    }
};

console.log('[Services] donationService.js loaded');
