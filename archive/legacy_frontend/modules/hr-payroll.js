/* =====================
   HR & PAYROLL MODULE v3
   Remarks for approval, Joining Date, Active label, Edit+View history, Pending Timesheet tile
   ===================== */
window.HRPayrollModule = {
    employees: [],
    leaves: [],
    currentTab: 'directory',
    _dataLoaded: false,

    async loadData() {
        try {
            this.employees = await apiRequest('/api/v1/employees') || [];
            this.leaves = await apiRequest('/api/v1/employees/leaves') || [];
            // Map employee ID to name for leaves if needed
            this.leaves.forEach(l => {
                if (!l.emp && l.employee_id) {
                    const e = this.employees.find(x => x.id === l.employee_id);
                    l.emp = e ? e.name : parseInt(l.employee_id).toString().substring(0,8);
                }
            });
            this._dataLoaded = true;
            App.navigateTo('hr-payroll');
        } catch (e) {
            console.error(e);
            App.showToast("Failed to load HR data", "error");
        }
    },

    render() {
        if (!this._dataLoaded) {
            this.loadData();
            return `<div style="padding:40px;text-align:center;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary-blue)"></i><p style="margin-top:10px">Loading HR & Payroll...</p></div>`;
        }
        
        const ml = App.currentLang === 'ml';
        const pendingLeaves = this.leaves.filter(l => l.status === 'pending').length;
        const totalPayroll = this.employees.reduce((s, e) => s + (e.salary || 0), 0);
        const pendingTimesheet = this.employees.filter(e => (e.attendance || 0) < 20).length;
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-users"></i> ${ml ? 'HR & പേയ്‌റോൾ' : 'HR & Payroll'}</h1>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-users kpi-icon"></i><div class="kpi-label">${ml ? 'ജീവനക്കാർ' : 'Total Employees'}</div><div class="kpi-value">${this.employees.length}</div><div class="kpi-sub">Active</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-money-bill kpi-icon"></i><div class="kpi-label">${ml ? 'പേയ്‌റോൾ' : 'Monthly Payroll'}</div><div class="kpi-value">₹${totalPayroll.toLocaleString()}</div><div class="kpi-sub">This month</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-calendar-times kpi-icon"></i><div class="kpi-label">${ml ? 'ലീവ്' : 'Pending Leaves'}</div><div class="kpi-value">${pendingLeaves}</div><div class="kpi-sub">Awaiting</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-clipboard-check kpi-icon"></i><div class="kpi-label">Pending Timesheet</div><div class="kpi-value">${pendingTimesheet}</div><div class="kpi-sub">< 20 days</div></div>
        </div>

        <div class="section-card">
            <div class="tabs-bar">
                <button class="tab-btn ${this.currentTab === 'directory' ? 'active' : ''}" onclick="HRPayrollModule.switchTab('directory')">${ml ? 'ജീവനക്കാർ' : 'Employee Directory'}</button>
                <button class="tab-btn ${this.currentTab === 'leaves' ? 'active' : ''}" onclick="HRPayrollModule.switchTab('leaves')">${ml ? 'ലീവ്' : 'Leave Management'}</button>
            </div>
            ${this.currentTab === 'directory' ? this.renderDirectory(ml) : this.renderLeaves(ml)}
        </div>`;
    },

    renderDirectory(ml) {
        return `
            <div class="section-header"><div class="section-title"><i class="fas fa-id-badge"></i> ${ml ? 'ജീവനക്കാർ' : 'Employee Directory'}</div>
                <button class="btn btn-primary btn-sm" onclick="HRPayrollModule.addEmployee()"><i class="fas fa-plus"></i> Add Employee</button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Dept</th><th>Joining Date</th><th>Salary</th><th>Attendance</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                ${this.employees.map(e => `<tr id="record-${e.id}">
                    <td><strong>${e.id}</strong></td><td>${e.name}</td><td>${e.role}</td><td>${e.dept}</td>
                    <td><small>${e.joinDate}</small></td>
                    <td>₹${e.salary.toLocaleString()}</td>
                    <td>${e.attendance}/26 <small style="color:${e.attendance >= 20 ? 'var(--primary-green)' : 'var(--primary-red)'}">days</small></td>
                    <td><span class="badge badge-success">${e.status}</span></td>
                    <td style="white-space:nowrap; display:flex; gap:6px; align-items:center;">
                        <button class="btn btn-sm btn-outline" title="View" onclick="HRPayrollModule.viewEmployee('${e.id}')"><i class="fas fa-eye"></i></button>
                        <div class="action-dropdown">
                            <button class="btn btn-sm btn-edit" title="Employee Actions"><i class="fas fa-pen"></i></button>
                            <div class="action-dropdown-content">
                                <button class="action-menu-btn" onclick="HRPayrollModule.editEmployee('${e.id}')"><i class="fas fa-edit"></i> Edit Details</button>
                                <button class="action-menu-btn text-danger" title="Delete" onclick="HRPayrollModule.deleteEmployee('${e.id}')" ${!RBAC.canDelete('HR') ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}><i class="fas fa-trash"></i> Delete Employee</button>
                            </div>
                        </div>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
            <div style="margin-top:16px;display:flex;gap:10px">
                <button class="btn btn-success" onclick="HRPayrollModule.runPayroll()"><i class="fas fa-money-check-alt"></i> Run Payroll</button>
            </div>
        `;
    },

    renderLeaves(ml) {
        return `
            <div class="section-header"><div class="section-title"><i class="fas fa-calendar-times"></i> ${ml ? 'ലീവ്' : 'Leave Management'}</div>
                <button class="btn btn-primary btn-sm" onclick="HRPayrollModule.applyLeave()"><i class="fas fa-plus"></i> Apply Leave</button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Remarks</th><th>Actions</th></tr></thead><tbody>
                ${this.leaves.map(l => `<tr id="record-${l.id}">
                    <td><strong>${l.id}</strong></td><td>${l.emp}</td><td><span class="badge badge-info">${l.type}</span></td>
                    <td>${l.from}</td><td>${l.to}</td><td><small>${l.reason}</small></td>
                    <td><span class="badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${l.status}</span></td>
                    <td><small style="color:var(--text-muted)">${l.remarks || '—'}</small></td>
                    <td style="white-space:nowrap">
                        ${l.status === 'pending' ? `
                            <button class="btn btn-sm btn-approve" onclick="HRPayrollModule.approveLeave('${l.id}')"><i class="fas fa-check"></i></button>
                            <div class="action-dropdown" style="margin-left:4px">
                                <button class="btn btn-sm btn-edit"><i class="fas fa-pen"></i></button>
                                <div class="action-dropdown-content">
                                    <button class="action-menu-btn text-danger" onclick="HRPayrollModule.rejectLeave('${l.id}')"><i class="fas fa-times"></i> Reject</button>
                                </div>
                            </div>
                        ` : ''}
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        `;
    },

    switchTab(tab) { this.currentTab = tab; App.navigateTo('hr-payroll'); },

    viewEmployee(id) {
        const e = this.employees.find(x => x.id === id);
        if (!e) return;
        let promoHtml = e.promotionHistory?.length ? `<table class="data-table" style="margin-top:8px"><thead><tr><th>Date</th><th>From</th><th>To</th><th>Remarks</th></tr></thead><tbody>${e.promotionHistory.map(p => `<tr><td>${p.date}</td><td>${p.from}</td><td>${p.to}</td><td>${p.remarks || '—'}</td></tr>`).join('')}</tbody></table>` : '<small style="color:var(--text-muted)">No promotions</small>';
        let salaryHtml = e.salaryHistory?.length ? `<table class="data-table" style="margin-top:8px"><thead><tr><th>Date</th><th>From</th><th>To</th><th>Remarks</th></tr></thead><tbody>${e.salaryHistory.map(s => `<tr><td>${s.date}</td><td>₹${s.from?.toLocaleString()}</td><td>₹${s.to?.toLocaleString()}</td><td>${s.remarks || '—'}</td></tr>`).join('')}</tbody></table>` : '<small style="color:var(--text-muted)">No salary changes</small>';

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">${e.name}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <div class="stat-row"><span class="stat-label">ID</span><span class="stat-value">${e.id}</span></div>
            <div class="stat-row"><span class="stat-label">Role</span><span class="stat-value">${e.role}</span></div>
            <div class="stat-row"><span class="stat-label">Department</span><span class="stat-value">${e.dept}</span></div>
            <div class="stat-row"><span class="stat-label">Joining Date</span><span class="stat-value">${e.joinDate}</span></div>
            <div class="stat-row"><span class="stat-label">Salary</span><span class="stat-value">₹${e.salary.toLocaleString()}</span></div>
            <div class="stat-row"><span class="stat-label">Attendance</span><span class="stat-value">${e.attendance}/26</span></div>
            <div class="stat-row"><span class="stat-label">Status</span><span class="stat-value"><span class="badge badge-success">${e.status}</span></span></div>
            ${e.remarks ? `<div class="stat-row"><span class="stat-label">Other Remarks</span><span class="stat-value">${e.remarks}</span></div>` : ''}
            <h4 style="margin-top:16px;font-size:0.95rem;color:var(--primary-blue)"><i class="fas fa-arrow-up"></i> Promotion History</h4>
            ${promoHtml}
            <h4 style="margin-top:16px;font-size:0.95rem;color:var(--primary-teal)"><i class="fas fa-rupee-sign"></i> Salary Hike History</h4>
            ${salaryHtml}
        `);
    },

    editEmployee(id) {
        const e = this.employees.find(x => x.id === id);
        if (!e) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit ${e.name}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="HRPayrollModule.updateEmployee(event,'${e.id}')">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="emp_name" value="${e.name}" required></div>
                    <div class="form-group"><label class="form-label">Role</label><input type="text" class="form-control" id="emp_role" value="${e.role}" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Department</label><select class="form-control" id="emp_dept"><option ${e.dept === 'Puja' ? 'selected' : ''}>Puja</option><option ${e.dept === 'Admin' ? 'selected' : ''}>Admin</option><option ${e.dept === 'Operations' ? 'selected' : ''}>Operations</option><option ${e.dept === 'IT' ? 'selected' : ''}>IT</option></select></div>
                    <div class="form-group"><label class="form-label">Salary (₹)</label><input type="number" class="form-control" id="emp_salary" value="${e.salary}" min="1" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="emp_status"><option ${e.status === 'Active' ? 'selected' : ''}>Active</option><option ${e.status === 'On Leave' ? 'selected' : ''}>On Leave</option><option ${e.status === 'Offboarded' ? 'selected' : ''}>Offboarded</option></select></div>
                    <div class="form-group"><label class="form-label">Other Remarks</label><input type="text" class="form-control" id="emp_remarks" value="${e.remarks || ''}" placeholder="Optional"></div>
                </div>
                <hr style="margin:16px 0;border:none;border-top:1px solid #eef0f5">
                <h4 style="font-size:0.9rem;margin-bottom:10px;color:var(--primary-blue)"><i class="fas fa-arrow-up"></i> Add Promotion</h4>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Promote To</label><input type="text" class="form-control" id="emp_promo_to" placeholder="New role (optional)"></div>
                    <div class="form-group"><label class="form-label">Promo Remarks</label><input type="text" class="form-control" id="emp_promo_remarks" placeholder="Optional"></div>
                </div>

                <h4 style="font-size:0.9rem;margin-bottom:10px;color:var(--primary-teal)"><i class="fas fa-rupee-sign"></i> Salary Hike</h4>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">New Salary</label><input type="number" class="form-control" id="emp_new_salary" placeholder="Leave blank for no change" min="1"></div>
                    <div class="form-group"><label class="form-label">Hike Remarks</label><input type="text" class="form-control" id="emp_hike_remarks" placeholder="Optional"></div>
                </div>

                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
            </form>
        `);
    },

    async updateEmployee(ev, id) {
        ev.preventDefault();
        const e = this.employees.find(x => x.id === id);
        if (!e) return;
        
        const newRole = document.getElementById('emp_promo_to').value.trim();
        const newSal = parseInt(document.getElementById('emp_new_salary').value);

        const promoRemarks = document.getElementById('emp_promo_remarks')?.value || '';
        const hikeRemarks = document.getElementById('emp_hike_remarks')?.value || '';

        const payload = {
            name: document.getElementById('emp_name').value,
            role: newRole || document.getElementById('emp_role')?.value || e.role,
            department: document.getElementById('emp_dept').value,
            salary: newSal || e.salary,
            status: document.getElementById('emp_status').value,
            remarks: document.getElementById('emp_remarks').value
        };

        if (newRole && newRole !== e.role) payload.remarks += ` (Promoted to ${newRole}: ${promoRemarks})`;
        if (newSal && newSal !== e.salary) payload.remarks += ` (Salary updated to ₹${newSal}: ${hikeRemarks})`;

        try {
            await apiRequest(`/api/v1/employees/${id}`, 'PUT', payload);
            App.closeModal(); 
            App.showToast('Employee updated!', 'success');
            this._dataLoaded = false;
            App.navigateTo('hr-payroll');
        } catch (error) {
            console.error("Employee update error", error);
            App.showToast(error.detail || "Failed to update employee", 'error');
        }
    },

    addEmployee() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Add Employee</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="addEmpForm" onsubmit="HRPayrollModule.saveEmployee(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Name *</label><input type="text" class="form-control" id="ae_name" required></div>
                    <div class="form-group"><label class="form-label">Role *</label><input type="text" class="form-control" id="ae_role" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Department</label><select class="form-control" id="ae_dept"><option>Puja</option><option>Admin</option><option>Operations</option><option>IT</option></select></div>
                    <div class="form-group"><label class="form-label">Salary (₹) *</label><input type="number" class="form-control" id="ae_salary" required min="1"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Joining Date *</label><input type="date" class="form-control" id="ae_join" required></div>
                    <div class="form-group"><label class="form-label">Other Remarks</label><input type="text" class="form-control" id="ae_remarks" placeholder="Optional notes..."></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Add</button></div>
            </form>
        `);
    },

    async saveEmployee(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('addEmpForm'))) return;
        
        const payload = {
            name: document.getElementById('ae_name').value,
            role: document.getElementById('ae_role').value,
            department: document.getElementById('ae_dept').value,
            salary: parseInt(document.getElementById('ae_salary').value),
            joining_date: document.getElementById('ae_join').value,
            status: 'Active',
            remarks: document.getElementById('ae_remarks').value
        };

        try {
            await apiRequest('/api/v1/employees', 'POST', payload);
            App.closeModal(); 
            App.showToast('Employee added!', 'success'); 
            this._dataLoaded = false;
            App.navigateTo('hr-payroll');
        } catch (error) {
            console.error("Employee create error", error);
            App.showToast(error.detail || "Failed to add employee", 'error');
        }
    },

    deleteEmployee(id) {
        RBAC.confirmDelete('HR', async () => {
            try {
                await apiRequest(`/api/v1/employees/${id}`, 'DELETE');
                App.showToast(`Employee deleted successfully.`, 'success');
                this._dataLoaded = false;
                App.navigateTo('hr-payroll');
            } catch (error) {
                console.error("Employee delete error", error);
                App.showToast(error.detail || "Failed to delete employee", 'error');
            }
        });
    },

    applyLeave() {
        const empOpts = this.employees.map(e => `<option>${e.name}</option>`).join('');
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Apply Leave</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="leaveForm" onsubmit="HRPayrollModule.saveLeave(event)">
                <div class="form-group"><label class="form-label">Employee *</label><select class="form-control" id="lv_emp" required>${empOpts}</select></div>
                <div class="form-group"><label class="form-label">Leave Type</label><select class="form-control" id="lv_type"><option>Casual</option><option>Sick</option><option>Earned</option><option>Half Day</option></select></div>
                <div class="form-row"><div class="form-group"><label class="form-label">From *</label><input type="date" class="form-control" id="lv_from" required></div><div class="form-group"><label class="form-label">To *</label><input type="date" class="form-control" id="lv_to" required></div></div>
                <div class="form-group"><label class="form-label">Reason *</label><textarea class="form-control" id="lv_reason" required></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Submit</button></div>
            </form>
        `);
    },

    async saveLeave(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('leaveForm'))) return;
        
        // Find employee by name since select has names
        const empName = document.getElementById('lv_emp').value;
        const emp = this.employees.find(x => x.name === empName);
        if(!emp) return App.showToast("Select valid employee", "error");

        const payload = {
            employee_id: emp.id,
            leave_type: document.getElementById('lv_type').value,
            start_date: document.getElementById('lv_from').value,
            end_date: document.getElementById('lv_to').value,
            reason: document.getElementById('lv_reason').value,
            status: 'pending'
        };

        try {
            await apiRequest('/api/v1/employees/leaves', 'POST', payload);
            App.closeModal(); 
            App.showToast('Leave applied!', 'success');
            this._dataLoaded = false;
            this.currentTab = 'leaves'; 
            App.navigateTo('hr-payroll');
        } catch (error) {
            console.error("Leave apply error", error);
            App.showToast(error.detail || "Failed to apply for leave", 'error');
        }
    },

    // Approve with mandatory remarks modal
    approveLeave(id) {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Approve Leave ${id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="HRPayrollModule.confirmApprove(event,'${id}')">
                <div class="form-group"><label class="form-label">Remarks (mandatory) *</label><textarea class="form-control" id="approve_remarks" required placeholder="Reason for approval..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-success"><i class="fas fa-check"></i> Approve</button></div>
            </form>
        `);
    },

    async confirmApprove(ev, id) {
        ev.preventDefault();
        const remarks = document.getElementById('approve_remarks')?.value?.trim();
        if (!remarks) { App.showToast('Remarks required!', 'error'); return; }
        
        try {
            await apiRequest(`/api/v1/employees/leaves/${id}/approve`, 'PATCH', { remarks });
            App.showToast(`Leave approved!`, 'success');
            App.closeModal();
            this._dataLoaded = false;
            this.currentTab = 'leaves';
            App.navigateTo('hr-payroll');
        } catch (error) {
            console.error(error);
            App.showToast(error.detail || "Failed to approve leave", 'error');
        }
    },

    rejectLeave(id) {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Reject Leave ${id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="HRPayrollModule.confirmReject(event,'${id}')">
                <div class="form-group"><label class="form-label">Reason for Rejection (mandatory) *</label><textarea class="form-control" id="reject_remarks" required></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-danger"><i class="fas fa-times"></i> Reject</button></div>
            </form>
        `);
    },

    async confirmReject(ev, id) {
        ev.preventDefault();
        const remarks = document.getElementById('reject_remarks')?.value?.trim();
        if (!remarks) { App.showToast('Remarks required!', 'error'); return; }
        
        try {
            await apiRequest(`/api/v1/employees/leaves/${id}/reject`, 'PATCH', { remarks });
            App.showToast(`Leave rejected!`, 'warning');
            App.closeModal();
            this._dataLoaded = false;
            this.currentTab = 'leaves';
            App.navigateTo('hr-payroll');
        } catch (error) {
            console.error(error);
            App.showToast(error.detail || "Failed to reject leave", 'error');
        }
    },

    async runPayroll() {
        try {
            const result = await apiRequest('/api/v1/employees/payroll/run', 'POST', {});
            App.showToast(`Payroll processed successfully for ${result.employees_processed} employees (${result.ref_number}).`, 'success');
        } catch (error) {
            console.error(error);
            App.showToast(error.detail || "Failed to process payroll", 'error');
        }
    }
};
