/* =====================
   INVENTORY MODULE v3
   Multi-item add, Suppliers management, remarks
   ===================== */
window.InventoryModule = {
    items: [],
    suppliers: [],
    invoices: [],
    itemRequests: [],

    currentTab: 'inventory',
    filters: {
        reqSearch: '', reqDateFrom: '', reqDateTo: '', reqTimeFrom: '', reqTimeTo: '',
        invSearch: '', invDateFrom: '', invDateTo: '', invTimeFrom: '', invTimeTo: ''
    },

    applyReqFilters() {
        const df = document.getElementById('req_df_inp').value;
        const dt = document.getElementById('req_dt_inp').value;
        const tf = document.getElementById('req_tf_inp').value;
        const tt = document.getElementById('req_tt_inp').value;

        if (df && dt && df > dt) {
            App.showToast('Error: "Date From" cannot be later than "Date To".', 'error');
            return;
        }
        if (tf && tt && tf > tt) {
            App.showToast('Error: "Time From" cannot be later than "Time To".', 'error');
            return;
        }

        this.filters.reqSearch = document.getElementById('req_search_inp').value;
        this.filters.reqDateFrom = df;
        this.filters.reqDateTo = dt;
        this.filters.reqTimeFrom = tf;
        this.filters.reqTimeTo = tt;
        App.navigateTo('inventory');
    },
    clearReqFilters() {
        this.filters.reqSearch = ''; this.filters.reqDateFrom = ''; this.filters.reqDateTo = '';
        this.filters.reqTimeFrom = ''; this.filters.reqTimeTo = '';
        App.navigateTo('inventory');
    },
    applyInvFilters() {
        const df = document.getElementById('inv_df_inp').value;
        const dt = document.getElementById('inv_dt_inp').value;
        const tf = document.getElementById('inv_tf_inp').value;
        const tt = document.getElementById('inv_tt_inp').value;

        if (df && dt && df > dt) {
            App.showToast('Error: "Date From" cannot be later than "Date To".', 'error');
            return;
        }
        if (tf && tt && tf > tt) {
            App.showToast('Error: "Time From" cannot be later than "Time To".', 'error');
            return;
        }

        this.filters.invSearch = document.getElementById('inv_search_inp').value;
        this.filters.invDateFrom = df;
        this.filters.invDateTo = dt;
        this.filters.invTimeFrom = tf;
        this.filters.invTimeTo = tt;
        App.navigateTo('inventory');
    },
    clearInvFilters() {
        this.filters.invSearch = ''; this.filters.invDateFrom = ''; this.filters.invDateTo = '';
        this.filters.invTimeFrom = ''; this.filters.invTimeTo = '';
        App.navigateTo('inventory');
    },

    render() {
        const ml = App.currentLang === 'ml';
        const lowStock = this.items.filter(i => i.qty < i.minStock);
        const totalValue = this.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-boxes-stacked"></i> ${ml ? 'ഇൻവെന്ററി' : 'Inventory Management'}</h1>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-boxes kpi-icon"></i><div class="kpi-label">Total Items</div><div class="kpi-value">${this.items.length}</div><div class="kpi-sub">Tracked</div></div>
            <div class="kpi-card" style="background:var(--grad-red)"><i class="fas fa-exclamation-triangle kpi-icon"></i><div class="kpi-label">Low Stock</div><div class="kpi-value">${lowStock.length}</div><div class="kpi-sub">Below threshold</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-rupee-sign kpi-icon"></i><div class="kpi-label">Inventory Value</div><div class="kpi-value">₹${totalValue.toLocaleString()}</div><div class="kpi-sub">Total</div></div>
            <div class="kpi-card" style="background:var(--grad-purple)"><i class="fas fa-truck kpi-icon"></i><div class="kpi-label">Suppliers</div><div class="kpi-value">${this.suppliers.length}</div><div class="kpi-sub">Active</div></div>
        </div>

        ${lowStock.length ? `<div class="section-card compact" style="border-left:4px solid var(--primary-red)">
            <div class="section-header"><div class="section-title" style="color:var(--primary-red)"><i class="fas fa-exclamation-triangle"></i> Low Stock Alerts</div></div>
            ${lowStock.map(i => `<div class="stat-row"><span class="stat-label"><strong>${i.name}</strong> — ${i.qty} left (min: ${i.minStock})</span><span class="stat-value"><span class="badge badge-danger">Low</span></span></div>`).join('')}
        </div>` : ''}

        <div class="tabs-bar" style="margin-bottom: 20px;">
            <button class="tab-btn ${this.currentTab === 'inventory' ? 'active' : ''}" onclick="InventoryModule.switchTab('inventory')">Temple Kalavara</button>
            <button class="tab-btn ${this.currentTab === 'supplies' ? 'active' : ''}" onclick="InventoryModule.switchTab('supplies')">Kalavara Supplies Management</button>
        </div>

        ${this.currentTab === 'inventory' ? this.renderInventoryTab(ml) : this.renderSuppliesTab(ml)}
        `;
    },

    switchTab(tab) {
        this.currentTab = tab;
        App.navigateTo('inventory');
    },

    renderInventoryTab(ml) {
        let reqs = [...this.itemRequests].reverse().filter(r => {
            if (this.filters.reqSearch && !JSON.stringify(r).toLowerCase().includes(this.filters.reqSearch.toLowerCase())) return false;
            if (this.filters.reqDateFrom || this.filters.reqDateTo || this.filters.reqTimeFrom || this.filters.reqTimeTo) {
                const [d, t] = r.date.split('T');
                if (this.filters.reqDateFrom && d < this.filters.reqDateFrom) return false;
                if (this.filters.reqDateTo && d > this.filters.reqDateTo) return false;
                if (this.filters.reqTimeFrom && t < this.filters.reqTimeFrom) return false;
                if (this.filters.reqTimeTo && t > this.filters.reqTimeTo) return false;
            }
            return true;
        });

        return `
        <!-- All Items -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-list"></i> All Items</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" style="background:var(--primary-teal);border-color:var(--primary-teal)" onclick="InventoryModule.openItemRequestModal()"><i class="fas fa-hand-holding-hand"></i> New Item Request</button>
                    <button class="btn btn-primary btn-sm" onclick="InventoryModule.addItem()"><i class="fas fa-plus"></i> Add Items</button>
                </div>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="invTable"><thead><tr><th>Sl. No.</th><th>Item</th><th>Category</th><th>Qty</th><th>Unit ₹</th><th>Status</th><th>Supplier</th><th>Actions</th></tr></thead><tbody>
                ${this.items.map((i, idx) => `<tr id="record-${i.id}">
                    <td><strong>${idx + 1}</strong></td><td>${i.name}</td><td><span class="badge badge-info">${i.category}</span></td>
                    <td>${i.qty}</td><td>₹${i.unitPrice}</td>
                    <td><span class="badge ${i.qty < i.minStock ? 'badge-danger' : 'badge-success'}">${i.qty < i.minStock ? 'Low' : 'OK'}</span></td>
                    <td><small>${i.supplier}</small></td>
                    <td><button class="btn btn-sm btn-outline" title="View Item Details" onclick="InventoryModule.viewItem('${i.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        <!-- Item Request History -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-clipboard-list"></i> Item Request History</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-outline btn-sm" onclick="InventoryModule.openReturnItemsModal()"><i class="fas fa-undo"></i> Return Items</button>
                    <button class="btn btn-primary btn-sm" style="background:var(--primary-teal);border-color:var(--primary-teal)" onclick="InventoryModule.openItemRequestModal()"><i class="fas fa-hand-holding-hand"></i> New Item Request</button>
                </div>
            </div>
            <div class="log-filter-grid" style="margin-bottom:15px; background:transparent; padding:0; border:none; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <input type="text" id="req_search_inp" class="search-input form-control" placeholder="Search requests..." value="${this.filters.reqSearch}" onkeyup="if(event.key==='Enter') document.getElementById('req_apply_btn').click()" style="flex:1; min-width:200px;">
                
                <div class="range-picker-group">
                    <input type="date" class="hide-icon" id="req_df_inp" title="Date From" value="${this.filters.reqDateFrom}" onclick="try{this.showPicker()}catch(e){}">
                    <span class="range-picker-separator">to</span>
                    <input type="date" title="Date To" id="req_dt_inp" value="${this.filters.reqDateTo}" onclick="try{this.showPicker()}catch(e){}">
                </div>

                <div class="range-picker-group">
                    <input type="time" class="hide-icon" id="req_tf_inp" title="Time From" value="${this.filters.reqTimeFrom}" onclick="try{this.showPicker()}catch(e){}">
                    <span class="range-picker-separator">to</span>
                    <input type="time" title="Time To" id="req_tt_inp" value="${this.filters.reqTimeTo}" onclick="try{this.showPicker()}catch(e){}">
                </div>

                <button id="req_apply_btn" class="btn btn-sm btn-primary" onclick="InventoryModule.applyReqFilters()">Apply Filters</button>
                <button class="btn btn-sm btn-outline" onclick="InventoryModule.clearReqFilters()" title="Clear Filters"><i class="fas fa-undo"></i></button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="reqTable"><thead><tr><th>Ref ID</th><th>Date & Time</th><th>Requester & Role</th><th>Dept / Purpose</th><th>Items Requested</th><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                ${reqs.length ? reqs.map(r => `<tr>
                    <td><strong>${r.id}</strong></td><td>${r.date.replace('T', ' ')}</td><td>${r.requester}<br><small style="color:var(--text-muted)">${r.role || '—'}</small></td><td>${r.department}</td>
                    <td><small>${r.itemsSummary}</small></td>
                    <td><i class="fas fa-user-circle"></i> <small>${r.createdBy || 'Admin'}</small></td>
                    <td><span class="badge badge-success">Completed</span></td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-sm btn-edit" title="Edit Request" onclick="InventoryModule.editItemRequest('${r.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline" title="View Request" onclick="InventoryModule.viewItemRequest('${r.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>`).join('') : `<tr><td colspan="8" style="text-align:center">No requests found matching criteria</td></tr>`}
            </tbody></table>
            </div>
        </div>`;
    },

    renderSuppliesTab(ml) {
        let invs = [...this.invoices].reverse().filter(inv => {
            if (this.filters.invSearch && !JSON.stringify(inv).toLowerCase().includes(this.filters.invSearch.toLowerCase())) return false;
            if (this.filters.invDateFrom || this.filters.invDateTo || this.filters.invTimeFrom || this.filters.invTimeTo) {
                // Invoices currently only have 'date' (YYYY-MM-DD), no time. We will support time fallback safely.
                const d = inv.date;
                const t = inv.time || '00:00';
                if (this.filters.invDateFrom && d < this.filters.invDateFrom) return false;
                if (this.filters.invDateTo && d > this.filters.invDateTo) return false;
                if (this.filters.invTimeFrom && t < this.filters.invTimeFrom) return false;
                if (this.filters.invTimeTo && t > this.filters.invTimeTo) return false;
            }
            return true;
        });

        return `
        <!-- Suppliers Management -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-truck"></i> ${ml ? 'വിതരണക്കാർ' : 'Suppliers Management'}</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" onclick="InventoryModule.addSupplier()"><i class="fas fa-plus"></i> Add Supplier</button>
                    <button class="btn btn-success btn-sm" onclick="InventoryModule.openInvoiceModal()"><i class="fas fa-file-invoice"></i> Purchase Invoice</button>
                </div>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="supTable"><thead><tr><th>Supplier ID</th><th>Supplier</th><th>Contact</th><th>Items Supplied</th><th>Last Delivery</th><th>Remarks</th><th>Actions</th></tr></thead><tbody>
                ${this.suppliers.map(s => `<tr>
                    <td><strong>${s.id}</strong></td><td>${s.name}</td><td>${s.contact}${s.email ? `<br><small>${s.email}</small>` : ''}</td>
                    <td><small>${s.items}</small></td><td>${s.lastDelivery}</td>
                    <td><small style="color:var(--text-muted)">${s.remarks}</small></td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-sm btn-edit" title="Edit Supplier" onclick="InventoryModule.editSupplier('${s.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline" title="View Items Supplied" onclick="InventoryModule.viewSupplierItems('${s.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        <!-- All Invoices -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-file-invoice-dollar"></i> All Invoices</div>
            </div>
             <div class="log-filter-grid" style="margin-bottom:15px; background:transparent; padding:0; border:none; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <input type="text" id="inv_search_inp" class="search-input form-control" placeholder="Search invoices..." value="${this.filters.invSearch}" onkeyup="if(event.key==='Enter') document.getElementById('inv_apply_btn').click()" style="flex:1; min-width:200px;">
                
                <div class="range-picker-group">
                    <input type="date" class="hide-icon" id="inv_df_inp" title="Date From" value="${this.filters.invDateFrom}" onclick="try{this.showPicker()}catch(e){}">
                    <span class="range-picker-separator">to</span>
                    <input type="date" title="Date To" id="inv_dt_inp" value="${this.filters.invDateTo}" onclick="try{this.showPicker()}catch(e){}">
                </div>

                <div class="range-picker-group">
                    <input type="time" class="hide-icon" id="inv_tf_inp" title="Time From" value="${this.filters.invTimeFrom}" onclick="try{this.showPicker()}catch(e){}">
                    <span class="range-picker-separator">to</span>
                    <input type="time" title="Time To" id="inv_tt_inp" value="${this.filters.invTimeTo}" onclick="try{this.showPicker()}catch(e){}">
                </div>

                <button id="inv_apply_btn" class="btn btn-sm btn-primary" onclick="InventoryModule.applyInvFilters()">Apply Filters</button>
                <button class="btn btn-sm btn-outline" onclick="InventoryModule.clearInvFilters()" title="Clear Filters"><i class="fas fa-undo"></i></button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="invHistTable"><thead><tr><th>Invoice Ref ID</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total Amount</th><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                ${invs.length ? invs.map(inv => `<tr>
                    <td><strong>${inv.id}</strong></td><td>${inv.date}</td><td><strong>${inv.supplier}</strong></td>
                    <td><small>${inv.itemsSummary}</small></td>
                    <td><strong style="color:var(--primary-blue)">₹${inv.amount.toLocaleString()}</strong></td>
                    <td><i class="fas fa-user-circle"></i> <small>${inv.createdBy || 'Admin'}</small></td>
                    <td><span class="badge ${inv.status === 'Completed' ? 'badge-teal' : 'badge-warning'}">${inv.status}</span></td>
                    <td><button class="btn btn-sm btn-outline" title="View Invoice" onclick="InventoryModule.viewInvoice('${inv.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>`).join('') : `<tr><td colspan="8" style="text-align:center">No invoices found matching criteria</td></tr>`}
            </tbody></table>
            </div>
        </div>`;
    },

    // Multi-item add
    addItem() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Add Inventory Items</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="addItemForm" onsubmit="InventoryModule.saveItems(event)">
                <div id="itemRows">
                    ${this.renderItemRow(0)}
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="InventoryModule.addItemRow()" style="margin:10px 0"><i class="fas fa-plus"></i> Add Another Item</button>
                <div class="form-group"><label class="form-label">Remarks <small style="color:var(--text-muted)">(optional)</small></label><textarea class="form-control" id="item_remarks_global" placeholder="Notes..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save All</button></div>
            </form>
        `);
    },

    renderItemRow(idx) {
        const supOpts = this.suppliers.map(s => `<option>${s.name}</option>`).join('');
        return `<div class="item-add-row" style="border:1px solid #eef0f5;border-radius:10px;padding:14px;margin-bottom:10px;position:relative">
            <button type="button" onclick="this.parentElement.remove()" style="position:absolute;top:6px;right:6px;background:none;color:var(--primary-red);font-size:0.9rem;cursor:pointer"><i class="fas fa-times"></i></button>
            <div class="form-row-3">
                <div class="form-group"><label class="form-label" style="font-size:0.72rem">Item Name *</label><input type="text" class="form-control item-name" required></div>
                <div class="form-group"><label class="form-label" style="font-size:0.72rem">Category</label><select class="form-control item-cat"><option>Puja</option><option>Kitchen</option><option>Electrical</option><option>Maintenance</option><option>Other</option></select></div>
                <div class="form-group"><label class="form-label" style="font-size:0.72rem">Qty *</label><input type="number" class="form-control item-qty" required min="0"></div>
            </div>
            <div class="form-row-3">
                <div class="form-group"><label class="form-label" style="font-size:0.72rem">Min Stock</label><input type="number" class="form-control item-min" value="10"></div>
                <div class="form-group"><label class="form-label" style="font-size:0.72rem">Unit</label><select class="form-control item-unit"><option>piece</option><option>kg</option><option>liter</option><option>box</option><option>pack</option></select></div>
                <div class="form-group"><label class="form-label" style="font-size:0.72rem">Unit Price (₹)</label><input type="number" class="form-control item-price" min="0"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:2"><label class="form-label" style="font-size:0.72rem">Supplier</label><select class="form-control item-supplier">${supOpts}<option>Other</option></select></div>
                <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Mode of Purchase</label><select class="form-control item-mode"><option>Local</option><option>Imported</option><option>Wholesale</option><option>Retail</option><option>Contract</option></select></div>
            </div>
        </div>`;
    },

    addItemRow() {
        const container = document.getElementById('itemRows');
        const div = document.createElement('div');
        div.innerHTML = this.renderItemRow(container.children.length);
        container.appendChild(div.firstElementChild);
    },

    saveItems(e) {
        e.preventDefault();
        const rows = document.querySelectorAll('.item-add-row');
        let added = 0;
        rows.forEach(row => {
            const name = row.querySelector('.item-name')?.value?.trim();
            if (!name) return;
            this.items.push({
                id: RefNumberGenerator.generateSequential('INV', this.items, 3),
                name, category: row.querySelector('.item-cat')?.value || 'Other',
                unit: row.querySelector('.item-unit')?.value || 'piece',
                qty: parseInt(row.querySelector('.item-qty')?.value) || 0,
                minStock: parseInt(row.querySelector('.item-min')?.value) || 10,
                unitPrice: parseInt(row.querySelector('.item-price')?.value) || 0,
                supplier: row.querySelector('.item-supplier')?.value || '',
                purchaseMode: row.querySelector('.item-mode')?.value || 'Local',
                remarks: document.getElementById('item_remarks_global')?.value || '',
                invoiceRefs: []
            });
            added++;
        });
        if (added === 0) { App.showToast('Add at least one item', 'error'); return; }
        AuditLog.add('Create', 'Inventory', `Added ${added} items`);
        App.closeModal(); App.showToast(`${added} item(s) added!`, 'success'); App.navigateTo('inventory');
    },

    openInvoiceModal() {
        const now = new Date();
        const mmyy = String(now.getMonth() + 1).padStart(2, '0') + String(now.getFullYear()).slice(-2);

        // Find highest existing invoice number of form InvXXX/MMYY
        let maxId = 0;
        this.invoices.forEach(inv => {
            if (inv.id.startsWith('Inv') && inv.id.endsWith(`/${mmyy}`)) {
                const numStr = inv.id.replace('Inv', '').split('/')[0];
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
        const autoInv = 'Inv' + String(maxId + 1).padStart(3, '0') + '/' + mmyy;

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Purchase Invoice</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="invoiceForm" onsubmit="InventoryModule.saveInvoice(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Invoice Ref ID *</label><input type="text" class="form-control" id="inv_no" value="${autoInv}" readonly style="background:#f0f2f5;font-weight:700"></div>
                    <div class="form-group"><label class="form-label">Mode of Order</label><select class="form-control" id="inv_order_mode"><option>Phone</option><option>Email</option><option>Direct</option><option>Offline</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Mode of Payment</label><select class="form-control" id="inv_pay_mode"><option>Cash</option><option>Cheque</option><option>UPI</option><option>Online</option><option>Offline</option></select></div>
                    <div class="form-group"><label class="form-label">Remarks</label><input type="text" class="form-control" id="inv_remarks" placeholder="Notes..."></div>
                </div>
                
                <h4 style="margin:16px 0 8px;font-size:0.9rem;border-bottom:1px solid #e0e0e0;padding-bottom:4px">Invoice Items</h4>
                <div id="invoiceLines">
                    ${this.renderInvoiceLine()}
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="InventoryModule.addInvoiceLine()" style="margin-bottom:14px"><i class="fas fa-plus"></i> Add Another Item</button>
                
                <div style="background:#f8f9fc;padding:12px;border-radius:8px;text-align:right;margin-bottom:16px">
                    <div style="font-size:1.1rem;font-weight:700">Estimated Grand Total: <span style="font-size:1.4rem;color:var(--primary-blue)">₹<span id="inv_grand_total">0</span></span></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary" id="inv_submit_btn" disabled>Confirm & Stock Invoice</button></div>
            </form>
        `);
        setTimeout(() => this.calcInvoiceTotal(), 100);
    },

    renderInvoiceLine() {
        return `<div class="form-row invoice-line" style="margin-bottom:8px; align-items:flex-end">
            <div class="form-group" style="flex:2"><label class="form-label" style="font-size:0.72rem">Required Item *</label>
                <select class="form-control inv-item" required onchange="InventoryModule.onInvoiceItemChange(this)">
                    <option value="">Select Item...</option>
                    ${this.items.map(i => `<option value="${i.id}" data-price="${i.unitPrice}" data-supplier="${i.supplier}">${i.name} (₹${i.unitPrice}/${i.unit})</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="flex:2"><label class="form-label" style="font-size:0.72rem">Supplier Name</label>
                <select class="form-control inv-supplier" disabled style="background:#f8f9fc; color:var(--primary-blue); font-weight:600"><option value="">Awaiting item...</option></select>
            </div>
            <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Amount (₹)</label><input type="number" class="form-control inv-price" readonly value="0" style="background:#f0f2f5;"></div>
            <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Qty</label><input type="number" class="form-control inv-qty" min="1" value="1" oninput="InventoryModule.calcInvoiceTotal()"></div>
            <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Total (₹)</label><input type="text" class="form-control inv-line-total" value="0" readonly style="background:#e8effa;font-weight:bold;cursor:not-allowed;color:var(--text-primary)"></div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove();InventoryModule.calcInvoiceTotal()" style="margin-bottom:4px"><i class="fas fa-times"></i></button>
        </div>`;
    },

    addInvoiceLine() {
        const container = document.getElementById('invoiceLines');
        const div = document.createElement('div');
        div.innerHTML = this.renderInvoiceLine();
        container.appendChild(div.firstElementChild);
    },

    onInvoiceItemChange(sel) {
        const opt = sel.options[sel.selectedIndex];
        const line = sel.closest('.invoice-line');
        const supSel = line.querySelector('.inv-supplier');
        const priceInput = line.querySelector('.inv-price');

        if (opt.value) {
            supSel.innerHTML = `<option value="${opt.dataset.supplier}">${opt.dataset.supplier || 'No Linked Supplier'}</option>`;
            priceInput.value = opt.dataset.price || 0;
        } else {
            supSel.innerHTML = '<option value="">Awaiting item...</option>';
            priceInput.value = 0;
        }
        this.calcInvoiceTotal();
    },

    calcInvoiceTotal() {
        const lines = document.querySelectorAll('.invoice-line');
        let grandTotal = 0;
        let valid = false;
        lines.forEach(line => {
            const sel = line.querySelector('.inv-item');
            if (sel && sel.value) {
                valid = true;
                const price = parseFloat(line.querySelector('.inv-price').value) || 0;
                const qty = parseInt(line.querySelector('.inv-qty').value) || 0;
                const lineTotal = price * qty;
                line.querySelector('.inv-line-total').value = lineTotal;
                grandTotal += lineTotal;
            }
        });
        const gtEl = document.getElementById('inv_grand_total');
        if (gtEl) gtEl.textContent = grandTotal.toLocaleString();
        const btn = document.getElementById('inv_submit_btn');
        if (btn) btn.disabled = !valid || grandTotal <= 0;
    },

    saveInvoice(e) {
        e.preventDefault();
        let updated = 0;
        const invNo = document.getElementById('inv_no').value;
        const lines = document.querySelectorAll('.invoice-line');
        let grandTotal = 0;
        const processedItems = [];
        let mainSupplier = '';

        lines.forEach(line => {
            const sel = line.querySelector('.inv-item');
            if (sel && sel.value) {
                const qty = parseInt(line.querySelector('.inv-qty').value) || 0;
                const price = parseFloat(line.querySelector('.inv-price').value) || 0;
                const item = this.items.find(i => i.id === sel.value);

                if (item && qty > 0) {
                    item.qty += qty;
                    if (!item.invoiceRefs) item.invoiceRefs = [];
                    item.invoiceRefs.push(invNo); // Link invoice ref to the item!

                    // Update supplier last delivery dynamically
                    const supplierObj = this.suppliers.find(s => s.name === item.supplier);
                    if (supplierObj) supplierObj.lastDelivery = new Date().toISOString().split('T')[0];
                    if (!mainSupplier) mainSupplier = item.supplier;

                    processedItems.push(`${item.name} (x${qty} ${item.unit}s)`);
                    grandTotal += (price * qty);
                    updated++;
                }
            }
        });

        // Save into All Invoices history
        this.invoices.push({
            id: invNo,
            date: new Date().toISOString().split('T')[0],
            supplier: mainSupplier || 'Multiple/Other',
            amount: grandTotal,
            orderMode: document.getElementById('inv_order_mode').value,
            payMode: document.getElementById('inv_pay_mode').value,
            remarks: document.getElementById('inv_remarks').value,
            itemsSummary: processedItems.join(', '),
            status: 'Completed',
            createdBy: App.currentUser
        });

        AuditLog.add('Create', 'Inventory', `Processed Purchase Invoice ${invNo} for ${updated} items`);

        if (window.AccountingModule && grandTotal > 0) {
            AccountingModule.addTransaction('expense', 'Purchase Invoice', `Stock Refill: ${mainSupplier || 'Multiple/Other'}`, grandTotal, invNo);
        }

        App.closeModal(); App.showToast('Purchase Invoice saved — stock updated!', 'success'); App.navigateTo('inventory');
    },

    viewItem(id) {
        const i = this.items.find(x => x.id === id);
        if (!i) return;
        App.viewDetail(`Item: ${i.name}`, [
            ['ID', i.id], ['Category', i.category], ['Quantity', `${i.qty} ${i.unit}s`],
            ['Min Stock', `${i.minStock} ${i.unit}s`], ['Unit Price', `₹${i.unitPrice} / ${i.unit}`],
            ['Total Value', `<strong style="color:var(--primary-blue)">₹${(i.qty * i.unitPrice).toLocaleString()}</strong>`],
            ['Supplier', `<strong style="color:var(--text-primary)">${i.supplier || '—'}</strong>`],
            ['Mode of Purchase', i.purchaseMode || '—'],
            ['Related Invoices', i.invoiceRefs && i.invoiceRefs.length ? i.invoiceRefs.join(', ') : 'None'],
            ['Remarks', i.remarks || '—'],
            ['Status', i.qty < i.minStock ? '<span class="badge badge-danger">Low Stock</span>' : '<span class="badge badge-success">OK</span>'],
        ]);
    },

    viewInvoice(id) {
        const inv = this.invoices.find(x => x.id === id);
        if (!inv) return;
        App.viewDetail(`Invoice: ${inv.id}`, [
            ['Invoice Ref ID', inv.id],
            ['Date', inv.date],
            ['Supplier', `<strong style="color:var(--text-primary)">${inv.supplier}</strong>`],
            ['Items Stocked', inv.itemsSummary],
            ['Total Amount', `<strong style="color:var(--primary-blue)">₹${inv.amount.toLocaleString()}</strong>`],
            ['Mode of Order', inv.orderMode],
            ['Mode of Payment', inv.payMode],
            ['Remarks', inv.remarks || 'None'],
            ['Created By', inv.createdBy || 'Admin'],
            ['Status', `<span class="badge ${inv.status === 'Completed' ? 'badge-teal' : 'badge-warning'}">${inv.status}</span>`],
        ]);
    },

    filterInvoices(q) {
        q = q.toLowerCase();
        document.querySelectorAll('#invHistTable tbody tr').forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    onRequesterChange(sel, targetRoleWrapperId, targetNameOtherId) {
        const val = sel.value;
        const nameOther = document.getElementById(targetNameOtherId);
        const roleWrapper = document.getElementById(targetRoleWrapperId);

        if (val === 'Other') {
            nameOther.style.display = 'block';
            roleWrapper.innerHTML = `<input type="text" class="form-control" id="${targetRoleWrapperId}_input" placeholder="Enter Role / Designation">`;
            return;
        }
        nameOther.style.display = 'none';
        if (!val) {
            roleWrapper.innerHTML = `<input type="text" class="form-control" id="${targetRoleWrapperId}_input" readonly placeholder="Auto-populated">`;
            return;
        }

        let emps = [];
        if (window.HRPayrollModule && window.HRPayrollModule.employees) {
            emps = window.HRPayrollModule.employees.filter(e => e.name === val);
        }

        if (emps.length === 0) {
            roleWrapper.innerHTML = `<input type="text" class="form-control" id="${targetRoleWrapperId}_input" placeholder="Unknown Role">`;
        } else if (emps.length === 1) {
            roleWrapper.innerHTML = `<input type="text" class="form-control" id="${targetRoleWrapperId}_input" value="${emps[0].role}" readonly>`;
        } else {
            let opts = emps.map(e => `<option value="${e.role}">${e.role} - ${e.dept} (${e.id})</option>`).join('');
            roleWrapper.innerHTML = `<select class="form-control" id="${targetRoleWrapperId}_input">${opts}</select>`;
        }
    },

    // Item Request Sub-module
    openItemRequestModal() {
        const autoReq = RefNumberGenerator.generateSequential('REQ', this.itemRequests, 3);
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const isoDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

        let depts = ['Puja', 'Admin', 'Operations', 'IT'];
        let reqNames = [];
        if (window.HRPayrollModule && window.HRPayrollModule.employees) {
            const uniqueDepts = [...new Set(window.HRPayrollModule.employees.map(e => e.dept).filter(Boolean))];
            if (uniqueDepts.length > 0) depts = uniqueDepts;
            reqNames = [...new Set(window.HRPayrollModule.employees.map(e => e.name).filter(Boolean))];
        }
        const deptOpts = depts.map(d => `<option value="${d}">${d}</option>`).join('');
        const reqNameOpts = reqNames.map(n => `<option value="${n}">${n}</option>`).join('');

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Item Request Form</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="requestForm" onsubmit="InventoryModule.saveItemRequest(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Request ID</label><input type="text" class="form-control" id="req_id" value="${autoReq}" readonly style="background:#f0f2f5;font-weight:700"></div>
                    <div class="form-group"><label class="form-label">Request Date & Time *</label><input type="datetime-local" class="form-control" id="req_date" value="${isoDateTime}" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Requester Name *</label>
                        <select class="form-control" id="req_name" required onchange="InventoryModule.onRequesterChange(this, 'req_role_wrapper', 'req_name_other')">
                            <option value="">Select Requester...</option>
                            ${reqNameOpts}
                            <option value="Other">Other</option>
                        </select>
                        <input type="text" class="form-control" id="req_name_other" placeholder="Enter requester name" style="display:none; margin-top:8px;">
                    </div>
                    <div class="form-group"><label class="form-label">Role</label>
                        <div id="req_role_wrapper">
                            <input type="text" class="form-control" id="req_role_wrapper_input" readonly placeholder="Auto-populated">
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex:1"><label class="form-label">Dept / Purpose *</label>
                        <select class="form-control" id="req_dept" onchange="document.getElementById('req_dept_other').style.display = this.value === 'Other' ? 'block' : 'none'" required>
                            <option value="">Select Dept...</option>
                            ${deptOpts}
                            <option value="Other">Other</option>
                        </select>
                        <input type="text" class="form-control" id="req_dept_other" placeholder="Enter department name" style="display:none; margin-top:8px;">
                    </div>
                </div>
                
                <h4 style="margin:16px 0 8px;font-size:0.9rem;border-bottom:1px solid #e0e0e0;padding-bottom:4px">Requested Items</h4>
                <div id="reqItemsContainer">
                    ${this.renderItemRequestRow()}
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="InventoryModule.addItemRequestRow('reqItemsContainer')" style="margin-bottom:14px"><i class="fas fa-plus"></i> Add Another Item</button>

                <div class="form-group"><label class="form-label">Remarks</label><input type="text" class="form-control" id="req_remarks" placeholder="Notes or urgency..."></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Submit Request</button></div>
            </form>
        `);
    },

    renderItemRequestRow(selectedId = '', selectedQty = 1) {
        return `<div class="form-row req-item-line" style="margin-bottom:8px; align-items:flex-end">
            <div class="form-group" style="flex:2"><label class="form-label" style="font-size:0.72rem">Required Item *</label>
                <select class="form-control req-item" required>
                    <option value="">Select Item...</option>
                    ${this.items.map(i => `<option value="${i.id}" ${i.id === selectedId ? 'selected' : ''}>${i.name} (Stock: ${i.qty} ${i.unit}s)</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Required Qty</label><input type="number" class="form-control req-qty" min="1" value="${selectedQty}"></div>
        </div>`;
    },

    addItemRequestRow(containerId = 'reqItemsContainer') {
        const container = document.getElementById(containerId);
        const div = document.createElement('div');
        div.innerHTML = this.renderItemRequestRow();
        container.appendChild(div.firstElementChild);
    },

    saveItemRequest(e) {
        e.preventDefault();

        const reqDateStr = document.getElementById('req_date').value;

        // Date and Time Validation
        const selectedDateTime = new Date(reqDateStr);
        const now = new Date();
        if (selectedDateTime < now) {
            App.showToast('Past dates and times are not allowed for this activity.', 'error');
            return;
        }

        let reqName = document.getElementById('req_name').value;
        if (reqName === 'Other') {
            reqName = document.getElementById('req_name_other').value.trim();
            if (!reqName) { App.showToast('Please specify the requester name', 'error'); return; }
        }
        const reqRole = document.getElementById('req_role_wrapper_input') ? document.getElementById('req_role_wrapper_input').value.trim() : '';

        let dept = document.getElementById('req_dept').value;
        if (dept === 'Other') {
            dept = document.getElementById('req_dept_other').value.trim();
            if (!dept) { App.showToast('Please specify the department', 'error'); return; }
        }

        const reqLines = document.querySelectorAll('.req-item-line');
        const summaryArr = [];
        const itemsData = [];
        let totalItems = 0;

        let hasError = false;
        reqLines.forEach(line => {
            const sel = line.querySelector('.req-item');
            if (sel && sel.value) {
                const qty = parseInt(line.querySelector('.req-qty').value) || 0;
                const item = this.items.find(i => i.id === sel.value);
                if (item && qty > 0) {
                    if (qty > item.qty) {
                        App.showToast(`Requested quantity for ${item.name} exceeds available stock (${item.qty} ${item.unit}s).`, 'error');
                        hasError = true;
                    }
                    summaryArr.push(`${item.name} (x${qty})`);
                    itemsData.push({ itemId: item.id, qty: qty });
                    totalItems++;
                }
            }
        });

        if (hasError) return;

        if (totalItems === 0) {
            App.showToast('Please request at least one item.', 'warning');
            return;
        }

        this.itemRequests.push({
            id: document.getElementById('req_id').value,
            date: document.getElementById('req_date').value,
            requester: reqName,
            role: reqRole,
            department: dept,
            itemsSummary: summaryArr.join(', '),
            itemsData: itemsData,
            remarks: document.getElementById('req_remarks').value,
            status: 'Request Completed',
            createdBy: App.currentUser
        });

        // Deduct stock immediately
        itemsData.forEach(ri => {
            const item = this.items.find(i => i.id === ri.itemId);
            if (item) {
                item.qty = Math.max(0, item.qty - ri.qty);
            }
        });

        AuditLog.add('Create', 'Inventory', `Item Request ${document.getElementById('req_id').value} generated for ${totalItems} items`);
        App.closeModal(); App.showToast('Item Request Submitted & Stock Deducted!', 'success'); App.navigateTo('inventory');
    },

    editItemRequest(id) {
        const req = this.itemRequests.find(x => x.id === id);
        if (!req) return;

        let depts = ['Puja', 'Admin', 'Operations', 'IT'];
        let reqNames = [];
        if (window.HRPayrollModule && window.HRPayrollModule.employees) {
            const temp = [...new Set(window.HRPayrollModule.employees.map(e => e.dept).filter(Boolean))];
            if (temp.length) depts = temp;
            reqNames = [...new Set(window.HRPayrollModule.employees.map(e => e.name).filter(Boolean))];
        }
        let isOtherDept = !depts.includes(req.department);
        const deptOpts = depts.map(d => `<option value="${d}" ${!isOtherDept && req.department === d ? 'selected' : ''}>${d}</option>`).join('');

        let isOtherReq = !reqNames.includes(req.requester);
        const reqNameOpts = reqNames.map(n => `<option value="${n}" ${!isOtherReq && req.requester === n ? 'selected' : ''}>${n}</option>`).join('');

        let roleHtml = `<input type="text" class="form-control" id="req_role_wrapper_edit_input" value="${req.role || ''}" readonly>`;
        if (isOtherReq) {
            roleHtml = `<input type="text" class="form-control" id="req_role_wrapper_edit_input" value="${req.role || ''}" placeholder="Enter Role / Designation">`;
        } else {
            let emps = (window.HRPayrollModule && window.HRPayrollModule.employees) ? window.HRPayrollModule.employees.filter(e => e.name === req.requester) : [];
            if (emps.length > 1) {
                let opts = emps.map(e => `<option value="${e.role}" ${req.role === e.role ? 'selected' : ''}>${e.role} - ${e.dept} (${e.id})</option>`).join('');
                roleHtml = `<select class="form-control" id="req_role_wrapper_edit_input">${opts}</select>`;
            } else if (emps.length === 1) {
                roleHtml = `<input type="text" class="form-control" id="req_role_wrapper_edit_input" value="${emps[0].role}" readonly>`;
            }
        }

        let rowsHtml = '';
        if (req.itemsData && req.itemsData.length) {
            req.itemsData.forEach(ri => { rowsHtml += this.renderItemRequestRow(ri.itemId, ri.qty); });
        } else {
            rowsHtml = this.renderItemRequestRow();
        }

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit Item Request</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="editRequestForm" onsubmit="InventoryModule.updateItemRequest(event, '${id}')">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Request ID</label><input type="text" class="form-control" value="${req.id}" readonly style="background:#f0f2f5;font-weight:700"></div>
                    <div class="form-group"><label class="form-label">Request Date & Time *</label><input type="datetime-local" class="form-control" id="req_date_edit" value="${req.date}" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Requester Name *</label>
                        <select class="form-control" id="req_name_edit" required onchange="InventoryModule.onRequesterChange(this, 'req_role_wrapper_edit', 'req_name_other_edit')">
                            <option value="">Select Requester...</option>
                            ${reqNameOpts}
                            <option value="Other" ${isOtherReq ? 'selected' : ''}>Other</option>
                        </select>
                        <input type="text" class="form-control" id="req_name_other_edit" value="${isOtherReq ? req.requester : ''}" placeholder="Enter requester name" style="display:${isOtherReq ? 'block' : 'none'}; margin-top:8px;">
                    </div>
                    <div class="form-group"><label class="form-label">Role</label>
                        <div id="req_role_wrapper_edit">
                            ${roleHtml}
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex:1"><label class="form-label">Dept / Purpose *</label>
                        <select class="form-control" id="req_dept_edit" onchange="document.getElementById('req_dept_other_edit').style.display = this.value === 'Other' ? 'block' : 'none'" required>
                            <option value="">Select Dept...</option>
                            ${deptOpts}
                            <option value="Other" ${isOtherDept ? 'selected' : ''}>Other</option>
                        </select>
                        <input type="text" class="form-control" id="req_dept_other_edit" value="${isOtherDept ? req.department : ''}" placeholder="Enter department name" style="display:${isOtherDept ? 'block' : 'none'}; margin-top:8px;">
                    </div>
                </div>
                
                <h4 style="margin:16px 0 8px;font-size:0.9rem;border-bottom:1px solid #e0e0e0;padding-bottom:4px">Requested Items</h4>
                <div id="reqItemsContainer_edit">
                    ${rowsHtml}
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="InventoryModule.addItemRequestRow('reqItemsContainer_edit')" style="margin-bottom:14px"><i class="fas fa-plus"></i> Add Another Item</button>

                <div class="form-row">
                    <div class="form-group"><label class="form-label">Remarks</label><input type="text" class="form-control" id="req_remarks_edit" value="${req.remarks || ''}" placeholder="Notes or urgency..."></div>
                </div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update Request</button></div>
            </form>
        `);
    },

    updateItemRequest(e, id) {
        e.preventDefault();
        const req = this.itemRequests.find(x => x.id === id);
        if (!req) return;

        let reqName = document.getElementById('req_name_edit').value;
        if (reqName === 'Other') {
            reqName = document.getElementById('req_name_other_edit').value.trim();
            if (!reqName) { App.showToast('Please specify the requester name', 'error'); return; }
        }
        const reqRole = document.getElementById('req_role_wrapper_edit_input') ? document.getElementById('req_role_wrapper_edit_input').value.trim() : '';

        let dept = document.getElementById('req_dept_edit').value;
        if (dept === 'Other') {
            dept = document.getElementById('req_dept_other_edit').value.trim();
            if (!dept) { App.showToast('Please specify the department', 'error'); return; }
        }

        const reqLines = document.querySelectorAll('#reqItemsContainer_edit .req-item-line');
        const summaryArr = [];
        const itemsData = [];
        let totalItems = 0;

        let hasError = false;
        reqLines.forEach(line => {
            const sel = line.querySelector('.req-item');
            if (sel && sel.value) {
                const qty = parseInt(line.querySelector('.req-qty').value) || 0;
                const item = this.items.find(i => i.id === sel.value);
                if (item && qty > 0) {
                    if (qty > item.qty) {
                        App.showToast(`Requested quantity for ${item.name} exceeds available stock (${item.qty} ${item.unit}s).`, 'error');
                        hasError = true;
                    }
                    summaryArr.push(`${item.name} (x${qty})`);
                    itemsData.push({ itemId: item.id, qty: qty });
                    totalItems++;
                }
            }
        });

        if (hasError) return;

        if (totalItems === 0) {
            App.showToast('Please request at least one item.', 'warning');
            return;
        }

        req.date = document.getElementById('req_date_edit').value;
        req.requester = reqName;
        req.role = reqRole;
        req.department = dept;
        req.itemsSummary = summaryArr.join(', ');
        req.itemsData = itemsData;
        req.remarks = document.getElementById('req_remarks_edit').value;

        // Automatically update stock difference if items were edited
        const originalItems = req.itemsData; // Store original
        req.itemsData = itemsData; // Apply new items

        AuditLog.add('Edit', 'Inventory', `Item Request ${id} updated`);
        App.closeModal();
        App.showToast('Request updated!', 'success');
        App.navigateTo('inventory');
    },

    viewItemRequest(id) {
        const req = this.itemRequests.find(x => x.id === id);
        if (!req) return;
        App.viewDetail(`Item Request: ${req.id}`, [
            ['Request ID', req.id],
            ['Date & Time', req.date.replace('T', ' ')],
            ['Requester', `${req.requester} <small style="color:var(--text-muted)">(${req.role || '—'})</small>`],
            ['Dept / Purpose', req.department],
            ['Items Requested', `<strong style="color:var(--primary-blue)">${req.itemsSummary}</strong>`],
            ['Remarks', req.remarks || 'None'],
            ['Created By', req.createdBy || 'Admin'],
            ['Status', `<span class="badge badge-success">Completed</span>`],
        ]);
    },

    // Return Items
    openReturnItemsModal() {
        const completedReqs = this.itemRequests; // All requests are now completed automatically
        if (completedReqs.length === 0) {
            App.showToast('No item requests available for return.', 'warning');
            return;
        }

        const reqOpts = completedReqs.map(r => `<option value="${r.id}">${r.id} - ${r.requester}</option>`).join('');

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Return Items</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="returnForm" onsubmit="InventoryModule.saveItemReturn(event)">
                <div class="form-group"><label class="form-label">Select Request ID *</label>
                    <select class="form-control" id="return_req_id" onchange="InventoryModule.onReturnReqChange(this.value)" required>
                        <option value="">Select a completed request...</option>
                        ${reqOpts}
                    </select>
                </div>
                
                <div id="returnItemsContainer" style="display:none;">
                    <h4 style="margin:16px 0 8px;font-size:0.9rem;border-bottom:1px solid #e0e0e0;padding-bottom:4px">Items Issued</h4>
                    <div id="returnItemList"></div>
                    <div class="form-group" style="margin-top:10px;"><label class="form-label">Return Remarks</label><input type="text" class="form-control" id="return_remarks" placeholder="Reason for return..."></div>
                    <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-success">Confirm Return</button></div>
                </div>
            </form>
        `);
    },

    onReturnReqChange(reqId) {
        const container = document.getElementById('returnItemsContainer');
        const listDiv = document.getElementById('returnItemList');
        if (!reqId) {
            container.style.display = 'none';
            return;
        }

        const req = this.itemRequests.find(r => r.id === reqId);
        if (!req || !req.itemsData) return;

        container.style.display = 'block';
        listDiv.innerHTML = '';

        req.itemsData.forEach((ri, idx) => {
            const item = this.items.find(i => i.id === ri.itemId);
            if (!item) return;
            // Get already returned qty if it exists
            const alreadyReturned = ri.returnedQty || 0;
            const returnable = ri.qty - alreadyReturned;

            if (returnable > 0) {
                listDiv.innerHTML += `
                    <div class="form-row return-item-line" style="margin-bottom:8px; align-items:flex-end">
                        <div class="form-group" style="flex:2">
                            <label class="form-label" style="font-size:0.72rem">Item</label>
                            <input type="text" class="form-control" value="${item.name} (Issued: ${ri.qty}, Returned: ${alreadyReturned})" readonly style="background:#f0f2f5;">
                            <input type="hidden" class="return-item-id" value="${item.id}">
                        </div>
                        <div class="form-group" style="flex:1">
                            <label class="form-label" style="font-size:0.72rem">Return Qty</label>
                            <input type="number" class="form-control return-qty" min="0" max="${returnable}" value="0">
                        </div>
                    </div>
                `;
            }
        });

        if (listDiv.innerHTML === '') {
            listDiv.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); padding:8px 0;">All items have already been fully returned for this request.</p>`;
            container.querySelector('.btn-success').style.display = 'none';
        } else {
            container.querySelector('.btn-success').style.display = 'inline-block';
        }
    },

    saveItemReturn(e) {
        e.preventDefault();
        const reqId = document.getElementById('return_req_id').value;
        const req = this.itemRequests.find(r => r.id === reqId);
        if (!req) return;

        const returnLines = document.querySelectorAll('.return-item-line');
        let totalReturnedItems = 0;
        let summaryArr = [];

        returnLines.forEach(line => {
            const itemId = line.querySelector('.return-item-id').value;
            const qty = parseInt(line.querySelector('.return-qty').value) || 0;

            if (qty > 0) {
                const item = this.items.find(i => i.id === itemId);
                const reqItemData = req.itemsData.find(ri => ri.itemId === itemId);

                if (item && reqItemData) {
                    // Update stock
                    item.qty += qty;
                    // Update request data tracking
                    reqItemData.returnedQty = (reqItemData.returnedQty || 0) + qty;
                    summaryArr.push(`${item.name} (+${qty})`);
                    totalReturnedItems++;
                }
            }
        });

        if (totalReturnedItems === 0) {
            App.showToast('Please enter a return quantity > 0 for at least one item.', 'warning');
            return;
        }

        const remarks = document.getElementById('return_remarks').value;
        const previousRemarks = req.remarks ? `${req.remarks} | ` : '';
        req.remarks = `${previousRemarks}Returned: ${summaryArr.join(', ')} (${remarks || 'No reason'})`;

        AuditLog.add('Edit', 'Inventory', `Returned items for Request ${reqId}: ${summaryArr.join(', ')}`);
        App.closeModal();
        App.showToast(`Stock updated! Returned ${totalReturnedItems} items.`, 'success');
        App.navigateTo('inventory');
    },

    // Supplier management
    addSupplier() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Add Supplier</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="supForm" onsubmit="InventoryModule.saveSupplier(event)">
                <div class="form-row"><div class="form-group"><label class="form-label">Supplier Name *</label><input type="text" class="form-control" id="sup_name" required></div><div class="form-group"><label class="form-label">Contact *</label><input type="tel" class="form-control" id="sup_contact" required></div></div>
                <div class="form-row"><div class="form-group"><label class="form-label">Alternate Contact</label><input type="tel" class="form-control" id="sup_alt"></div><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="sup_email"></div></div>
                <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="sup_addr" rows="2"></textarea></div>
                <div class="form-group"><label class="form-label">Other Remarks</label><input type="text" class="form-control" id="sup_remarks" placeholder="Notes, payment terms..."></div>
                
                <h4 style="margin:16px 0 8px;font-size:0.9rem;border-bottom:1px solid #e0e0e0;padding-bottom:4px">Supplier Items List</h4>
                <div id="supItemsContainer">
                    ${this.renderSupplierItemRow()}
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="InventoryModule.addSupplierItemRow()" style="margin-bottom:14px"><i class="fas fa-plus"></i> Add Another Item</button>

                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save Supplier & Items</button></div>
            </form>
        `);
    },

    renderSupplierItemRow() {
        return `<div class="form-row sup-item-line" style="margin-bottom:8px; align-items:flex-end">
            <div class="form-group" style="flex:2"><label class="form-label" style="font-size:0.72rem">Item Name *</label><input type="text" class="form-control si-name" required placeholder="e.g. Camphor"></div>
            <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Unit</label><select class="form-control si-unit"><option>piece</option><option>kg</option><option>liter</option><option>box</option><option>pack</option></select></div>
            <div class="form-group" style="flex:1"><label class="form-label" style="font-size:0.72rem">Price / Unit (₹)</label><input type="number" class="form-control si-price" min="0" required></div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="if(document.querySelectorAll('.sup-item-line').length > 1) this.parentElement.remove()" style="margin-bottom:4px"><i class="fas fa-times"></i></button>
        </div>`;
    },

    addSupplierItemRow() {
        const container = document.getElementById('supItemsContainer');
        const div = document.createElement('div');
        div.innerHTML = this.renderSupplierItemRow();
        container.appendChild(div.firstElementChild);
    },

    saveSupplier(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('supForm'))) return;

        const supName = document.getElementById('sup_name').value.trim();

        // Extract multiple items
        const itemRows = document.querySelectorAll('.sup-item-line');
        const addedItemNames = [];

        itemRows.forEach(row => {
            const name = row.querySelector('.si-name').value.trim();
            const unit = row.querySelector('.si-unit').value;
            const price = parseFloat(row.querySelector('.si-price').value) || 0;

            if (name) {
                // Determine if item already exists by name and supplier
                const existing = this.items.find(i => i.name.toLowerCase() === name.toLowerCase() && i.supplier === supName);
                if (existing) {
                    existing.unitPrice = price; // Update price
                    existing.unit = unit;
                } else {
                    this.items.push({
                        id: RefNumberGenerator.generateSequential('INV', this.items, 3),
                        name, category: 'Other', unit, qty: 0, minStock: 10, unitPrice: price,
                        supplier: supName, purchaseMode: 'Local', remarks: '', invoiceRefs: []
                    });
                }
                addedItemNames.push(name);
            }
        });

        this.suppliers.push({
            id: RefNumberGenerator.generateSequential('TSUP', this.suppliers, 3),
            name: supName,
            contact: document.getElementById('sup_contact').value,
            altContact: document.getElementById('sup_alt').value || '',
            email: document.getElementById('sup_email').value || '',
            address: document.getElementById('sup_addr').value || '',
            items: addedItemNames.join(', '),
            lastDelivery: '—',
            remarks: document.getElementById('sup_remarks').value || ''
        });

        AuditLog.add('Create', 'Inventory', `Added supplier: ${supName} with ${addedItemNames.length} linked items`);
        App.closeModal(); App.showToast('Supplier added!', 'success'); App.navigateTo('inventory');
    },

    editSupplier(id) {
        const s = this.suppliers.find(x => x.id === id);
        if (!s) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit Supplier ${s.id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="InventoryModule.updateSupplier(event,'${s.id}')">
                <div class="form-row"><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="supe_name" value="${s.name}" required></div><div class="form-group"><label class="form-label">Contact</label><input class="form-control" id="supe_contact" value="${s.contact}" required></div></div>
                <div class="form-row"><div class="form-group"><label class="form-label">Alt Contact</label><input type="tel" class="form-control" id="supe_alt" value="${s.altContact || ''}"></div><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="supe_email" value="${s.email || ''}"></div></div>
                <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="supe_addr" rows="2">${s.address || ''}</textarea></div>
                <div class="form-group"><label class="form-label">Other Remarks</label><input type="text" class="form-control" id="supe_remarks" value="${s.remarks || ''}"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
            </form>
        `);
    },

    updateSupplier(e, id) {
        e.preventDefault();
        const s = this.suppliers.find(x => x.id === id);
        if (s) {
            s.name = document.getElementById('supe_name').value;
            s.contact = document.getElementById('supe_contact').value;
            s.altContact = document.getElementById('supe_alt').value;
            s.email = document.getElementById('supe_email').value;
            s.address = document.getElementById('supe_addr').value;
            s.remarks = document.getElementById('supe_remarks').value;
        }
        AuditLog.add('Edit', 'Inventory', `Updated supplier ${id}`);
        App.closeModal(); App.showToast('Supplier updated!', 'success'); App.navigateTo('inventory');
    },

    viewSupplierItems(id) {
        const s = this.suppliers.find(x => x.id === id);
        if (!s) return;
        const suppliedItems = this.items.filter(i => i.supplier === s.name);
        const deliveries = this.invoices.filter(i => i.supplier === s.name).reverse();

        let contentHtml = `
            <div class="modal-header"><h3 class="modal-title">${s.name} — Details</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            
            <h4 style="margin:0 0 10px; font-size:1rem; border-bottom:1px solid #e0e0e0; padding-bottom:5px;">Provided Items</h4>
            <div style="margin-bottom:20px;">
                ${suppliedItems.length ? `<table class="data-table"><thead><tr><th>Item</th><th>Stock</th><th>Unit Price</th></tr></thead><tbody>${suppliedItems.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.unitPrice}</td></tr>`).join('')}</tbody></table>` : '<div class="empty-state"><i class="fas fa-box-open"></i><p>No items from this supplier</p></div>'}
            </div>

            <h4 style="margin:0 0 10px; font-size:1rem; border-bottom:1px solid #e0e0e0; padding-bottom:5px;">Delivery History</h4>
            <div style="max-height: 250px; overflow-y: auto;">
                ${deliveries.length ? `<table class="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th>Amount</th><th>Status</th></tr></thead><tbody>${deliveries.map(d => `<tr><td><strong>${d.id}</strong></td><td>${d.date}</td><td><small>${d.itemsSummary}</small></td><td>₹${d.amount}</td><td><span class="badge ${d.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${d.status}</span></td></tr>`).join('')}</tbody></table>` : '<div class="empty-state"><i class="fas fa-file-invoice"></i><p>No delivery records found for this supplier.</p></div>'}
            </div>
            
            <div class="form-actions" style="margin-top: 20px;"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Close</button></div>
        `;
        App.openModal(contentHtml);
    }
};
