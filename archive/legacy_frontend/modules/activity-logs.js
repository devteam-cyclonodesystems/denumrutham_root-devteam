/* =====================
   ACTIVITY LOGS MODULE (Dedicated)
   Full audit trail with filters, export
   ===================== */
window.ActivityLogsModule = {
    filters: {
        dateFrom: '',
        dateTo: '',
        timeFrom: '',
        timeTo: '',
        user: '',
        module: '',
        action: ''
    },

    render() {
        const ml = App.currentLang === 'ml';
        const filtered = this.getFilteredEntries();

        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-clipboard-list"></i> ${ml ? 'പ്രവർത്തന ലോഗ്' : 'Activity Logs'}</h1>
        </div>

        <!-- KPI Stats -->
        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-list kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ ലോഗുകൾ' : 'Total Logs'}</div><div class="kpi-value">${AuditLog.entries.length}</div><div class="kpi-sub">All time</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-plus kpi-icon"></i><div class="kpi-label">${ml ? 'ഇന്ന് സൃഷ്ടിച്ചവ' : 'Creates Today'}</div><div class="kpi-value">${AuditLog.entries.filter(e => e.action === 'Create').length}</div><div class="kpi-sub">Create actions</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-edit kpi-icon"></i><div class="kpi-label">${ml ? 'തിരുത്തലുകൾ' : 'Edits'}</div><div class="kpi-value">${AuditLog.entries.filter(e => e.action === 'Edit').length}</div><div class="kpi-sub">Edit actions</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-trash kpi-icon"></i><div class="kpi-label">${ml ? 'ഇല്ലാതാക്കിയവ' : 'Deletes'}</div><div class="kpi-value">${AuditLog.entries.filter(e => e.action === 'Delete' || e.action.includes('Delete')).length}</div><div class="kpi-sub">Delete actions</div></div>
        </div>

        <!-- Filter Bar -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-filter"></i> ${ml ? 'ഫിൽട്ടറുകൾ' : 'Filters'}</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-sm btn-outline" onclick="ActivityLogsModule.resetFilters()" data-tooltip="Reset all filters"><i class="fas fa-undo"></i> Reset</button>
                    <button class="btn btn-sm btn-primary" onclick="ActivityLogsModule.exportPDF()" data-tooltip="Export as PDF"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-sm btn-success" onclick="ActivityLogsModule.exportExcel()" data-tooltip="Export as Excel"><i class="fas fa-file-excel"></i> Excel</button>
                </div>
            </div>
            <div class="log-filter-grid">
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">Date From</label>
                    <input type="date" class="form-control" id="log_date_from" value="${this.filters.dateFrom}" onchange="ActivityLogsModule.filters.dateFrom=this.value;ActivityLogsModule.applyFilters()">
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">Date To</label>
                    <input type="date" class="form-control" id="log_date_to" value="${this.filters.dateTo}" onchange="ActivityLogsModule.filters.dateTo=this.value;ActivityLogsModule.applyFilters()">
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">Time From</label>
                    <input type="time" class="form-control" id="log_time_from" value="${this.filters.timeFrom}" onchange="ActivityLogsModule.filters.timeFrom=this.value;ActivityLogsModule.applyFilters()">
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">Time To</label>
                    <input type="time" class="form-control" id="log_time_to" value="${this.filters.timeTo}" onchange="ActivityLogsModule.filters.timeTo=this.value;ActivityLogsModule.applyFilters()">
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">User</label>
                    <select class="form-control" id="log_user" onchange="ActivityLogsModule.filters.user=this.value;ActivityLogsModule.applyFilters()">
                        <option value="">All Users</option>
                        ${[...new Set(AuditLog.entries.map(e => e.user))].map(u => `<option value="${u}" ${this.filters.user === u ? 'selected' : ''}>${u}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">Module</label>
                    <select class="form-control" id="log_module" onchange="ActivityLogsModule.filters.module=this.value;ActivityLogsModule.applyFilters()">
                        <option value="">All Modules</option>
                        ${[...new Set(AuditLog.entries.map(e => e.module))].map(m => `<option value="${m}" ${this.filters.module === m ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-size:0.72rem">Action Type</label>
                    <select class="form-control" id="log_action" onchange="ActivityLogsModule.filters.action=this.value;ActivityLogsModule.applyFilters()">
                        <option value="">All Actions</option>
                        <option value="Create" ${this.filters.action === 'Create' ? 'selected' : ''}>Create</option>
                        <option value="Edit" ${this.filters.action === 'Edit' ? 'selected' : ''}>Edit</option>
                        <option value="Delete" ${this.filters.action === 'Delete' ? 'selected' : ''}>Delete</option>
                        <option value="Approve" ${this.filters.action === 'Approve' ? 'selected' : ''}>Approve</option>
                        <option value="Reject" ${this.filters.action === 'Reject' ? 'selected' : ''}>Reject</option>
                        <option value="Login" ${this.filters.action === 'Login' ? 'selected' : ''}>Login</option>
                        <option value="Logout" ${this.filters.action === 'Logout' ? 'selected' : ''}>Logout</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Logs Table -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-list"></i> ${ml ? 'ലോഗ് എൻട്രികൾ' : 'Log Entries'} <small style="color:var(--text-muted)">(${filtered.length} records)</small></div></div>
            <div style="overflow-x:auto">
            <table class="data-table" id="activityLogTable">
                <thead><tr>
                    <th>${ml ? 'സമയം' : 'Timestamp'}</th>
                    <th>${ml ? 'ഉപയോക്താവ്' : 'User'}</th>
                    <th>${ml ? 'പദവി' : 'Role'}</th>
                    <th>${ml ? 'മൊഡ്യൂൾ' : 'Module'}</th>
                    <th>${ml ? 'പ്രവർത്തനം' : 'Action'}</th>
                    <th>${ml ? 'വിശദാംശങ്ങൾ' : 'Details'}</th>
                    <th>${ml ? 'പഴയ മൂല്യം' : 'Old Value'}</th>
                    <th>${ml ? 'പുതിയ മൂല്യം' : 'New Value'}</th>
                    <th>IP</th>
                </tr></thead>
                <tbody>
                    ${filtered.map(e => `<tr>
                        <td><small>${e.ts}</small></td>
                        <td>${e.user}</td>
                        <td><small>${e.role || '—'}</small></td>
                        <td><span class="badge badge-info">${e.module}</span></td>
                        <td><span class="badge ${this.actionBadge(e.action)}">${e.action}</span></td>
                        <td><small>${e.details}</small></td>
                        <td><small>${e.oldValue || '—'}</small></td>
                        <td><small>${e.newValue || '—'}</small></td>
                        <td><small>${e.ip || '—'}</small></td>
                    </tr>`).join('')}
                </tbody>
            </table>
            </div>
        </div>`;
    },

    actionBadge(action) {
        const map = {
            'Create': 'badge-success', 'Edit': 'badge-info', 'Delete': 'badge-danger',
            'Approve': 'badge-teal', 'Reject': 'badge-danger', 'Login': 'badge-purple',
            'Logout': 'badge-warning'
        };
        return map[action] || 'badge-warning';
    },

    getFilteredEntries() {
        return AuditLog.entries.filter(e => {
            if (this.filters.user && e.user !== this.filters.user) return false;
            if (this.filters.module && e.module !== this.filters.module) return false;
            if (this.filters.action && !e.action.includes(this.filters.action)) return false;
            if (this.filters.dateFrom) {
                const entryDate = e.ts.split(' ')[0];
                if (entryDate < this.filters.dateFrom) return false;
            }
            if (this.filters.dateTo) {
                const entryDate = e.ts.split(' ')[0];
                if (entryDate > this.filters.dateTo) return false;
            }
            if (this.filters.timeFrom) {
                const entryTime = e.ts.split(' ')[1] || '';
                if (entryTime < this.filters.timeFrom) return false;
            }
            if (this.filters.timeTo) {
                const entryTime = e.ts.split(' ')[1] || '';
                if (entryTime > this.filters.timeTo) return false;
            }
            return true;
        });
    },

    applyFilters() {
        App.navigateTo('activity-logs');
    },

    resetFilters() {
        this.filters = { dateFrom: '', dateTo: '', timeFrom: '', timeTo: '', user: '', module: '', action: '' };
        App.navigateTo('activity-logs');
    },

    exportPDF() {
        App.showToast('Generating PDF... (In production, this triggers server-side PDF generation)', 'info');
        // In production: window.print() or server API call
        setTimeout(() => {
            const printContent = document.getElementById('activityLogTable').outerHTML;
            const win = window.open('', '', 'width=1200,height=800');
            win.document.write(`<html><head><title>Activity Logs Export</title><style>table{border-collapse:collapse;width:100%;font-family:Inter,sans-serif;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1a237e;color:#fff}</style></head><body><h2>Activity Logs - Temple Management System</h2>${printContent}</body></html>`);
            win.document.close();
            win.print();
        }, 500);
    },

    exportExcel() {
        App.showToast('Generating Excel... (downloading CSV)', 'info');
        const entries = this.getFilteredEntries();
        let csv = 'Timestamp,User,Role,Module,Action,Details,Old Value,New Value,IP\n';
        entries.forEach(e => {
            csv += `"${e.ts}","${e.user}","${e.role || ''}","${e.module}","${e.action}","${e.details}","${e.oldValue || ''}","${e.newValue || ''}","${e.ip || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'activity_logs.csv'; a.click();
        URL.revokeObjectURL(url);
    }
};
