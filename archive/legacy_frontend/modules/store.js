/* =====================
   TEMPLE STORE MODULE v3
   Order placement, edit/cancel orders, suppliers section, remarks
   ===================== */
window.StoreModule = {
    products: [
        { id: 'PRD-001', name: 'Puja Kit', category: 'Puja', price: 299, stock: 45, sold: 120, image: '🪔' },
        { id: 'PRD-002', name: 'Vibhuti Packet', category: 'Puja', price: 50, stock: 200, sold: 540, image: '🤲' },
        { id: 'PRD-003', name: 'Kumkum Box', category: 'Puja', price: 30, stock: 300, sold: 410, image: '✨' },
        { id: 'PRD-004', name: 'Temple Calendar', category: 'General', price: 150, stock: 60, sold: 80, image: '📅' },
        { id: 'PRD-005', name: 'Brass Diya', category: 'General', price: 450, stock: 25, sold: 55, image: '🕯️' },
        { id: 'PRD-006', name: 'Sandalwood Paste', category: 'Puja', price: 120, stock: 80, sold: 190, image: '🪵' },
    ],

    orders: [
        { id: 'ORD-001', customer: 'Rajesh Kumar', phone: '9876543210', address: '123 Temple Road', items: 'Puja Kit x2, Vibhuti x3', total: 748, date: '2026-02-23', status: 'delivered', remarks: '', createdBy: 'Admin' },
        { id: 'ORD-002', customer: 'Meenakshi R.', phone: '9871234561', address: '45 Lotus St', items: 'Brass Diya x1', total: 450, date: '2026-02-24', status: 'processing', remarks: 'Gift wrapping', createdBy: 'Store Staff' },
        { id: 'ORD-003', customer: 'Anitha Menon', phone: '9871234563', address: 'NSS Block', items: 'Temple Calendar x3, Kumkum x5', total: 600, date: '2026-02-25', status: 'pending', remarks: '', createdBy: 'App User' },
        { id: 'ORD-004', customer: 'Suresh P.', phone: '9876500006', address: 'Avenue 2', items: 'Puja Kit x1', total: 299, date: '2026-02-26', status: 'delivered', remarks: '', createdBy: 'Admin' },
        { id: 'ORD-005', customer: 'Gopal T.', phone: '9876500007', address: 'Ring Road', items: 'Sandalwood Paste x2', total: 240, date: '2026-02-27', status: 'processing', remarks: '', createdBy: 'Store Staff' },
        { id: 'ORD-006', customer: 'Lakshmi N.', phone: '9876500008', address: 'Park Street', items: 'Brass Diya x2', total: 900, date: '2026-02-28', status: 'delivered', remarks: '', createdBy: 'App User' },
        { id: 'ORD-007', customer: 'Rahul K.', phone: '9876500009', address: 'Highland', items: 'Vibhuti Packet x5', total: 250, date: '2026-03-01', status: 'pending', remarks: '', createdBy: 'Store Staff' },
        { id: 'ORD-008', customer: 'Vivek M.', phone: '9876500010', address: 'Green View', items: 'Kumkum Box x10', total: 300, date: '2026-03-02', status: 'pending', remarks: 'Fast delivery', createdBy: 'Admin' },
        { id: 'ORD-009', customer: 'Priya S.', phone: '9876500011', address: 'West End', items: 'Temple Calendar x1', total: 150, date: '2026-03-03', status: 'cancelled', remarks: 'Out of town', createdBy: 'App User' },
        { id: 'ORD-010', customer: 'Arun C.', phone: '9876500012', address: 'South Court', items: 'Puja Kit x4', total: 1196, date: '2026-03-04', status: 'processing', remarks: '', createdBy: 'Store Staff' },
    ],

    bids: [
        { id: 'BID-001', item: 'Antique Brass Lamp', category: 'Auction', startPrice: 5000, currentBid: 12500, bidders: 8, closingDate: '2026-03-05', image: '🪔' },
        { id: 'BID-002', item: 'Silver Kumkum Box', category: 'Auction', startPrice: 3000, currentBid: 7200, bidders: 5, closingDate: '2026-03-10', image: '🥈' },
    ],

    suppliers: [
        { id: 'SUP-001', name: 'Krishna Traders', contact: '9876543200', altContact: '', email: 'contact@krishnatraders.com', address: 'Market Road, Trivandrum', items: 'Puja Kits, Vibhuti, Kumkum', lastDelivery: '2026-02-20', remarks: 'Bulk: 15% off' },
        { id: 'SUP-002', name: 'Local Vendors', contact: '9876543202', altContact: '9876543302', email: 'artisans@brass.com', address: 'Industrial Area', items: 'Brass Diya, Temple Lamps', lastDelivery: '2026-02-15', remarks: 'Custom orders: 3-week lead' },
        { id: 'SUP-003', name: 'Gita Press Gorakhpur', contact: '0551-2334721', altContact: '', email: 'gitapress@example.com', address: 'Gorakhpur, UP', items: 'Religious Books', lastDelivery: '2026-02-28', remarks: 'Books supplier' }
    ],

    // Invoices for restocking
    invoices: [],

    currentTab: 'products',

    render() {
        const ml = App.currentLang === 'ml';
        const rev = this.products.reduce((s, p) => s + (p.sold * p.price), 0);
        const unitsSold = this.products.reduce((s, p) => s + p.sold, 0);
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-store"></i> ${ml ? 'ക്ഷേത്ര സ്റ്റോർ' : 'Temple Store'}</h1>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-box kpi-icon"></i><div class="kpi-label">Products</div><div class="kpi-value">${this.products.length}</div><div class="kpi-sub">In catalog</div></div>
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-rupee-sign kpi-icon"></i><div class="kpi-label">Revenue</div><div class="kpi-value">₹${rev.toLocaleString()}</div><div class="kpi-sub">All time</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-shopping-bag kpi-icon"></i><div class="kpi-label">Units Sold</div><div class="kpi-value">${unitsSold}</div><div class="kpi-sub">Total</div></div>
            <div class="kpi-card" style="background:var(--grad-purple)"><i class="fas fa-gavel kpi-icon"></i><div class="kpi-label">Active Bids</div><div class="kpi-value">${this.bids.length}</div><div class="kpi-sub">Ongoing</div></div>
        </div>
        
        <div class="section-card">
            <div class="tabs-bar">
                <button class="tab-btn ${this.currentTab === 'products' ? 'active' : ''}" onclick="StoreModule.switchTab('products')">Products</button>
                <button class="tab-btn ${this.currentTab === 'orders' ? 'active' : ''}" onclick="StoreModule.switchTab('orders')">Sales Orders</button>
                <button class="tab-btn ${this.currentTab === 'invoices' ? 'active' : ''}" onclick="StoreModule.switchTab('invoices')">Purchase Invoices</button>
                <button class="tab-btn ${this.currentTab === 'bids' ? 'active' : ''}" onclick="StoreModule.switchTab('bids')">Live Auctions</button>
            </div>
            ${this.currentTab === 'products' ? this.renderProducts(ml) :
                this.currentTab === 'orders' ? this.renderOrders(ml) :
                    this.currentTab === 'invoices' ? this.renderInvoices(ml) :
                        this.renderBidding(ml)}
        </div>`;
    },

    renderProducts(ml) {
        return `
            <div class="section-header"><div class="section-title"><i class="fas fa-th-large"></i> Product Catalog</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-success btn-sm" onclick="StoreModule.openSellItemModal()"><i class="fas fa-shopping-cart"></i> Sell Item</button>
                    <button class="btn btn-primary btn-sm" style="background:var(--primary-teal);border-color:var(--primary-teal)" onclick="StoreModule.openRestockModal()"><i class="fas fa-truck-loading"></i> Restock Stock</button>
                    <button class="btn btn-primary btn-sm" onclick="StoreModule.addProduct()"><i class="fas fa-plus"></i> Add Product</button>
                </div>
            </div>
            <div class="products-grid">
                ${this.products.map(p => `
                <div class="product-card">
                    <div class="product-img" style="font-size:3rem">${p.image}</div>
                    <div class="product-info">
                        <div class="product-category">${p.category}</div>
                        <div class="product-name">${p.name}</div>
                        <div class="product-price">₹${p.price}</div>
                        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">Stock: ${p.stock} | Sold: ${p.sold}</div>
                        ${p.stock > 0 ? `<button class="btn btn-sm btn-primary" style="margin-top:8px;width:100%" onclick="StoreModule.placeOrder('${p.id}')"><i class="fas fa-shopping-cart"></i> Place Order</button>` : '<div class="badge badge-danger" style="margin-top:8px">Out of Stock</div>'}
                    </div>
                </div>`).join('')}
            </div>`;
    },

    renderOrders(ml) {
        const badge = s => s === 'delivered' ? 'badge-success' : s === 'processing' ? 'badge-info' : s === 'pending' ? 'badge-warning' : s === 'cancelled' ? 'badge-danger' : 'badge-info';
        return `
            <div class="section-header"><div class="section-title"><i class="fas fa-shopping-bag"></i> Orders</div></div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Remarks</th><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                ${this.orders.map(o => `<tr id="record-${o.id}">
                    <td><strong>${o.id}</strong></td><td>${o.customer}</td>
                    <td><small>${o.items}</small></td><td><strong>₹${o.total.toLocaleString()}</strong></td>
                    <td>${o.date}</td>
                    <td><small style="color:var(--text-muted)">${o.remarks || '—'}</small></td>
                    <td><i class="fas fa-user-circle"></i> <small>${o.createdBy || 'Admin'}</small></td>
                    <td><span class="badge ${badge(o.status)}">${o.status}</span></td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-sm btn-outline" title="View Order" onclick="StoreModule.viewOrder('${o.id}')"><i class="fas fa-eye"></i></button>
                        ${o.status !== 'delivered' && o.status !== 'cancelled' ? `
                        <div class="action-dropdown">
                            <button class="btn btn-sm btn-edit" title="Order Actions"><i class="fas fa-pen"></i></button>
                            <div class="action-dropdown-content">
                                <button class="action-menu-btn" onclick="StoreModule.editOrder('${o.id}')"><i class="fas fa-edit"></i> Edit Details</button>
                                <button class="action-menu-btn text-danger" onclick="StoreModule.cancelOrder('${o.id}')"><i class="fas fa-times"></i> Cancel Order</button>
                            </div>
                        </div>` : ''}
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>`;
    },

    renderBidding(ml) {
        return `
            <div class="section-header"><div class="section-title"><i class="fas fa-gavel"></i> Active Bids</div>
                <button class="btn btn-primary btn-sm" onclick="StoreModule.createBid()"><i class="fas fa-plus"></i> Create Listing</button>
            </div>
            <div class="products-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
                ${this.bids.map(b => `
                <div class="bid-card">
                    <div class="bid-img" style="font-size:3rem">${b.image}</div>
                    <div class="bid-info">
                        <div class="bid-name">${b.item}</div>
                        <div class="bid-meta">${b.category} • ${b.bidders} bidders</div>
                        <div class="bid-prices"><span class="bid-start">Start: ₹${b.startPrice.toLocaleString()}</span><span class="bid-current">₹${b.currentBid.toLocaleString()}</span></div>
                        <div class="bid-progress"><div class="progress-bar"><div class="progress-fill" style="width:${Math.min((b.currentBid / (b.startPrice * 5)) * 100, 100)}%;background:var(--grad-blue)"></div></div></div>
                        <div class="bid-timer"><i class="fas fa-clock"></i> Closes: ${b.closingDate}</div>
                        <button class="btn btn-sm btn-primary" style="width:100%;margin-top:8px" onclick="StoreModule.placeBid('${b.id}')"><i class="fas fa-gavel"></i> Place Bid</button>
                    </div>
                </div>`).join('')}
            </div>`;
    },

    renderSuppliers(ml) {
        return `
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-truck"></i> ${ml ? 'വിതരണക്കാർ' : 'Suppliers'}</div>
                <button class="btn btn-primary btn-sm" onclick="StoreModule.addSupplier()"><i class="fas fa-plus"></i> Add Supplier</button>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>ID</th><th>Supplier</th><th>Contact</th><th>Items</th><th>Last Delivery</th><th>Price Note</th><th>Actions</th></tr></thead><tbody>
                ${this.suppliers.map(s => `<tr>
                    <td><strong>${s.id}</strong></td><td>${s.name}</td><td>${s.contact}${s.email ? `<br><small>${s.email}</small>` : ''}</td>
                    <td><small>${s.items}</small></td><td>${s.lastDelivery}</td>
                    <td><small style="color:var(--text-muted)">${s.remarks || '—'}</small></td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-sm btn-edit" title="Edit Supplier" onclick="StoreModule.editSupplier('${s.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline" title="View Items Supplied" onclick="StoreModule.viewSupplierItems('${s.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>`;
    },

    renderInvoices(ml) {
        let invoicesHtml = '';
        if (!this.invoices.length) {
            invoicesHtml = `<div class="empty-state"><i class="fas fa-file-invoice"></i><p>No restock invoices generated yet.</p>
            <button class="btn btn-primary" style="margin-top:10px" onclick="StoreModule.openRestockModal()">Generate Restock Invoice</button>
            </div>`;
        } else {
            invoicesHtml = `
            <div class="section-card">
                <div class="section-header"><div class="section-title"><i class="fas fa-file-invoice-dollar"></i> Purchase Invoices (Restocks)</div>
                    <button class="btn btn-primary btn-sm" onclick="StoreModule.openRestockModal()"><i class="fas fa-truck-loading"></i> New Restock Invoice</button>
                </div>
                <div style="overflow-x:auto">
                <table class="data-table"><thead><tr><th>Ref No.</th><th>Date</th><th>Supplier</th><th>Item Restocked</th><th>Qty Added</th><th>Total Cost</th><th>Created By</th><th>Remarks</th></tr></thead><tbody>
                    ${[...this.invoices].reverse().map(inv => `<tr>
                        <td><strong>${inv.id}</strong></td>
                        <td>${inv.date}</td>
                        <td>${inv.supplier}</td>
                        <td><span class="badge badge-info">${inv.item}</span></td>
                        <td><strong>+${inv.qty}</strong></td>
                        <td>₹${inv.cost.toLocaleString()}</td>
                        <td><small><i class="fas fa-user-circle"></i> ${inv.createdBy || 'Admin'}</small></td>
                        <td><small style="color:var(--text-muted)">${inv.remarks || '—'}</small></td>
                    </tr>`).join('')}
                </tbody></table>
                </div>
            </div>`;
        }

        return `
        <!-- Suppliers Management -->
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-truck"></i> ${ml ? 'വിതരണക്കാർ' : 'Suppliers Management'}</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" onclick="StoreModule.addSupplier()"><i class="fas fa-plus"></i> Add Supplier</button>
                    <button class="btn btn-success btn-sm" onclick="StoreModule.openRestockModal()"><i class="fas fa-file-invoice"></i> Purchase Invoice</button>
                </div>
            </div>
            <div style="overflow-x:auto">
            <table class="data-table" id="supTable"><thead><tr><th>ID</th><th>Supplier</th><th>Contact</th><th>Items Supplied</th><th>Last Delivery</th><th>Remarks</th><th>Actions</th></tr></thead><tbody>
                ${this.suppliers.map(s => `<tr>
                    <td><strong>${s.id}</strong></td><td>${s.name}</td><td>${s.contact}${s.email ? `<br><small>${s.email}</small>` : ''}</td>
                    <td><small>${s.items}</small></td><td>${s.lastDelivery}</td>
                    <td><small style="color:var(--text-muted)">${s.remarks}</small></td>
                    <td style="white-space:nowrap">
                        <button class="btn btn-sm btn-edit" title="Edit Supplier" onclick="StoreModule.editSupplier('${s.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline" title="View Items Supplied" onclick="StoreModule.viewSupplierItems('${s.id}')"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        ${invoicesHtml}
        `;
    },

    switchTab(tab) { this.currentTab = tab; App.navigateTo('store'); },

    // Open Sell Item Modal (Select Product first)
    openSellItemModal() {
        const availableProducts = this.products.filter(p => p.stock > 0);
        if (availableProducts.length === 0) {
            App.showToast('No products available in stock to sell', 'error');
            return;
        }

        const productOptions = availableProducts.map(p =>
            `<option value="${p.id}" data-price="${p.price}" data-stock="${p.stock}" data-name="${p.name}" data-img="${p.image}">${p.name} (Stock: ${p.stock}) - ₹${p.price}</option>`
        ).join('');

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Sell Store Item</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="orderForm" onsubmit="StoreModule.saveSellOrder(event)">
                <div class="form-group">
                    <label class="form-label">Select Product *</label>
                    <select class="form-control" id="ord_product" required onchange="StoreModule.updateSellItemModal()">
                        ${productOptions}
                    </select>
                </div>
                
                <div id="sellItemDetails" style="text-align:center;margin-bottom:15px">
                    <div id="sell_img" style="font-size:3rem;margin-bottom:10px">${availableProducts[0].image}</div>
                    <div id="sell_price_label" style="font-weight:800;font-size:1.2rem;color:var(--primary-blue);margin-bottom:10px">₹${availableProducts[0].price} per unit</div>
                </div>

                <div class="form-row">
                    <div class="form-group"><label class="form-label">Customer Name *</label><input type="text" class="form-control" id="ord_cust" required></div>
                    <div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-control" id="ord_phone"></div>
                </div>
                <div class="form-group"><label class="form-label">Customer Address</label><textarea class="form-control" id="ord_addr" rows="2"></textarea></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Quantity *</label><input type="number" class="form-control" id="ord_qty" min="1" max="${availableProducts[0].stock}" value="1" required oninput="StoreModule.updateSellItemModal()"></div>
                    <div class="form-group"><label class="form-label">Total</label><div id="ord_total" style="font-weight:800;font-size:1.2rem;color:var(--primary-blue);margin-top:6px">₹${availableProducts[0].price}</div><div class="amount-words" id="ord_words">${numberToWords(availableProducts[0].price)}</div></div>
                </div>
                <div class="form-group"><label class="form-label">Payment Mode</label><select class="form-control" id="ord_pay"><option>Cash</option><option>UPI</option><option>Online</option><option>Offline</option></select></div>
                <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="ord_remarks" placeholder="Gift wrapping, delivery notes..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-shopping-cart"></i> Place Order</button></div>
            </form>
        `);
    },

    updateSellItemModal() {
        const select = document.getElementById('ord_product');
        if (!select) return;
        const opt = select.options[select.selectedIndex];
        const price = parseInt(opt.getAttribute('data-price'));
        const stock = parseInt(opt.getAttribute('data-stock'));
        const img = opt.getAttribute('data-img');

        const qtyInput = document.getElementById('ord_qty');
        qtyInput.max = stock;
        const qty = parseInt(qtyInput.value) || 0;

        document.getElementById('sell_img').textContent = img;
        document.getElementById('sell_price_label').textContent = '₹' + price + ' per unit';

        const total = price * qty;
        document.getElementById('ord_total').textContent = '₹' + total.toLocaleString();
        document.getElementById('ord_words').textContent = numberToWords(total);
    },

    saveSellOrder(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('orderForm'))) return;

        const select = document.getElementById('ord_product');
        const productId = select.value;
        const p = this.products.find(x => x.id === productId);
        if (!p) return;

        const qty = parseInt(document.getElementById('ord_qty').value);
        if (qty > p.stock) {
            App.showToast('Not enough stock available', 'error');
            return;
        }

        const total = qty * p.price;
        const id = RefNumberGenerator.generateSequential('ORD', this.orders, 3);

        this.orders.push({
            id,
            customer: document.getElementById('ord_cust').value,
            phone: document.getElementById('ord_phone').value || '',
            address: document.getElementById('ord_addr').value || '',
            items: `${p.name} x${qty}`,
            total,
            date: new Date().toISOString().split('T')[0],
            status: 'delivered', // Direct sale usually means delivered immediately
            remarks: document.getElementById('ord_remarks')?.value || '',
            createdBy: App.currentUser
        });

        p.stock -= qty; p.sold += qty;
        AuditLog.add('Create', 'Store', `Order ${id} (Direct Sale): ${p.name} x${qty}`);

        if (window.AccountingModule) {
            AccountingModule.addTransaction('income', 'Store Sales', `Direct Sale - ${p.name} x${qty}`, total, id);
        }

        App.closeModal();
        App.showToast(`Order ${id} completed! ₹${total.toLocaleString()}`, 'success');
        this.currentTab = 'orders';
        App.navigateTo('store');
    },

    // Place Order for a product
    placeOrder(productId) {
        const p = this.products.find(x => x.id === productId);
        if (!p) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Place Order — ${p.name}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="orderForm" onsubmit="StoreModule.saveOrder(event,'${p.id}')">
                <div style="text-align:center;font-size:3rem;margin-bottom:10px">${p.image}</div>
                <div style="text-align:center;font-weight:800;font-size:1.2rem;color:var(--primary-blue);margin-bottom:10px">₹${p.price} per unit</div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Customer Name *</label><input type="text" class="form-control" id="ord_cust" required></div>
                    <div class="form-group"><label class="form-label">Phone *</label><input type="tel" class="form-control" id="ord_phone" required></div>
                </div>
                <div class="form-group"><label class="form-label">Customer Address *</label><textarea class="form-control" id="ord_addr" rows="2" required placeholder="Mandatory delivery address"></textarea></div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Quantity *</label><input type="number" class="form-control" id="ord_qty" min="1" max="${p.stock}" value="1" required oninput="document.getElementById('ord_total').textContent='₹'+(parseInt(this.value||0)*${p.price}).toLocaleString();document.getElementById('ord_words').textContent=numberToWords(parseInt(this.value||0)*${p.price})"></div>
                    <div class="form-group"><label class="form-label">Total</label><div id="ord_total" style="font-weight:800;font-size:1.2rem;color:var(--primary-blue);margin-top:6px">₹${p.price}</div><div class="amount-words" id="ord_words">${numberToWords(p.price)}</div></div>
                </div>
                <div class="form-group"><label class="form-label">Payment Mode</label><select class="form-control" id="ord_pay"><option>Cash</option><option>UPI</option><option>Online</option><option>Offline</option></select></div>
                <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="ord_remarks" placeholder="Gift wrapping, delivery notes..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-shopping-cart"></i> Place Order</button></div>
            </form>
        `);
    },

    saveOrder(e, productId) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('orderForm'))) return;
        const p = this.products.find(x => x.id === productId);
        const qty = parseInt(document.getElementById('ord_qty').value);
        const total = qty * p.price;
        const id = RefNumberGenerator.generateSequential('ORD', this.orders, 3);
        this.orders.push({
            id, customer: document.getElementById('ord_cust').value,
            phone: document.getElementById('ord_phone').value,
            address: document.getElementById('ord_addr').value,
            items: `${p.name} x${qty}`, total, date: new Date().toISOString().split('T')[0],
            status: 'pending',
            remarks: document.getElementById('ord_remarks')?.value || '',
            createdBy: App.currentUser
        });
        p.stock -= qty; p.sold += qty;
        AuditLog.add('Create', 'Store', `Order ${id}: ${p.name} x${qty}`);

        if (window.AccountingModule) {
            AccountingModule.addTransaction('income', 'Store Sales', `Store Order - ${p.name} x${qty}`, total, id);
        }

        App.closeModal();
        App.showToast(`Order ${id} placed! ₹${total.toLocaleString()}`, 'success');
        this.currentTab = 'orders';
        App.navigateTo('store');
    },

    viewOrder(id) {
        const o = this.orders.find(x => x.id === id);
        if (!o) return;
        App.viewDetail(`Order ${o.id}`, [
            ['Customer', o.customer], ['Phone', o.phone || '—'],
            ['Address', o.address || '—'],
            ['Items', o.items], ['Total', `₹${o.total.toLocaleString()}`],
            ['In Words', numberToWords(o.total)],
            ['Date', o.date], ['Remarks', o.remarks || '—'],
            ['Created By', o.createdBy || 'Admin'],
            ['Status', `<span class="badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">${o.status}</span>`],
        ]);
    },

    editOrder(id) {
        const o = this.orders.find(x => x.id === id);
        if (!o) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit Order ${o.id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="StoreModule.updateOrder(event,'${o.id}')">
                <div class="form-row"><div class="form-group"><label class="form-label">Customer</label><input type="text" class="form-control" id="orde_cust" value="${o.customer}" required></div><div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="orde_phone" value="${o.phone || ''}"></div></div>
                <div class="form-group"><label class="form-label">Address *</label><textarea class="form-control" id="orde_addr" rows="2" required>${o.address || ''}</textarea></div>
                <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="orde_status"><option ${o.status === 'pending' ? 'selected' : ''}>pending</option><option ${o.status === 'processing' ? 'selected' : ''}>processing</option><option ${o.status === 'delivered' ? 'selected' : ''}>delivered</option></select></div>
                <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="orde_remarks">${o.remarks || ''}</textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
            </form>
        `);
    },

    updateOrder(e, id) {
        e.preventDefault();
        const o = this.orders.find(x => x.id === id);
        if (o) {
            const prev = { ...o };
            o.customer = document.getElementById('orde_cust').value;
            o.phone = document.getElementById('orde_phone').value;
            o.status = document.getElementById('orde_status').value;
            o.remarks = document.getElementById('orde_remarks').value;
            AuditLog.add('Edit', 'Store', `Updated order ${id}`);
            App.showUndo('Order updated', () => { Object.assign(o, prev); this.currentTab = 'orders'; App.navigateTo('store'); });
        }
        App.closeModal(); App.showToast('Order updated!', 'success');
        this.currentTab = 'orders'; App.navigateTo('store');
    },

    cancelOrder(id) {
        const o = this.orders.find(x => x.id === id);
        if (o) {
            const remarks = prompt("Cancellation Remarks (Mandatory):");
            if (!remarks || remarks.trim() === "") {
                App.showToast("Cancellation remarks are mandatory.", "error");
                return;
            }
            const prev = o.status;
            o.status = 'cancelled';
            o.remarks = typeof o.remarks === 'string' && o.remarks.trim().length > 0 ? o.remarks + " | Cancelled: " + remarks : "Cancelled: " + remarks;
            AuditLog.add('Edit', 'Store', `Cancelled order ${id}. Reason: ${remarks}`);
            App.showToast(`Order ${id} cancelled`, 'warning');
            App.showUndo(`Order cancelled`, () => { o.status = prev; this.currentTab = 'orders'; App.navigateTo('store'); });
            this.currentTab = 'orders';
            App.navigateTo('store');
        }
    },

    addProduct() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Add Product</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="prodForm" onsubmit="StoreModule.saveProduct(event)">
                <div class="form-row"><div class="form-group"><label class="form-label">Name *</label><input type="text" class="form-control" id="prd_name" required></div><div class="form-group"><label class="form-label">Category</label><select class="form-control" id="prd_cat"><option>Puja</option><option>General</option><option>Books</option><option>Other</option></select></div></div>
                <div class="form-row"><div class="form-group"><label class="form-label">Price (₹) *</label><input type="number" class="form-control" id="prd_price" required min="1"></div><div class="form-group"><label class="form-label">Stock *</label><input type="number" class="form-control" id="prd_stock" required min="0"></div></div>
                <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="prd_remarks" placeholder="Product description..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Add</button></div>
            </form>
        `);
    },

    saveProduct(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('prodForm'))) return;
        this.products.push({
            id: RefNumberGenerator.generateSequential('PRD', this.products, 3),
            name: document.getElementById('prd_name').value,
            category: document.getElementById('prd_cat').value,
            price: parseInt(document.getElementById('prd_price').value),
            stock: parseInt(document.getElementById('prd_stock').value),
            sold: 0, image: '📦'
        });
        AuditLog.add('Create', 'Store', `Added product: ${this.products[this.products.length - 1].name}`);
        App.closeModal(); App.showToast('Product added!', 'success'); App.navigateTo('store');
    },

    // Restock Items (Purchase Invoice)
    openRestockModal() {
        if (this.products.length === 0) {
            App.showToast('No products available to restock. Add a product first.', 'error');
            return;
        }

        const productOpts = this.products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} (Current Stock: ${p.stock})</option>`).join('');
        const supplierOpts = this.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        const refId = `RESTOCK-${Math.floor(Math.random() * 10000)}`;

        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Restock Store Items (Purchase Invoice)</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="restockForm" onsubmit="StoreModule.saveRestock(event)">
                <div class="form-row">
                    <div class="form-group"><label class="form-label">Invoice Ref *</label><input type="text" class="form-control" id="rst_ref" value="${refId}" required></div>
                    <div class="form-group"><label class="form-label">Supplier *</label><select class="form-control" id="rst_sup" required><option value="">Select Supplier...</option>${supplierOpts}</select></div>
                </div>

                <div class="form-row">
                    <div class="form-group"><label class="form-label">Select Product *</label><select class="form-control" id="rst_product" required>${productOpts}</select></div>
                    <div class="form-group"><label class="form-label">Quantity Received *</label><input type="number" class="form-control" id="rst_qty" min="1" required></div>
                </div>

                <div class="form-row">
                    <div class="form-group"><label class="form-label">Supplier Cost (Total ₹) *</label><input type="number" class="form-control" id="rst_cost" min="0" required></div>
                    <div class="form-group"><label class="form-label">Restock Date *</label><input type="date" class="form-control" id="rst_date" value="${new Date().toISOString().split('T')[0]}" required></div>
                </div>

                <div class="form-group"><label class="form-label">Remarks</label><textarea class="form-control" id="rst_remarks" rows="2" placeholder="Notes on condition, delivery..."></textarea></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-file-invoice"></i> Generate Invoice & Restock</button></div>
            </form>
        `);
    },

    saveRestock(e) {
        e.preventDefault();
        const productId = document.getElementById('rst_product').value;
        const supplierId = document.getElementById('rst_sup').value;
        const qty = parseInt(document.getElementById('rst_qty').value);
        const cost = parseFloat(document.getElementById('rst_cost').value);
        const ref = document.getElementById('rst_ref').value;
        const date = document.getElementById('rst_date').value;
        const remarks = document.getElementById('rst_remarks').value;

        const p = this.products.find(x => x.id === productId);
        const s = this.suppliers.find(x => x.id === supplierId);

        if (p && s && qty > 0) {
            // Increase stock
            p.stock += qty;

            // Generate Invoice Record
            this.invoices.push({
                id: ref,
                date: date,
                supplier: s.name,
                item: p.name,
                qty: qty,
                cost: cost,
                remarks: remarks,
                createdBy: App.currentUser
            });

            AuditLog.add('Create', 'Store', `Restocked ${qty}x ${p.name} from ${s.name} (Ref: ${ref})`);
            App.closeModal();
            App.showToast(`Successfully restocked! Now ${p.stock} in stock.`, 'success');
            App.navigateTo('store');
        } else {
            App.showToast('Invalid product or supplier selection.', 'error');
        }
    },

    placeBid(bidId) {
        const b = this.bids.find(x => x.id === bidId);
        if (!b) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Bid on ${b.item}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="StoreModule.submitBid(event,'${b.id}')">
                <div style="text-align:center;font-size:3rem;margin-bottom:10px">${b.image}</div>
                <div style="text-align:center;margin-bottom:14px"><span style="color:var(--text-muted)">Current bid:</span> <strong style="font-size:1.3rem;color:var(--primary-blue)">₹${b.currentBid.toLocaleString()}</strong></div>
                <div class="form-group"><label class="form-label">Your Name *</label><input type="text" class="form-control" id="bid_name" required></div>
                <div class="form-group"><label class="form-label">Your Bid (₹) *</label><input type="number" class="form-control" id="bid_amt" min="${b.currentBid + 100}" required placeholder="Min: ₹${(b.currentBid + 100).toLocaleString()}" oninput="document.getElementById('bidWords').textContent=numberToWords(parseInt(this.value))"><div class="amount-words" id="bidWords"></div></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary"><i class="fas fa-gavel"></i> Place Bid</button></div>
            </form>
        `);
    },

    submitBid(e, bidId) {
        e.preventDefault();
        const b = this.bids.find(x => x.id === bidId);
        const amt = parseInt(document.getElementById('bid_amt').value);
        if (b && amt > b.currentBid) {
            b.currentBid = amt; b.bidders++;
            App.showToast(`Bid placed: ₹${amt.toLocaleString()}`, 'success');
        }
        App.closeModal(); this.currentTab = 'bidding'; App.navigateTo('store');
    },

    createBid() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Create Bid Listing</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="bidForm" onsubmit="StoreModule.saveBid(event)">
                <div class="form-row"><div class="form-group"><label class="form-label">Item Name *</label><input type="text" class="form-control" id="bid_item" required></div><div class="form-group"><label class="form-label">Category</label><select class="form-control" id="bid_cat"><option>Auction</option><option>Donation Item</option></select></div></div>
                <div class="form-row"><div class="form-group"><label class="form-label">Start Price (₹) *</label><input type="number" class="form-control" id="bid_start" required min="1"></div><div class="form-group"><label class="form-label">Closing Date *</label><input type="date" class="form-control" id="bid_close" required></div></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Create</button></div>
            </form>
        `);
    },

    saveBid(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('bidForm'))) return;
        this.bids.push({
            id: RefNumberGenerator.generateSequential('BID', this.bids, 3),
            item: document.getElementById('bid_item').value,
            category: document.getElementById('bid_cat').value,
            startPrice: parseInt(document.getElementById('bid_start').value),
            currentBid: parseInt(document.getElementById('bid_start').value),
            bidders: 0, closingDate: document.getElementById('bid_close').value, image: '📦'
        });
        App.closeModal(); App.showToast('Bid listing created!', 'success');
        this.currentTab = 'bidding'; App.navigateTo('store');
    },

    // Supplier management
    addSupplier() {
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Add Supplier</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form id="ssupForm" onsubmit="StoreModule.saveSupplier(event)">
                <div class="form-row"><div class="form-group"><label class="form-label">Name *</label><input type="text" class="form-control" id="ssup_name" required></div><div class="form-group"><label class="form-label">Contact *</label><input type="tel" class="form-control" id="ssup_contact" required></div></div>
                <div class="form-row"><div class="form-group"><label class="form-label">Alt Contact</label><input type="tel" class="form-control" id="ssup_alt"></div><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="ssup_email"></div></div>
                <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="ssup_addr" rows="2"></textarea></div>
                <div class="form-group"><label class="form-label">Items Supplied</label><input type="text" class="form-control" id="ssup_items" placeholder="e.g., Brass items, Puja kits"></div>
                <div class="form-group"><label class="form-label">Other Remarks</label><input type="text" class="form-control" id="ssup_remarks"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Add</button></div>
            </form>
        `);
    },

    saveSupplier(e) {
        e.preventDefault();
        if (!App.validateForm(document.getElementById('ssupForm'))) return;
        this.suppliers.push({
            id: RefNumberGenerator.generateSequential('SSUP', this.suppliers, 3),
            name: document.getElementById('ssup_name').value,
            contact: document.getElementById('ssup_contact').value,
            altContact: document.getElementById('ssup_alt').value || '',
            email: document.getElementById('ssup_email').value || '',
            address: document.getElementById('ssup_addr').value || '',
            items: document.getElementById('ssup_items').value || '',
            lastDelivery: '—',
            remarks: document.getElementById('ssup_remarks').value || ''
        });
        AuditLog.add('Create', 'Store', `Added supplier: ${this.suppliers[this.suppliers.length - 1].name}`);
        App.closeModal(); App.showToast('Supplier added!', 'success'); App.navigateTo('store');
    },

    editSupplier(id) {
        const s = this.suppliers.find(x => x.id === id);
        if (!s) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">Edit Supplier ${s.id}</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="StoreModule.updateSupplier(event,'${s.id}')">
                <div class="form-row"><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-control" id="ssupe_name" value="${s.name}" required></div><div class="form-group"><label class="form-label">Contact</label><input class="form-control" id="ssupe_contact" value="${s.contact}" required></div></div>
                <div class="form-row"><div class="form-group"><label class="form-label">Alt Contact</label><input type="tel" class="form-control" id="ssupe_alt" value="${s.altContact || ''}"></div><div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="ssupe_email" value="${s.email || ''}"></div></div>
                <div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="ssupe_addr" rows="2">${s.address || ''}</textarea></div>
                <div class="form-group"><label class="form-label">Items</label><input type="text" class="form-control" id="ssupe_items" value="${s.items}"></div>
                <div class="form-group"><label class="form-label">Other Remarks</label><input type="text" class="form-control" id="ssupe_remarks" value="${s.remarks || ''}"></div>
                <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
            </form>
        `);
    },

    updateSupplier(e, id) {
        e.preventDefault();
        const s = this.suppliers.find(x => x.id === id);
        if (s) {
            s.name = document.getElementById('ssupe_name').value;
            s.contact = document.getElementById('ssupe_contact').value;
            s.altContact = document.getElementById('ssupe_alt').value;
            s.email = document.getElementById('ssupe_email').value;
            s.address = document.getElementById('ssupe_addr').value;
            s.items = document.getElementById('ssupe_items').value;
            s.remarks = document.getElementById('ssupe_remarks').value;
        }
        App.closeModal(); App.showToast('Supplier updated!', 'success'); App.navigateTo('store');
    },

    viewSupplierItems(id) {
        const s = this.suppliers.find(x => x.id === id);
        if (!s) return;
        App.openModal(`
            <div class="modal-header"><h3 class="modal-title">${s.name} — Delivery Items</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
            <div class="stat-row"><span class="stat-label">Items Supplied</span><span class="stat-value">${s.items || '—'}</span></div>
            <div class="stat-row"><span class="stat-label">Last Delivery</span><span class="stat-value">${s.lastDelivery}</span></div>
            <div class="stat-row"><span class="stat-label">Price Notes</span><span class="stat-value">${s.priceNote || '—'}</span></div>
        `);
    }
};
