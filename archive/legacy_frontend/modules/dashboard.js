/* =====================
   DASHBOARD MODULE v4
   Cleaned up layout, date filter scoped to big tiles, Connected Devices as mini-table
   ===================== */
window.DashboardModule = {
    dateFilter: 'today',
    customStart: '',
    customEnd: '',
    customTimeStart: '',
    customTimeEnd: '',

    _apiLoaded: false,
    _apiBookingsCount: 0,
    _apiDonationsTotal: 0,

    // Devices data
    devices: [],
    _loading: false,

    async loadFromAPI() {
        if (this._loading) return;
        this._loading = true;
        console.log('[Dashboard] Loading data from API...');

        try {
            if (typeof BookingService !== 'undefined') {
                const bookings = await BookingService.getAll(0, 1000);
                this._apiBookingsCount = bookings ? bookings.length : 0;
            }
            if (typeof DonationService !== 'undefined') {
                const donations = await DonationService.getAll(0, 1000);
                this._apiDonationsTotal = donations ? donations.reduce((sum, d) => sum + d.amount, 0) : 0;
            }
            this._apiLoaded = true;
        } catch (e) {
            console.error('[Dashboard] Error loading API data:', e);
            // Even on error, we mark as as loaded to stop the "..." loading state
            // and maybe try again later or provide a manual refresh.
            this._apiLoaded = true;
        } finally {
            this._loading = false;
        }

        // Trigger a re-render if we are still on the dashboard page
        if (App.currentPage === 'dashboard') {
            const content = document.getElementById('pageContent');
            if (content) content.innerHTML = this.render();
        }
    },

    render() {
        if (!this._apiLoaded && !this._loading) {
            this.loadFromAPI();
        }

        const ml = App.currentLang === 'ml';
        const presentCount = this._apiLoaded ? (this._apiEmployeesCount || '...') : '...';
        const onLeaveCount = this._apiLoaded ? (this._apiLeavesCount || '...') : '...';

        const bookingCount = this._apiLoaded ? this._apiBookingsCount : '...';
        const donationTotalStr = this._apiLoaded ? `₹${this._apiDonationsTotal.toLocaleString()}` : '...';

        return `
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
            <h1 class="page-title"><i class="fas fa-th-large"></i> ${ml ? 'ഡാഷ്ബോർഡ്' : 'Dashboard'}</h1>
            <div style="display:flex;gap:10px;align-items:center">
                ${this._apiLoaded ? '<span class="badge badge-success" style="font-size:0.75rem"><i class="fas fa-signal"></i> LIVE SYNC</span>' : '<span class="badge badge-warning" style="font-size:0.75rem"><i class="fas fa-database"></i> OFFLINE</span>'}
                <button class="btn btn-sm btn-outline" onclick="DashboardModule._apiLoaded=false; App.navigateTo('dashboard')" data-tooltip="Refresh data">
                    <i class="fas fa-sync-alt ${this._loading ? 'fa-spin' : ''}"></i>
                </button>
            </div>
        </div>

        <!-- Date Range Filter (Scoped to KPI tiles only) -->
        <div class="date-filter-bar" style="background:#e3f2fd;border:1px solid #bbdefb">
            <i class="fas fa-calendar-alt" style="color:var(--primary-blue)"></i>
            <span style="font-size:0.8rem;font-weight:600;color:var(--primary-blue);margin-right:12px">FILTER:</span>
            ${['today', 'weekly', 'monthly', '6months', 'yearly', 'custom'].map(f => `
                <span class="filter-pill ${this.dateFilter === f ? 'active' : ''}" onclick="DashboardModule.setFilter('${f}')">${f === 'today' ? (ml ? 'ഇന്ന്' : 'Today') :
                f === 'weekly' ? (ml ? 'ആഴ്ച' : 'Weekly') :
                    f === 'monthly' ? (ml ? 'മാസം' : 'Monthly') :
                        f === '6months' ? '6 Months' :
                            f === 'yearly' ? (ml ? 'വാർഷികം' : 'Yearly') : (ml ? 'ഇഷ്‌ടാനുസൃതം' : 'Custom')
            }</span>
            `).join('')}
        </div>

        <!-- Stats Row (RBAC-filtered) -->
        <div class="kpi-grid">
            ${RBAC.canAccessModule('archana') ? `<div class="kpi-card" style="background:var(--grad-blue)" onclick="location.hash='archana'"><i class="fas fa-om kpi-icon"></i><div class="kpi-label">${ml ? 'അർച്ചന ബുക്കിംഗ്' : 'Archana Bookings'}</div><div class="kpi-value" id="kpi-bookings">${bookingCount}</div><div class="kpi-sub">Total recorded context</div></div>` : ''}
            ${RBAC.canAccessModule('offerings') ? `<div class="kpi-card" style="background:var(--grad-teal)" onclick="location.hash='offerings'"><i class="fas fa-coins kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ വഴിപാട്' : 'Total Offerings / Donations'}</div><div class="kpi-value" id="kpi-donations">${donationTotalStr}</div><div class="kpi-sub">Total recorded context</div></div>` : ''}
            ${RBAC.canAccessModule('hall-booking') ? `<div class="kpi-card" style="background:var(--grad-purple)" onclick="location.hash='hall-booking'"><i class="fas fa-building kpi-icon"></i><div class="kpi-label">${ml ? 'ഹാൾ ബുക്കിംഗ്' : 'Hall Bookings'}</div><div class="kpi-value">${this._apiLoaded ? (this._apiHallBookingsCount || 0) : '...'}</div><div class="kpi-sub">${this.dateFilter} filter applied</div></div>` : ''}
            ${RBAC.canAccessModule('hr-payroll') ? `<div class="kpi-card" style="background:var(--grad-green)" onclick="location.hash='hr-payroll'"><i class="fas fa-users kpi-icon"></i><div class="kpi-label">${ml ? 'ജീവനക്കാർ' : 'Employees'}</div><div class="kpi-value"><span style="font-size:0.85em">${presentCount} <small>Present</small> · ${onLeaveCount} <small>Leave</small></span></div><div class="kpi-sub">${ml ? 'ഇന്നത്തെ ഡാറ്റ' : "Today's data (fixed)"}</div></div>` : ''}
        </div>

        <!-- Quick Action Shortcuts (RBAC-filtered) -->
        <div class="quick-actions">
            ${RBAC.canWriteModule('archana') ? `<div class="quick-action-card" onclick="location.hash='archana';setTimeout(()=>ArchanaModule.openBookingModal(),200)" data-tooltip="Quickly create a new Archana/Pooja booking"><div class="qa-icon" style="background:var(--grad-blue)"><i class="fas fa-plus"></i></div><div class="qa-text">${ml ? 'പുതിയ അർച്ചന/പൂജ' : 'New Archana/Pooja'}</div></div>` : ''}
            ${RBAC.canWriteModule('offerings') ? `<div class="quick-action-card" onclick="location.hash='offerings';setTimeout(()=>OfferingsModule.openOfferingModal(),200)" data-tooltip="Register a new devotee offering"><div class="qa-icon" style="background:var(--grad-teal)"><i class="fas fa-hand-holding-dollar"></i></div><div class="qa-text">${ml ? 'പുതിയ വഴിപാട്' : 'New Offering'}</div></div>` : ''}
            ${RBAC.canWriteModule('store') ? `<div class="quick-action-card" onclick="location.hash='store';setTimeout(()=>StoreModule.openSellItemModal(),200)" data-tooltip="Sell a temple store item"><div class="qa-icon" style="background:var(--grad-gold)"><i class="fas fa-shopping-cart"></i></div><div class="qa-text">${ml ? 'സ്റ്റോർ വിൽപന' : 'Sell Store Item'}</div></div>` : ''}
            ${RBAC.canWriteModule('inventory') ? `<div class="quick-action-card" onclick="location.hash='inventory';setTimeout(()=>InventoryModule.openInvoiceModal(),200)" data-tooltip="Add an inventory invoice"><div class="qa-icon" style="background:var(--grad-orange)"><i class="fas fa-file-invoice"></i></div><div class="qa-text">${ml ? 'പുതിയ ഇൻവോയ്‌സ്' : 'New Inventory Invoice'}</div></div>` : ''}
            ${RBAC.canWriteModule('accounting') ? `<div class="quick-action-card" onclick="location.hash='accounting';setTimeout(()=>AccountingModule.openModal(),200)" data-tooltip="Record a new temple expense"><div class="qa-icon" style="background:var(--grad-red)"><i class="fas fa-money-bill"></i></div><div class="qa-text">${ml ? 'പുതിയ ചിലവ്' : 'New Expense'}</div></div>` : ''}
            ${RBAC.canWriteModule('communication') ? `<div class="quick-action-card" onclick="location.hash='whatsapp'" data-tooltip="Send WhatsApp notification"><div class="qa-icon" style="background:#25d366"><i class="fab fa-whatsapp"></i></div><div class="qa-text">${ml ? 'സന്ദേശം' : 'Send Broadcast'}</div></div>` : ''}
            ${RBAC.canAccessModule('communication') ? `<div class="quick-action-card" onclick="location.hash='live-streaming'" data-tooltip="Start YouTube Live for temple event"><div class="qa-icon" style="background:var(--grad-red)"><i class="fas fa-video"></i></div><div class="qa-text">${ml ? 'ലൈവ്' : 'Go Live'}</div></div>` : ''}
        </div>

        <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <!-- Today's Temple Timings -->
            <div class="section-card compact">
                <div class="section-header"><div class="section-title"><i class="fas fa-clock"></i> ${ml ? 'ഇന്നത്തെ സമയക്രമം' : "Today's Temple Timings"}</div></div>
                <table class="data-table compact-table">
                    <thead><tr><th>${ml ? 'സമയം' : 'Time'}</th><th>${ml ? 'പൂജ' : 'Pooja / Event'}</th></tr></thead>
                    <tbody>
                        <tr><td><strong>05:00 AM</strong></td><td>Nirmalya Darshanam</td></tr>
                        <tr><td><strong>06:00 AM</strong></td><td>Suprabhatam & Abhishekam</td></tr>
                        <tr><td><strong>08:00 AM</strong></td><td>Ganapathi Homam</td></tr>
                        <tr><td><strong>10:00 AM</strong></td><td>Navagraha Pooja <span class="badge badge-warning">Special</span></td></tr>
                        <tr><td><strong>12:00 PM</strong></td><td>Ucha Pooja & Deeparadhana</td></tr>
                        <tr><td><strong>05:30 PM</strong></td><td>Sandhya Pooja</td></tr>
                        <tr><td><strong>06:30 PM</strong></td><td>Deeparadhana</td></tr>
                        <tr><td><strong>08:00 PM</strong></td><td>Athazha Pooja & Closing</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Temple Announcements -->
            <div class="section-card compact">
                <div class="section-header"><div class="section-title"><i class="fas fa-bullhorn"></i> ${ml ? 'ക്ഷേത്ര അറിയിപ്പുകൾ' : 'Temple Announcements'}</div></div>
                <div class="announce-scroll auto-scrolling">
                    <div class="announce-inner">
                        <div class="activity-item"><div class="activity-dot" style="background:var(--primary-gold)"></div><div class="activity-content"><div class="activity-text"><strong>Maha Shivaratri</strong> — Feb 26, 2026. Special 12-hour rituals.</div><div class="activity-time">Upcoming</div></div></div>
                        <div class="activity-item"><div class="activity-dot" style="background:var(--primary-teal)"></div><div class="activity-content"><div class="activity-text"><strong>Full Moon Pooja</strong> — Mar 3, 2026. Evening special pooja.</div><div class="activity-time">Upcoming</div></div></div>
                        <div class="activity-item"><div class="activity-dot" style="background:var(--primary-orange)"></div><div class="activity-content"><div class="activity-text"><strong>Annual Festival</strong> — Mar 15–22, 2026. Cultural programs daily.</div><div class="activity-time">Upcoming</div></div></div>
                        <div class="activity-item"><div class="activity-dot" style="background:var(--primary-blue)"></div><div class="activity-content"><div class="activity-text"><strong>Ram Navami Celebrations</strong> — Apr 6, 2026.</div><div class="activity-time">Upcoming</div></div></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <!-- Key Personnel -->
            <div class="section-card compact">
                <div class="section-header"><div class="section-title"><i class="fas fa-id-badge"></i> ${ml ? 'ജീവനക്കാർ' : 'Key Personnel'}</div></div>
                <table class="data-table compact-table">
                    <thead><tr><th>${ml ? 'പേര്' : 'Name'}</th><th>${ml ? 'പദവി' : 'Role'}</th></tr></thead>
                    <tbody>
                        <tr><td>Sri Venkatesh Bhatt</td><td><span class="badge badge-purple">Head Pujari</span></td></tr>
                        <tr><td>Sri Ramanathan</td><td><span class="badge badge-purple">Pujari</span></td></tr>
                        <tr><td>Mr. Narayanan Nair</td><td><span class="badge badge-teal">Committee President</span></td></tr>
                        <tr><td>Mr. Suresh Menon</td><td><span class="badge badge-teal">Secretary</span></td></tr>
                        <tr><td>Mr. Krishnan Pillai</td><td><span class="badge badge-info">Temple Manager</span></td></tr>
                        <tr><td>Ms. Deepa S.</td><td><span class="badge badge-info">Counter Staff</span></td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Revenue Split -->
            <div class="section-card compact">
                <div class="section-header"><div class="section-title"><i class="fas fa-chart-pie"></i> ${ml ? 'വരുമാന വിഭജനം' : 'Revenue Split'}</div></div>
                <div class="stat-row"><span class="stat-label">Offerings</span><span class="stat-value">₹4,52,800</span></div>
                <div class="stat-row"><span class="stat-label">Archana Fees</span><span class="stat-value">₹1,86,500</span></div>
                <div class="stat-row"><span class="stat-label">Hall Rental</span><span class="stat-value">₹2,40,000</span></div>
                <div class="stat-row"><span class="stat-label">Store Sales</span><span class="stat-value">₹1,25,400</span></div>
                <div style="border-top:2px solid var(--primary-blue);padding-top:8px;margin-top:8px;display:flex;justify-content:space-between;font-weight:800"><span>Total Revenue</span><span style="color:var(--primary-blue);font-size:1.1rem">₹10,04,700</span></div>
            </div>
        </div>

        <!-- Recent Activity & Connected Devices -->
        <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div class="section-card compact" style="padding:10px;">
                <div class="section-header"><div class="section-title"><i class="fas fa-history"></i> ${ml ? 'സമീപ പ്രവർത്തനം' : 'Recent Activity'}</div></div>
                <div class="activity-list compact-activity" style="font-size:0.8rem; padding: 10px; color: var(--text-muted); text-align: center;">
                    No recent activity to display.
                </div>
            </div>

            <!-- Connected Devices (converted to mini table) -->
            <div class="section-card compact">
                <div class="section-header">
                    <div class="section-title"><i class="fas fa-laptop"></i> ${ml ? 'ഉപകരണ സ്ഥിതി' : 'Connected Devices'}</div>
                    <button class="btn btn-outline btn-sm" onclick="DashboardModule.addDevice()" data-tooltip="Add new device"><i class="fas fa-plus"></i></button>
                </div>
                <div style="overflow-x:auto">
                <table class="data-table" style="font-size:0.8rem"><thead><tr><th>ID/Device</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                    ${this.devices.map(d => `<tr>
                        <td><strong>${d.id}</strong><br>${d.name}</td>
                        <td><span class="badge badge-info">${d.assignedTo}</span></td>
                        <td><div style="display:inline-flex;align-items:center;gap:4px;color:${d.status === 'connected' ? 'var(--primary-green)' : 'var(--primary-red)'}"><div style="width:8px;height:8px;border-radius:50%;background:currentColor"></div>${d.status}</div></td>
                        <td style="white-space:nowrap">
                            <div class="action-dropdown" style="text-align:left">
                                <button class="btn btn-sm btn-edit" title="Device Actions"><i class="fas fa-pen"></i></button>
                                <div class="action-dropdown-content">
                                    <button class="action-menu-btn" onclick="DashboardModule.editDevice('${d.id}')"><i class="fas fa-edit"></i> Edit Device</button>
                                    <button class="action-menu-btn text-danger" onclick="DashboardModule.removeDevice('${d.id}')"><i class="fas fa-trash"></i> Remove Device</button>
                                </div>
                            </div>
                        </td>
                    </tr>`).join('')}
                </tbody></table>
                </div>
            </div>
        </div>
        `;
    },

    setFilter(f) {
        if (f === 'custom') {
            this.openCustomFilterModal();
            return;
        }
        this.dateFilter = f;
        App.navigateTo('dashboard');
    },
    applyFilter(e) {
        if (e) e.preventDefault();
        this.dateFilter = 'custom';
        this.customStart = document.getElementById('cf_date_start').value;
        this.customEnd = document.getElementById('cf_date_end').value;
        const ts = document.getElementById('cf_time_start').value;
        const tp = document.getElementById('cf_ampm_start').value;
        this.customTimeStart = ts + ' ' + tp;
        const te = document.getElementById('cf_time_end').value;
        const tp_end = document.getElementById('cf_ampm_end').value;
        this.customTimeEnd = te + ' ' + tp_end;
        App.closeModal();
        App.navigateTo('dashboard');
    },
    openCustomFilterModal() {
        // Generate 1-12 hour options
        const hrs = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
        const mins = ['00', '15', '30', '45'];
        const timeOpts = hrs.flatMap(h => mins.map(m => `<option value="${h}:${m}">${h}:${m}</option>`)).join('');

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Custom Date-Time Range</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="DashboardModule.applyFilter(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Start Date</label><input type="date" class="form-control" id="cf_date_start" required></div>
                    <div class="form-group"><label class="form-label">Start Time</label>
                        <div style="display:flex;gap:4px">
                            <select class="form-control" id="cf_time_start" required>${timeOpts}</select>
                            <select class="form-control" id="cf_ampm_start"><option>AM</option><option>PM</option></select>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">End Date</label><input type="date" class="form-control" id="cf_date_end" required></div>
                    <div class="form-group"><label class="form-label">End Time</label>
                        <div style="display:flex;gap:4px">
                            <select class="form-control" id="cf_time_end" required>${timeOpts}</select>
                            <select class="form-control" id="cf_ampm_end"><option>AM</option><option>PM</option></select>
                        </div>
                    </div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Apply Filter</button></div>
            </form>
        `);
    },

    // --- Device Management ---
    addDevice() {
        App.openModal(`
            < div class= "modal-header" ><h3 class="modal-title">Add Device</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div >
        <form id="devForm" onsubmit="DashboardModule.saveDevice(event)">
            <div class="form-row">
                <div class="form-group"><label class="form-label">Device Name *</label><input type="text" class="form-control" id="dev_name" required></div>
                <div class="form-group"><label class="form-label">Type *</label><select class="form-control" id="dev_type" required><option>Biometric</option><option>Printer</option><option>Payment</option><option>Scanner</option><option>Camera</option><option>Other</option></select></div>
            </div>
            <div class="form-group"><label class="form-label">Assign To</label><select class="form-control" id="dev_assign"><option>Counter</option><option>HR Module</option><option>Store</option><option>Inventory</option><option>All Modules</option></select></div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
        `);
    },

    saveDevice(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('devForm'))) return;
        this.devices.push({
            id: RefNumberGenerator.generateSequential('DEV', this.devices, 2),
            name: document.getElementById('dev_name').value,
            type: document.getElementById('dev_type').value,
            assignedTo: document.getElementById('dev_assign').value,
            status: 'disconnected'
        });
        AuditLog.add('Create', 'Dashboard', 'Added device: ' + document.getElementById('dev_name').value);
        App.closeModal(); App.showToast('Device added!', 'success'); App.navigateTo('dashboard');
    },

    editDevice(id) {
        const d = this.devices.find(x => x.id === id);
        if (!d) return;
        App.openModal(`
            < div class= "modal-header" ><h3 class="modal-title">Edit Device ${d.id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div >
        <form onsubmit="DashboardModule.updateDevice(event,'${d.id}')">
            <div class="form-row">
                <div class="form-group"><label class="form-label">Device Name</label><input type="text" class="form-control" id="dev_e_name" value="${d.name}" required></div>
                <div class="form-group"><label class="form-label">Type</label><select class="form-control" id="dev_e_type"><option ${d.type === 'Biometric' ? 'selected' : ''}>Biometric</option><option ${d.type === 'Printer' ? 'selected' : ''}>Printer</option><option ${d.type === 'Payment' ? 'selected' : ''}>Payment</option><option ${d.type === 'Scanner' ? 'selected' : ''}>Scanner</option><option ${d.type === 'Camera' ? 'selected' : ''}>Camera</option><option ${d.type === 'Other' ? 'selected' : ''}>Other</option></select></div>
            </div>
            <div class="form-group"><label class="form-label">Assign To</label><select class="form-control" id="dev_e_assign"><option ${d.assignedTo === 'Counter' ? 'selected' : ''}>Counter</option><option ${d.assignedTo === 'HR' ? 'selected' : ''}>HR Module</option><option ${d.assignedTo === 'Store' ? 'selected' : ''}>Store</option><option ${d.assignedTo === 'Inventory' ? 'selected' : ''}>Inventory</option><option ${d.assignedTo === 'All Modules' ? 'selected' : ''}>All Modules</option></select></div>
            <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="dev_e_status"><option ${d.status === 'connected' ? 'selected' : ''}>connected</option><option ${d.status === 'disconnected' ? 'selected' : ''}>disconnected</option></select></div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
        </form>
        `);
    },

    updateDevice(e, id) {
        e.preventDefault();
        const d = this.devices.find(x => x.id === id);
        if (d) {
            d.name = document.getElementById('dev_e_name').value;
            d.type = document.getElementById('dev_e_type').value;
            d.assignedTo = document.getElementById('dev_e_assign').value;
            d.status = document.getElementById('dev_e_status').value;
        }
        AuditLog.add('Edit', 'Dashboard', 'Updated device: ' + id);
        App.closeModal(); App.showToast('Device updated!', 'success'); App.navigateTo('dashboard');
    },

    removeDevice(id) {
        const idx = this.devices.findIndex(x => x.id === id);
        if (idx > -1) {
            const removed = this.devices.splice(idx, 1)[0];
            AuditLog.add('Delete', 'Dashboard', 'Removed device: ' + removed.name);
            App.showToast('Device removed', 'warning');
            App.showUndo('Device removed', () => { this.devices.splice(idx, 0, removed); App.navigateTo('dashboard'); });
            App.navigateTo('dashboard');
        }
    }
};
