/* =====================
   ARCHANA / POOJA BOOKING MODULE v4
   Reordered form, refined checkout sumamry with calculation table, ref numbers
   ===================== */
window.ArchanaModule = {
    _apiLoaded: false, // track if API data has been loaded
    _apiLoaded: false, 
    bookings: [],

    archanaList: [
        { name: 'Ganapathi Homam', price: 500 },
        { name: 'Rudra Abhishekam', price: 1500 },
        { name: 'Lakshmi Pooja', price: 350 },
        { name: 'Saraswati Pooja', price: 300 },
        { name: 'Lalitha Sahasranama', price: 800 },
        { name: 'Vishnu Sahasranama', price: 600 },
        { name: 'Navagraha Pooja', price: 800 },
        { name: 'Modaka Pooja', price: 250 },
        { name: 'Mrityunjaya Homam', price: 1200 },
        { name: 'Chandika Homam', price: 1000 },
    ],

    cart: [], // Stores individual members mapped to archanas for calculation

    render() {
        // Trigger async API load on first render (non-blocking)
        if (!this._apiLoaded) {
            this.loadFromAPI();
        }

        const ml = App.currentLang === 'ml';
        const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;
        const cancelled = this.bookings.filter(b => b.status === 'cancelled').length;
        const badge = s => s === 'confirmed' ? 'badge-success' : s === 'cancelled' ? 'badge-danger' : 'badge-info';
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-om"></i> ${ml ? 'അർച്ചന / പൂജ ബുക്കിംഗ്' : 'Archana / Pooja Booking'}</h1>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-om kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ ബുക്കിംഗ്' : 'Total Bookings'}</div><div class="kpi-value">${this.bookings.length}</div><div class="kpi-sub">All bookings</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-check kpi-icon"></i><div class="kpi-label">${ml ? 'സ്ഥിരീകരിച്ചവ' : 'Confirmed'}</div><div class="kpi-value">${confirmed}</div><div class="kpi-sub">Confirmed</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-times kpi-icon"></i><div class="kpi-label">${ml ? 'റദ്ദാക്കിയവ' : 'Cancelled'}</div><div class="kpi-value">${cancelled}</div><div class="kpi-sub">Cancelled</div></div>
            <div class="kpi-card" style="background:var(--grad-teal)"><i class="fas fa-rupee-sign kpi-icon"></i><div class="kpi-label">${ml ? 'ആകെ വരുമാനം' : 'Revenue'}</div><div class="kpi-value">₹${this.bookings.reduce((s, b) => s + (b.status !== 'cancelled' ? b.total : 0), 0).toLocaleString()}</div><div class="kpi-sub">Total collected</div></div>
        </div>

        <!-- Archana List (Quick Add) -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title"><i class="fas fa-list"></i> ${ml ? 'അർച്ചന പട്ടിക' : 'Archana List'}</div>
                <button class="btn btn-primary" onclick="ArchanaModule.openBookingModal()"><i class="fas fa-plus"></i> ${ml ? 'പുതിയ ബുക്കിംഗ്' : 'New Booking'}</button>
            </div>
            <div class="products-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
                ${this.archanaList.map(a => `
                <div class="quick-action-card" style="flex-direction:column;text-align:center;padding:16px;gap:6px;cursor:pointer" onclick="ArchanaModule.openBookingModal('${a.name}')" data-tooltip="Book ${a.name}">
                    <div class="qa-icon" style="background:var(--grad-gold);width:40px;height:40px"><i class="fas fa-om"></i></div>
                    <div style="font-weight:700;font-size:0.88rem">${a.name}</div>
                    <div style="font-weight:800;color:var(--primary-blue)">₹${a.price.toLocaleString()}</div>
                </div>
                `).join('')}
            </div>
        </div>

        <!-- Bookings List -->
        <div class="section-card">
            <div class="section-header">
                <div class="section-title"><i class="fas fa-clipboard-list"></i> ${ml ? 'ബുക്കിംഗ് പട്ടിക' : 'Bookings List'}</div>
                <input type="text" class="search-input" placeholder="Search..." onkeyup="ArchanaModule.filterBookings(this.value)" style="max-width:250px">
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="archanaTable"><thead><tr><th>Ref ID</th><th>${ml ? 'ഭക്തൻ' : 'Devotee'}</th><th>${ml ? 'നക്ഷത്രം' : 'Nakshatra'}</th><th>${ml ? 'അർച്ചനകൾ' : 'Archanas'}</th><th>${ml ? 'തീയതി' : 'Date'}</th><th>${ml ? 'ആകെ' : 'Total'}</th><th>Mode</th><th>User</th><th>${ml ? 'സ്ഥിതി' : 'Status'}</th><th>Actions</th></tr></thead><tbody>
                ${[...this.bookings].reverse().map(b => `<tr id="record-${b.id}">
                    <td><strong>${b.ref_number || b.id.substring(0,8)}</strong></td>
                    <td>${b.devotee_name}${b.family && b.family.length ? '<br><small style="color:var(--text-muted)">+' + b.family.length + ' member(s)</small>' : ''}</td>
                    <td><small>${b.nakshatra}</small></td>
                    <td>${b.items ? b.items.map(i => i.name).join(', ') : ''}</td>
                    <td>${b.booking_date}<br><small>${b.booking_time}</small></td>
                    <td><strong>₹${b.total.toLocaleString()}</strong>${b.dakshina ? '<br><small style="color:var(--primary-teal)">+₹' + b.dakshina + ' dakshina</small>' : ''}</td>
                    <td><small>${b.booking_mode || '—'}</small></td>
                    <td><i class="fas fa-user-circle"></i> <small>${b.created_by || 'Admin'}</small></td>
                    <td><span class="badge ${badge(b.status)}">${b.status}</span></td>
                    <td style="white-space:nowrap">
                        <div class="action-group" style="display:flex;gap:6px">
                            <button class="btn btn-sm btn-outline" onclick="ArchanaModule.viewBooking('${b.id}')" data-tooltip="View details"><i class="fas fa-eye"></i></button>
                            ${b.status !== 'cancelled' && b.booking_date >= new Date().toISOString().split('T')[0] ? `
                            <div class="action-dropdown">
                                <button class="btn btn-sm btn-edit"><i class="fas fa-pen"></i></button>
                                <div class="action-dropdown-content">
                                    <button class="action-menu-btn text-danger" onclick="ArchanaModule.cancelBooking('${b.id}')"><i class="fas fa-times"></i> Cancel Booking</button>
                                </div>
                            </div>` : ''}
                        </div>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>`;
    },

    openBookingModal(preselect) {
        this.cart = [];

        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        // Fix Ref ID duplication and get next ID
        const currentDt = new Date();
        const mmyy = String(currentDt.getMonth() + 1).padStart(2, '0') + String(currentDt.getFullYear()).slice(-2);
        let maxId = 0;
        this.bookings.forEach(b => {
            if (b.id.startsWith('AR') && b.id.endsWith('/' + mmyy)) {
                const num = parseInt(b.id.replace('AR', '').split('/')[0], 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
        const nextId = 'AR' + String(maxId + 1).padStart(2, '0') + '/' + mmyy;

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">New Archana Booking</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="archanaForm" onsubmit="ArchanaModule.saveBooking(event)">
                <!-- Main Devotee Input Bar -->
                <div style="background:#f0f5ff;padding:12px;border-radius:10px;margin-bottom:16px;border:1px solid #d0deff">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <h4 style="font-size:0.9rem;color:var(--primary-blue);margin:0">1. Add Persons to Booking</h4>
                        <div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary)">Ref ID: <span style="color:var(--primary-blue)">${nextId}</span></div>
                        <input type="hidden" id="arc_ref_id" value="${nextId}">
                    </div>
                    <div class="form-row-4" style="align-items:end;margin-bottom:0">
                        <div class="form-group"><label class="form-label" style="font-size:0.75rem">Name</label><input type="text" class="form-control" id="add_name" placeholder="Devotee name"></div>
                        <div class="form-group"><label class="form-label" style="font-size:0.75rem">Nakshatra</label><select class="form-control" id="add_nak"><option value="">Select...</option>${NAKSHATRAS.map(n => `<option value="${n}">${n}</option>`).join('')}</select></div>
                        <div class="form-group"><label class="form-label" style="font-size:0.75rem">Archana</label><select class="form-control" id="add_arc"><option value="">Select...</option>${this.archanaList.map(a => `<option value="${a.name}" data-price="${a.price}">${a.name} (₹${a.price})</option>`).join('')}</select></div>
                        <div class="form-group"><button type="button" class="btn btn-primary" onclick="ArchanaModule.addToCart()"><i class="fas fa-plus"></i> Add Person</button></div>
                    </div>
                </div>

                <!-- Structured List -->
                <div id="cartList" style="margin-bottom:18px"></div>

                <div class="form-row" style="margin-top:20px;border-top:1px solid #e0e0e0;padding-top:16px">
                    <div class="form-group"><label class="form-label">Date *</label><input type="date" class="form-control" id="arc_date" value="${defaultDate}" required></div>
                    <div class="form-group">
                        <label class="form-label">Time</label>
                        <div style="display:flex;gap:4px">
                            <input type="time" class="form-control" id="arc_time" value="${defaultTime}" style="flex:1">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Pujari Dakshina (optional)</label>
                    <input type="number" class="form-control amount-input" id="arc_dakshina" placeholder="₹0" min="0" oninput="ArchanaModule.updateCheckout()">
                </div>

                <div class="form-group">
                    <label class="form-label">Phone <small style="color:var(--text-muted)">(optional)</small></label>
                    <input type="tel" class="form-control" id="arc_phone" placeholder="Mobile number">
                </div>

                <div class="consent-row">
                    <input type="checkbox" id="arc_consent">
                    <label for="arc_consent">User consent to receive messages and receipts via WhatsApp.</label>
                </div>

                <div class="form-group">
                    <label class="form-label">Remarks <small style="color:var(--text-muted)">(optional)</small></label>
                    <input type="text" class="form-control" id="arc_remarks" placeholder="Any notes...">
                </div>

                <div class="form-row">
                    <div class="form-group"><label class="form-label">Booking Mode</label><select class="form-control" id="arc_bookingMode"><option>Counter</option><option>Online</option><option>Phone</option><option>Offline</option></select></div>
                    <div class="form-group"><label class="form-label">Payment Mode</label><select class="form-control" id="arc_paymentMode"><option>Cash</option><option>UPI</option><option>Offline</option></select></div>
                </div>

                <!-- Calculation Table -->
                <div id="checkoutSummary" style="padding:16px;background:#f8f9fc;border-radius:10px;margin-bottom:16px"></div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-check-circle"></i> Confirm Booking</button>
                </div>
            </form>
        `);

        if (preselect) {
            document.getElementById('add_name').value = 'Primary Devotee';
            document.getElementById('add_arc').value = preselect;
            document.getElementById('add_nak').focus();
        }
        this.renderCart();
    },

    addToCart() {
        const name = document.getElementById('add_name').value.trim();
        const nak = document.getElementById('add_nak').value;
        const arcSel = document.getElementById('add_arc');
        const arcName = arcSel.value;
        const arcPrice = arcSel.options[arcSel.selectedIndex]?.dataset.price || 0;

        if (!name || !nak || !arcName) {
            App.showToast('Please fill Name, Nakshatra, and Archana to add.', 'warning');
            return;
        }

        this.cart.push({
            id: Date.now() + Math.random(),
            name, nakshatra: nak, archana: arcName, price: parseInt(arcPrice),
            isPrimary: this.cart.length === 0
        });

        document.getElementById('add_name').value = '';
        document.getElementById('add_nak').value = '';
        document.getElementById('add_arc').value = '';
        document.getElementById('add_name').focus();

        this.renderCart();
    },

    removeFromCart(id) {
        const idx = this.cart.findIndex(c => c.id === id);
        if (idx > -1) {
            this.cart.splice(idx, 1);
            if (this.cart.length > 0 && !this.cart[0].isPrimary) {
                this.cart[0].isPrimary = true;
            }
            this.renderCart();
        }
    },

    setPrimary(id) {
        this.cart.forEach(c => c.isPrimary = (c.id === id));
        this.renderCart();
    },

    renderCart() {
        const listEl = document.getElementById('cartList');
        if (!listEl) return;

        if (this.cart.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;padding:20px;border:1px dashed #d0d7e5;border-radius:8px;color:var(--text-muted);font-size:0.85rem">No entries added. Add persons using the form above.</div>';
        } else {
            listEl.innerHTML = `
            <table class="data-table" style="font-size:0.8rem">
                <thead><tr><th style="width:30px"></th><th>Name</th><th>Nakshatra</th><th>Archana</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                ${this.cart.map(c => `
                    <tr style="${c.isPrimary ? 'background:#f5fafe' : ''}">
                        <td><input type="radio" name="primaryDev" ${c.isPrimary ? 'checked' : ''} onclick="ArchanaModule.setPrimary(${c.id})" data-tooltip="Set as primary devotee"></td>
                        <td><strong>${c.name}</strong>${c.isPrimary ? ' <span class="badge badge-teal" style="font-size:0.6rem;padding:2px 6px">Primary</span>' : ''}</td>
                        <td>${c.nakshatra}</td>
                        <td>${c.archana}</td>
                        <td>₹${c.price}</td>
                        <td style="text-align:right"><button type="button" class="btn btn-sm btn-outline-danger" onclick="ArchanaModule.removeFromCart(${c.id})" style="padding:4px"><i class="fas fa-times"></i></button></td>
                    </tr>
                `).join('')}
                </tbody>
            </table>`;
        }
        this.updateCheckout();
    },

    updateCheckout() {
        const el = document.getElementById('checkoutSummary');
        if (!el) return;

        if (this.cart.length === 0) {
            el.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem">Payment summary will appear here</div>';
            return;
        }

        const aggs = {};
        this.cart.forEach(c => {
            if (!aggs[c.archana]) aggs[c.archana] = { count: 0, price: c.price, total: 0 };
            aggs[c.archana].count++;
            aggs[c.archana].total += c.price;
        });

        const arcSubtotal = this.cart.reduce((s, c) => s + c.price, 0);
        const dakEl = document.getElementById('arc_dakshina');
        const dak = dakEl ? parseInt(dakEl.value) || 0 : 0;
        const grandTotal = arcSubtotal + dak;

        let html = `
            <h4 style="margin-bottom:10px;font-size:0.9rem;color:#333;border-bottom:1px solid #d0d7e5;padding-bottom:6px">Calculation Summary</h4>
            <table style="width:100%;font-size:0.85rem;margin-bottom:12px">
                <thead><tr style="color:var(--text-muted);text-align:left"><th style="padding-bottom:4px">Archana</th><th style="padding-bottom:4px">Qty</th><th style="text-align:right;padding-bottom:4px">Total</th></tr></thead>
                <tbody>
                ${Object.keys(aggs).map(k => `<tr><td style="padding:3px 0">${k} (@ ₹${aggs[k].price})</td><td>x${aggs[k].count}</td><td style="text-align:right">₹${aggs[k].total}</td></tr>`).join('')}
                </tbody>
            </table>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding-top:8px;border-top:1px dashed #d0d7e5"><span>Archana Total</span><strong>₹${arcSubtotal}</strong></div>
            ${dak ? `<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding-top:4px"><span>Pujari Dakshina</span><strong>₹${dak}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:800;color:var(--primary-blue);margin-top:10px;padding-top:10px;border-top:2px solid var(--primary-blue)"><span>Grand Total</span><span>₹${grandTotal.toLocaleString()}</span></div>
        `;

        el.innerHTML = html;
        el.innerHTML += `<div style="text-align:right;font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-top:4px;text-transform:uppercase">${numberToWords(grandTotal)}</div>`;
    },

    saveBooking(e) {
        e.preventDefault();
        if (this.cart.length === 0) {
            App.showToast('Please add at least one person to the booking.', 'error');
            return;
        }

        const primary = this.cart.find(c => c.isPrimary) || this.cart[0];
        const family = this.cart.filter(c => c.id !== primary.id).map(c => ({
            name: c.name, nakshatra: c.nakshatra, archana: c.archana
        }));

        const itemsList = {};
        this.cart.forEach(c => {
            if (!itemsList[c.archana]) itemsList[c.archana] = { name: c.archana, price: 0 };
            itemsList[c.archana].price += c.price;
        });

        const dak = parseInt(document.getElementById('arc_dakshina')?.value) || 0;
        const total = this.cart.reduce((s, c) => s + c.price, 0) + dak;
        const id = document.getElementById('arc_ref_id').value;
        const selectedDateStr = document.getElementById('arc_date').value;
        let rawTime = document.getElementById('arc_time').value; // e.g. "14:30"

        // Date and Time Validation
        const selectedDateTime = new Date(`${selectedDateStr}T${rawTime || '00:00'}`);
        const now = new Date();
        if (selectedDateTime < now) {
            App.showToast('Past dates and times are not allowed for this activity.', 'error');
            return;
        }

        let timeStr = rawTime;
        if (rawTime) {
            let [h, m] = rawTime.split(':');
            let ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            timeStr = `${h}:${m} ${ampm}`;
        }

        this.bookings.push({
            id,
            devotee: primary.name,
            phone: document.getElementById('arc_phone')?.value || '',
            nakshatra: primary.nakshatra,
            items: Object.values(itemsList),
            family,
            dakshina: dak,
            date: selectedDateStr,
            time: timeStr,
            status: 'confirmed',
            total,
            remarks: document.getElementById('arc_remarks')?.value || '',
            bookingMode: document.getElementById('arc_bookingMode')?.value || 'Counter',
            paymentMode: document.getElementById('arc_paymentMode')?.value || 'Cash',
            consent: document.getElementById('arc_consent')?.checked || false,
            createdBy: App.currentUser
        });

        AuditLog.add('Create', 'Archana', `Created booking ${id} for ${primary.name}`);

        if (window.AccountingModule) {
            AccountingModule.addTransaction('income', 'Archanai Fees', `Archana Booking - ${primary.name}`, total, id);
        }

        // --- Send to backend API (fire-and-forget) ---
        this.syncBookingToAPI(primary, total);

        App.closeModal();
        App.addNotification(`New archana booking ${id} by ${primary.name}`, 'fa-om', 'var(--grad-blue)', 'archana', id);
        App.showToast(`Booking ${id} created! Total: ₹${total.toLocaleString()}`, 'success');
        App.navigateTo('archana');
    },

    viewBooking(id) {
        const b = this.bookings.find(x => x.id === id);
        if (!b) return;
        App.viewDetail(`Booking ${b.ref_number || b.id.substring(0,8)}`, [
            ['Devotee', b.devotee_name], ['Nakshatra', b.nakshatra],
            ['Phone', b.phone || '—'],
            ['Date & Time', `${b.booking_date} ${b.booking_time}`],
            ['Archanas', (b.items || []).map(i => i.name).join('<br>')],
            ['Dakshina Amount', `₹${b.dakshina}`],
            ['Total Payable', `<strong>₹${b.total.toLocaleString()}</strong>`],
            ['Payment Mode', b.payment_mode], ['Booking Mode', b.booking_mode],
            ['Remarks', b.remarks || 'None'],
            ['Created By', b.created_by || 'Admin'],
            ['Consent', b.consent ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'],
            ['Status', `<span class="badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">${b.status}</span>`],
        ]);
    },

    updateStatus(id, status) {
        const b = this.bookings.find(x => x.id === id);
        if (b) {
            const prev = b.status;
            b.status = status;
            AuditLog.add('Approve', 'Archana', `${id} status changed to ${status}`, prev, status);
            App.showToast(`${id} is now ${status}!`, 'success');
            App.showUndo(`Booking ${id} ${status}`, () => { b.status = prev; App.navigateTo('archana'); });
            App.navigateTo('archana');
        }
    },

    async cancelBooking(id) {
        try {
            await apiRequest(`/api/v1/archana-bookings/${id}/cancel`, 'PATCH');
            App.showToast(`Booking cancelled. Revenue deducted.`, 'warning');
            this._apiLoaded = false;
            App.navigateTo('archana');
        } catch (error) {
            console.error("Booking cancel error", error);
            App.showToast(error.detail || "Failed to cancel booking", 'error');
        }
    },

    filterBookings(q) {
        q = q.toLowerCase();
        document.querySelectorAll('#archanaTable tbody tr').forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    /* --- Backend API Integration --- */

    async loadFromAPI() {
        try {
            this.bookings = await apiRequest('/api/v1/archana-bookings') || [];
            this._apiLoaded = true;

            if (App.currentPage === 'archana') {
                const content = document.getElementById('pageContent');
                if (content) content.innerHTML = this.render();
            }
        } catch (error) {
            console.error("Failed to load archana bookings", error);
        }
    },

    async saveBooking(e) {
        e.preventDefault();
        if (this.cart.length === 0) { App.showToast('Add at least one person', 'error'); return; }

        const primary = this.cart.find(c => c.isPrimary);
        const family = this.cart.filter(c => !c.isPrimary).map(c => ({ name: c.name, nakshatra: c.nakshatra, archana: c.archana }));
        const items = this.cart.map(c => ({ name: c.archana, price: c.price }));
        const dak = parseInt(document.getElementById('arc_dakshina').value) || 0;
        const sum = this.cart.reduce((s, c) => s + c.price, 0);

        const payload = {
            ref_number: document.getElementById('arc_ref_id').value,
            devotee_name: primary.name,
            nakshatra: primary.nakshatra,
            phone: document.getElementById('arc_phone').value,
            items: items,
            family: family,
            dakshina: dak,
            booking_date: document.getElementById('arc_date').value,
            booking_time: document.getElementById('arc_time').value,
            total: sum + dak,
            payment_mode: document.getElementById('arc_paymentMode').value,
            booking_mode: document.getElementById('arc_bookingMode').value,
            remarks: document.getElementById('arc_remarks').value,
            consent: document.getElementById('arc_consent').checked,
        };

        try {
            await apiRequest('/api/v1/archana-bookings', 'POST', payload);
            App.closeModal();
            App.showToast('Booking Confirmed!', 'success');
            this._apiLoaded = false;
            App.navigateTo('archana');
        } catch (error) {
            console.error("Booking error", error);
            App.showToast(error.detail || "Failed to create booking", 'error');
        }
    }
};
