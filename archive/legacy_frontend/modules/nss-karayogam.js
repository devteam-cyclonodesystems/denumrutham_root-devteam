/* =====================
   NSS KARAYOGAM COMMITTEE MODULE
   Full module with mini tiles, big stats, filters, forms
   ===================== */
window.NSSKarayogamModule = {
    dateFilter: 'monthly',
    customStart: '',
    customEnd: '',

    members: [
        { id: 'NSS-M001', name: 'Narayanan Nair', phone: '9876543210', address: 'Karayogam Ward 1', joinDate: '2024-01-15', status: 'active' },
        { id: 'NSS-M002', name: 'Suresh Menon', phone: '9876543211', address: 'Karayogam Ward 2', joinDate: '2024-03-20', status: 'active' },
        { id: 'NSS-M003', name: 'Krishnan Pillai', phone: '9876543212', address: 'Karayogam Ward 1', joinDate: '2024-06-10', status: 'active' },
        { id: 'NSS-M004', name: 'Deepa Lakshmi', phone: '9876543213', address: 'Karayogam Ward 3', joinDate: '2025-01-05', status: 'active' },
        { id: 'NSS-M005', name: 'Ramesh Kumar', phone: '9876543214', address: 'Karayogam Ward 2', joinDate: '2025-08-12', status: 'inactive' },
    ],

    chitSchemes: [
        { id: 'CH01/0226', member: 'Narayanan Nair', scheme: 'Gold Chit 50K', amount: 50000, paid: 25000, startDate: '2026-01-01', status: 'active' },
        { id: 'CH02/0226', member: 'Suresh Menon', scheme: 'Silver Chit 25K', amount: 25000, paid: 15000, startDate: '2026-01-15', status: 'active' },
        { id: 'CH03/0226', member: 'Deepa Lakshmi', scheme: 'Gold Chit 50K', amount: 50000, paid: 10000, startDate: '2026-02-01', status: 'active' },
    ],

    loanSchemes: [
        { id: 'LN01/0226', member: 'Krishnan Pillai', amount: 100000, balance: 75000, emi: 5000, startDate: '2026-01-10', status: 'active' },
        { id: 'LN02/0226', member: 'Ramesh Kumar', amount: 50000, balance: 30000, emi: 2500, startDate: '2025-11-01', status: 'active' },
    ],

    scholarships: [
        { id: 'SCH-001', student: 'Anu Krishnan', course: 'B.Tech', amount: 15000, year: '2026', status: 'approved' },
        { id: 'SCH-002', student: 'Vishnu Nair', course: 'MBBS', amount: 25000, year: '2026', status: 'pending' },
    ],

    marriages: [
        { id: 'MR-001', bride: 'Sreelakshmi', groom: 'Arun Kumar', date: '2026-03-15', venue: 'Karayogam Hall', status: 'registered' },
    ],

    deaths: [
        { id: 'DR-001', name: 'Gopalan Nair', age: 78, date: '2026-02-10', ward: 'Ward 1', status: 'registered' },
    ],

    revenue: [
        { id: 'REV-001', date: '2026-02-01', desc: 'Monthly member collection', amount: 45000, type: 'Collection' },
        { id: 'REV-002', date: '2026-02-10', desc: 'Hall rental income', amount: 15000, type: 'Rental' },
        { id: 'REV-003', date: '2026-02-15', desc: 'Chit scheme interest', amount: 8000, type: 'Interest' },
        { id: 'REV-004', date: '2026-02-20', desc: 'Donation - Annual festival', amount: 25000, type: 'Donation' },
    ],

    expenses: [
        { id: 'EXP-001', date: '2026-02-05', desc: 'Hall maintenance', amount: 12000, type: 'Maintenance' },
        { id: 'EXP-002', date: '2026-02-12', desc: 'Scholarship disbursement', amount: 15000, type: 'Scholarship' },
        { id: 'EXP-003', date: '2026-02-18', desc: 'Office supplies', amount: 3500, type: 'Supplies' },
    ],

    render() {
        const ml = App.currentLang === 'ml';
        const totalRevenue = this.revenue.reduce((s, r) => s + r.amount, 0);
        const totalExpense = this.expenses.reduce((s, e) => s + e.amount, 0);
        const presentCount = 7;
        const absentCount = 1;

        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-landmark"></i> ${ml ? 'NSS കരയോഗം കമ്മിറ്റി' : 'NSS Karayogam Committee'}</h1>
        </div>

        <!-- Mini Action Tiles -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-th"></i> ${ml ? 'ദ്രുത പ്രവർത്തനങ്ങൾ' : 'Quick Actions'}</div></div>
            <div class="quick-actions" style="margin-top: 10px;">
                <div class="quick-action-card" onclick="NSSKarayogamModule.openMemberForm()" data-tooltip="Register a new Karayogam member">
                    <div class="qa-icon" style="background:var(--grad-blue)"><i class="fas fa-user-plus"></i></div>
                    <div class="qa-text">${ml ? 'പുതിയ അംഗം' : 'New Member'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openChitForm()" data-tooltip="Join a chit scheme">
                    <div class="qa-icon" style="background:var(--grad-teal)"><i class="fas fa-file-alt"></i></div>
                    <div class="qa-text">${ml ? 'ചിട്ടി ചേരുക' : 'Join Chit'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openLoanForm()" data-tooltip="Apply for a loan scheme">
                    <div class="qa-icon" style="background:var(--grad-orange)"><i class="fas fa-hand-holding-usd"></i></div>
                    <div class="qa-text">${ml ? 'വായ്പ അപേക്ഷ' : 'Apply Loan'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openScholarshipForm()" data-tooltip="Apply for scholarship">
                    <div class="qa-icon" style="background:var(--grad-purple)"><i class="fas fa-graduation-cap"></i></div>
                    <div class="qa-text">${ml ? 'സ്കോളർഷിപ്പ്' : 'Scholarship'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openMarriageForm()" data-tooltip="Register a marriage">
                    <div class="qa-icon" style="background:var(--grad-pink)"><i class="fas fa-ring"></i></div>
                    <div class="qa-text">${ml ? 'വിവാഹ രജി.' : 'Marriage Reg.'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openDeathForm()" data-tooltip="Register a death">
                    <div class="qa-icon" style="background:var(--grad-red)"><i class="fas fa-cross"></i></div>
                    <div class="qa-text">${ml ? 'മരണ രജി.' : 'Death Reg.'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openRevenueForm()" data-tooltip="Add a revenue entry">
                    <div class="qa-icon" style="background:var(--grad-green)"><i class="fas fa-arrow-down"></i></div>
                    <div class="qa-text">${ml ? 'വരുമാനം' : 'Revenue'}</div>
                </div>
                <div class="quick-action-card" onclick="NSSKarayogamModule.openExpenseForm()" data-tooltip="Add an expense entry">
                    <div class="qa-icon" style="background:var(--grad-gold)"><i class="fas fa-arrow-up"></i></div>
                    <div class="qa-text">${ml ? 'ചെലവ്' : 'Expense'}</div>
                </div>
            </div>
        </div>

        <!-- Date Filter for Big Tiles -->
        <div class="date-filter-bar">
            <i class="fas fa-calendar-alt" style="color:var(--text-muted);font-size:0.85rem"></i>
            ${['weekly', 'monthly', 'custom'].map(f => `
                <span class="filter-pill ${this.dateFilter === f ? 'active' : ''}" onclick="NSSKarayogamModule.setFilter('${f}')">${f === 'weekly' ? (ml ? 'ആഴ്ച' : 'Weekly') :
                f === 'monthly' ? (ml ? 'മാസം' : 'Monthly') : (ml ? 'ഇഷ്‌ടാനുസൃതം' : 'Custom')
            }</span>
            `).join('')}
            ${this.dateFilter === 'custom' ? `
                <input type="date" class="form-control" style="width:auto;padding:4px 8px;font-size:0.78rem" value="${this.customStart}" onchange="NSSKarayogamModule.customStart=this.value;NSSKarayogamModule.applyFilter()">
                <span style="color:var(--text-muted)">to</span>
                <input type="date" class="form-control" style="width:auto;padding:4px 8px;font-size:0.78rem" value="${this.customEnd}" onchange="NSSKarayogamModule.customEnd=this.value;NSSKarayogamModule.applyFilter()">
            ` : ''}
        </div>

        <!-- Big Stats Tiles -->
        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-users kpi-icon"></i><div class="kpi-label">${ml ? 'അംഗങ്ങൾ' : 'Members'}</div><div class="kpi-value"><span style="font-size:0.85em">${presentCount} <small>Present</small> · ${absentCount} <small>Absent</small></span></div><div class="kpi-sub">${ml ? 'ഇന്നത്തെ ഡാറ്റ' : "Today's data (fixed)"}</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-arrow-down kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ വരുമാനം' : 'Total Revenue'}</div><div class="kpi-value">₹${totalRevenue.toLocaleString()}</div><div class="kpi-sub">${numberToWords(totalRevenue)}</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-arrow-up kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ ചെലവ്' : 'Total Expense'}</div><div class="kpi-value">₹${totalExpense.toLocaleString()}</div><div class="kpi-sub">${numberToWords(totalExpense)}</div></div>
        </div>

        <!-- Members Table -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title"><i class="fas fa-users"></i> ${ml ? 'അംഗങ്ങൾ' : 'Members'}</div>
                <input type="text" class="search-input" placeholder="Search members..." onkeyup="NSSKarayogamModule.filterTable('nssMemTable',this.value)" style="max-width:220px">
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="nssMemTable"><thead><tr><th>ID</th><th>${ml ? 'പേര്' : 'Name'}</th><th>${ml ? 'ഫോൺ' : 'Phone'}</th><th>${ml ? 'വിലാസം' : 'Address'}</th><th>${ml ? 'ചേർന്ന തീയതി' : 'Join Date'}</th><th>${ml ? 'സ്ഥിതി' : 'Status'}</th><th>Actions</th></tr></thead><tbody>
                ${this.members.map(m => `<tr id="record-${m.id}">
                    <td><strong>${m.id}</strong></td><td>${m.name}</td><td>${m.phone}</td><td><small>${m.address}</small></td><td>${m.joinDate}</td>
                    <td><span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}">${m.status}</span></td>
                    <td style="white-space:nowrap">
                        <div class="action-group">
                            <button class="btn btn-sm btn-outline" onclick="NSSKarayogamModule.viewMember('${m.id}')" data-tooltip="View member details"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-sm btn-edit" onclick="NSSKarayogamModule.editMember('${m.id}')" data-tooltip="Edit member"><i class="fas fa-pen"></i></button>
                        </div>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        <!-- Chit Schemes -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-file-alt"></i> ${ml ? 'ചിട്ടി പദ്ധതികൾ' : 'Chit Schemes'}</div></div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>ID</th><th>Member</th><th>Scheme</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>
                ${this.chitSchemes.map(c => `<tr>
                    <td><strong>${c.id}</strong></td><td>${c.member}</td><td>${c.scheme}</td>
                    <td><strong>₹${c.amount.toLocaleString()}</strong></td><td>₹${c.paid.toLocaleString()}</td>
                    <td>₹${(c.amount - c.paid).toLocaleString()}</td>
                    <td><span class="badge badge-success">${c.status}</span></td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        <!-- Loan Schemes -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-hand-holding-usd"></i> ${ml ? 'വായ്പ പദ്ധതികൾ' : 'Loan Schemes'}</div></div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>ID</th><th>Member</th><th>Amount</th><th>Balance</th><th>EMI</th><th>Start Date</th><th>Status</th></tr></thead><tbody>
                ${this.loanSchemes.map(l => `<tr>
                    <td><strong>${l.id}</strong></td><td>${l.member}</td>
                    <td><strong>₹${l.amount.toLocaleString()}</strong></td><td>₹${l.balance.toLocaleString()}</td>
                    <td>₹${l.emi.toLocaleString()}</td><td>${l.startDate}</td>
                    <td><span class="badge badge-success">${l.status}</span></td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        <!-- Revenue & Expenses side by side -->
        <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div class="section-card">
                <div class="section-header"><div class="section-title"><i class="fas fa-arrow-down"></i> ${ml ? 'വരുമാനം' : 'Revenue'}</div></div>
                <table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody>
                    ${this.revenue.map(r => `<tr><td>${r.date}</td><td>${r.desc}</td><td><span class="badge badge-success">${r.type}</span></td><td><strong>₹${r.amount.toLocaleString()}</strong></td></tr>`).join('')}
                </tbody></table>
            </div>
            <div class="section-card">
                <div class="section-header"><div class="section-title"><i class="fas fa-arrow-up"></i> ${ml ? 'ചെലവ്' : 'Expenses'}</div></div>
                <table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody>
                    ${this.expenses.map(e => `<tr><td>${e.date}</td><td>${e.desc}</td><td><span class="badge badge-danger">${e.type}</span></td><td><strong>₹${e.amount.toLocaleString()}</strong></td></tr>`).join('')}
                </tbody></table>
            </div>
        </div>

        <!-- Scholarships, Marriages, Deaths -->
        <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:4px">
            <div class="section-card">
                <div class="section-header"><div class="section-title"><i class="fas fa-graduation-cap"></i> ${ml ? 'സ്കോളർഷിപ്പുകൾ' : 'Scholarships'}</div></div>
                <table class="data-table"><thead><tr><th>ID</th><th>Student</th><th>Course</th><th>Amount</th><th>Status</th></tr></thead><tbody>
                    ${this.scholarships.map(s => `<tr><td><strong>${s.id}</strong></td><td>${s.student}</td><td>${s.course}</td><td><strong>₹${s.amount.toLocaleString()}</strong></td><td><span class="badge ${s.status === 'approved' ? 'badge-success' : 'badge-warning'}">${s.status}</span></td></tr>`).join('')}
                </tbody></table>
            </div>
            <div class="section-card">
                <div class="section-header"><div class="section-title"><i class="fas fa-ring"></i> ${ml ? 'വിവാഹ / മരണ റജിസ്ട്രേഷൻ' : 'Marriage / Death Registration'}</div></div>
                <table class="data-table"><thead><tr><th>ID</th><th>Type</th><th>Details</th><th>Date</th><th>Status</th></tr></thead><tbody>
                    ${this.marriages.map(m => `<tr><td><strong>${m.id}</strong></td><td><span class="badge badge-purple">Marriage</span></td><td>${m.bride} & ${m.groom}</td><td>${m.date}</td><td><span class="badge badge-success">${m.status}</span></td></tr>`).join('')}
                    ${this.deaths.map(d => `<tr><td><strong>${d.id}</strong></td><td><span class="badge badge-danger">Death</span></td><td>${d.name} (Age: ${d.age})</td><td>${d.date}</td><td><span class="badge badge-success">${d.status}</span></td></tr>`).join('')}
                </tbody></table>
            </div>
        </div>`;
    },

    setFilter(f) { this.dateFilter = f; App.navigateTo('nss-karayogam'); },
    applyFilter() { App.navigateTo('nss-karayogam'); },

    filterTable(tableId, q) {
        q = q.toLowerCase();
        document.querySelectorAll(`#${tableId} tbody tr`).forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    // --- Forms ---
    openMemberForm() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-user-plus"></i> New Member Registration</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssMemberForm" onsubmit="NSSKarayogamModule.saveMember(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Full Name *</label><input type="text" class="form-control" id="nss_name" required></div>
                    <div class="form-group"><label class="form-label">Phone *</label><input type="tel" class="form-control" id="nss_phone" required></div>
                </div>
                <div class="form-group"><label class="form-label">Address</label><input type="text" class="form-control" id="nss_address" placeholder="Ward / Address"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Register</button></div>
            </form>
        `);
    },

    saveMember(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssMemberForm'))) return;
        const id = 'NSS-M' + String(this.members.length + 1).padStart(3, '0');
        this.members.push({
            id, name: document.getElementById('nss_name').value,
            phone: document.getElementById('nss_phone').value,
            address: document.getElementById('nss_address').value || '',
            joinDate: new Date().toISOString().split('T')[0], status: 'active'
        });
        AuditLog.add('Create', 'NSS Karayogam', 'New member registered: ' + document.getElementById('nss_name').value);
        App.closeModal(); App.showToast('Member registered!', 'success'); App.navigateTo('nss-karayogam');
    },

    openChitForm() {
        const memberOpts = this.members.filter(m => m.status === 'active').map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-file-alt"></i> Join Chit Scheme</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssChitForm" onsubmit="NSSKarayogamModule.saveChit(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Member *</label><select class="form-control" id="nss_chit_member" required><option value="">Select...</option>${memberOpts}</select></div>
                    <div class="form-group"><label class="form-label">Scheme *</label><select class="form-control" id="nss_chit_scheme" required><option>Gold Chit 50K</option><option>Silver Chit 25K</option><option>Diamond Chit 1L</option></select></div>
                </div>
                <div class="form-group"><label class="form-label">Amount *</label><input type="number" class="form-control amount-input" id="nss_chit_amt" required min="1"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Join Scheme</button></div>
            </form>
        `);
    },

    saveChit(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssChitForm'))) return;
        const id = RefNumberGenerator.generate('CH');
        this.chitSchemes.push({
            id, member: document.getElementById('nss_chit_member').value,
            scheme: document.getElementById('nss_chit_scheme').value,
            amount: parseInt(document.getElementById('nss_chit_amt').value),
            paid: 0, startDate: new Date().toISOString().split('T')[0], status: 'active'
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Chit scheme joined: ' + id);
        App.closeModal(); App.showToast('Chit scheme joined!', 'success'); App.navigateTo('nss-karayogam');
    },

    openLoanForm() {
        const memberOpts = this.members.filter(m => m.status === 'active').map(m => `<option value="${m.name}">${m.name}</option>`).join('');
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-hand-holding-usd"></i> Apply Loan Scheme</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssLoanForm" onsubmit="NSSKarayogamModule.saveLoan(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Member *</label><select class="form-control" id="nss_loan_member" required><option value="">Select...</option>${memberOpts}</select></div>
                    <div class="form-group"><label class="form-label">Loan Amount *</label><input type="number" class="form-control amount-input" id="nss_loan_amt" required min="1"></div>
                </div>
                <div class="form-group"><label class="form-label">Monthly EMI *</label><input type="number" class="form-control amount-input" id="nss_loan_emi" required min="1"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Apply</button></div>
            </form>
        `);
    },

    saveLoan(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssLoanForm'))) return;
        const id = RefNumberGenerator.generate('LN');
        const amt = parseInt(document.getElementById('nss_loan_amt').value);
        this.loanSchemes.push({
            id, member: document.getElementById('nss_loan_member').value,
            amount: amt, balance: amt, emi: parseInt(document.getElementById('nss_loan_emi').value),
            startDate: new Date().toISOString().split('T')[0], status: 'active'
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Loan applied: ' + id);
        App.closeModal(); App.showToast('Loan application submitted!', 'success'); App.navigateTo('nss-karayogam');
    },

    openScholarshipForm() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-graduation-cap"></i> Apply Scholarship</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssSchForm" onsubmit="NSSKarayogamModule.saveScholarship(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Student Name *</label><input type="text" class="form-control" id="nss_sch_name" required></div>
                    <div class="form-group"><label class="form-label">Course *</label><input type="text" class="form-control" id="nss_sch_course" required></div>
                </div>
                <div class="form-group"><label class="form-label">Amount *</label><input type="number" class="form-control amount-input" id="nss_sch_amt" required min="1"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Apply</button></div>
            </form>
        `);
    },

    saveScholarship(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssSchForm'))) return;
        const id = RefNumberGenerator.generateSequential('SCH', this.scholarships, 3);
        this.scholarships.push({
            id, student: document.getElementById('nss_sch_name').value,
            course: document.getElementById('nss_sch_course').value,
            amount: parseInt(document.getElementById('nss_sch_amt').value),
            year: '2026', status: 'pending'
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Scholarship applied: ' + id);
        App.closeModal(); App.showToast('Scholarship application submitted!', 'success'); App.navigateTo('nss-karayogam');
    },

    openMarriageForm() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-ring"></i> Marriage Registration</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssMarForm" onsubmit="NSSKarayogamModule.saveMarriage(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Bride Name *</label><input type="text" class="form-control" id="nss_mar_bride" required></div>
                    <div class="form-group"><label class="form-label">Groom Name *</label><input type="text" class="form-control" id="nss_mar_groom" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Date *</label><input type="date" class="form-control" id="nss_mar_date" required></div>
                    <div class="form-group"><label class="form-label">Venue</label><input type="text" class="form-control" id="nss_mar_venue" value="Karayogam Hall"></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Register</button></div>
            </form>
        `);
    },

    saveMarriage(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssMarForm'))) return;
        const id = RefNumberGenerator.generateSequential('MR', this.marriages, 3);
        this.marriages.push({
            id, bride: document.getElementById('nss_mar_bride').value,
            groom: document.getElementById('nss_mar_groom').value,
            date: document.getElementById('nss_mar_date').value,
            venue: document.getElementById('nss_mar_venue').value || 'Karayogam Hall', status: 'registered'
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Marriage registered: ' + id);
        App.closeModal(); App.showToast('Marriage registered!', 'success'); App.navigateTo('nss-karayogam');
    },

    openDeathForm() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-cross"></i> Death Registration</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssDeathForm" onsubmit="NSSKarayogamModule.saveDeath(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Name *</label><input type="text" class="form-control" id="nss_death_name" required></div>
                    <div class="form-group"><label class="form-label">Age *</label><input type="number" class="form-control" id="nss_death_age" required min="0"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Date *</label><input type="date" class="form-control" id="nss_death_date" required></div>
                    <div class="form-group"><label class="form-label">Ward</label><input type="text" class="form-control" id="nss_death_ward" placeholder="Ward number"></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Register</button></div>
            </form>
        `);
    },

    saveDeath(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssDeathForm'))) return;
        const id = RefNumberGenerator.generateSequential('DR', this.deaths, 3);
        this.deaths.push({
            id, name: document.getElementById('nss_death_name').value,
            age: parseInt(document.getElementById('nss_death_age').value),
            date: document.getElementById('nss_death_date').value,
            ward: document.getElementById('nss_death_ward').value || '', status: 'registered'
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Death registered: ' + id);
        App.closeModal(); App.showToast('Death registered.', 'info'); App.navigateTo('nss-karayogam');
    },

    openRevenueForm() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-arrow-down"></i> Revenue Entry</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssRevForm" onsubmit="NSSKarayogamModule.saveRevenue(event)">
                <div class="form-group"><label class="form-label">Description *</label><input type="text" class="form-control" id="nss_rev_desc" required></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Amount *</label><input type="number" class="form-control amount-input" id="nss_rev_amt" required min="1"></div>
                    <div class="form-group"><label class="form-label">Type</label><select class="form-control" id="nss_rev_type"><option>Collection</option><option>Rental</option><option>Interest</option><option>Donation</option><option>Other</option></select></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Save</button></div>
            </form>
        `);
    },

    saveRevenue(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssRevForm'))) return;
        const id = RefNumberGenerator.generateSequential('REV', this.revenue, 3);
        this.revenue.push({
            id, date: new Date().toISOString().split('T')[0],
            desc: document.getElementById('nss_rev_desc').value,
            amount: parseInt(document.getElementById('nss_rev_amt').value),
            type: document.getElementById('nss_rev_type').value
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Revenue entry: ' + id);
        App.closeModal(); App.showToast('Revenue entry saved!', 'success'); App.navigateTo('nss-karayogam');
    },

    openExpenseForm() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title"><i class="fas fa-arrow-up"></i> Expense Entry</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="nssExpForm" onsubmit="NSSKarayogamModule.saveExpense(event)">
                <div class="form-group"><label class="form-label">Description *</label><input type="text" class="form-control" id="nss_exp_desc" required></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Amount *</label><input type="number" class="form-control amount-input" id="nss_exp_amt" required min="1"></div>
                    <div class="form-group"><label class="form-label">Type</label><select class="form-control" id="nss_exp_type"><option>Maintenance</option><option>Scholarship</option><option>Supplies</option><option>Salary</option><option>Other</option></select></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Save</button></div>
            </form>
        `);
    },

    saveExpense(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('nssExpForm'))) return;
        const id = RefNumberGenerator.generateSequential('EXP', this.expenses, 3);
        this.expenses.push({
            id, date: new Date().toISOString().split('T')[0],
            desc: document.getElementById('nss_exp_desc').value,
            amount: parseInt(document.getElementById('nss_exp_amt').value),
            type: document.getElementById('nss_exp_type').value
        });
        AuditLog.add('Create', 'NSS Karayogam', 'Expense entry: ' + id);
        App.closeModal(); App.showToast('Expense entry saved!', 'success'); App.navigateTo('nss-karayogam');
    },

    viewMember(id) {
        const m = this.members.find(x => x.id === id);
        if (!m) return;
        App.viewDetail('Member: ' + m.name, [
            ['ID', m.id], ['Name', m.name], ['Phone', m.phone],
            ['Address', m.address || '—'], ['Join Date', m.joinDate],
            ['Status', `<span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}">${m.status}</span>`]
        ]);
    },

    editMember(id) {
        const m = this.members.find(x => x.id === id);
        if (!m) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit Member ${m.id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="NSSKarayogamModule.updateMember(event,'${m.id}')">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="nss_e_name" value="${m.name}" required></div>
                    <div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-control" id="nss_e_phone" value="${m.phone}" required></div>
                </div>
                <div class="form-group"><label class="form-label">Address</label><input type="text" class="form-control" id="nss_e_addr" value="${m.address}"></div>
                <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="nss_e_status"><option ${m.status === 'active' ? 'selected' : ''}>active</option><option ${m.status === 'inactive' ? 'selected' : ''}>inactive</option></select></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
            </form>
        `);
    },

    updateMember(e, id) {
        e.preventDefault();
        const m = this.members.find(x => x.id === id);
        if (m) {
            const oldName = m.name;
            m.name = document.getElementById('nss_e_name').value;
            m.phone = document.getElementById('nss_e_phone').value;
            m.address = document.getElementById('nss_e_addr').value;
            m.status = document.getElementById('nss_e_status').value;
            AuditLog.add('Edit', 'NSS Karayogam', 'Updated member: ' + id, oldName, m.name);
        }
        App.closeModal(); App.showToast('Member updated!', 'success'); App.navigateTo('nss-karayogam');
    }
};
