/* =====================
   TEMPLE PORTAL SERVICE
   API integration for devotee portal: temples, services, bookings, payments, profile
   ===================== */

window.TemplePortalService = {
    /**
     * Register a new devotee.
     * @param {string} phoneNumber
     * @param {string} password
     * @param {string} name
     * @returns {Promise<{access_token: string, token_type: string}>}
     */
    async registerDevotee(phoneNumber, password, name) {
        return await apiPost('/auth/devotee/register', {
            phone_number: phoneNumber,
            password: password,
            name: name,
        });
    },

    /**
     * Get list of temples.
     * @param {number} skip
     * @param {number} limit
     * @param {string} search
     * @returns {Promise<{temples: Array, total: number}>}
     */
    async getTemples(skip = 0, limit = 50, search = '') {
        const params = { skip, limit };
        if (search) params.search = search;
        return await apiGet('/temples/', params);
    },

    /**
     * Get full temple profile.
     * @param {string} templeId
     * @returns {Promise<Object>}
     */
    async getTemple(templeId) {
        return await apiGet(`/temples/${templeId}`);
    },

    /**
     * Get services for a temple.
     * @param {string} templeId
     * @returns {Promise<Array>}
     */
    async getTempleServices(templeId) {
        return await apiGet(`/temples/${templeId}/services`);
    },

    /**
     * Create a service booking.
     * @param {Object} data - { temple_id, service_id, booking_date, devotee_name, devotee_phone, notes }
     * @returns {Promise<Object>}
     */
    async createBooking(data) {
        return await apiPost('/devotee/bookings', data);
    },

    /**
     * Get current devotee's bookings.
     * @returns {Promise<Array>}
     */
    async getMyBookings() {
        return await apiGet('/devotee/bookings/my');
    },

    /**
     * Get payment details for a booking (includes UPI ID for QR generation).
     * @param {string} bookingId
     * @returns {Promise<Object>}
     */
    async getBookingPayment(bookingId) {
        return await apiGet(`/devotee/bookings/${bookingId}/payment`);
    },

    /**
     * Get current devotee's profile.
     * @returns {Promise<Object>}
     */
    async getMyProfile() {
        return await apiGet('/devotee/profile');
    },

    /**
     * Update current devotee's profile.
     * @param {Object} data - { name, nakshatra, gothram, address }
     * @returns {Promise<Object>}
     */
    async updateMyProfile(data) {
        return await apiPut('/devotee/profile', data);
    },
};

console.log('[Services] templePortalService.js loaded');
