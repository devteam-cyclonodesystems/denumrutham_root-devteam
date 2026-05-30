/* =====================
   OFFERINGS MODULE v3
   Hundi icon, no Flower Decoration, address field, partial payment, remarks, booking mode
   ===================== */
window.OfferingsModule = {
    _apiLoaded: false,
    categories: [
        { name: 'Anna Daanam', total: 250000, icon: 'fa-utensils' },
        { name: 'Gold / Silver', total: 120000, icon: 'fa-ring' },
        { name: 'Cash Donation', total: 52800, icon: 'fa-money-bill' },
        { name: 'Vazhipadu', total: 30000, icon: 'fa-hand-holding-heart' },
    ],

    offerings: [
        { id: 'OFF-001', donor: 'Lakshmi Devi', phone: '9871234560', address: '12, Temple Street, Thrissur', category: 'Cash Donation', amount: 5000, date: '2026-02-23', remarks: 'In memory of father', status: 'confirmed', paymentType: 'full', amountPaid: 5000, bookingMode: 'Counter', createdBy: 'Counter Staff' },
        { id: 'OFF-002', donor: 'Narayan Nair', phone: '9871234561', address: 'Nair House, Ernakulam', category: 'Anna Daanam', amount: 25000, date: '2026-02-22', remarks: 'For Shivaratri', status: 'confirmed', paymentType: 'full', amountPaid: 25000, bookingMode: 'Counter', createdBy: 'Admin' },
        { id: 'OFF-003', donor: 'Anonymous', phone: '', address: '', category: 'Cash Donation', amount: 10000, date: '2026-02-21', remarks: '', status: 'confirmed', paymentType: 'full', amountPaid: 10000, bookingMode: 'Counter', createdBy: 'Counter Staff' },
        { id: 'OFF-004', donor: 'Meenakshi R.', phone: '9871234562', address: '45, MG Road, Kochi', category: 'Gold / Silver', amount: 50000, date: '2026-02-20', remarks: 'Gold chain 5g', status: 'confirmed', paymentType: 'partial', amountPaid: 30000, bookingMode: 'Online', createdBy: 'App User' },
        { id: 'OFF-005', donor: 'Rajesh Kumar', phone: '9876543210', address: '', category: 'Vazhipadu', amount: 2500, date: '2026-02-20', remarks: '', status: 'pending', paymentType: 'full', amountPaid: 2500, bookingMode: 'Phone', createdBy: 'Store Staff' },
        { id: 'OFF-006', donor: 'Bala V.', phone: '9876543215', address: 'West Nada', category: 'Anna Daanam', amount: 15000, date: '2026-02-24', remarks: 'Birthday special', status: 'confirmed', paymentType: 'full', amountPaid: 15000, bookingMode: 'Online', createdBy: 'App User' },
        { id: 'OFF-007', donor: 'Gita Prasad', phone: '9876543216', address: 'Avenue Road', category: 'Cash Donation', amount: 2000, date: '2026-02-25', remarks: '', status: 'confirmed', paymentType: 'full', amountPaid: 2000, bookingMode: 'Counter', createdBy: 'Counter Staff' },
        { id: 'OFF-008', donor: 'Sriram Iyer', phone: '9876543217', address: 'South Street', category: 'Gold / Silver', amount: 15000, date: '2026-02-26', remarks: 'Silver Vilakku', status: 'confirmed', paymentType: 'full', amountPaid: 15000, bookingMode: 'Offline', createdBy: 'Admin' },
        { id: 'OFF-009', donor: 'Preethi K.', phone: '9876543218', address: '', category: 'Vazhipadu', amount: 3500, date: '2026-02-27', remarks: '', status: 'pending', paymentType: 'full', amountPaid: 3500, bookingMode: 'Phone', createdBy: 'Store Staff' },
        { id: 'OFF-010', donor: 'Vinod M.', phone: '9876543219', address: 'East Lane', category: 'Cash Donation', amount: 50000, date: '2026-02-28', remarks: 'Temple Trust', status: 'confirmed', paymentType: 'partial', amountPaid: 25000, bookingMode: 'Online', createdBy: 'App User' }
    ],

    render() {
        const ml = App.currentLang === 'ml';
        const totalAmount = this.offerings.reduce((s, o) => s + o.amount, 0);
        const donors = new Set(this.offerings.map(o => o.donor)).size;
        const pending = this.offerings.filter(o => (o.amount - (o.amountPaid || 0)) > 0).length;
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-hand-holding-dollar"></i> ${ml ? 'വഴിപാടുകൾ' : 'Offerings'}</h1>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-teal)"><i class="fas fa-hand-holding-dollar kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ വഴിപാട്' : 'Total Offerings'}</div><div class="kpi-value">₹${totalAmount.toLocaleString()}</div><div class="kpi-sub">All time</div></div>
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-users kpi-icon"></i><div class="kpi-label">${ml ? 'ദാതാക്കൾ' : 'Donors'}</div><div class="kpi-value">${donors}</div><div class="kpi-sub">Unique</div></div>
            <div class="kpi-card" style="background:var(--grad-purple)"><i class="fas fa-receipt kpi-icon"></i><div class="kpi-label">${ml ? 'രസീതുകൾ' : 'Receipts'}</div><div class="kpi-value">${this.offerings.length}</div><div class="kpi-sub">Total</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-exclamation-circle kpi-icon"></i><div class="kpi-label">Pending Payments</div><div class="kpi-value">${pending}</div><div class="kpi-sub">Balance due</div></div>
        </div>

        <!-- Offering Categories -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-th-list"></i> ${ml ? 'വിഭാഗങ്ങൾ' : 'Offering Categories'}</div>
                <button class="btn btn-primary" onclick="OfferingsModule.openOfferingModal()"><i class="fas fa-plus"></i> ${ml ? 'പുതിയ വഴിപാട്' : 'Record Offering'}</button>
            </div>
            <div class="products-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px">
                ${this.categories.map(c => `
                <div class="quick-action-card" style="flex-direction:column;text-align:center;padding:14px;gap:4px">
                    <div class="qa-icon" style="background:var(--grad-teal);width:40px;height:40px"><i class="fas ${c.icon}"></i></div>
                    <div style="font-weight:700;font-size:0.88rem">${c.name}</div>
                    <div style="font-weight:800;color:var(--primary-teal)">₹${c.total.toLocaleString()}</div>
                </div>`).join('')}
            </div>
        </div>

        <!-- All Offerings -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-list"></i> ${ml ? 'എല്ലാ വഴിപാടുകളും' : 'All Offerings'}</div>
                <input type="text" class="search-input" placeholder="Search..." onkeyup="OfferingsModule.filterOfferings(this.value)" style="max-width:250px">
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="offTable"><thead><tr><th>ID</th><th>${ml ? 'ദാതാവ്' : 'Donor'}</th><th>${ml ? 'വിഭാഗം' : 'Category'}</th><th>${ml ? 'തുക' : 'Amount'}</th><th>Paid</th><th>Balance</th><th>${ml ? 'തീയതി' : 'Date'}</th><th>Mode</th><th>User</th><th>${ml ? 'കുറിപ്പ്' : 'Remarks'}</th><th>Actions</th></tr></thead><tbody>
                ${this.offerings.map(o => {
            const remaining = o.amount - (o.amountPaid || 0);
            return `<tr id="record-${o.id}">
                    <td><strong>${o.id}</strong></td><td>${o.donor}</td><td><span class="badge badge-teal">${o.category}</span></td>
                    <td><strong>₹${o.amount.toLocaleString()}</strong></td>
                    <td>₹${(o.amountPaid || 0).toLocaleString()}</td>
                    <td>${remaining > 0 ? `<span style="color:var(--primary-red);font-weight:700">₹${remaining.toLocaleString()}</span>` : '<span class="badge badge-success">Paid</span>'}</td>
                    <td>${o.date}</td>
                    <td><small>${o.bookingMode || '—'}</small></td>
                    <td><i class="fas fa-user-circle"></i> <small>${o.createdBy || 'Admin'}</small></td>
                    <td><small style="color:var(--text-muted)">${o.remarks || '—'}</small></td>
                    <td>
                        <button class="btn btn-sm btn-outline" title="View" onclick="OfferingsModule.viewOffering('${o.id}')"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-sm btn-success" title="Send Receipt via WhatsApp" onclick="OfferingsModule.sendReceipt('${o.id}')"><i class="fab fa-whatsapp"></i></button>
                    </td>
                </tr>`;
        }).join('')}
            </tbody></table>
            </div>
        </div>`;
    },

    openOfferingModal() {
        const catOpts = this.categories.map(c => `<option>${c.name}</option>`).join('');
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Record Offering</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="offForm" onsubmit="OfferingsModule.saveOffering(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Donor Name *</label><input type="text" class="form-control" id="off_donor" required></div>
                    <div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-control" id="off_phone" placeholder="Optional"></div>
                </div>
                <div class="form-group"><label class="form-label">Address <small style="color:var(--text-muted)">(optional)</small></label><input type="text" class="form-control" id="off_address" placeholder="Devotee address"></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Category *</label><select class="form-control" id="off_cat" required>${catOpts}</select></div>
                    <div class="form-group"><label class="form-label">Amount (₹) *</label><input type="number" class="form-control" id="off_amt" required min="1" oninput="document.getElementById('off_words').textContent=numberToWords(parseInt(this.value))"><div class="amount-words" id="off_words"></div></div>
                </div>

                <!-- Full / Partial Payment -->
                <div class="form-group">
                    <label class="form-label">Payment Type</label>
                    <div class="payment-radio-group">
                        <label><input type="radio" name="off_paytype" value="full" checked onchange="document.getElementById('off_paidGroup').style.display='none'"> Full Payment</label>
                        <label><input type="radio" name="off_paytype" value="partial" onchange="document.getElementById('off_paidGroup').style.display=''"> Partial Payment</label>
                    </div>
                </div>
                <div class="form-group" id="off_paidGroup" style="display:none">
                    <label class="form-label">Amount Paid (₹)</label>
                    <input type="number" class="form-control" id="off_amountPaid" min="0" oninput="document.getElementById('off_paidWords').textContent=numberToWords(parseInt(this.value))">
                    <div class="amount-words" id="off_paidWords"></div>
                </div>

                <!-- Booking Mode -->
                <div class="form-group"><label class="form-label">Booking Mode</label><select class="form-control" id="off_bookingMode"><option>Counter</option><option>Online</option><option>Phone</option><option>Other</option><option>Offline</option></select></div>

                <div class="form-group"><label class="form-label">Remarks <small style="color:var(--text-muted)">(optional)</small></label><textarea class="form-control" id="off_remarks" placeholder="Any notes..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Record</button></div>
            </form>
        `);
    },

    saveOffering(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('offForm'))) return;
        const amt = parseInt(document.getElementById('off_amt').value);
        const payType = document.querySelector('input[name="off_paytype"]:checked')?.value || 'full';
        const amountPaid = payType === 'partial' ? (parseInt(document.getElementById('off_amountPaid').value) || 0) : amt;
        const id = RefNumberGenerator.generateSequential('OFF', this.offerings, 3);
        this.offerings.unshift({
            id, donor: document.getElementById('off_donor').value,
            phone: document.getElementById('off_phone')?.value || '',
            address: document.getElementById('off_address')?.value || '',
            category: document.getElementById('off_cat').value,
            amount: amt, date: new Date().toISOString().split('T')[0],
            remarks: document.getElementById('off_remarks')?.value || '',
            status: 'confirmed', paymentType: payType, amountPaid,
            bookingMode: document.getElementById('off_bookingMode')?.value || 'Counter',
            createdBy: App.currentUser
        });
        AuditLog.add('Create', 'Offerings', `Recorded ${id} from ${this.offerings[0].donor}`);

        if (window.AccountingModule && amountPaid > 0) {
            AccountingModule.addTransaction('income', 'Donations', `${document.getElementById('off_cat').value} - ${document.getElementById('off_donor').value}`, amountPaid, id);
        }

        App.closeModal();
        App.addNotification(`Offering ${id}: ₹${amt.toLocaleString()} from ${this.offerings[0].donor}`, 'fa-hand-holding-dollar', 'var(--grad-teal)', 'offerings', id);
        App.showToast(`Offering ₹${amt.toLocaleString()} recorded!`, 'success');
        App.navigateTo('offerings');

        // --- Sync to backend API (fire-and-forget) ---
        this.syncDonationToAPI(this.offerings[0]);
    },

    viewOffering(id) {
        const o = this.offerings.find(x => x.id === id);
        if (!o) return;
        const remaining = o.amount - (o.amountPaid || 0);
        App.viewDetail(`Offering ${o.id}`, [
            ['Donor', o.donor], ['Phone', o.phone || '—'], ['Address', o.address || '—'],
            ['Category', o.category], ['Amount', `₹${o.amount.toLocaleString()}`],
            ['In Words', numberToWords(o.amount)],
            ['Payment Type', o.paymentType || 'full'],
            ['Amount Paid', `₹${(o.amountPaid || 0).toLocaleString()}`],
            ['Balance', remaining > 0 ? `<strong style="color:var(--primary-red)">₹${remaining.toLocaleString()}</strong>` : 'Fully Paid'],
            ['Booking Mode', o.bookingMode || '—'],
            ['Remarks', o.remarks || '—'],
            ['Created By', o.createdBy || 'Admin'],
        ]);
    },

    sendReceipt(id) {
        App.showToast(`Receipt for ${id} sent via WhatsApp!`, 'success');
    },

    filterOfferings(q) { q = q.toLowerCase(); document.querySelectorAll('#offTable tbody tr').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; }); },

    /* --- Backend API Integration --- */

    /**
     * Load donations from backend.
     */
    async loadFromAPI() {
        try {
            if (typeof DonationService === 'undefined') return;
            const donations = await DonationService.getAll();
            if (donations && Array.isArray(donations)) {
                // Update: ALWAYS overwrite this.offerings, even if empty, 
                // to ensure real-time consistency with Dashboard.
                this.offerings = donations.map(d => {
                    const dt = new Date(d.created_at || Date.now());
                    const pd = n => String(n).padStart(2, '0');
                    return {
                        id: d.id.substring(0, 8).toUpperCase(),
                        donor: d.notes ? d.notes.split(' - ').slice(-1)[0].split(':')[0] : 'Devotee',
                        phone: '—',
                        address: '—',
                        category: d.notes ? d.notes.split(' - ')[0] : 'General',
                        amount: d.amount,
                        date: `${dt.getFullYear()}-${pd(dt.getMonth() + 1)}-${pd(dt.getDate())}`,
                        remarks: d.notes || '',
                        status: 'confirmed',
                        paymentType: 'full',
                        amountPaid: d.amount,
                        bookingMode: 'System',
                        createdBy: 'Backend'
                    };
                });
                
                // Recalculate category totals if needed, or stick to simple list
            }
            this._apiLoaded = true;
            console.log(`[Offerings] Live Sync: Loaded ${this.offerings.length} donations`);

            // Re-render if currently on offerings page
            if (App.currentPage === 'offerings') {
                const content = document.getElementById('pageContent');
                if (content) content.innerHTML = this.render();
            }
        } catch (error) {
            console.warn('[Offerings] API not available:', error.message);
        }
    },

    /**
     * Sync new offering/donation to backend API.
     */
    async syncDonationToAPI(offering) {
        try {
            if (typeof DonationService === 'undefined') return;
            await DonationService.create({
                amount: offering.amountPaid || offering.amount,
                notes: `${offering.category} - ${offering.donor}${offering.remarks ? ': ' + offering.remarks : ''}`
            });
            console.log('[Offerings] Donation synced to backend');
        } catch (error) {
            console.warn('[Offerings] Backend sync failed:', error.message);
        }
    }
};
