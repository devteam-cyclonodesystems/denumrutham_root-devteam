/* =====================
   BOOKING SERVICE
   CRUD operations for /bookings endpoint
   ===================== */

window.BookingService = {
    /**
     * Get all bookings (paginated).
     * @param {number} skip
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getAll(skip = 0, limit = 100) {
        return await apiGet('/bookings', { skip, limit });
    },

    /**
     * Create a new booking.
     * @param {object} data - { devotee_id, total_amount }
     * @returns {Promise<object>}
     */
    async create(data) {
        return await apiPost('/bookings', data);
    }
};

console.log('[Services] bookingService.js loaded');
