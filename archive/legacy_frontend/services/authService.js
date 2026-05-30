/* =====================
   AUTH SERVICE
   Login, logout, current user extraction from JWT
   ===================== */

window.AuthService = {
    /**
     * Login with email and password.
     * Backend expects OAuth2PasswordRequestForm (form-urlencoded with 'username' + 'password').
     *
     * @param {string} userId
     * @param {string} password
     * @returns {Promise<{access_token: string, token_type: string}>}
     */
    async login(userId, password) {
        const formData = new URLSearchParams();
        formData.append('username', userId);
        formData.append('password', password);

        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: formData.toString(),
            isFormData: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response && response.access_token) {
            setToken(response.access_token);

            // Cache user info from token
            const userInfo = this.getCurrentUser();
            if (userInfo) {
                localStorage.setItem('user_info', JSON.stringify(userInfo));
            }
        }

        return response;
    },

    /**
     * Logout — clear token and redirect.
     */
    logout() {
        logout(); // from api.js
    },

    /**
     * Get current user info from the stored JWT.
     * Returns { sub, temple_id, role } or null.
     */
    getCurrentUser() {
        const token = getToken();
        if (!token) return null;
        const payload = parseJwt(token);
        if (!payload) return null;
        return {
            id: payload.sub || null,
            temple_id: payload.temple_id || null,
            role: payload.role || 'STAFF',
            username: payload.username || null,
        };
    },

    /**
     * Get cached user info (from localStorage).
     */
    getCachedUser() {
        try {
            const cached = localStorage.getItem('user_info');
            return cached ? JSON.parse(cached) : this.getCurrentUser();
        } catch (e) {
            return this.getCurrentUser();
        }
    }
};

console.log('[Services] authService.js loaded');
