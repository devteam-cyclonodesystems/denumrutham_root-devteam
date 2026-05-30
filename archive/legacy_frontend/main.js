/* =====================
   MAIN APPLICATION v4
   SPA Router, Notifications, Language, Validation, Undo, Audit,
   RBAC, Auto Ref Numbers, Tooltips, Amount-in-Words
   ===================== */

/* --- Utility: Number to Indian Words --- */
window.numberToWords = function (n) {
    if (!n || isNaN(n) || n <= 0) return '';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (n < 20) return ones[n] + ' Rupees Only';
    if (n < 100) return (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')) + ' Rupees Only';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numberToWords(n % 100).replace(' Rupees Only', '') : '') + ' Rupees Only';
    if (n < 100000) {
        const th = Math.floor(n / 1000);
        return (th < 20 ? ones[th] : tens[Math.floor(th / 10)] + (th % 10 ? ' ' + ones[th % 10] : '')) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000).replace(' Rupees Only', '') : '') + ' Rupees Only';
    }
    if (n < 10000000) {
        const lk = Math.floor(n / 100000);
        return (lk < 20 ? ones[lk] : tens[Math.floor(lk / 10)] + (lk % 10 ? ' ' + ones[lk % 10] : '')) + ' Lakh' + (n % 100000 ? ' ' + numberToWords(n % 100000).replace(' Rupees Only', '') : '') + ' Rupees Only';
    }
    const cr = Math.floor(n / 10000000);
    return (cr < 20 ? ones[cr] : tens[Math.floor(cr / 10)] + (cr % 10 ? ' ' + ones[cr % 10] : '')) + ' Crore' + (n % 10000000 ? ' ' + numberToWords(n % 10000000).replace(' Rupees Only', '') : '') + ' Rupees Only';
};

