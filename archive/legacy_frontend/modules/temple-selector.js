/* =====================
   TEMPLE SELECTOR MODULE
   SuperAdmin-only: full-page temple picker with CRUD capabilities.
   Fetches all temples from /superadmin/temples and presents them as cards.
   On selection → calls TempleContext.select(), then loads the dashboard.
   ===================== */

// Indian States & Union Territories for dropdown
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

window.TempleSelectorModule = {
    _temples: [],
    _loading: false,
    _error: null,
    _editingTemple: null,  // Temple being edited (null = create mode)

    render() {
        const isSuperAdmin = RBAC._isSuperAdmin;

        return `
        <div class="temple-selector-page" id="templeSelectorPage">
            <!-- Hero Header -->
            <div class="ts-hero">
                <div class="ts-hero-inner">
                    <div class="ts-brand">
                        <i class="fas fa-gopuram ts-brand-icon"></i>
                        <div>
                            <h1 class="ts-brand-name">Denumrutham</h1>
                            <p class="ts-brand-sub">Temple Management Platform</p>
                        </div>
                    </div>
                    <div class="ts-hero-badge">
                        <i class="fas fa-shield-halved"></i> SuperAdmin Portal
                    </div>
                </div>
                <div class="ts-hero-wave"></div>
            </div>

            <!-- Main Content -->
            <div class="ts-body">
                <div class="ts-controls">
                    <div>
                        <h2 class="ts-section-title">Select a Temple to Manage</h2>
                        <p class="ts-section-sub">Choose a temple below to enter its management dashboard</p>
                    </div>
                    <div style="display:flex;gap:12px;align-items:center">
                        <div class="ts-search-wrap">
                            <i class="fas fa-search ts-search-icon"></i>
                            <input id="tsSearchInput" type="text" class="ts-search" placeholder="Search temples..." oninput="TempleSelectorModule.filterTemples(this.value)" />
                        </div>
                        ${isSuperAdmin ? `
                        <button class="btn btn-primary ts-create-btn" id="tsCreateBtn" onclick="TempleSelectorModule.openTempleModal()">
                            <i class="fas fa-plus"></i> Add Temple
                        </button>` : ''}
                    </div>
                </div>

                <!-- Stats Bar -->
                <div class="ts-stats-bar" id="tsStatsBar">
                    <div class="ts-stat">
                        <span class="ts-stat-num" id="tsTotalCount">—</span>
                        <span class="ts-stat-lab">Total Temples</span>
                    </div>
                    <div class="ts-stat">
                        <span class="ts-stat-num" id="tsActiveCount">—</span>
                        <span class="ts-stat-lab">Active</span>
                    </div>
                    <div class="ts-stat">
                        <span class="ts-stat-num" id="tsInactiveCount">—</span>
                        <span class="ts-stat-lab">Inactive</span>
                    </div>
                    <div class="ts-stat">
                        <span class="ts-stat-num" id="tsStateCount">—</span>
                        <span class="ts-stat-lab">States</span>
                    </div>
                </div>

                <!-- Filter Tabs -->
                <div class="ts-filter-tabs" id="tsFilterTabs">
                    <button class="ts-filter-tab active" data-filter="all" onclick="TempleSelectorModule.setFilter('all', this)">All</button>
                    <button class="ts-filter-tab" data-filter="active" onclick="TempleSelectorModule.setFilter('active', this)">Active</button>
                    <button class="ts-filter-tab" data-filter="inactive" onclick="TempleSelectorModule.setFilter('inactive', this)">Inactive</button>
                </div>

                <!-- Temple Grid -->
                <div class="ts-grid" id="tsGrid">
                    <div class="ts-loading">
                        <div class="ts-spinner"></div>
                        <p>Loading temples…</p>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async init() {
        await this.loadTemples();
    },

    _currentFilter: 'all',

    setFilter(filter, btn) {
        this._currentFilter = filter;
        document.querySelectorAll('.ts-filter-tab').forEach(t => t.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.applyFilters();
    },

    applyFilters() {
        const q = (document.getElementById('tsSearchInput')?.value || '').toLowerCase().trim();
        let filtered = this._temples;

        if (this._currentFilter === 'active') {
            filtered = filtered.filter(t => t.status === 'active');
        } else if (this._currentFilter === 'inactive') {
            filtered = filtered.filter(t => t.status === 'inactive');
        }

        if (q) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(q) ||
                (t.location || '').toLowerCase().includes(q) ||
                (t.state || '').toLowerCase().includes(q) ||
                (t.district || '').toLowerCase().includes(q) ||
                (t.contact_number || '').toLowerCase().includes(q)
            );
        }

        this.renderGrid(filtered);
    },

    async loadTemples() {
        const grid = document.getElementById('tsGrid');
        if (!grid) return;

        try {
            grid.innerHTML = `<div class="ts-loading"><div class="ts-spinner"></div><p>Loading temples…</p></div>`;
            const data = await apiRequest('/superadmin/temples/?include_inactive=true');
            this._temples = data.temples || [];
            this.refreshStats();
            this.applyFilters();
        } catch (err) {
            grid.innerHTML = `
                <div class="ts-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load temples</p>
                    <small>${err.message}</small>
                    <button class="btn btn-outline" onclick="TempleSelectorModule.loadTemples()" style="margin-top:12px">
                        <i class="fas fa-rotate-right"></i> Retry
                    </button>
                </div>`;
        }
    },

    refreshStats() {
        const temples = this._temples;
        const el = (id) => document.getElementById(id);
        if (el('tsTotalCount')) el('tsTotalCount').textContent = temples.length;
        if (el('tsActiveCount')) el('tsActiveCount').textContent = temples.filter(t => t.status === 'active').length;
        if (el('tsInactiveCount')) el('tsInactiveCount').textContent = temples.filter(t => t.status === 'inactive').length;
        const states = new Set(temples.map(t => t.state).filter(Boolean));
        if (el('tsStateCount')) el('tsStateCount').textContent = states.size || '—';
    },

    filterTemples(query) {
        this.applyFilters();
    },

    renderGrid(temples) {
        const grid = document.getElementById('tsGrid');
        if (!grid) return;

        if (temples.length === 0) {
            grid.innerHTML = `
                <div class="ts-empty">
                    <i class="fas fa-gopuram" style="font-size:3rem;opacity:0.2;margin-bottom:12px"></i>
                    <p>No temples found</p>
                </div>`;
            return;
        }

        grid.innerHTML = temples.map(t => this.templeCard(t)).join('');
    },

    templeCard(t) {
        const isSuperAdmin = RBAC._isSuperAdmin;
        const isInactive = t.status === 'inactive';
        const initials = t.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        const locationStr = [t.district, t.state].filter(Boolean).join(', ') || t.location || 'Location N/A';
        const bgColors = [
            'linear-gradient(135deg,#1a237e,#283593)',
            'linear-gradient(135deg,#4a148c,#6a1b9a)',
            'linear-gradient(135deg,#880e4f,#ad1457)',
            'linear-gradient(135deg,#b71c1c,#c62828)',
            'linear-gradient(135deg,#e65100,#ef6c00)',
            'linear-gradient(135deg,#1b5e20,#2e7d32)',
            'linear-gradient(135deg,#006064,#00838f)',
        ];
        const colorIndex = t.name.charCodeAt(0) % bgColors.length;
        const bg = bgColors[colorIndex];

        const safeT = JSON.stringify(t).replace(/"/g, '&quot;');

        return `
        <div class="ts-card ${isInactive ? 'ts-card-inactive' : ''}" id="tscard-${t.id}">
            <div class="ts-card-art" style="background:${bg}">
                ${t.image_url
                    ? `<img src="${t.image_url}" alt="${t.name}" class="ts-card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : ''}
                <div class="ts-card-initials" ${t.image_url ? 'style="display:none"' : ''}>${initials}</div>
                <div class="ts-card-status ${t.status === 'active' ? 'ts-status-active' : 'ts-status-inactive'}">
                    <i class="fas fa-circle" style="font-size:0.45rem"></i> ${t.status === 'active' ? 'Active' : 'Inactive'}
                </div>
                ${isSuperAdmin ? `
                <div class="ts-card-actions">
                    <button class="ts-action-dot" onclick="event.stopPropagation();TempleSelectorModule.toggleCardMenu('${t.id}')" title="Actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="ts-action-menu" id="tsMenu-${t.id}">
                        <button class="ts-menu-item" onclick="event.stopPropagation();TempleSelectorModule.openTempleModal('${t.id}')">
                            <i class="fas fa-edit"></i> Edit Temple
                        </button>
                        ${isInactive
                            ? `<button class="ts-menu-item ts-menu-success" onclick="event.stopPropagation();TempleSelectorModule.reactivateTemple('${t.id}')">
                                <i class="fas fa-check-circle"></i> Reactivate
                              </button>`
                            : `<button class="ts-menu-item ts-menu-danger" onclick="event.stopPropagation();TempleSelectorModule.confirmDeactivate('${t.id}','${t.name.replace(/'/g, "\\'")}')">
                                <i class="fas fa-ban"></i> Deactivate
                              </button>`
                        }
                    </div>
                </div>` : ''}
            </div>
            <div class="ts-card-body">
                <h3 class="ts-card-title">${t.name}</h3>
                <p class="ts-card-loc"><i class="fas fa-map-marker-alt"></i> ${locationStr}</p>
                ${t.contact_number ? `<p class="ts-card-contact"><i class="fas fa-phone"></i> ${t.contact_number}</p>` : ''}
                ${isInactive
                    ? `<button class="ts-enter-btn ts-enter-disabled" disabled>
                        <i class="fas fa-lock"></i> Temple Inactive
                      </button>`
                    : `<button class="ts-enter-btn" onclick="event.stopPropagation();TempleSelectorModule.selectTemple(${safeT})">
                        Enter Dashboard <i class="fas fa-arrow-right"></i>
                      </button>`
                }
            </div>
        </div>`;
    },

    toggleCardMenu(templeId) {
        // Close all other menus first
        document.querySelectorAll('.ts-action-menu.open').forEach(m => {
            if (m.id !== `tsMenu-${templeId}`) m.classList.remove('open');
        });
        const menu = document.getElementById(`tsMenu-${templeId}`);
        if (menu) menu.classList.toggle('open');

        // Close on outside click
        const closeHandler = (e) => {
            if (!e.target.closest('.ts-card-actions')) {
                document.querySelectorAll('.ts-action-menu.open').forEach(m => m.classList.remove('open'));
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    },

    // ─── CRUD Modal ──────────────────────────────────────

    openTempleModal(templeId = null) {
        this._editingTemple = templeId ? this._temples.find(t => t.id === templeId) : null;
        const t = this._editingTemple;
        const isEdit = !!t;
        const title = isEdit ? 'Edit Temple' : 'Register New Temple';
        const icon = isEdit ? 'fa-edit' : 'fa-gopuram';

        const stateOptions = INDIAN_STATES.map(s =>
            `<option value="${s}" ${t && t.state === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        App.openModal(`
            <div class="modal-header">
                <h3 class="modal-title"><i class="fas ${icon}"></i> ${title}</h3>
                <button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button>
            </div>
            <form id="templeForm" onsubmit="TempleSelectorModule.handleSaveTemple(event)" novalidate>
                <div class="temple-form-body">
                    ${isEdit ? `
                    <div class="temple-form-id">
                        <i class="fas fa-fingerprint"></i> Temple ID: <code>${t.id}</code>
                    </div>` : ''}

                    <div class="temple-form-section">
                        <div class="temple-form-section-title"><i class="fas fa-info-circle"></i> Basic Information</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Temple Name <span class="required">*</span></label>
                                <input type="text" class="form-control" id="tf_name" value="${isEdit ? this._escHtml(t.name) : ''}" required placeholder="e.g. Sree Padmanabha Swamy Temple">
                                <div class="field-error" id="tf_name_err"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Location <span class="required">*</span></label>
                                <input type="text" class="form-control" id="tf_location" value="${isEdit ? this._escHtml(t.location || '') : ''}" required placeholder="e.g. East Fort, Thiruvananthapuram">
                                <div class="field-error" id="tf_location_err"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="tf_description" rows="3" placeholder="Brief description about the temple...">${isEdit ? this._escHtml(t.description || '') : ''}</textarea>
                        </div>
                    </div>

                    <div class="temple-form-section">
                        <div class="temple-form-section-title"><i class="fas fa-map-location-dot"></i> Address Details</div>
                        <div class="form-group">
                            <label class="form-label">Address Line 1 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="tf_address1" value="${isEdit ? this._escHtml(t.address_line_1 || '') : ''}" required placeholder="Street address">
                            <div class="field-error" id="tf_address1_err"></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Address Line 2</label>
                            <input type="text" class="form-control" id="tf_address2" value="${isEdit ? this._escHtml(t.address_line_2 || '') : ''}" placeholder="Landmark, area (optional)">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">District</label>
                                <input type="text" class="form-control" id="tf_district" value="${isEdit ? this._escHtml(t.district || '') : ''}" placeholder="e.g. Thiruvananthapuram">
                            </div>
                            <div class="form-group">
                                <label class="form-label">State</label>
                                <select class="form-control" id="tf_state">
                                    <option value="">Select State</option>
                                    ${stateOptions}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Pincode</label>
                                <input type="text" class="form-control" id="tf_pincode" value="${isEdit ? this._escHtml(t.pincode || '') : ''}" placeholder="e.g. 695001" maxlength="10">
                                <div class="field-error" id="tf_pincode_err"></div>
                            </div>
                            <div class="form-group"></div>
                        </div>
                    </div>

                    <div class="temple-form-section">
                        <div class="temple-form-section-title"><i class="fas fa-address-book"></i> Contact Information</div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Contact Number <span class="required">*</span></label>
                                <input type="tel" class="form-control" id="tf_phone" value="${isEdit ? this._escHtml(t.contact_number || '') : ''}" required placeholder="e.g. +91 471 2572555">
                                <div class="field-error" id="tf_phone_err"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Alternate Contact</label>
                                <input type="tel" class="form-control" id="tf_altphone" value="${isEdit ? this._escHtml(t.alternate_contact || '') : ''}" placeholder="Optional alternate number">
                                <div class="field-error" id="tf_altphone_err"></div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="tf_email" value="${isEdit ? this._escHtml(t.email || '') : ''}" placeholder="temple@example.com">
                                <div class="field-error" id="tf_email_err"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <div class="status-toggle-wrap">
                                    <label class="status-toggle">
                                        <input type="checkbox" id="tf_status" ${(!isEdit || t.status === 'active') ? 'checked' : ''}>
                                        <span class="status-slider"></span>
                                    </label>
                                    <span class="status-label" id="tf_status_label">${(!isEdit || t.status === 'active') ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions temple-form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" id="tfSubmitBtn">
                        <i class="fas fa-save"></i> ${isEdit ? 'Update Temple' : 'Create Temple'}
                    </button>
                </div>
            </form>
        `);

        // Status toggle label update
        const statusCb = document.getElementById('tf_status');
        if (statusCb) {
            statusCb.addEventListener('change', () => {
                document.getElementById('tf_status_label').textContent = statusCb.checked ? 'Active' : 'Inactive';
            });
        }
    },

    _escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    validateTempleForm() {
        let valid = true;

        // Clear all errors
        document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
        document.querySelectorAll('.form-control.invalid').forEach(e => e.classList.remove('invalid'));

        const setError = (id, msg) => {
            const el = document.getElementById(id);
            const errEl = document.getElementById(id + '_err');
            if (el) el.classList.add('invalid');
            if (errEl) errEl.textContent = msg;
            valid = false;
        };

        // Required fields
        const name = document.getElementById('tf_name')?.value.trim();
        if (!name) setError('tf_name', 'Temple name is required');

        const location = document.getElementById('tf_location')?.value.trim();
        if (!location) setError('tf_location', 'Location is required');

        const address1 = document.getElementById('tf_address1')?.value.trim();
        if (!address1) setError('tf_address1', 'Address line 1 is required');

        const phone = document.getElementById('tf_phone')?.value.trim();
        if (!phone) {
            setError('tf_phone', 'Contact number is required');
        } else {
            const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
            if (!/^\d{7,15}$/.test(cleaned)) {
                setError('tf_phone', 'Invalid phone number (7-15 digits)');
            }
        }

        // Optional validations
        const altPhone = document.getElementById('tf_altphone')?.value.trim();
        if (altPhone) {
            const cleaned = altPhone.replace(/[\s\-\(\)\+]/g, '');
            if (!/^\d{7,15}$/.test(cleaned)) {
                setError('tf_altphone', 'Invalid phone number format');
            }
        }

        const email = document.getElementById('tf_email')?.value.trim();
        if (email) {
            if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
                setError('tf_email', 'Invalid email format');
            }
        }

        const pincode = document.getElementById('tf_pincode')?.value.trim();
        if (pincode) {
            if (!/^\d{5,10}$/.test(pincode)) {
                setError('tf_pincode', 'Invalid pincode (5-10 digits)');
            }
        }

        return valid;
    },

    async handleSaveTemple(e) {
        e.preventDefault();
        if (!this.validateTempleForm()) return;

        const submitBtn = document.getElementById('tfSubmitBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; }

        const payload = {
            name: document.getElementById('tf_name').value.trim(),
            location: document.getElementById('tf_location').value.trim(),
            state: document.getElementById('tf_state').value,
            address_line_1: document.getElementById('tf_address1').value.trim(),
            address_line_2: document.getElementById('tf_address2')?.value.trim() || '',
            district: document.getElementById('tf_district')?.value.trim() || '',
            pincode: document.getElementById('tf_pincode')?.value.trim() || '',
            contact_number: document.getElementById('tf_phone').value.trim(),
            alternate_contact: document.getElementById('tf_altphone')?.value.trim() || '',
            email: document.getElementById('tf_email')?.value.trim() || '',
            description: document.getElementById('tf_description')?.value.trim() || '',
            status: document.getElementById('tf_status')?.checked ? 'active' : 'inactive',
        };

        const isEdit = !!this._editingTemple;

        try {
            if (isEdit) {
                await TempleManagementService.update(this._editingTemple.id, payload);
                App.showToast(`Temple "${payload.name}" updated successfully!`, 'success');
            } else {
                await TempleManagementService.create(payload);
                App.showToast(`Temple "${payload.name}" created successfully!`, 'success');
            }
            App.closeModal();
            await this.loadTemples();
        } catch (err) {
            App.showToast(`Failed to ${isEdit ? 'update' : 'create'} temple: ${err.message}`, 'error');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = `<i class="fas fa-save"></i> ${isEdit ? 'Update Temple' : 'Create Temple'}`; }
        }
    },

    // ─── Deactivate / Reactivate ─────────────────────────

    confirmDeactivate(templeId, templeName) {
        App.openModal(`
            <div class="modal-header">
                <h3 class="modal-title"><i class="fas fa-exclamation-triangle" style="color:var(--primary-red)"></i> Deactivate Temple</h3>
                <button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="deactivate-confirm">
                <div class="deactivate-icon"><i class="fas fa-ban"></i></div>
                <p class="deactivate-title">Are you sure you want to <strong>deactivate</strong> this temple?</p>
                <p class="deactivate-name">${templeName}</p>
                <p class="deactivate-note">The temple and all its data will be preserved but hidden from active use. Dashboard access will be disabled.</p>
                <div class="deactivate-actions">
                    <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="App.closeModal();TempleSelectorModule.handleDeactivate('${templeId}')">
                        <i class="fas fa-ban"></i> Confirm Deactivate
                    </button>
                </div>
            </div>
        `);
    },

    async handleDeactivate(templeId) {
        try {
            await TempleManagementService.delete(templeId);
            App.showToast('Temple deactivated successfully', 'warning');
            await this.loadTemples();
        } catch (err) {
            App.showToast('Failed to deactivate temple: ' + err.message, 'error');
        }
    },

    async reactivateTemple(templeId) {
        try {
            await TempleManagementService.update(templeId, { status: 'active' });
            App.showToast('Temple reactivated!', 'success');
            await this.loadTemples();
        } catch (err) {
            App.showToast('Failed to reactivate temple: ' + err.message, 'error');
        }
    },

    // ─── Temple Selection ────────────────────────────────

    async selectTemple(temple) {
        if (this._loading) return;
        this._loading = true;

        // Visual feedback on the card
        const card = document.getElementById(`tscard-${temple.id}`);
        if (card) {
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';
        }

        if (typeof App !== 'undefined') App.showToast(`Entering ${temple.name}…`, 'info');

        try {
            await TempleContext.select(temple);

            // Update the header immediately
            if (typeof App !== 'undefined') {
                App.updateTempleHeader(temple.name);
                // Re-load user info so RBAC is refreshed
                App.loadUserFromToken();
                App.navigateTo('dashboard');
            }
        } catch (err) {
            if (typeof App !== 'undefined') App.showToast('Failed to enter temple: ' + err.message, 'error');
            if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; }
        } finally {
            this._loading = false;
        }
    },
};

console.log('[Module] temple-selector.js loaded');
