/* =====================
   TEMPLE MANAGEMENT SERVICE
   SuperAdmin CRUD operations for /superadmin/temples
   Supports extended fields: name, location, state, address, contact, etc.
   ===================== */

window.TempleManagementService = {
    /**
     * List all temples (SuperAdmin).
     * @param {boolean} includeInactive - Include inactive temples
     * @returns {Promise<{ temples: Array, total: number }>}
     */
    async getAll(includeInactive = true) {
        return await apiGet('/superadmin/temples/', { include_inactive: includeInactive });
    },

    /**
     * Create a new temple with full details.
     * @param {object} data - Temple creation payload
     * @returns {Promise<object>}
     */
    async create(data) {
        return await apiPost('/superadmin/temples', data);
    },

    /**
     * Update a temple with partial or full data.
     * @param {string} templeId
     * @param {object} data - Updated fields
     * @returns {Promise<object>}
     */
    async update(templeId, data) {
        return await apiPut(`/superadmin/temples/${templeId}`, data);
    },

    /**
     * Soft-delete a temple (sets status to 'inactive').
     * @param {string} templeId
     * @returns {Promise<object>}
     */
    async delete(templeId) {
        return await apiDelete(`/superadmin/temples/${templeId}`);
    }
};

console.log('[Services] templeManagementService.js loaded');
