/* =====================
   API SERVICE — Core Fetch Wrapper
   Base URL, token handling, error handling, auto-logout on 401
   ===================== */

window.API_BASE = `${window.location.origin}/api/v1`;

/* --- Token Helpers --- */
window.getToken = function () {
    return localStorage.getItem('token');
};

window.setToken = function (token) {
    localStorage.setItem('token', token);
};

window.removeToken = function () {
    localStorage.removeItem('token');
};

window.isAuthenticated = function () {
    return !!getToken();
};

/**
 * Decode JWT payload (without verification — just for reading claims client-side).
 * Returns null if token is missing or malformed.
 */
window.parseJwt = function (token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

/**
 * Check if the current token is expired.
 */
window.isTokenExpired = function () {
    const token = getToken();
    if (!token) return true;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
};

/* --- Logout --- */
window.logout = function () {
    removeToken();
    localStorage.removeItem('user_info');
    window.location.href = 'login.html';
};

/* --- Auth Gate (call on protected pages) --- */
window.requireAuth = function () {
    if (!isAuthenticated() || isTokenExpired()) {
        logout();
        return false;
    }
    return true;
};

/**
 * Core API request wrapper.
 *
 * @param {string} endpoint  -  e.g. '/devotees' or '/auth/login'
 * @param {object} options   -  { method, body, headers, isFormData }
 * @returns {Promise<any>}   -  parsed JSON response
 */
window.apiRequest = async function (endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, isFormData = false } = options;

    // Standardize endpoint construction
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${cleanEndpoint}`;

    // Build headers
    const reqHeaders = { ...headers };

    // Attach auth token
    const token = getToken();
    if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Set Content-Type for JSON bodies (not for form data)
    if (body && !isFormData) {
        reqHeaders['Content-Type'] = 'application/json';
    }

    const fetchOptions = { method, headers: reqHeaders };

    if (body) {
        fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(url, fetchOptions);

        // Handle 401 — token expired or invalid → auto-logout
        if (response.status === 401) {
            console.error('[API] Authentication failed — redirecting to login');
            logout();
            throw new Error('Authentication expired. Please log in again.');
        }

        // Handle 403 — insufficient permissions (do NOT logout)
        if (response.status === 403) {
            console.warn(`[API] Permission denied: ${method} ${endpoint}`);
            throw new Error('Permission denied');
        }

        // Handle other errors
        if (!response.ok) {
            let errorDetail = `HTTP ${response.status}`;
            try {
                const errorBody = await response.json();
                errorDetail = errorBody.detail || errorBody.message || JSON.stringify(errorBody);
            } catch (e) {
                // response wasn't JSON
            }
            console.error(`[API] ${method} ${endpoint} → ${response.status}:`, errorDetail);
            throw new Error(errorDetail);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        // Network errors & Offline handling
        if (!navigator.onLine || (error.name === 'TypeError' && error.message.includes('fetch'))) {
            console.error('[API] Network error or offline — queuing action safely', error.message);
            
            // Allow GETs to naturally fail, but store POST/PUT/DELETE for background sync
            if (method !== 'GET') {
                const pendingActions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
                pendingActions.push({
                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                    type: method + '_' + cleanEndpoint.replace(/\//g, '_').toUpperCase(),
                    endpoint: cleanEndpoint,
                    method: method,
                    payload: body,
                    timestamp: new Date().toISOString(),
                    status: "pending",
                    retries: 0
                });
                localStorage.setItem('pending_actions', JSON.stringify(pendingActions));
                console.log(`[Sync] Action queued: ${method} ${cleanEndpoint}`);
                // Act as if it succeeded locally so UI doesn't crash
                return { status: "queued", message: "Action saved offline" };
            }
            throw new Error('Network error: Unable to reach the server. Please check your connection.');
        }
        throw error;
    }
};

/* --- Hybrid Sync Worker --- */
let isSyncing = false;

window.syncOfflineActions = async function() {
    if (!navigator.onLine) return;
    if (isSyncing) return;
    
    isSyncing = true;
    
    try {
        let pendingActions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
        // Only attempt actions that haven't permanently failed
        let actionsToSync = pendingActions.filter(a => a.status !== "failed");
        
        if (actionsToSync.length === 0) return;
        
        console.log(`[Sync] Attempting to sync ${actionsToSync.length} offline actions...`);
        
        try {
            const response = await apiPost('/sync', actionsToSync);
            if (response && response.status === 'success' && response.data) {
                console.log('[Sync] Server finished sync processing. Mapping replies...');
                
                let retryDelayTriggered = false;
                let maxRetriesThisBatch = 0;
                
                // Per-action result handling (NO BLACK BOX)
                response.data.forEach(result => {
                    const actionIndex = pendingActions.findIndex(a => a.id === result.id);
                    if (actionIndex > -1) {
                        if (result.status === "success" || result.status === "duplicate") {
                            // SAFE ARRAY MUTATION: filter out the successful item later or immediately without shifting live loops 
                            pendingActions = pendingActions.filter(a => a.id !== result.id);
                        } else if (result.status === "conflict") {
                            console.warn(`[Sync] Conflict detected on action ${result.id}: ${result.message}`);
                            // Mark failed cleanly
                            const idx = pendingActions.findIndex(a => a.id === result.id);
                            if (idx > -1) {
                                pendingActions[idx].status = "failed";
                                pendingActions[idx].error = result.message;
                            }
                        } else {
                            // Retry handling
                            const idx = pendingActions.findIndex(a => a.id === result.id);
                            if (idx > -1) {
                                let action = pendingActions[idx];
                                console.error(`[Sync] Action ${result.id} failed:`, result.error);
                                
                                if (action.retries < 3) {
                                    action.retries += 1;
                                    action.status = "pending";
                                    retryDelayTriggered = true;
                                    maxRetriesThisBatch = Math.max(maxRetriesThisBatch, action.retries);
                                } else {
                                    action.status = "failed";
                                }
                            }
                        }
                    }
                });
                
                // Persist the clean/updated state back to memory
                localStorage.setItem('pending_actions', JSON.stringify(pendingActions));
                
                // Exponential Backoff Integration
                if (retryDelayTriggered) {
                    const delay = Math.pow(2, maxRetriesThisBatch) * 1000;
                    console.log(`[Sync] Scheduling backoff retry in ${delay}ms`);
                    setTimeout(() => {
                        window.syncOfflineActions();
                    }, delay);
                }
            }
        } catch (error) {
            console.error('[Sync] Failed entirely:', error);
        }
    } finally {
        isSyncing = false;
    }
};

// Listeners for network changes (Auto Sync self-healing)
window.addEventListener('online', () => {
    console.log('[Network] Reconnected. Triggering sync...');
    window.syncOfflineActions();
});
window.addEventListener('offline', () => {
    console.warn('[Network] Disconnected. Running in offline mode.');
});

/* --- Convenience Methods --- */
window.apiGet = function (endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return apiRequest(url, { method: 'GET' });
};

window.apiPost = function (endpoint, body) {
    return apiRequest(endpoint, { method: 'POST', body });
};

window.apiPut = function (endpoint, body) {
    return apiRequest(endpoint, { method: 'PUT', body });
};

window.apiDelete = function (endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
};

console.log('[Services] api.js loaded');
