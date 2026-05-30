/* =====================
   TEMPLE CONTEXT SERVICE
   Manages SuperAdmin's selected temple — stores metadata in localStorage
   and calls the backend to exchange the JWT for one with temple_id.
   ===================== */

window.TempleContext = {
    STORAGE_KEY: 'selected_temple',

    /**
     * Persist selected temple metadata.
     * @param {{ id: string, name: string, location: string, district: string, state: string }} temple
     */
    set(temple) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(temple));
    },

    /**
     * Get the currently selected temple (or null if none selected).
     * @returns {{ id: string, name: string, location: string } | null}
     */
    get() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'null');
        } catch (e) {
            return null;
        }
    },

    /** Clear selected temple (used on logout or temple switch). */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Select a temple:
     * 1. Call backend POST /superadmin/select-temple to get a new JWT with temple_id
     * 2. Replace the stored token with the new one
     * 3. Cache temple metadata for header display
     *
     * @param {{ id: string, name: string, location: string }} temple
     * @returns {Promise<void>}
     */
    async select(temple) {
        try {
            const response = await apiRequest('/superadmin/select-temple', {
                method: 'POST',
                body: { temple_id: temple.id },
            });

            if (!response || !response.access_token) {
                throw new Error('No token returned from select-temple');
            }

            // Replace the existing JWT with the new tenant-scoped token
            setToken(response.access_token);

            // Cache metadata so the header can update immediately
            this.set({
                id: temple.id,
                name: temple.name,
                location: temple.location || '',
                district: temple.district || '',
                state: temple.state || '',
            });

            // Update user_info cache
            if (typeof AuthService !== 'undefined') {
                const user = AuthService.getCurrentUser();
                if (user) localStorage.setItem('user_info', JSON.stringify(user));
            }

            // Reset API-loaded flags on data modules so they reload with new tenant data
            this._resetModuleData();

            console.log('[TempleContext] Selected temple:', temple.name);
        } catch (err) {
            console.error('[TempleContext] Failed to select temple:', err);
            throw err;
        }
    },

    /**
     * Switch temple — requests a clean SUPERADMIN token (without temple_id),
     * clears the selection, and navigates to the temple-selector.
     */
    async switchTemple() {
        try {
            // Request a clean SUPERADMIN JWT without temple_id
            const response = await apiRequest('/superadmin/reset-context', {
                method: 'POST',
            });

            if (response && response.access_token) {
                setToken(response.access_token);
                console.log('[TempleContext] Token reset to clean SUPERADMIN state');
            }
        } catch (err) {
            console.warn('[TempleContext] Could not reset context via API, clearing locally:', err.message);
        }

        // Clear cached temple selection
        this.clear();

        // Reset module data caches
        this._resetModuleData();

        // Navigate to temple-selector
        if (typeof App !== 'undefined') {
            App.navigateTo('temple-selector');
        }
    },

    /**
     * Reset data-loading flags on modules so they re-fetch from the API
     * after a temple context change.
     */
    _resetModuleData() {
        if (typeof DashboardModule !== 'undefined') {
            DashboardModule._apiLoaded = false;
            DashboardModule._loading = false;
            DashboardModule._apiBookingsCount = 0;
            DashboardModule._apiDonationsTotal = 0;
        }
        // Add other module resets here as they become API-driven
    }
};

console.log('[Services] templeContextService.js loaded');