/* --- Auto Reference Number Generator --- */
window.RefNumberGenerator = {
    counters: {},
    generate(prefix) {
        const now = new Date();
        const mmyy = String(now.getMonth() + 1).padStart(2, '0') + String(now.getFullYear()).slice(-2);
        const key = prefix + '_' + mmyy;
        if (!this.counters[key]) this.counters[key] = 0;
        this.counters[key]++;
        return prefix + String(this.counters[key]).padStart(3, '0') + '/' + mmyy;
    },
    generateSequential(prefix, collection, padding = 3) {
        const now = new Date();
        const mmyy = String(now.getMonth() + 1).padStart(2, '0') + String(now.getFullYear()).slice(-2);
        if (!collection || collection.length === 0) return prefix + String(1).padStart(padding, '0') + '/' + mmyy;
        let max = 0;
        collection.forEach(item => {
            if (item.id && item.id.startsWith(prefix)) {
                let numStr = "";
                if (item.id.includes('/')) {
                    numStr = item.id.slice(prefix.length).split('/')[0];
                } else if (item.id.startsWith(prefix + '-')) {
                    numStr = item.id.slice(prefix.length + 1);
                }
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        return prefix + String(max + 1).padStart(padding, '0') + '/' + mmyy;
    }
};

/* --- RBAC Helper --- */
window.RBAC = {
    currentUserRole: 'Super Admin', // Will be updated from JWT on init
    _myPermissions: null, // { moduleKey: 'full'|'read'|'none' } loaded from backend
    _isAdmin: true, // true if JWT role is ADMIN
    authorizedDeleteRoles: ['Temple Manager', 'IT Admin', 'Super Admin', 'Authorized Official', 'ADMIN'],
    canDelete() {
        return this.authorizedDeleteRoles.includes(this.currentUserRole);
    },
    confirmDelete(module, itemId, callback) {
        if (!this.canDelete()) {
            App.showToast('You do not have permission to delete records.', 'error');
            AuditLog.add('Delete Attempt (Denied)', module, `Unauthorized delete attempt on ${itemId} by ${this.currentUserRole}`, '', '');
            return;
        }
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-shield-alt"></i> Confirm Deletion</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <div style="padding:20px;text-align:center">
                <div style="font-size:3rem;color:var(--primary-red);margin-bottom:12px"><i class="fas fa-exclamation-triangle"></i></div>
                <p style="font-size:1rem;margin-bottom:8px">You are about to <strong>permanently delete</strong> record <strong>${itemId}</strong>.</p>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">This action will be logged. Please confirm to proceed.</p>
                <div style="display:flex;gap:12px;justify-content:center">
                    <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="App.closeModal();(${callback.toString()})()"><i class="fas fa-trash"></i> Confirm Delete</button>
                </div>
            </div>
        `);
    },

    /**
     * Fetch the current user's effective permissions from the backend.
     * Populates RBAC._myPermissions with { moduleKey: accessLevel }.
     */
    async loadMyPermissions() {
        if (this._isAdmin) {
            this._myPermissions = null; // null = full access to everything
            return;
        }
        try {
            const perms = await apiRequest('/rbac/my-permissions/');
            this._myPermissions = {};
            if (Array.isArray(perms)) {
                perms.forEach(p => {
                    // Check if this is a wildcard permission (*)
                    if (p.resource_key === '*') {
                        // Grant access to ALL modules known to the system
                        this.modules.forEach(m => {
                            this._myPermissions[m.key] = p.access_level || 'full';
                        });
                    } else if (p.resource_type === 'module') {
                        this._myPermissions[p.resource_key] = p.access_level;
                    }
                });
            }
            console.log('[RBAC] Final permissions mapping:', this._myPermissions);
        } catch (e) {
            console.error('[RBAC] Failed to load my permissions:', e);
            this._myPermissions = {}; 
        }
    },

    /**
     * Get the access level for a module: 'full', 'read', or 'none'.
     */
    getModuleAccess(moduleKey) {
        if (this._isAdmin || this._myPermissions === null) return 'full';
        if (!this._myPermissions) return 'none';
        return this._myPermissions[moduleKey] || 'none';
    },

    /**
     * Check if current user can see a module (full or read access).
     */
    canAccessModule(moduleKey) {
        const access = this.getModuleAccess(moduleKey);
        return access === 'full' || access === 'read';
    },

    /**
     * Check if current user can write in a module (full access only).
     */
    canWriteModule(moduleKey) {
        return this.getModuleAccess(moduleKey) === 'full';
    }
};

/* --- Nakshatra List (Malayalam Calendar Stars) --- */
window.NAKSHATRAS = [
    'അശ്വതി (Ashwathi)', 'ഭരണി (Bharani)', 'കാർത്തിക (Karthika)', 'രോഹിണി (Rohini)',
    'മകയിരം (Makayiram)', 'തിരുവാതിര (Thiruvathira)', 'പുണർതം (Punartham)', 'പൂയം (Pooyam)',
    'ആയില്യം (Ayilyam)', 'മകം (Makam)', 'പൂരം (Pooram)', 'ഉത്രം (Uthram)',
    'അത്തം (Atham)', 'ചിത്തിര (Chithira)', 'ചോതി (Chothi)', 'വിശാഖം (Vishakham)',
    'അനിഴം (Anizham)', 'തൃക്കേട്ട (Thrikketta)', 'മൂലം (Moolam)', 'പൂരാടം (Pooradam)',
    'ഉത്രാടം (Uthradam)', 'തിരുവോണം (Thiruvonam)', 'അവിട്ടം (Avittam)', 'ചതയം (Chathayam)',
    'പൂരുരുട്ടാതി (Pooruruttathi)', 'ഉത്രട്ടാതി (Uthrattathi)', 'രേവതി (Revathi)'
];

/* --- Audit Log Store (Enhanced) --- */
window.AuditLog = {
    entries: [
        { ts: '2026-02-25 10:05', user: 'Admin', role: 'Super Admin', action: 'Login', module: 'System', details: 'Admin logged in from Chrome/Win11', oldValue: '', newValue: '', ip: '192.168.1.100' },
        { ts: '2026-02-25 10:10', user: 'Admin', role: 'Super Admin', action: 'Create', module: 'Archana', details: 'Created booking ARC-001 for Rajesh Kumar', oldValue: '', newValue: 'ARC-001', ip: '192.168.1.100' },
        { ts: '2026-02-25 10:15', user: 'Deepa S.', role: 'Counter Staff', action: 'Edit', module: 'Inventory', details: 'Updated stock for Camphor: 50 → 12', oldValue: '50', newValue: '12', ip: '192.168.1.105' },
        { ts: '2026-02-25 10:30', user: 'Admin', role: 'Super Admin', action: 'Approve', module: 'HR', details: 'Approved leave LV-001 for Sri Ramanathan', oldValue: 'Pending', newValue: 'Approved', ip: '192.168.1.100' },
        { ts: '2026-02-25 11:00', user: 'Admin', role: 'Super Admin', action: 'Create', module: 'Hall Booking', details: 'Created booking HB-001 for Kalyana Mandapam', oldValue: '', newValue: 'HB-001', ip: '192.168.1.100' },
        { ts: '2026-02-25 11:15', user: 'Admin', role: 'Super Admin', action: 'Login', module: 'System', details: 'Session started', oldValue: '', newValue: '', ip: '192.168.1.100' },
        { ts: '2026-02-25 17:30', user: 'Deepa S.', role: 'Counter Staff', action: 'Logout', module: 'System', details: 'Session ended', oldValue: '', newValue: '', ip: '192.168.1.105' },
    ],
    add(action, module, details, oldValue, newValue) {
        const now = new Date();
        const ts = now.toISOString().slice(0, 16).replace('T', ' ');
        this.entries.unshift({ ts, user: 'Admin', role: RBAC.currentUserRole, action, module, details, oldValue: oldValue || '', newValue: newValue || '', ip: '192.168.1.100' });
    }
};

window.App = {
    modules: {
        'dashboard': () => DashboardModule.render(),
        'archana': () => ArchanaModule.render(),
        'hall-booking': () => HallBookingModule.render(),
        'offerings': () => OfferingsModule.render(),
        'accounting': () => AccountingModule.render(),
        'hr-payroll': () => HRPayrollModule.render(),
        'inventory': () => InventoryModule.render(),
        'store': () => StoreModule.render(),
        'communication': () => CommunicationModule.render(),
        'nss-karayogam': () => NSSKarayogamModule.render(),
        'super-admin': () => SuperAdminModule.render(),
        'temples': () => TemplesModule.render(),
        'temple-selector': () => TempleSelectorModule.render(),
    },

    currentPage: 'dashboard',
    currentLang: 'en',
    currentUser: 'Admin', // Updated from JWT on init

    // Notification store
    notifications: [],

    async init() {
        // --- Auth Check ---
        if (typeof requireAuth === 'function' && !requireAuth()) {
            return; // redirect happens inside requireAuth()
        }

        // --- Load user info from JWT ---
        this.loadUserFromToken();

        this.setupRouter();
        this.setupSidebar();
        this.setupProfileDropdown();
        this.setupDatetime();
        this.seedNotifications();
        this.setupNotificationUI();

        // --- Load RBAC permissions from backend, then enforce ---
        await RBAC.loadMyPermissions();
        this.applyRBACGuards();

        // Determine default landing page based on role
        let defaultPage = 'dashboard';
        let needTempleSelection = false;

        if (RBAC._isDevotee) {
            defaultPage = 'temples';
        } else if (RBAC._isSuperAdmin) {
            // SuperAdmin: go to temple-selector if no temple chosen yet
            const selected = (typeof TempleContext !== 'undefined') ? TempleContext.get() : null;
            if (!selected) {
                defaultPage = 'temple-selector';
                needTempleSelection = true;
            }
        }

        let hashPage = location.hash.slice(1);
        
        // Guard: Prevent bypassing temple selection via direct URL
        if (needTempleSelection && hashPage && hashPage !== 'temple-selector') {
            console.warn('SuperAdmin must select a temple first.');
            hashPage = 'temple-selector';
        }

        this.navigateTo(hashPage || defaultPage);

        // Periodic token expiry check (every 60s)
        this._tokenCheckInterval = setInterval(() => {
            if (typeof isTokenExpired === 'function' && isTokenExpired()) {
                console.warn('[Auth] Token expired — logging out');
                clearInterval(this._tokenCheckInterval);
                if (typeof logout === 'function') logout();
            }
        }, 60000);
    },

    /**
     * Load user info from the JWT and update global state + UI.
     */
    loadUserFromToken() {
        if (typeof AuthService !== 'undefined') {
            const user = AuthService.getCurrentUser();
            if (user) {
                // Map JWT role to display role
                const isSuperAdmin = user.role === 'SUPERADMIN';
                const roleDisplay = isSuperAdmin ? 'Super Admin'
                    : user.role === 'ADMIN' ? 'Admin'
                        : user.role === 'DEVOTEE' ? 'Devotee'
                            : user.role === 'STAFF' ? 'Staff'
                                : user.role || 'Staff';

                RBAC._isAdmin = (user.role === 'ADMIN' || isSuperAdmin);
                RBAC._isSuperAdmin = isSuperAdmin;
                RBAC._isDevotee = (user.role === 'DEVOTEE');
                this.currentUser = user.username || user.id || 'Admin';
                RBAC.currentUserRole = roleDisplay;

                // Update UI elements
                this.updateUserUI(roleDisplay);

                // Update temple header context
                const selected = (typeof TempleContext !== 'undefined') ? TempleContext.get() : null;
                if (isSuperAdmin && selected) {
                    this.updateTempleHeader(selected.name);
                }
            }
        }
    },

    /**
     * Update the header temple name — used after SuperAdmin selects a temple.
     */
    updateTempleHeader(templeName) {
        const el = document.getElementById('headerTempleName');
        if (!el) return;
        const isSuperAdmin = RBAC._isSuperAdmin;
        if (isSuperAdmin) {
            el.innerHTML = `<i class="fas fa-shield-halved" style="font-size:0.8em;margin-right:4px;opacity:0.8"></i>SuperAdmin &rsaquo; <strong>${templeName}</strong>`;
            // Show the switch-temple button in the header
            const switchBtn = document.getElementById('switchTempleBannerBtn');
            if (switchBtn) switchBtn.style.display = '';
        } else {
            el.textContent = `Denumrutham • ${templeName}`;
        }
    },

    /**
     * Update sidebar and header with current user info.
     */
    updateUserUI(roleDisplay) {
        const sidebarName = document.getElementById('sidebarUserName');
        const sidebarRole = document.getElementById('sidebarUserRole');
        const headerName = document.getElementById('headerProfileName');
        const headerImg = document.getElementById('headerProfileImg');
        const profileDDName = document.getElementById('profileDDName');
        const profileDDRole = document.getElementById('profileDDRole');

        const displayName = roleDisplay === 'Super Admin' ? 'Admin' : (this.currentUser || 'User');

        if (sidebarName) sidebarName.textContent = displayName;
        if (sidebarRole) sidebarRole.textContent = roleDisplay;
        if (headerName) headerName.textContent = displayName;
        if (headerImg) {
            headerImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a237e&color=fff&rounded=true&size=36`;
            headerImg.alt = displayName;
        }
        if (profileDDName) profileDDName.textContent = displayName;
        if (profileDDRole) profileDDRole.textContent = roleDisplay;
    },

    /**
     * Logout — clear token and redirect to login.
     */
    logout() {
        if (this._tokenCheckInterval) clearInterval(this._tokenCheckInterval);
        if (typeof AuthService !== 'undefined') {
            AuthService.logout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user_info');
            window.location.href = 'login.html';
        }
    },

    setupRouter() {
        window.addEventListener('hashchange', () => {
            const page = location.hash.slice(1) || 'dashboard';
            this.navigateTo(page);
        });
    },

    navigateTo(page, scrollToId) {
        // Backward compatibility: redirect old routes to super-admin
        if (page === 'activity-logs') { page = 'super-admin'; if (typeof SuperAdminModule !== 'undefined') SuperAdminModule.activeTab = 'audit-base'; }
        if (page === 'workflows') { page = 'super-admin'; if (typeof SuperAdminModule !== 'undefined') SuperAdminModule.activeTab = 'automate'; }

        if (!this.modules[page]) page = 'dashboard';

        // RBAC guard: block navigation to restricted modules (except dashboard)
        if (page !== 'dashboard' && !RBAC.canAccessModule(page)) {
            this.showToast('You do not have access to this module.', 'error');
            page = 'dashboard';
        }

        // SuperAdmin guard: require temple selection for all pages except temple-selector and super-admin
        if (RBAC._isSuperAdmin && page !== 'temple-selector' && page !== 'super-admin') {
            const selected = (typeof TempleContext !== 'undefined') ? TempleContext.get() : null;
            if (!selected) {
                console.warn('[Guard] SuperAdmin must select a temple first.');
                page = 'temple-selector';
            }
        }

        this.currentPage = page;
        location.hash = page;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const content = document.getElementById('pageContent');
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px)';
        setTimeout(() => {
            content.innerHTML = this.modules[page]();
            content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';

            // Auto-attach amount-in-words to all .amount-input fields
            this.initAmountWords();
            // Init tooltips
            this.initTooltips();

            // Apply global translations dynamically without page reload
            if (window.App && App.applyTranslations) App.applyTranslations();

            // If scrollToId is provided, scroll to that element and highlight it
            if (scrollToId) {
                setTimeout(() => this.scrollAndHighlight(scrollToId), 200);
            }

            // If temple-selector just loaded, trigger async data fetch
            if (page === 'temple-selector' && typeof TempleSelectorModule !== 'undefined') {
                TempleSelectorModule.init();
            }

            // If super-admin temples tab, load temples data
            if (page === 'super-admin' && typeof SuperAdminModule !== 'undefined' && SuperAdminModule.activeTab === 'temples-mgmt' && !SuperAdminModule._templesLoaded) {
                SuperAdminModule.loadTemples().then(() => SuperAdminModule.switchTab('temples-mgmt'));
            }
        }, 80);
    },

    // Scroll to element and apply fading highlight
    scrollAndHighlight(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-fade');
        setTimeout(() => el.classList.remove('highlight-fade'), 4000);
    },

    setupSidebar() {
        const toggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        toggle.addEventListener('click', () => {
            if (window.innerWidth <= 600) {
                sidebar.classList.toggle('mobile-open');
            }
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 600) sidebar.classList.remove('mobile-open');
            });
        });
    },

    // --- Profile Dropdown ---
    setupProfileDropdown() {
        const toggle = document.getElementById('profileToggle');
        const dropdown = document.getElementById('profileDropdown');
        if (!toggle || !dropdown) return;
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
            // Close notifications when profile opens
            document.getElementById('notifDropdown')?.classList.remove('open');
        });
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    },

    // --- Customer Care Support Panel ---
    openCustomerCare() {
        this.openModal(`
            <div class="modal-header">
                <h3 class="modal-title"><i class="fas fa-headset"></i> Customer Care</h3>
                <button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="cc-panel">
                <div class="cc-hero">
                    <i class="fas fa-life-ring cc-hero-icon"></i>
                    <h2>How can we help?</h2>
                    <p>Get support for your Temple Management System</p>
                </div>
                <div class="cc-grid">
                    <div class="cc-card" onclick="window.open('mailto:support@denumrutham.com','_blank')">
                        <i class="fas fa-envelope" style="color:var(--primary-blue);font-size:1.5rem"></i>
                        <strong>Email Support</strong>
                        <small>support@denumrutham.com</small>
                    </div>
                    <div class="cc-card" onclick="window.open('https://wa.me/919876543210','_blank')">
                        <i class="fab fa-whatsapp" style="color:#25D366;font-size:1.5rem"></i>
                        <strong>WhatsApp Support</strong>
                        <small>+91 98765 43210</small>
                    </div>
                    <div class="cc-card" onclick="window.open('tel:+919876543210')">
                        <i class="fas fa-phone" style="color:var(--primary-teal);font-size:1.5rem"></i>
                        <strong>Call Support</strong>
                        <small>Mon–Sat, 9 AM – 6 PM</small>
                    </div>
                    <div class="cc-card" onclick="App.showToast('Knowledge base coming soon','info')">
                        <i class="fas fa-book" style="color:var(--primary-orange);font-size:1.5rem"></i>
                        <strong>Help Docs</strong>
                        <small>Guides & tutorials</small>
                    </div>
                </div>
                <div class="cc-footer">
                    <small><i class="fas fa-info-circle"></i> Denumrutham Temple Management System v1.0.0</small>
                </div>
            </div>
        `);
    },

    // Combined date + time
    setupDatetime() {
        const el = document.getElementById('headerDatetime');
        const update = () => {
            const now = new Date();
            const date = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            el.innerHTML = `<div style="font-weight:700">${time}</div><div style="font-size:0.65rem;opacity:0.8">${date}</div>`;
        };
        update();
        setInterval(update, 1000);
    },

    // Language switcher
    switchLang(lang) {
        this.currentLang = lang;
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
        this.showToast(lang === 'ml' ? 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി' : 'Language switched to English', 'info');
        // Re-render current page (global state sync)
        this.navigateTo(this.currentPage);
    },

    // --- Auto Amount-in-Words (Global) ---
    initAmountWords() {
        document.querySelectorAll('.amount-input').forEach(input => {
            if (input._amountWordsAttached) return;
            input._amountWordsAttached = true;
            // Create display element if not present
            let display = input.parentElement.querySelector('.amount-words');
            if (!display) {
                display = document.createElement('div');
                display.className = 'amount-words';
                input.parentElement.appendChild(display);
            }
            const updateWords = () => {
                const val = parseInt(input.value);
                display.textContent = val > 0 ? numberToWords(val) : '';
            };
            input.addEventListener('input', updateWords);
            updateWords(); // initial
        });
    },

    // --- Tooltips (Global, Enhanced) ---
    initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            if (el._tooltipReady) return;
            el._tooltipReady = true;
            el.style.position = el.style.position || 'relative';
            el.addEventListener('mouseenter', function () {
                // Remove any existing tooltip first
                const old = document.querySelector('.global-tooltip');
                if (old) old.remove();
                const tip = document.createElement('div');
                tip.className = 'global-tooltip';
                tip.textContent = this.getAttribute('data-tooltip');
                document.body.appendChild(tip);
                const rect = this.getBoundingClientRect();
                
                // If it's a sidebar item, position tooltip to the right to fit on screen
                if (this.closest('.sidebar')) {
                    tip.style.top = (rect.top + rect.height / 2) + 'px';
                    tip.style.left = (rect.right + 12) + 'px';
                    tip.style.transform = 'translateY(-50%)';
                } else {
                    // Default: below element. Adjust if too close to bottom.
                    let top = rect.bottom + 8;
                    let left = rect.left + rect.width / 2;
                    if (top + 40 > window.innerHeight) top = rect.top - 36;
                    tip.style.top = top + 'px';
                    tip.style.left = left + 'px';
                    tip.style.transform = 'translateX(-50%)';
                }
                
                requestAnimationFrame(() => tip.classList.add('visible'));
            });
            el.addEventListener('mouseleave', function () {
                const tip = document.querySelector('.global-tooltip');
                if (tip) { tip.classList.remove('visible'); setTimeout(() => tip.remove(), 200); }
            });
        });
    },

    // --- Notification System ---
    seedNotifications() {
        this.notifications = [
            { id: 1, icon: 'fa-calendar-check', bg: 'var(--grad-green)', text: 'New booking from Rajesh Kumar', time: '10 min ago', page: 'archana', recordId: 'ARC-001', read: false },
            { id: 2, icon: 'fa-coins', bg: 'var(--grad-blue)', text: 'Offering of ₹5,000 received', time: '32 min ago', page: 'offerings', recordId: 'OFF-001', read: false },
            { id: 3, icon: 'fa-exclamation-triangle', bg: 'var(--grad-red)', text: 'Low stock: Camphor (12 left)', time: '5 hours ago', page: 'inventory', recordId: 'INV-001', read: false },
            { id: 4, icon: 'fa-video', bg: 'var(--grad-teal)', text: 'Noon stream has 342 viewers', time: 'Now', page: 'live-streaming', recordId: null, read: false },
            { id: 5, icon: 'fa-money-bill', bg: 'var(--grad-orange)', text: 'Payroll pending approval', time: '1 day ago', page: 'hr-payroll', recordId: null, read: false },
        ];
    },

    addNotification(text, icon, bg, page, recordId) {
        this.notifications.unshift({
            id: Date.now(), icon: icon || 'fa-bell', bg: bg || 'var(--grad-blue)',
            text, time: 'Just now', page: page || 'dashboard', recordId: recordId || null, read: false
        });
        this.renderNotifications();
    },

    setupNotificationUI() {
        const btn = document.getElementById('notifBtn');
        const dropdown = document.getElementById('notifDropdown');
        btn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', () => dropdown.classList.remove('open'));
        this.renderNotifications();
    },

    renderNotifications() {
        const list = document.getElementById('notifList');
        const badge = document.getElementById('notifBadge');
        const unread = this.notifications.filter(n => !n.read).length;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
        list.innerHTML = this.notifications.map(n => `
            <div class="notif-item" style="${n.read ? 'opacity:0.6' : ''}" onclick="App.handleNotifClick(${n.id})">
                <div class="notif-icon" style="background:${n.bg}"><i class="fas ${n.icon}"></i></div>
                <div>
                    <div class="notif-text">${n.text}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
            </div>
        `).join('');
    },

    handleNotifClick(id) {
        const n = this.notifications.find(x => x.id === id);
        if (n) {
            n.read = true;
            this.renderNotifications();
            document.getElementById('notifDropdown').classList.remove('open');
            if (n.page) {
                this.navigateTo(n.page, n.recordId ? `record-${n.recordId}` : null);
            }
        }
    },

    // --- Modal ---
    openModal(content) {
        const overlay = document.getElementById('modalOverlay');
        document.getElementById('modalContainer').innerHTML = content;
        overlay.classList.add('open');
        overlay.onclick = (e) => { if (e.target === overlay) this.closeModal(); };
        // Init amount words inside modal
        setTimeout(() => {
            this.initAmountWords();
            this.initTooltips();
            if (window.App && App.applyTranslations) App.applyTranslations();
        }, 50);
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('open');
    },

    // --- Toast ---
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3500);
    },

    // --- Undo Snackbar ---
    showUndo(message, undoCallback, duration = 8000) {
        const container = document.getElementById('undoContainer');
        const snackbar = document.createElement('div');
        snackbar.className = 'undo-snackbar';
        snackbar.innerHTML = `
            <span class="undo-text"><i class="fas fa-info-circle"></i> ${message}</span>
            <button class="undo-btn" onclick="this.parentElement._undoFn()"><i class="fas fa-undo"></i> Undo</button>
        `;
        snackbar._undoFn = () => {
            if (undoCallback) undoCallback();
            snackbar.classList.add('undo-hiding');
            setTimeout(() => snackbar.remove(), 300);
        };
        container.appendChild(snackbar);
        setTimeout(() => {
            if (snackbar.parentElement) {
                snackbar.classList.add('undo-hiding');
                setTimeout(() => snackbar.remove(), 300);
            }
        }, duration);
    },

    // --- Form Validation ---
    validateForm(formEl) {
        let valid = true;
        formEl.querySelectorAll('[required]').forEach(input => {
            input.classList.remove('invalid');
            const err = input.parentElement.querySelector('.form-error');
            if (err) err.remove();
            if (!input.value.trim()) {
                valid = false;
                input.classList.add('invalid');
                const errDiv = document.createElement('div');
                errDiv.className = 'form-error';
                errDiv.textContent = 'This field is required';
                input.parentElement.appendChild(errDiv);
            }
        });
        return valid;
    },

    // --- View Detail Modal (read-only) ---
    viewDetail(title, rows) {
        this.openModal(`
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button>
            </div>
            ${rows.map(r => `<div class="stat-row"><span class="stat-label">${r[0]}</span><span class="stat-value">${r[1]}</span></div>`).join('')}
        `);
    },

    // --- Amount Words Helper (attach to any amount input) ---
    attachAmountWords(inputId, displayId) {
        const input = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        if (input && display) {
            input.addEventListener('input', () => {
                display.textContent = numberToWords(parseInt(input.value));
            });
        }
    },

    // --- Get current time in 12-hour format ---
    getCurrentTime12() {
        const now = new Date();
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return { hours: String(h).padStart(2, '0'), minutes: m, ampm };
    },

    // --- RBAC Permission Guards ---
    applyRBACGuards() {
        const isDevotee = RBAC._isDevotee;
        const isSuperAdmin = RBAC._isSuperAdmin;

        // Modules only visible to devotees
        const devoteeOnlyModules = ['temples'];
        // Modules hidden from devotees (admin-only)
        const adminModules = ['dashboard', 'archana', 'hall-booking', 'offerings', 'accounting',
            'hr-payroll', 'inventory', 'store', 'communication', 'nss-karayogam', 'super-admin'];

        // Hide sidebar modules based on role
        document.querySelectorAll('#sidebarNav .nav-item').forEach(item => {
            const page = item.dataset.page;
            if (!page) return;

            if (isDevotee) {
                // Devotee: only see temples module
                item.style.display = devoteeOnlyModules.includes(page) ? '' : 'none';
            } else if (isSuperAdmin) {
                // SuperAdmin: hide devotee-only module (temples public portal), show all admin modules
                // Also show the switch-temple button
                item.style.display = (page === 'temples') ? 'none' : '';
            } else {
                // Admin/Staff: let RBAC handle access to all modules, including temples
                if (page === 'dashboard') {
                    item.style.display = '';
                } else {
                    const canAccess = RBAC.canAccessModule(page);
                    item.style.display = canAccess ? '' : 'none';
                }
            }
        });

        // Show/hide the switch-temple nav item
        const switchTempleBtn = document.getElementById('switchTempleNavBtn');
        if (switchTempleBtn) {
            switchTempleBtn.style.display = isSuperAdmin ? '' : 'none';
        }
    }
};

// --- RBAC Enhanced Guards on window.RBAC ---
RBAC.applyGuards = function () {
    App.applyRBACGuards();
};

document.addEventListener('DOMContentLoaded', () => App.init());
