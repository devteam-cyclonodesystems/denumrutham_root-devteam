/* =====================
   SUPER ADMIN MODULE
   Tabbed layout: Audit Base | Automate | RBAC | Temples
   ===================== */
window.SuperAdminModule = {
    activeTab: 'audit-base',

    // Temple management state
    _temples: [],
    _templesLoaded: false,

    // Default roles for RBAC management UI
    roles: [
        { id: 'R-01', name: 'Super Admin', description: 'Full system access — all modules, all actions', active: true, permCount: 'All' },
        { id: 'R-02', name: 'Temple Manager', description: 'Manages daily operations, bookings, and staff', active: true, permCount: 9 },
        { id: 'R-03', name: 'Temple Clerk', description: 'Counter operations — Archana, Offerings, Store', active: true, permCount: 4 },
        { id: 'R-04', name: 'Accountant', description: 'Financial modules — Accounts, Offerings, Reports', active: true, permCount: 3 },
        { id: 'R-05', name: 'HR Admin', description: 'HR & Payroll management', active: true, permCount: 2 },
        { id: 'R-06', name: 'Store Manager', description: 'Store and Inventory management', active: true, permCount: 3 },
        { id: 'R-07', name: 'Security', description: 'Read-only access to logs and audit trail', active: true, permCount: 1 },
        { id: 'R-08', name: 'NSS Committee', description: 'NSS Karayogam committee functions', active: true, permCount: 1 },
    ],

    // Module permission definitions
    modules: [
        { key: 'dashboard', label: 'Dashboard', icon: 'fa-th-large' },
        { key: 'archana', label: 'Archana', icon: 'fa-om' },
        { key: 'hall-booking', label: 'Hall Booking', icon: 'fa-building' },
        { key: 'offerings', label: 'Offerings', icon: 'fa-hand-holding-dollar' },
        { key: 'accounting', label: 'Accounts', icon: 'fa-chart-line' },
        { key: 'hr-payroll', label: 'HR & Payroll', icon: 'fa-users' },
        { key: 'inventory', label: 'Inventory', icon: 'fa-boxes-stacked' },
        { key: 'store', label: 'Store', icon: 'fa-store' },
        { key: 'communication', label: 'Communication', icon: 'fa-satellite-dish' },
        { key: 'nss-karayogam', label: 'NSS Karayogam', icon: 'fa-landmark' },
        { key: 'super-admin', label: 'Super Admin', icon: 'fa-shield-halved' },
        { key: 'temples', label: 'Temples', icon: 'fa-gopuram' },
    ],

    // Permission matrix: roleId -> { moduleKey: 'full'|'read'|'none' }
    permissionMatrix: {
        'R-01': null, // Super Admin — full access (null = all)
        'R-02': { dashboard: 'full', archana: 'full', 'hall-booking': 'full', offerings: 'full', accounting: 'read', 'hr-payroll': 'full', inventory: 'full', store: 'full', communication: 'full' },
        'R-03': { dashboard: 'read', archana: 'full', offerings: 'full', store: 'full' },
        'R-04': { dashboard: 'read', accounting: 'full', offerings: 'read' },
        'R-05': { dashboard: 'read', 'hr-payroll': 'full' },
        'R-06': { dashboard: 'read', inventory: 'full', store: 'full' },
        'R-07': { dashboard: 'read' },
        'R-08': { dashboard: 'read', 'nss-karayogam': 'full' },
    },

    // Currently selected role for editing
    selectedRoleId: null,

    async loadData() {
        try {
            // Fetch roles
            const rolesRes = await apiRequest('/rbac/roles');
            if (rolesRes && Array.isArray(rolesRes)) {
                this.roles = rolesRes.map(r => ({
                    id: r.id,
                    name: r.name,
                    description: r.description || '',
                    active: r.is_active,
                    permCount: 0 // Will update after fetching permissions
                }));
            }

            // Fetch permissions for each role to build the matrix
            this.permissionMatrix = {};
            for (const role of this.roles) {
                // If the role is Super Admin, we don't need to fetch standard matrix, it has "All"
                if (role.name === 'Super Admin' || role.name === 'ADMIN') {
                    this.permissionMatrix[role.id] = null;
                    role.permCount = 'All';
                    continue;
                }

                try {
                    const permRes = await apiRequest(`/rbac/roles/${role.id}/permissions`);
                    const matrixRow = {};
                    let pCount = 0;
                    if (permRes && permRes.permissions) {
                        permRes.permissions.forEach(p => {
                            if (p.resource_type === 'module') {
                                matrixRow[p.resource_key] = p.access_level;
                                pCount++;
                            }
                        });
                    }
                    this.permissionMatrix[role.id] = matrixRow;
                    role.permCount = pCount;
                } catch (e) {
                    console.error(`Failed to load permissions for role ${role.id}`, e);
                    this.permissionMatrix[role.id] = {};
                }
            }
            // Trigger a re-render if we are on the RBAC tab
            if (this.activeTab === 'rbac') {
                this.switchTab('rbac');
            }
        } catch (e) {
            console.error('Failed to load RBAC data from backend:', e);
            App.showToast('Failed to load roles from server', 'error');
        }
    },

    render() {
        const ml = App.currentLang === 'ml';
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-shield-halved"></i> ${ml ? 'സൂപ്പർ അഡ്‌മിൻ' : 'Super Admin'}</h1>
        </div>

        <!-- Tab Navigation -->
        <div class="sa-tabs">
            <button class="sa-tab ${this.activeTab === 'audit-base' ? 'active' : ''}" onclick="SuperAdminModule.switchTab('audit-base')" data-tooltip="View system activity logs">
                <i class="fas fa-clipboard-list"></i> ${ml ? 'ഓഡിറ്റ് ബേസ്' : 'Audit Base'}
            </button>
            <button class="sa-tab ${this.activeTab === 'automate' ? 'active' : ''}" onclick="SuperAdminModule.switchTab('automate')" data-tooltip="Manage workflow automations">
                <i class="fas fa-cogs"></i> ${ml ? 'ഓട്ടോമേറ്റ്' : 'Automate'}
            </button>
            <button class="sa-tab ${this.activeTab === 'rbac' ? 'active' : ''}" onclick="SuperAdminModule.switchTab('rbac')" data-tooltip="Role Based Access Control">
                <i class="fas fa-user-shield"></i> RBAC
            </button>
            <button class="sa-tab ${this.activeTab === 'temples-mgmt' ? 'active' : ''}" onclick="SuperAdminModule.switchTab('temples-mgmt')" data-tooltip="Manage temples">
                <i class="fas fa-gopuram"></i> ${ml ? 'ക്ഷേത്രങ്ങൾ' : 'Temples'}
            </button>
        </div>

        <!-- Tab Content -->
        <div class="sa-tab-content">
            ${this.renderActiveTab()}
        </div>`;
    },

    switchTab(tab) {
        this.activeTab = tab;
        const content = document.querySelector('.sa-tab-content');
        if (content) {
            content.style.opacity = '0';
            setTimeout(() => {
                content.innerHTML = this.renderActiveTab();
                content.style.transition = 'opacity 0.25s ease';
                content.style.opacity = '1';
                // Re-init tooltips
                if (App.initTooltips) App.initTooltips();
                if (App.applyTranslations) App.applyTranslations();
            }, 100);
        }
        // Update tab active state
        document.querySelectorAll('.sa-tab').forEach(t => {
            t.classList.toggle('active', t.textContent.trim().toLowerCase().includes(
                tab === 'audit-base' ? 'audit' : tab === 'automate' ? 'automate' : 'rbac'
            ));
        });
    },

    renderActiveTab() {
        switch (this.activeTab) {
            case 'audit-base': return ActivityLogsModule.render();
            case 'automate': return WorkflowsModule.render();
            case 'rbac': return this.renderRBAC();
            case 'temples-mgmt': return this.renderTemplesMgmt();
            default: return ActivityLogsModule.render();
        }
    },

    // ─── RBAC Management UI ──────────────────────────────

    renderRBAC() {
        const ml = App.currentLang === 'ml';
        const selectedRole = this.selectedRoleId ? this.roles.find(r => r.id === this.selectedRoleId) : null;

        return `
        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-purple)"><i class="fas fa-user-shield kpi-icon"></i><div class="kpi-label">${ml ? 'മൊത്തം റോളുകൾ' : 'Total Roles'}</div><div class="kpi-value">${this.roles.length}</div><div class="kpi-sub">Active roles</div></div>
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-key kpi-icon"></i><div class="kpi-label">${ml ? 'മൊഡ്യൂളുകൾ' : 'Modules'}</div><div class="kpi-value">${this.modules.length}</div><div class="kpi-sub">Controllable</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-check-circle kpi-icon"></i><div class="kpi-label">${ml ? 'സജീവം' : 'Active Roles'}</div><div class="kpi-value">${this.roles.filter(r => r.active).length}</div><div class="kpi-sub">Enabled</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-shield-alt kpi-icon"></i><div class="kpi-label">${ml ? 'അനുമതികൾ' : 'Permission Sets'}</div><div class="kpi-value">${Object.keys(this.permissionMatrix).length}</div><div class="kpi-sub">Configured</div></div>
        </div>

        <!-- Role List -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title"><i class="fas fa-users-cog"></i> ${ml ? 'റോൾ മാനേജ്‌മെന്റ്' : 'Role Management'}</div>
                <button class="btn btn-sm btn-primary" onclick="SuperAdminModule.addRole()" data-tooltip="Create a new role"><i class="fas fa-plus"></i> Add Role</button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table">
                <thead><tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr></thead>
                <tbody>
                    ${this.roles.map(r => `<tr class="${this.selectedRoleId === r.id ? 'rbac-selected-row' : ''}">
                        <td><strong>${r.name}</strong></td>
                        <td><small style="color:var(--text-secondary)">${r.description}</small></td>
                        <td><span class="badge badge-info">${r.permCount === 'All' ? 'All Modules' : r.permCount + ' modules'}</span></td>
                        <td><span class="badge ${r.active ? 'badge-success' : 'badge-danger'}">${r.active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="SuperAdminModule.editPermissions('${r.id}')" data-tooltip="Edit module permissions for this role"><i class="fas fa-key"></i> Permissions</button>
                            ${r.id !== 'R-01' ? `<button class="btn btn-sm btn-warning" onclick="SuperAdminModule.toggleRole('${r.id}')" data-tooltip="${r.active ? 'Deactivate' : 'Activate'} this role" style="margin-left:4px"><i class="fas fa-power-off"></i></button>` : ''}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
            </div>
        </div>

        <!-- Permission Matrix -->
        ${selectedRole ? this.renderPermissionMatrix(selectedRole) : ''}`;
    },

    renderPermissionMatrix(role) {
        const ml = App.currentLang === 'ml';
        const perms = this.permissionMatrix[role.id];
        const isSuperAdmin = perms === null;

        return `
        <div class="section-card">
            <div class="section-header">
                <div class="section-title"><i class="fas fa-th"></i> ${ml ? 'അനുമതി മാട്രിക്സ്' : 'Permission Matrix'} — <strong>${role.name}</strong></div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-sm btn-outline" onclick="SuperAdminModule.selectedRoleId=null;App.navigateTo('super-admin')" data-tooltip="Close permission editor"><i class="fas fa-times"></i> Close</button>
                    ${!isSuperAdmin ? `<button class="btn btn-sm btn-success" onclick="SuperAdminModule.savePermissions('${role.id}')" data-tooltip="Save permission changes"><i class="fas fa-save"></i> Save</button>` : ''}
                </div>
            </div>
            ${isSuperAdmin ? `<div style="padding:20px;text-align:center;color:var(--primary-teal)"><i class="fas fa-infinity" style="font-size:2rem;margin-bottom:8px;display:block"></i><strong>Super Admin has full unrestricted access to all modules and features.</strong><br><small style="color:var(--text-muted)">This role cannot be modified.</small></div>` : `
            <div style="overflow-x:auto">
            <table class="data-table rbac-matrix">
                <thead><tr>
                    <th style="width:50px"></th>
                    <th>Module</th>
                    <th style="text-align:center">Full Access</th>
                    <th style="text-align:center">Read Only</th>
                    <th style="text-align:center">No Access</th>
                </tr></thead>
                <tbody>
                    ${this.modules.map(m => {
                        const level = (perms && perms[m.key]) || 'none';
                        return `<tr>
                            <td style="text-align:center"><i class="fas ${m.icon}" style="color:var(--primary-blue);font-size:1.1rem"></i></td>
                            <td><strong>${m.label}</strong></td>
                            <td style="text-align:center"><input type="radio" name="perm_${m.key}" value="full" ${level === 'full' ? 'checked' : ''} onchange="SuperAdminModule.updatePerm('${role.id}','${m.key}','full')"></td>
                            <td style="text-align:center"><input type="radio" name="perm_${m.key}" value="read" ${level === 'read' ? 'checked' : ''} onchange="SuperAdminModule.updatePerm('${role.id}','${m.key}','read')"></td>
                            <td style="text-align:center"><input type="radio" name="perm_${m.key}" value="none" ${level === 'none' ? 'checked' : ''} onchange="SuperAdminModule.updatePerm('${role.id}','${m.key}','none')"></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            </div>
            <div class="rbac-legend">
                <span><span class="legend-dot" style="background:var(--primary-green)"></span> Full Access — Can view, create, edit, delete</span>
                <span><span class="legend-dot" style="background:var(--primary-blue)"></span> Read Only — Can view data only</span>
                <span><span class="legend-dot" style="background:var(--primary-red)"></span> No Access — Module is hidden</span>
            </div>`}
        </div>`;
    },

    // ─── RBAC Actions ─────────────────────────────────────

    editPermissions(roleId) {
        this.selectedRoleId = roleId;
        App.navigateTo('super-admin');
    },

    updatePerm(roleId, moduleKey, level) {
        if (!this.permissionMatrix[roleId]) this.permissionMatrix[roleId] = {};
        if (level === 'none') {
            delete this.permissionMatrix[roleId][moduleKey];
        } else {
            this.permissionMatrix[roleId][moduleKey] = level;
        }
        // State updated in memory, user must click 'Save' to commit to database
    },

    async savePermissions(roleId) {
        const role = this.roles.find(r => r.id === roleId);
        if (!role) return;

        const roleMatrix = this.permissionMatrix[roleId] || {};
        
        // We first need to get the list of ALL possible permissions from the backend to map keys to UUIDs
        let allPerms = [];
        try {
            allPerms = await apiRequest('/rbac/permissions');
        } catch (e) {
            console.error("Could not fetch permissions lists", e);
            App.showToast('Failed to sync permissions list with backend', 'error');
            return;
        }

        const assignments = [];
        
        // Map matrix selections to backend permission UUIDs
        for (const [moduleKey, level] of Object.entries(roleMatrix)) {
            // Find the permission ID for this module
            let permObj = allPerms.find(p => p.resource_type === 'module' && p.resource_key === moduleKey);
            
            // If the permission doesn't exist in the DB yet, create it on the fly
            if (!permObj) {
                try {
                    permObj = await apiRequest('/rbac/permissions', {
                        method: 'POST',
                        body: {
                            resource_type: 'module',
                            resource_key: moduleKey,
                            description: `Access to ${moduleKey} module`
                        }
                    });
                } catch(e) {
                    console.warn(`Could not auto-create permission for ${moduleKey}`, e);
                    continue;
                }
            }

            if (permObj) {
                assignments.push({
                    permission_id: permObj.id,
                    access_level: level
                });
            }
        }

        try {
            // Push assignments to backend
            await apiRequest(`/rbac/roles/${roleId}/permissions`, {
                method: 'POST',
                body: assignments
            });
            
            role.permCount = Object.keys(roleMatrix).length;
            
            App.showToast(`Permissions saved for ${role.name}!`, 'success');
            AuditLog.add('Edit', 'RBAC', `Updated permissions for role ${role.name}`, '', JSON.stringify(roleMatrix));
            
            // Reload user permissions to apply any changes to their own viewing rights
            if (RBAC && RBAC.loadMyPermissions) {
                 await RBAC.loadMyPermissions();
                 if (RBAC.applyGuards) RBAC.applyGuards();
            }
        } catch (e) {
             console.error('Failed to save permissions:', e);
             App.showToast('Error saving permissions to database', 'error');
        }
    },

    async toggleRole(roleId) {
        const role = this.roles.find(r => r.id === roleId);
        if (role) {
            const toggledState = !role.active;
            try {
                await apiRequest(`/rbac/roles/${roleId}`, {
                    method: 'PUT',
                    body: { is_active: toggledState }
                });
                
                role.active = toggledState;
                App.showToast(`Role "${role.name}" ${role.active ? 'activated' : 'deactivated'}`, role.active ? 'success' : 'warning');
                AuditLog.add(role.active ? 'Activate' : 'Deactivate', 'RBAC', `Role ${role.name} ${role.active ? 'activated' : 'deactivated'}`, '', '');
                App.navigateTo('super-admin');
            } catch (e) {
                console.error("Failed to toggle role state", e);
                App.showToast('Failed to update role status in DB', 'error');
            }
        }
    },

    addRole() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-plus"></i> Create New Role</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="SuperAdminModule.saveNewRole(event)">
                <div class="form-group"><label class="form-label">Role Name</label><input type="text" class="form-control" id="rbac_role_name" required placeholder="e.g. Pooja Coordinator"></div>
                <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="rbac_role_desc" rows="3" placeholder="Describe the role responsibilities..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Create Role</button></div>
            </form>
        `);
    },

    async saveNewRole(e) {
        e.preventDefault();
        const name = document.getElementById('rbac_role_name').value.trim();
        const desc = document.getElementById('rbac_role_desc').value.trim();
        if (!name) return;
        
        try {
            const res = await apiRequest('/rbac/roles', {
                method: 'POST',
                body: {
                    name: name,
                    description: desc || name
                }
            });
            
            if (res && res.id) {
                this.roles.push({ id: res.id, name: res.name, description: res.description, active: res.is_active, permCount: 0 });
                this.permissionMatrix[res.id] = {};
                
                App.closeModal();
                App.showToast(`Role "${name}" created!`, 'success');
                AuditLog.add('Create', 'RBAC', `Created new role: ${name}`, '', res.id);
                this.activeTab = 'rbac';
                App.navigateTo('super-admin');
            }
        } catch (e) {
             console.error("Failed to save new role", e);
             App.showToast(e.message || 'Failed to create role in the database', 'error');
        }
    },

    // ─── Permission Guard Check ──────────────────────────

    /**
     * Check if the current user role has access to a given module.
     * Returns 'full', 'read', or 'none'.
     */
    getModuleAccess(moduleKey) {
        // Super Admin always has full access
        if (RBAC.currentUserRole === 'Super Admin') return 'full';

        // Find role by name
        const role = this.roles.find(r => r.name === RBAC.currentUserRole && r.active);
        if (!role) return 'none';

        const perms = this.permissionMatrix[role.id];
        if (perms === null) return 'full'; // null means all access
        if (!perms) return 'none';

        return perms[moduleKey] || 'none';
    },

    /**
     * Check if current user can see a module.
     */
    canAccessModule(moduleKey) {
        const access = this.getModuleAccess(moduleKey);
        return access === 'full' || access === 'read';
    },

    /**
     * Check if current user can write (create/edit/delete) in a module.
     */
    canWriteModule(moduleKey) {
        return this.getModuleAccess(moduleKey) === 'full';
    },
    // ─── Temple Management Tab ────────────────────────────

    renderTemplesMgmt() {
        const ml = App.currentLang === 'ml';
        const temples = this._temples;
        const activeCount = temples.filter(t => t.status === 'active').length;
        const inactiveCount = temples.filter(t => t.status === 'inactive').length;

        return `
        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-gopuram kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ ക്ഷേത്രങ്ങൾ' : 'Total Temples'}</div><div class="kpi-value">${temples.length}</div><div class="kpi-sub">In system</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-check-circle kpi-icon"></i><div class="kpi-label">${ml ? 'സജീവം' : 'Active'}</div><div class="kpi-value">${activeCount}</div><div class="kpi-sub">Operational</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-ban kpi-icon"></i><div class="kpi-label">${ml ? 'നിഷ്‌ക്രിയം' : 'Inactive'}</div><div class="kpi-value">${inactiveCount}</div><div class="kpi-sub">Deactivated</div></div>
        </div>

        <div class="section-card">
            <div class="section-header">
                <div class="section-title"><i class="fas fa-gopuram"></i> ${ml ? 'ക്ഷേത്ര മാനേജ്‌മെന്റ്' : 'Temple Management'}</div>
                <button class="btn btn-sm btn-primary" onclick="SuperAdminModule.openCreateTempleModal()" data-tooltip="Register a new temple"><i class="fas fa-plus"></i> Add Temple</button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table">
                <thead><tr>
                    <th>Name</th>
                    <th>Domain</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr></thead>
                <tbody>
                    ${temples.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)"><i class="fas fa-gopuram" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:8px"></i>No temples found. Click "Add Temple" to get started.</td></tr>` : ''}
                    ${temples.map(t => `<tr>
                        <td><strong>${t.name}</strong></td>
                        <td><code style="font-size:0.8rem;background:var(--bg-secondary);padding:2px 6px;border-radius:4px">${t.domain}</code></td>
                        <td>${[t.location, t.district, t.state].filter(Boolean).join(', ') || '—'}</td>
                        <td><span class="badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}">${t.status}</span></td>
                        <td style="white-space:nowrap">
                            <div class="action-dropdown">
                                <button class="btn btn-sm btn-edit" title="Temple Actions"><i class="fas fa-pen"></i></button>
                                <div class="action-dropdown-content">
                                    <button class="action-menu-btn" onclick="SuperAdminModule.openEditTempleModal('${t.id}')"><i class="fas fa-edit"></i> Edit Temple</button>
                                    ${t.status === 'active'
                                        ? `<button class="action-menu-btn text-danger" onclick="SuperAdminModule.confirmDeactivateTemple('${t.id}','${t.name.replace(/'/g, "\\'")}')"><i class="fas fa-ban"></i> Deactivate</button>`
                                        : `<button class="action-menu-btn" onclick="SuperAdminModule.reactivateTemple('${t.id}')"><i class="fas fa-check"></i> Reactivate</button>`
                                    }
                                </div>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
            </div>
        </div>`;
    },

    async loadTemples() {
        try {
            const data = await TempleManagementService.getAll();
            this._temples = data.temples || [];
            this._templesLoaded = true;
        } catch (e) {
            console.error('[SuperAdmin] Failed to load temples:', e);
            App.showToast('Failed to load temples', 'error');
        }
    },

    openCreateTempleModal() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-gopuram"></i> Register New Temple</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="createTempleForm" onsubmit="SuperAdminModule.handleCreateTemple(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Temple Name *</label><input type="text" class="form-control" id="ct_name" required placeholder="e.g. Sree Padmanabha Swamy Temple"></div>
                    <div class="form-group"><label class="form-label">Domain *</label><input type="text" class="form-control" id="ct_domain" required placeholder="e.g. padmanabha.denumrutham.com"></div>
                </div>
                <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-control" id="ct_location" placeholder="e.g. East Fort, Thiruvananthapuram"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Create Temple</button></div>
            </form>
        `);
    },

    async handleCreateTemple(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('createTempleForm'))) return;

        const name = document.getElementById('ct_name').value.trim();
        const domain = document.getElementById('ct_domain').value.trim();
        const location = document.getElementById('ct_location').value.trim();

        try {
            await TempleManagementService.create({ name, domain, location });
            App.closeModal();
            App.showToast(`Temple "${name}" created successfully!`, 'success');
            AuditLog.add('Create', 'Temples', `Created temple: ${name}`);
            await this.loadTemples();
            this.switchTab('temples-mgmt');
        } catch (err) {
            App.showToast('Failed to create temple: ' + err.message, 'error');
        }
    },

    openEditTempleModal(templeId) {
        const t = this._temples.find(x => x.id === templeId);
        if (!t) return;

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-edit"></i> Edit Temple</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="editTempleForm" onsubmit="SuperAdminModule.handleUpdateTemple(event,'${t.id}')">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Temple Name *</label><input type="text" class="form-control" id="et_name" value="${t.name}" required></div>
                    <div class="form-group"><label class="form-label">Domain *</label><input type="text" class="form-control" id="et_domain" value="${t.domain}" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-control" id="et_location" value="${[t.location, t.district, t.state].filter(Boolean).join(', ')}"></div>
                    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="et_status"><option value="active" ${t.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${t.status === 'inactive' ? 'selected' : ''}>Inactive</option></select></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update</button></div>
            </form>
        `);
    },

    async handleUpdateTemple(e, templeId) {
        e.preventDefault();
        const name = document.getElementById('et_name').value.trim();
        const domain = document.getElementById('et_domain').value.trim();
        const location = document.getElementById('et_location').value.trim();
        const status = document.getElementById('et_status').value;

        try {
            await TempleManagementService.update(templeId, { name, domain, location, status });
            App.closeModal();
            App.showToast(`Temple updated successfully!`, 'success');
            AuditLog.add('Edit', 'Temples', `Updated temple: ${name}`);
            await this.loadTemples();
            this.switchTab('temples-mgmt');
        } catch (err) {
            App.showToast('Failed to update temple: ' + err.message, 'error');
        }
    },

    confirmDeactivateTemple(templeId, templeName) {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-exclamation-triangle" style="color:var(--primary-red)"></i> Deactivate Temple</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <div style="padding:20px;text-align:center">
                <div style="font-size:3rem;color:var(--primary-red);margin-bottom:12px"><i class="fas fa-ban"></i></div>
                <p style="font-size:1rem;margin-bottom:8px">You are about to <strong>deactivate</strong> temple <strong>${templeName}</strong>.</p>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">The temple and all its data will be preserved but hidden from active use.</p>
                <div style="display:flex;gap:12px;justify-content:center">
                    <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="App.closeModal();SuperAdminModule.handleDeleteTemple('${templeId}')"><i class="fas fa-ban"></i> Confirm Deactivate</button>
                </div>
            </div>
        `);
    },

    async handleDeleteTemple(templeId) {
        try {
            await TempleManagementService.delete(templeId);
            App.showToast('Temple deactivated', 'warning');
            AuditLog.add('Delete', 'Temples', `Deactivated temple: ${templeId}`);
            await this.loadTemples();
            this.switchTab('temples-mgmt');
        } catch (err) {
            App.showToast('Failed to deactivate temple: ' + err.message, 'error');
        }
    },

    async reactivateTemple(templeId) {
        try {
            await TempleManagementService.update(templeId, { status: 'active' });
            App.showToast('Temple reactivated!', 'success');
            AuditLog.add('Edit', 'Temples', `Reactivated temple: ${templeId}`);
            await this.loadTemples();
            this.switchTab('temples-mgmt');
        } catch (err) {
            App.showToast('Failed to reactivate temple: ' + err.message, 'error');
        }
    }
};

// Initialize RBAC data from backend (admin only)
if (typeof getToken === 'function' && getToken()) {
    const _payload = typeof parseJwt === 'function' ? parseJwt(getToken()) : null;
    if (_payload && (_payload.role === 'ADMIN' || _payload.role === 'SUPERADMIN')) {
        SuperAdminModule.loadData();
        // Also pre-load temples for SuperAdmin
        if (_payload.role === 'SUPERADMIN') {
            SuperAdminModule.loadTemples();
        }
    }
}
