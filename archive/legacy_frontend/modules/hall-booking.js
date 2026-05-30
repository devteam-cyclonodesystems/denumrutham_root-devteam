/* =====================
   HALL & VENUE BOOKING MODULE v3
   Calendar on top, payment type, payment remaining, booking mode, remarks, cancel
   ===================== */
window.HallBookingModule = {
    halls: [],
    bookings: [],

    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    _dataLoaded: false,

    async loadData() {
        try {
            this.halls = await apiRequest('/halls') || [];
            this.bookings = await apiRequest('/hall-bookings') || [];
            this._dataLoaded = true;
            App.navigateTo('hall-booking');
        } catch (e) {
            console.error("Failed to load hall booking data", e);
            App.showToast("Failed to load hall bookings", "error");
        }
    },

    render() {
        if (!this._dataLoaded) {
            this.loadData();
            return `<div style="padding:40px;text-align:center;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary-blue)"></i><p style="margin-top:10px">Loading Hall Bookings...</p></div>`;
        }
        const ml = App.currentLang === 'ml';
        const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;
        const pending = this.bookings.filter(b => b.status === 'pending').length;
        const pendingPayments = this.bookings.filter(b => (b.amount - (b.amountPaid || 0)) > 0).length;
        const revenue = this.bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0);
        const badge = s => s === 'confirmed' ? 'badge-success' : s === 'pending' ? 'badge-warning' : s === 'cancelled' ? 'badge-danger' : 'badge-info';
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-building"></i> ${ml ? 'ഹാൾ & വേദി ബുക്കിംഗ്' : 'Hall & Venue Booking'}</h1>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-building kpi-icon"></i><div class="kpi-label">Total Venues</div><div class="kpi-value">${this.halls.length}</div><div class="kpi-sub">View venues ↓</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-check kpi-icon"></i><div class="kpi-label">Active Bookings</div><div class="kpi-value">${confirmed}</div><div class="kpi-sub">Confirmed</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-clock kpi-icon"></i><div class="kpi-label">Pending Approval</div><div class="kpi-value">${pending}</div><div class="kpi-sub">Review ↓</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-exclamation-circle kpi-icon"></i><div class="kpi-label">Pending Payments</div><div class="kpi-value">${pendingPayments}</div><div class="kpi-sub">Balance due</div></div>
            <div class="kpi-card" style="background:var(--grad-teal)"><i class="fas fa-rupee-sign kpi-icon"></i><div class="kpi-label">Revenue</div><div class="kpi-value">₹${revenue.toLocaleString()}</div><div class="kpi-sub">Confirmed</div></div>
        </div>

        <!-- Split Layout: Available Venues and Calendar -->
        <div class="grid-2-1" style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;align-items:stretch">
            <!-- Available Venues -->
            <div class="section-card" style="margin-bottom:0">
                <div class="section-header">
                    <div class="section-title"><i class="fas fa-building"></i> Available Venues</div>
                    <button class="btn btn-primary btn-sm" onclick="HallBookingModule.openBookingModal()"><i class="fas fa-plus"></i> New Booking</button>
                </div>
                <div class="products-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
                    ${this.halls.map(h => `
                    <div class="product-card" style="cursor:pointer" onclick="HallBookingModule.openBookingModal('${h.id}')">
                        <div class="product-img" style="height:80px;font-size:2.5rem;display:flex;align-items:center;justify-content:center;background:var(--grad-teal)">${h.image}</div>
                        <div class="product-info" style="padding:12px">
                            <div class="product-name">${h.name}</div>
                            <div style="font-size:0.72rem;color:var(--text-muted)"><i class="fas fa-users"></i> ${h.capacity} • ${h.amenities}</div>
                            <div class="product-price" style="margin-top:6px">₹${h.pricePerDay.toLocaleString()}/day</div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Calendar on right -->
            <div class="section-card compact" style="margin-bottom:0; display:flex; flex-direction:column; height:100%">
                ${this.renderCalendar()}
                <div style="margin-top:auto; padding-top:12px; display:flex; gap:10px; flex-wrap:wrap; font-size:0.75rem; justify-content:center">
                    <span style="display:flex; align-items:center; gap:4px"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#ffcdd2;border:1px solid #e57373"></span> Booked</span>
                    <span style="display:flex; align-items:center; gap:4px"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#fff3e0;border:1px solid #ffb74d"></span> Pending</span>
                    <span style="display:flex; align-items:center; gap:4px"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#e8f5e9;border:1px solid #81c784"></span> Available</span>
                </div>
            </div>
        </div>

        <!-- All Bookings (with New Booking button inside) -->
        <div class="section-card" id="hallBookingsTable">
            <div class="section-header"><div class="section-title"><i class="fas fa-clipboard-list"></i> All Bookings</div>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" class="search-input" placeholder="Search..." onkeyup="HallBookingModule.filterBookings(this.value)" style="max-width:200px">
                    <button class="btn btn-primary btn-sm" onclick="HallBookingModule.openBookingModal()"><i class="fas fa-plus"></i> New Booking</button>
                </div>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="hbTable"><thead><tr><th>Ref ID</th><th>Hall</th><th>Booking Name</th><th>Purpose</th><th>Date</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Mode</th><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                ${[...this.bookings].reverse().map(b => {
            const remaining = b.amount - (b.amountPaid || 0);
            return `<tr id="record-${b.id}">
                    <td><strong>${b.id}</strong></td><td>${b.hall}</td><td>${b.customer}</td>
                    <td><strong>${b.purpose}</strong></td>
                    <td><div style="font-size:0.8rem">${b.date} ${b.startTime || ''}</div>${(b.endDate !== b.date) || b.endTime ? `<div style="font-size:0.8rem; color:var(--text-muted)">to ${b.endDate} ${b.endTime || ''}</div>` : ''}</td>
                    <td><strong>₹${b.amount.toLocaleString()}</strong></td>
                    <td>₹${(b.amountPaid || 0).toLocaleString()}</td>
                    <td>${remaining > 0 ? `<span style="color:var(--primary-red);font-weight:700">₹${remaining.toLocaleString()}</span>` : '<span class="badge badge-success">Paid</span>'}</td>
                    <td><small>${b.bookingMode || '—'}</small></td>
                    <td><i class="fas fa-user-circle"></i> <small>${b.createdBy || 'Admin'}</small></td>
                    <td><span class="badge ${badge(b.status)}">${b.status}</span></td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-sm btn-outline" title="View" onclick="HallBookingModule.viewBooking('${b.id}')"><i class="fas fa-eye"></i></button>
                        <div class="action-dropdown">
                            <button class="btn btn-sm btn-edit" title="Booking Actions"><i class="fas fa-pen"></i></button>
                            <div class="action-dropdown-content">
                                <button class="action-menu-btn" onclick="HallBookingModule.editBooking('${b.id}')"><i class="fas fa-edit"></i> Edit Booking</button>
                                ${b.status !== 'cancelled' && b.date >= new Date().toISOString().split('T')[0] ? `<button class="action-menu-btn text-danger" onclick="HallBookingModule.cancelBooking('${b.id}')"><i class="fas fa-times"></i> Cancel Booking</button>` : ''}
                            </div>
                        </div>
                        ${b.status === 'pending' ? `<button class="btn btn-sm btn-approve" title="Approve" style="margin-left:4px" onclick="HallBookingModule.approve('${b.id}')"><i class="fas fa-check"></i></button>` : ''}
                    </td>
                </tr>`;
        }).join('')}
            </tbody></table>
            </div>
        </div>

`;
    },

    renderCalendar() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const y = this.calYear, m = this.calMonth;
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const today = new Date();
        const bookedDates = new Set(), pendingDates = new Set();
        this.bookings.forEach(b => {
            const start = new Date(b.date), end = new Date(b.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (d.getMonth() === m && d.getFullYear() === y) {
                    if (b.status === 'confirmed') bookedDates.add(d.getDate());
                    else if (b.status === 'pending') pendingDates.add(d.getDate());
                }
            }
        });
        let cells = '';
        for (let i = 0; i < firstDay; i++) cells += '<div class="cal-day empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
            let cls = 'cal-day';
            let onclickAttr = '';
            let title = 'Available';
            let inlineStyle = '';

            if (bookedDates.has(d)) { cls += ' booked'; title = 'Fully/Partially Booked'; inlineStyle = 'background:#e0e0e0; color:#424242; border-bottom:2px solid #b71c1c;'; }
            else if (pendingDates.has(d)) { cls += ' pending'; title = 'Pending Booking'; }
            else { cls += ' available'; }

            if (isToday) {
                cls += ' today';
                // Force today to be blue, overriding booked styles if necessary
                inlineStyle = 'background:var(--primary-blue); color:#fff; font-weight:700; border:2px solid #1565c0; box-shadow:0 0 8px rgba(21,101,192,0.4); z-index:1;';
            }

            if (bookedDates.has(d) || pendingDates.has(d)) {
                const searchDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                onclickAttr = `onclick="HallBookingModule.scrollToBooking('${searchDate}')"`;
            }
            cells += `<div class="${cls}" style="${inlineStyle}" title="${title}" ${onclickAttr}>${d}</div>`;
        }
        return `<div class="mini-cal" style="flex:1; display:flex; flex-direction:column"><div class="mini-cal-header"><button onclick="HallBookingModule.changeMonth(-1)"><i class="fas fa-chevron-left"></i></button><div class="cal-title">${months[m]} ${y}</div><button onclick="HallBookingModule.changeMonth(1)"><i class="fas fa-chevron-right"></i></button></div><div class="mini-cal-grid" style="flex:1; grid-auto-rows: 1fr;">${days.map(d => `<div class="cal-day-label" style="display:flex;align-items:center;justify-content:center">${d}</div>`).join('')}${cells}</div></div>`;
    },

    changeMonth(delta) { this.calMonth += delta; if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; } if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; } App.navigateTo('hall-booking'); },

    scrollToBooking(dateStr) {
        const target = new Date(dateStr);
        // Ensure time is stripped so comparison works correctly
        const b = this.bookings.find(x => {
            const sd = new Date(x.date);
            const ed = new Date(x.endDate);
            return target >= sd && target <= ed;
        });
        if (b) {
            const row = document.getElementById('record-' + b.id);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.remove('highlight-fade');
                void row.offsetWidth; // trigger reflow
                row.classList.add('highlight-fade');
            }
        }
    },

    openBookingModal(hallId) {
        const hall = hallId ? this.halls.find(h => h.id === hallId) : null;
        const hallOpts = this.halls.map(h => `<option value="${h.name}" ${hall && h.id === hallId ? 'selected' : ''}>${h.name} — ₹${h.pricePerDay.toLocaleString()}/day</option>`).join('');

        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const defaultTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">New Hall Booking</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="hallForm" onsubmit="HallBookingModule.saveBooking(event)">
                <div class="form-group"><label class="form-label">Hall / Venue *</label><select class="form-control" id="hb_hall" required onchange="HallBookingModule.calcDuration('hb_')">${hallOpts}</select></div>
                
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Customer Name *</label><input type="text" class="form-control" id="hb_cust" required></div>
                    <div class="form-group"><label class="form-label">Phone *</label><input type="tel" class="form-control" id="hb_phone" required></div>
                </div>
                <!-- Address Field -->
                <div class="form-group"><label class="form-label">Customer Address *</label><input type="text" class="form-control" id="hb_address" required placeholder="Full Address"></div>

                <div class="form-row" style="gap:10px">
                    <div class="form-group"><label class="form-label">Start Date & Time *</label><div style="display:flex;gap:4px"><input type="date" class="form-control" id="hb_date" value="${defaultDate}" required onchange="HallBookingModule.calcDuration('hb_')"><input type="time" class="form-control" id="hb_time" value="${defaultTime}" required onchange="HallBookingModule.calcDuration('hb_')"></div></div>
                    <div class="form-group"><label class="form-label">End Date & Time *</label><div style="display:flex;gap:4px"><input type="date" class="form-control" id="hb_end" value="${defaultDate}" required onchange="HallBookingModule.calcDuration('hb_')"><input type="time" class="form-control" id="hb_endTime" value="${defaultTime}" required onchange="HallBookingModule.calcDuration('hb_')"></div></div>
                </div>
                
                <div class="form-group"><label class="form-label">Booking Purpose *</label><input type="text" class="form-control" id="hb_purpose" required></div>

                <!-- Discount -->
                <div class="form-row" style="align-items:flex-end">
                    <div class="form-group" style="margin-bottom:0"><label class="form-label">Discount</label>
                        <select class="form-control" id="hb_discountType" onchange="const c=document.getElementById('hb_customDiscount'); if(this.value==='Custom') { c.style.display='block'; c.focus(); } else { c.style.display='none'; } HallBookingModule.calcDuration('hb_');">
                            <option value="0">None</option>
                            <option value="5">5%</option>
                            <option value="10">10%</option>
                            <option value="15">15%</option>
                            <option value="20">20%</option>
                            <option value="Custom">Custom Percentage</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <input type="number" class="form-control" id="hb_customDiscount" placeholder="Enter %" min="0" max="100" style="display:none" oninput="HallBookingModule.calcDuration('hb_')">
                    </div>
                </div>

                <!-- Live Calculation Display -->
                <div id="hb_duration_display" style="margin: 15px 0; padding:12px; background:#f8f9fc; border-radius:8px; border:1px solid #e8e8f0; display:none;"></div>

                <!-- Payment Type -->
                <div class="form-group">
                    <label class="form-label">Payment Type</label>
                    <div class="payment-radio-group">
                        <label><input type="radio" name="hb_paytype" value="full" checked onchange="document.getElementById('hb_paidGroup').style.display='none'"> Full Payment</label>
                        <label><input type="radio" name="hb_paytype" value="partial" onchange="document.getElementById('hb_paidGroup').style.display=''"> Partial Payment</label>
                    </div>
                </div>
                <div class="form-group" id="hb_paidGroup" style="display:none">
                    <label class="form-label">Amount Paid (₹)</label>
                    <input type="number" class="form-control" id="hb_amountPaid" min="0" placeholder="₹0" oninput="document.getElementById('hb_paidWords').textContent=numberToWords(parseInt(this.value))">
                    <div class="amount-words" id="hb_paidWords"></div>
                </div>

                <!-- Payment Collection Mode -->
                <div class="form-group"><label class="form-label">Payment Collection Mode</label><select class="form-control" id="hb_paymentMode"><option>Cash</option><option>UPI</option><option>Online Booking</option><option>Offline</option></select></div>

                <!-- Booking Mode -->
                <div class="form-group"><label class="form-label">Booking Mode</label><select class="form-control" id="hb_bookingMode"><option>Counter</option><option>Online</option><option>Phone</option><option>Other</option><option>Offline</option></select></div>

                <!-- Remarks -->
                <div class="form-group"><label class="form-label">Remarks <small style="color:var(--text-muted)">(optional)</small></label><textarea class="form-control" id="hb_remarks" placeholder="Any notes..."></textarea></div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-check"></i> Book</button>
                </div>
            </form>
        `);
    },

    calcDuration(prefix = 'hb_') {
        const d1 = document.getElementById(`${prefix}date`)?.value;
        const t1 = document.getElementById(`${prefix}time`)?.value;
        const d2 = document.getElementById(`${prefix}end`)?.value;
        const t2 = document.getElementById(`${prefix}endTime`)?.value;
        const displayEl = document.getElementById(`${prefix}duration_display`);
        const submitBtn = document.querySelector(prefix === 'hb_' ? '#hallForm button[type="submit"]' : '#hallEditForm button[type="submit"]');
        if (!d1 || !t1 || !d2 || !t2 || !displayEl) return;

        const startDT = new Date(`${d1}T${t1}`);
        const endDT = new Date(`${d2}T${t2}`);
        const diffMs = endDT - startDT;

        if (diffMs <= 0) {
            displayEl.style.display = 'block'; displayEl.style.color = 'var(--primary-red)';
            displayEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> End Date/Time must be strictly after Start Date/Time';
            if (submitBtn) submitBtn.disabled = true;
            return;
        }
        if (submitBtn) submitBtn.disabled = false;

        let m = Math.floor(diffMs / 60000);
        const totalHours = diffMs / 3600000;

        const rawDays = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;

        let chargeableDays = rawDays;
        if (rawDays === 0) {
            // Minimum exactly half day if it crosses 0 hours
            chargeableDays = remHours > 15 ? 2 : (remHours > 6 ? 1.5 : Math.max(0.5, remHours / 24));
        } else {
            if (remHours > 15) chargeableDays += 1;
            else if (remHours > 6) chargeableDays += 0.5;
            else chargeableDays += (remHours / 24); // exact hourly addition
        }


        const hallName = document.getElementById(`${prefix}hall`)?.value;
        const hall = this.halls.find(h => h.name === hallName);
        const rate = hall ? hall.pricePerDay : 10000;

        let subtotal = rate * chargeableDays;

        let discountPct = document.getElementById(`${prefix}discountType`)?.value || "0";
        if (discountPct === 'Custom') discountPct = document.getElementById(`${prefix}customDiscount`)?.value || 0;
        const discountAmount = subtotal * (parseFloat(discountPct) / 100 || 0);
        const total = Math.max(0, subtotal - discountAmount);

        const dPart = Math.floor(m / 1440); m %= 1440;
        const hPart = Math.floor(m / 60); m %= 60;

        let durStr = [];
        if (dPart > 0) durStr.push(`${dPart} day${dPart > 1 ? 's' : ''}`);
        if (hPart > 0) durStr.push(`${hPart} hour${hPart > 1 ? 's' : ''}`);
        if (m > 0) durStr.push(`${m} min`);

        displayEl.style.display = 'block';
        displayEl.style.color = 'var(--text-primary)';
        displayEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                <span style="color:var(--text-secondary)"><i class="fas fa-clock"></i> Duration:</span>
                <strong style="color:var(--primary-teal)">${durStr.join(' ')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                <span style="color:var(--text-secondary)">Chargeable Time:</span>
                <strong>${chargeableDays.toFixed(2)} Days (₹${rate.toLocaleString()}/day)</strong>
            </div>
            ${discountAmount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--primary-green)">
                <span>Discount (${discountPct}%):</span>
                <strong>- ₹${discountAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; border-top:1px solid #e8e8f0; padding-top:6px; margin-top:4px">
                <span style="font-weight:700">Total Payable Amount:</span>
                <strong style="font-size:1.1rem; color:var(--primary-blue)">₹${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </div>
            <input type="hidden" id="${prefix}calculatedAmount" value="${total}">
            <input type="hidden" id="${prefix}calculatedDiscount" value="${discountAmount}">
        `;

        // Auto-update Amount Paid field max and update words if partial
        const amountPaidField = document.getElementById(`${prefix}amountPaid`);
        if (amountPaidField && amountPaidField.value > total) {
            amountPaidField.value = total;
            const wordsEl = document.getElementById(`${prefix}paidWords`);
            if (wordsEl) wordsEl.textContent = numberToWords(parseInt(total) || 0);
        }
    },

    async saveBooking(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('hallForm'))) return;
        const startD = document.getElementById('hb_date').value;
        const startT = document.getElementById('hb_time').value;
        const endD = document.getElementById('hb_end').value;
        const endT = document.getElementById('hb_endTime').value;

        // Date and Time Validation
        const selectedDateTime = new Date(`${startD}T${startT || '00:00'}`);
        const currentDT = new Date();
        if (selectedDateTime < currentDT) {
            App.showToast('Past dates and times are not allowed for this activity.', 'error');
            return;
        }

        const hallName = document.getElementById('hb_hall').value;
        const hallInfo = this.halls.find(h => h.name === hallName);
        if (!hallInfo) return;

        // Use pre-calculated values
        const calcAmountInput = document.getElementById('hb_calculatedAmount');
        const calcDiscInput = document.getElementById('hb_calculatedDiscount');
        const amount = calcAmountInput ? parseFloat(calcAmountInput.value) : 10000;
        const discountAmount = calcDiscInput ? parseFloat(calcDiscInput.value) : 0;

        const payType = document.querySelector('input[name="hb_paytype"]:checked')?.value || 'full';
        const amountPaid = payType === 'partial' ? (parseInt(document.getElementById('hb_amountPaid').value) || 0) : amount;
        
        const payload = {
            hall_id: hallInfo.id,
            hall_name: hallName,
            customer_name: document.getElementById('hb_cust').value,
            address: document.getElementById('hb_address').value,
            phone: document.getElementById('hb_phone').value,
            date: startD,
            start_time: startT,
            end_date: endD,
            end_time: endT,
            purpose: document.getElementById('hb_purpose').value,
            amount,
            discount_amount: discountAmount,
            payment_type: payType,
            amount_paid: amountPaid,
            remarks: document.getElementById('hb_remarks')?.value || '',
            booking_mode: document.getElementById('hb_bookingMode')?.value || 'Counter',
            payment_mode: document.getElementById('hb_paymentMode')?.value || 'Cash'
        };

        try {
            await apiRequest('/api/v1/hall-bookings/', 'POST', payload);
            App.closeModal();
            App.showToast(`Booking created!`, 'success');
            this._dataLoaded = false;
            App.navigateTo('hall-booking');
        } catch (error) {
            console.error("Booking error", error);
            App.showToast(error.detail || "Failed to create booking", 'error');
        }
    },

    viewBooking(id) {
        const b = this.bookings.find(x => x.id === id);
        if (!b) return;
        const remaining = b.amount - (b.amount_paid || b.amountPaid || 0);

        // Calculate simple string duration to show in view
        let durStr = '';
        if (b.date && (b.end_date || b.endDate)) {
            const stdt = new Date(`${b.date}T${b.start_time || b.startTime || '00:00'}`);
            const eddt = new Date(`${b.end_date || b.endDate}T${b.end_time || b.endTime || '23:59'}`);
            let m = Math.floor((eddt - stdt) / 60000);
            const dP = Math.floor(m / 1440); m %= 1440;
            const hP = Math.floor(m / 60); m %= 60;
            let p = [];
            if (dP > 0) p.push(`${dP} days`);
            if (hP > 0) p.push(`${hP} hrs`);
            if (m > 0) p.push(`${m} mins`);
            durStr = p.join(' ');
        }

        const hallName = this.halls.find(h => h.id === b.hall_id)?.name || b.hall || 'Unknown';
        const displayId = b.ref_number || b.id.substring(0, 8);

        App.viewDetail(`Booking ${displayId}`, [
            ['Hall', hallName], ['Customer', b.customer_name || b.customer],
            ['Address', b.address || '—'],
            ['Phone', b.phone],
            ['Dates & Time', `${b.date} ${b.start_time || b.startTime || ''} to ${b.end_date || b.endDate} ${b.end_time || b.endTime || ''}`],
            ['Duration', durStr || '—'],
            ['Purpose', b.purpose],
            ['Total Payable (After Disc)', `<strong>₹${(b.amount || 0).toLocaleString()}</strong>`],
            ['Discount Applied', `₹${((b.discount_amount !== undefined ? b.discount_amount : b.discountAmount) || 0).toLocaleString()}`],
            ['In Words', numberToWords(b.amount)],
            ['Payment Type', b.payment_type || b.paymentType || 'full'],
            ['Amount Paid', `₹${((b.amount_paid !== undefined ? b.amount_paid : b.amountPaid) || 0).toLocaleString()}`],
            ['Balance Remaining', remaining > 0 ? `<strong style="color:var(--primary-red)">₹${remaining.toLocaleString()}</strong>` : '<span class="badge badge-success">Fully Paid</span>'],
            ['Booking Mode', b.booking_mode || b.bookingMode || '—'],
            ['Payment Mode', b.payment_mode || b.paymentMode || '—'],
            ['Remarks', b.remarks || 'None'],
            ['Created By', b.created_by || b.createdBy || 'Admin'],
            ['Status', `<span class="badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">${b.status}</span>`],
        ]);
    },

    editBooking(id) {
        const b = this.bookings.find(x => x.id === id);
        if (!b) return;
        const currentHallName = this.halls.find(h => h.id === b.hall_id)?.name || b.hall;
        const hallOpts = this.halls.map(h => `<option value="${h.name}" ${h.name === currentHallName ? 'selected' : ''}>${h.name} — ₹${h.price_per_day || h.pricePerDay.toLocaleString()}/day</option>`).join('');

        const dAmount = b.discount_amount !== undefined ? b.discount_amount : b.discountAmount || 0;
        const totalBaseAmt = (b.amount || 0) + (dAmount || 0);
        let discPctValue = "0";
        if (dAmount > 0 && totalBaseAmt > 0) {
            const pct = Math.round((dAmount / totalBaseAmt) * 100);
            if ([5, 10, 15, 20].includes(pct)) discPctValue = pct.toString();
            else discPctValue = "Custom";
        }
        
        const c_name = b.customer_name || b.customer || '';

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit Booking ${b.ref_number || b.id.substring(0,8)}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="hallEditForm" onsubmit="HallBookingModule.updateBooking(event,'${b.id}')">
                <div class="form-group"><label class="form-label">Hall / Venue *</label><select class="form-control" id="hbe_hall" required onchange="HallBookingModule.calcDuration('hbe_')">${hallOpts}</select></div>
                
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Customer Name *</label><input type="text" class="form-control" id="hbe_cust" value="${c_name}" required></div>
                    <div class="form-group"><label class="form-label">Phone *</label><input type="tel" class="form-control" id="hbe_phone" value="${b.phone || ''}" required></div>
                </div>
                <!-- Address Field -->
                <div class="form-group"><label class="form-label">Customer Address *</label><input type="text" class="form-control" id="hbe_address" value="${b.address || ''}" required placeholder="Full Address"></div>

                <div class="form-row" style="gap:10px">
                    <div class="form-group"><label class="form-label">Start Date & Time *</label><div style="display:flex;gap:4px"><input type="date" class="form-control" id="hbe_date" value="${b.date}" required onchange="HallBookingModule.calcDuration('hbe_')"><input type="time" class="form-control" id="hbe_time" value="${b.start_time || b.startTime || '09:00'}" required onchange="HallBookingModule.calcDuration('hbe_')"></div></div>
                    <div class="form-group"><label class="form-label">End Date & Time *</label><div style="display:flex;gap:4px"><input type="date" class="form-control" id="hbe_end" value="${b.endDate || b.date}" required onchange="HallBookingModule.calcDuration('hbe_')"><input type="time" class="form-control" id="hbe_endTime" value="${b.endTime || '18:00'}" required onchange="HallBookingModule.calcDuration('hbe_')"></div></div>
                </div>
                
                <div class="form-group"><label class="form-label">Booking Purpose *</label><input type="text" class="form-control" id="hbe_purpose" value="${b.purpose}" required></div>

                <!-- Discount -->
                <div class="form-row" style="align-items:flex-end">
                    <div class="form-group" style="margin-bottom:0"><label class="form-label">Discount</label>
                        <select class="form-control" id="hbe_discountType" onchange="const c=document.getElementById('hbe_customDiscount'); if(this.value==='Custom') { c.style.display='block'; c.focus(); } else { c.style.display='none'; } HallBookingModule.calcDuration('hbe_');">
                            <option value="0" ${discPctValue === "0" ? 'selected' : ''}>None</option>
                            <option value="5" ${discPctValue === "5" ? 'selected' : ''}>5%</option>
                            <option value="10" ${discPctValue === "10" ? 'selected' : ''}>10%</option>
                            <option value="15" ${discPctValue === "15" ? 'selected' : ''}>15%</option>
                            <option value="20" ${discPctValue === "20" ? 'selected' : ''}>20%</option>
                            <option value="Custom" ${discPctValue === "Custom" ? 'selected' : ''}>Custom Percentage</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                        <input type="number" class="form-control" id="hbe_customDiscount" placeholder="Enter %" min="0" max="100" style="display:${discPctValue === 'Custom' ? 'block' : 'none'}" value="${discPctValue === 'Custom' ? Math.round((b.discountAmount / totalBaseAmt) * 100) : ''}" oninput="HallBookingModule.calcDuration('hbe_')">
                    </div>
                </div>

                <!-- Live Calculation Display -->
                <div id="hbe_duration_display" style="margin: 15px 0; padding:12px; background:#f8f9fc; border-radius:8px; border:1px solid #e8e8f0; display:none;"></div>

                <!-- Payment Type -->
                <div class="form-group">
                    <label class="form-label">Payment Type</label>
                    <div class="payment-radio-group">
                        <label><input type="radio" name="hbe_paytype" value="full" ${b.paymentType !== 'partial' ? 'checked' : ''} onchange="document.getElementById('hbe_paidGroup').style.display='none'"> Full Payment</label>
                        <label><input type="radio" name="hbe_paytype" value="partial" ${b.paymentType === 'partial' ? 'checked' : ''} onchange="document.getElementById('hbe_paidGroup').style.display=''"> Partial Payment</label>
                    </div>
                </div>
                <div class="form-group" id="hbe_paidGroup" style="display:${b.paymentType === 'partial' ? 'block' : 'none'}">
                    <label class="form-label">Amount Paid (₹)</label>
                    <input type="number" class="form-control" id="hbe_paid" value="${b.amountPaid || 0}" min="0" oninput="document.getElementById('hbe_paidWords').textContent=numberToWords(parseInt(this.value))">
                    <div class="amount-words" id="hbe_paidWords">${numberToWords(b.amountPaid || 0)}</div>
                </div>

                <!-- Payment Collection Mode -->
                <div class="form-group"><label class="form-label">Payment Collection Mode</label><select class="form-control" id="hbe_paymentMode"><option ${b.paymentMode === 'Cash' ? 'selected' : ''}>Cash</option><option ${b.paymentMode === 'UPI' ? 'selected' : ''}>UPI</option><option ${b.paymentMode === 'Online Booking' ? 'selected' : ''}>Online Booking</option><option ${b.paymentMode === 'Offline' ? 'selected' : ''}>Offline</option></select></div>

                <!-- Booking Mode -->
                <div class="form-group"><label class="form-label">Booking Mode</label><select class="form-control" id="hbe_bookingMode"><option ${b.bookingMode === 'Counter' ? 'selected' : ''}>Counter</option><option ${b.bookingMode === 'Online' ? 'selected' : ''}>Online</option><option ${b.bookingMode === 'Phone' ? 'selected' : ''}>Phone</option><option ${b.bookingMode === 'Other' ? 'selected' : ''}>Other</option><option ${b.bookingMode === 'Offline' ? 'selected' : ''}>Offline</option></select></div>

                <!-- Remarks -->
                <div class="form-group"><label class="form-label">Remarks <small style="color:var(--text-muted)">(optional)</small></label><textarea class="form-control" id="hbe_remarks">${b.remarks || ''}</textarea></div>

                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update Booking</button></div>
            </form>
        `);
        // Trigger initial calculation
        setTimeout(() => HallBookingModule.calcDuration('hbe_'), 100);
    },

    async updateBooking(e, id) {
        e.preventDefault();
        const b = this.bookings.find(x => x.id === id);
        if (b) {
            const newStartD = document.getElementById('hbe_date').value;
            const newStartT = document.getElementById('hbe_time').value;

            // Date and Time Validation
            const selectedDateTime = new Date(`${newStartD}T${newStartT || '00:00'}`);
            const currentDT = new Date();
            // Allow update of past bookings if they are already in the past, otherwise warn.
            // Simplified: remove past date check for edits to allow correcting historical records, or keep if required.

            const newStartDT = new Date(`${newStartD}T${document.getElementById('hbe_time').value}`);
            const newEndDT = new Date(`${document.getElementById('hbe_end').value}T${document.getElementById('hbe_endTime').value}`);
            if (newEndDT <= newStartDT) { App.showToast('End Date/Time must be strictly after Start Date/Time', 'error'); return; }

            const hallName = document.getElementById('hbe_hall').value;
            const hallInfo = this.halls.find(h => h.name === hallName);

            const calcAmountInput = document.getElementById('hbe_calculatedAmount');
            const calcDiscInput = document.getElementById('hbe_calculatedDiscount');
            const newAmount = calcAmountInput ? parseFloat(calcAmountInput.value) : b.amount;
            const newDisc = calcDiscInput ? parseFloat(calcDiscInput.value) : (b.discount_amount || 0);

            const payType = document.querySelector('input[name="hbe_paytype"]:checked')?.value || 'full';
            const amountPaid = payType === 'partial' ? (parseInt(document.getElementById('hbe_paid').value) || 0) : newAmount;

            const payload = {
                hall_id: hallInfo ? hallInfo.id : b.hall_id,
                hall_name: hallName,
                customer_name: document.getElementById('hbe_cust').value,
                address: document.getElementById('hbe_address').value,
                phone: document.getElementById('hbe_phone').value,
                date: newStartD,
                start_time: newStartT,
                end_date: document.getElementById('hbe_end').value,
                end_time: document.getElementById('hbe_endTime').value,
                purpose: document.getElementById('hbe_purpose').value,
                amount: newAmount,
                discount_amount: newDisc,
                payment_type: payType,
                amount_paid: amountPaid,
                payment_mode: document.getElementById('hbe_paymentMode')?.value || b.payment_mode,
                booking_mode: document.getElementById('hbe_bookingMode')?.value || b.booking_mode,
                remarks: document.getElementById('hbe_remarks').value
            };

            try {
                await apiRequest(`/api/v1/hall-bookings/${id}`, 'PUT', payload);
                App.closeModal();
                App.showToast('Booking updated!', 'success');
                this._dataLoaded = false;
                App.navigateTo('hall-booking');
            } catch (error) {
                console.error("Booking update error", error);
                App.showToast(error.detail || "Failed to update booking", 'error');
            }
        }
    },

    async approve(id) {
        try {
            await apiRequest(`/api/v1/hall-bookings/${id}/status`, 'PUT', { status: 'confirmed' });
            App.showToast(`Booking approved!`, 'success');
            this._dataLoaded = false;
            App.navigateTo('hall-booking');
        } catch (error) {
            console.error("Booking approve error", error);
            App.showToast(error.detail || "Failed to approve booking", 'error');
        }
    },

    async cancelBooking(id) {
        try {
            await apiRequest(`/api/v1/hall-bookings/${id}/status`, 'PUT', { status: 'cancelled' });
            App.showToast(`Booking cancelled`, 'warning');
            this._dataLoaded = false;
            App.navigateTo('hall-booking');
        } catch (error) {
            console.error("Booking cancel error", error);
            App.showToast(error.detail || "Failed to cancel booking", 'error');
        }
    },

    filterBookings(q) { q = q.toLowerCase(); document.querySelectorAll('#hbTable tbody tr').forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; }); }
};
