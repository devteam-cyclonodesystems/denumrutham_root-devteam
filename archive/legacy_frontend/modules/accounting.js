/* =====================
   ACCOUNTING MODULE
   ===================== */
window.AccountingModule = {
    entries: [
        { id: 'TXN001-0226', date: '2026-02-23', type: 'income', category: 'Archanai Fees', desc: 'Daily archanai collections', amount: 12500, ref: 'ARC-batch', createdBy: 'Counter Staff' },
        { id: 'TXN002-0226', date: '2026-02-23', type: 'income', category: 'Donations', desc: 'Anna Daanam donations', amount: 25000, ref: 'DON-batch', createdBy: 'App User' },
        { id: 'TXN003-0226', date: '2026-02-23', type: 'income', category: 'Hall Rental', desc: 'Kalyana Mandapam - Wedding', amount: 25000, ref: 'HB-001', createdBy: 'Admin' },
        { id: 'TXN004-0226', date: '2026-02-23', type: 'income', category: 'Store Sales', desc: 'Online store daily sales', amount: 8400, ref: 'ORD-batch', createdBy: 'Store Staff' },
        { id: 'TXN005-0226', date: '2026-02-22', type: 'expense', category: 'Salaries', desc: 'Staff salary - Feb batch', amount: 842000, ref: 'PAY-Feb', createdBy: 'Admin' },
        { id: 'TXN006-0226', date: '2026-02-22', type: 'expense', category: 'Puja Materials', desc: 'Flowers, camphor, oil', amount: 15600, ref: 'PO-045', createdBy: 'Store Staff' },
        { id: 'TXN007-0226', date: '2026-02-22', type: 'expense', category: 'Electricity', desc: 'EB bill - February', amount: 32000, ref: 'UTIL-Feb', createdBy: 'Admin' },
        { id: 'TXN008-0226', date: '2026-02-21', type: 'expense', category: 'Maintenance', desc: 'Temple painting work', amount: 75000, ref: 'MNT-012', createdBy: 'Admin' },
        { id: 'TXN009-0226', date: '2026-02-21', type: 'income', category: 'Donations', desc: 'Festival sponsorship', amount: 50000, ref: 'DON-003', createdBy: 'Counter Staff' },
        { id: 'TXN010-0226', date: '2026-02-20', type: 'expense', category: 'Food Supplies', desc: 'Rice, dal, vegetables', amount: 28000, ref: 'PO-044', createdBy: 'Store Staff' },
    ],

    currentTab: 'ledger',
    filters: {
        incSearch: '', incDateFrom: '', incDateTo: '',
        expSearch: '', expDateFrom: '', expDateTo: '',
        ledSearch: '', ledDateFrom: '', ledDateTo: ''
    },

    // Global Interface for Other Modules to Push Transactions
    addTransaction(type, category, desc, amount, ref, userName) {
        if (!amount || amount <= 0) return;

        const now = new Date();
        const mmyy = String(now.getMonth() + 1).padStart(2, '0') + String(now.getFullYear()).slice(-2);

        let maxId = 0;
        this.entries.forEach(e => {
            if (e.id.startsWith('TXN') && e.id.endsWith(`-${mmyy}`)) {
                const numStr = e.id.substring(3).split('-')[0];
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
        const id = 'TXN' + String(maxId + 1).padStart(3, '0') + '-' + mmyy;

        this.entries.unshift({
            id: id,
            date: new Date().toISOString().split('T')[0],
            type: type, // 'income' or 'expense'
            category: category,
            desc: desc,
            amount: amount,
            ref: ref,
            createdBy: userName || App.currentUser
        });
    },

    render() {
        const incomeTotal = this.entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const expenseTotal = this.entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-chart-line"></i> Temple Accounting</h1>
            <div style="display:flex;gap:8px">
                <button class="btn btn-outline" style="background:white" onclick="App.navigateTo('inventory')"><i class="fas fa-boxes"></i> Inventory</button>
                <button class="btn btn-outline" style="background:white" onclick="App.navigateTo('store')"><i class="fas fa-store"></i> Store</button>
                <button class="btn btn-primary" onclick="AccountingModule.openModal()"><i class="fas fa-plus"></i> Manual Entry</button>
            </div>
        </div>
        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-arrow-down kpi-icon"></i><div class="kpi-label">Total Income</div><div class="kpi-value">₹${incomeTotal.toLocaleString()}</div><div class="kpi-sub">All time</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-arrow-up kpi-icon"></i><div class="kpi-label">Total Expenses</div><div class="kpi-value">₹${expenseTotal.toLocaleString()}</div><div class="kpi-sub">All time</div></div>
            <div class="kpi-card" style="background:${incomeTotal - expenseTotal >= 0 ? 'var(--grad-blue)' : 'var(--grad-orange)'}"><i class="fas fa-balance-scale kpi-icon"></i><div class="kpi-label">Net Balance</div><div class="kpi-value">₹${(incomeTotal - expenseTotal).toLocaleString()}</div><div class="kpi-sub">${incomeTotal - expenseTotal >= 0 ? 'Surplus' : 'Deficit'}</div></div>
            <div class="kpi-card" style="background:var(--grad-purple)"><i class="fas fa-file-alt kpi-icon"></i><div class="kpi-label">Transactions</div><div class="kpi-value">${this.entries.length}</div><div class="kpi-sub">Total logged</div></div>
        </div>

        <div class="section-card">
            <div class="tabs-bar">
                <button class="tab-btn ${this.currentTab === 'ledger' ? 'active' : ''}" onclick="AccountingModule.switchTab('ledger')">Master Ledger</button>
                <button class="tab-btn ${this.currentTab === 'income' ? 'active' : ''}" onclick="AccountingModule.switchTab('income')">Income</button>
                <button class="tab-btn ${this.currentTab === 'expense' ? 'active' : ''}" onclick="AccountingModule.switchTab('expense')">Expenses</button>
            </div>
            ${this.renderTabContent()}
        </div>`;
    },

    renderTabContent() {
        if (this.currentTab === 'income') return this.renderIncome();
        if (this.currentTab === 'expense') return this.renderExpense();
        return this.renderLedger();
    },

    switchTab(tab) {
        this.currentTab = tab;
        App.navigateTo('accounting');
    },

    _applyFilters(entries, search, df, dt) {
        let filtered = [...entries];
        if (search) {
            const ls = search.toLowerCase();
            filtered = filtered.filter(e => e.id.toLowerCase().includes(ls) || e.category.toLowerCase().includes(ls) || e.desc.toLowerCase().includes(ls) || e.ref.toLowerCase().includes(ls));
        }
        if (df) filtered = filtered.filter(e => e.date >= df);
        if (dt) filtered = filtered.filter(e => e.date <= dt);
        // Force sort to reverse chronological
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        return filtered;
    },

    renderLedger() {
        const filtered = this._applyFilters(this.entries, this.filters.ledSearch, this.filters.ledDateFrom, this.filters.ledDateTo);
        return `
            <div class="filter-bar" style="display:flex; gap:10px; margin-bottom:15px; align-items:flex-end">
                <input type="text" id="led_search_inp" class="form-control" placeholder="Search Master Ledger..." value="${this.filters.ledSearch}" style="flex:2">
                <div class="range-picker-group" style="flex:3">
                    <div style="position:relative; flex:1">
                        <i class="fas fa-calendar-alt range-picker-icon"></i>
                        <input type="date" id="led_df_inp" class="form-control hide-icon" placeholder="Date From" value="${this.filters.ledDateFrom}" onclick="try{this.showPicker()}catch(e){}">
                    </div>
                    <span class="range-picker-separator">to</span>
                    <div style="position:relative; flex:1">
                        <input type="date" id="led_dt_inp" class="form-control" placeholder="Date To" value="${this.filters.ledDateTo}">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="AccountingModule.applyFilters('ledger')">Apply</button>
                <button class="btn btn-outline" onclick="AccountingModule.clearFilters('ledger')"><i class="fas fa-redo"></i></button>
            </div>
            <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th>Ref</th><th>User</th></tr></thead><tbody>
                ${filtered.map(e => `<tr><td><strong>${e.id}</strong></td><td>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td><span class="badge ${e.type === 'income' ? 'badge-success' : 'badge-danger'}">${e.type}</span></td><td>${e.category}</td><td>${e.desc}</td><td style="font-weight:700;color:${e.type === 'income' ? 'var(--primary-green)' : 'var(--primary-red)'}">₹${e.amount.toLocaleString()}</td><td><small>${e.ref}</small></td><td><i class="fas fa-user-circle"></i> <small>${e.createdBy || 'Admin'}</small></td></tr>`).join('')}
            </tbody></table></div>
        `;
    },

    renderIncome() {
        const inc = this.entries.filter(e => e.type === 'income');
        const filtered = this._applyFilters(inc, this.filters.incSearch, this.filters.incDateFrom, this.filters.incDateTo);
        return `
            <div class="filter-bar" style="display:flex; gap:10px; margin-bottom:15px; align-items:flex-end">
                <input type="text" id="inc_search_inp" class="form-control" placeholder="Search Incomes..." value="${this.filters.incSearch}" style="flex:2">
                <div class="range-picker-group" style="flex:3">
                    <div style="position:relative; flex:1">
                        <i class="fas fa-calendar-alt range-picker-icon"></i>
                        <input type="date" id="inc_df_inp" class="form-control hide-icon" placeholder="Date From" value="${this.filters.incDateFrom}" onclick="try{this.showPicker()}catch(e){}">
                    </div>
                    <span class="range-picker-separator">to</span>
                    <div style="position:relative; flex:1">
                        <input type="date" id="inc_dt_inp" class="form-control" placeholder="Date To" value="${this.filters.incDateTo}">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="AccountingModule.applyFilters('income')">Apply</button>
                <button class="btn btn-outline" onclick="AccountingModule.clearFilters('income')"><i class="fas fa-redo"></i></button>
            </div>
            <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th><th>Date</th><th>Category</th><th>Description</th><th style="color:var(--primary-green)">Income Amount (₹)</th><th>Ref</th><th>User</th></tr></thead><tbody>
                ${filtered.map(e => `<tr><td><strong>${e.id}</strong></td><td>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>${e.category}</td><td>${e.desc}</td><td style="font-weight:700;color:var(--primary-green)">₹${e.amount.toLocaleString()}</td><td><small>${e.ref}</small></td><td><i class="fas fa-user-circle"></i> <small>${e.createdBy || 'Admin'}</small></td></tr>`).join('')}
            </tbody></table></div>
        `;
    },

    renderExpense() {
        const exp = this.entries.filter(e => e.type === 'expense');
        const filtered = this._applyFilters(exp, this.filters.expSearch, this.filters.expDateFrom, this.filters.expDateTo);
        return `
            <div class="filter-bar" style="display:flex; gap:10px; margin-bottom:15px; align-items:flex-end">
                <input type="text" id="exp_search_inp" class="form-control" placeholder="Search Expenses..." value="${this.filters.expSearch}" style="flex:2">
                <div class="range-picker-group" style="flex:3">
                    <div style="position:relative; flex:1">
                        <i class="fas fa-calendar-alt range-picker-icon"></i>
                        <input type="date" id="exp_df_inp" class="form-control hide-icon" placeholder="Date From" value="${this.filters.expDateFrom}" onclick="try{this.showPicker()}catch(e){}">
                    </div>
                    <span class="range-picker-separator">to</span>
                    <div style="position:relative; flex:1">
                        <input type="date" id="exp_dt_inp" class="form-control" placeholder="Date To" value="${this.filters.expDateTo}">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="AccountingModule.applyFilters('expense')">Apply</button>
                <button class="btn btn-outline" onclick="AccountingModule.clearFilters('expense')"><i class="fas fa-redo"></i></button>
            </div>
            <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>ID</th><th>Date</th><th>Category</th><th>Description</th><th style="color:var(--primary-red)">Expense Amount (₹)</th><th>Ref</th><th>User</th></tr></thead><tbody>
                ${filtered.map(e => `<tr><td><strong>${e.id}</strong></td><td>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>${e.category}</td><td>${e.desc}</td><td style="font-weight:700;color:var(--primary-red)">₹${e.amount.toLocaleString()}</td><td><small>${e.ref}</small></td><td><i class="fas fa-user-circle"></i> <small>${e.createdBy || 'Admin'}</small></td></tr>`).join('')}
            </tbody></table></div>
        `;
    },

    applyFilters(type) {
        let pf = type === 'ledger' ? 'led' : (type === 'income' ? 'inc' : 'exp');
        const df = document.getElementById(`${pf}_df_inp`).value;
        const dt = document.getElementById(`${pf}_dt_inp`).value;
        if (df && dt && df > dt) {
            App.showToast('Error: "Date From" cannot be later than "Date To".', 'error');
            return;
        }
        this.filters[`${pf}Search`] = document.getElementById(`${pf}_search_inp`).value;
        this.filters[`${pf}DateFrom`] = df;
        this.filters[`${pf}DateTo`] = dt;
        App.navigateTo('accounting');
    },

    clearFilters(type) {
        let pf = type === 'ledger' ? 'led' : (type === 'income' ? 'inc' : 'exp');
        this.filters[`${pf}Search`] = '';
        this.filters[`${pf}DateFrom`] = '';
        this.filters[`${pf}DateTo`] = '';
        App.navigateTo('accounting');
    },

    openModal() {
        App.openModal(`<div class="modal-header"><h3 class="modal-title">Manual Accounting Entry</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="AccountingModule.save(event)">
            <div class="form-row"><div class="form-group"><label class="form-label">Type</label><select class="form-control" id="ac_type"><option value="income">Income</option><option value="expense">Expense</option></select></div><div class="form-group"><label class="form-label">Category</label><input type="text" class="form-control" id="ac_cat" required></div></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Amount</label><input type="number" class="form-control" id="ac_amt" required min="1"></div><div class="form-group"><label class="form-label">Date</label><input type="date" class="form-control" id="ac_date" required></div></div>
            <div class="form-group"><label class="form-label">Description</label><input type="text" class="form-control" id="ac_desc"></div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save Manual Entry</button></div>
        </form>`);
    },
    save(e) {
        e.preventDefault();

        const now = new Date(document.getElementById('ac_date').value || Date.now());
        const mmyy = String(now.getMonth() + 1).padStart(2, '0') + String(now.getFullYear()).slice(-2);

        let maxId = 0;
        this.entries.forEach(entry => {
            if (entry.id.startsWith('TXN') && entry.id.endsWith(`-${mmyy}`)) {
                const numStr = entry.id.substring(3).split('-')[0];
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
        const id = 'TXN' + String(maxId + 1).padStart(3, '0') + '-' + mmyy;

        this.entries.unshift({
            id: id,
            date: document.getElementById('ac_date').value,
            type: document.getElementById('ac_type').value,
            category: document.getElementById('ac_cat').value,
            desc: document.getElementById('ac_desc').value,
            amount: parseInt(document.getElementById('ac_amt').value),
            ref: 'MAN-' + id.split('-')[0].replace('TXN', ''),
            createdBy: App.currentUser
        });
        App.closeModal();
        App.showToast('Manual Entry recorded!', 'success');
        App.navigateTo('accounting');
    }
};
