/* =====================
   TEMPLES MODULE — Devotee Portal
   Temple Discovery, Service Booking, QR Payment, My Bookings, Profile
   ===================== */

window.TemplesModule = {
    // Sub-view state
    currentView: 'explore',    // explore | temple-detail | book-service | payment | my-bookings | profile
    selectedTemple: null,
    selectedService: null,
    lastBooking: null,
    templesCache: [],
    searchQuery: '',

    render() {
        switch (this.currentView) {
            case 'explore':       return this.renderExplore();
            case 'temple-detail': return this.renderTempleDetail();
            case 'book-service':  return this.renderBookService();
            case 'payment':       return this.renderPayment();
            case 'my-bookings':   return this.renderMyBookings();
            case 'profile':       return this.renderProfile();
            default:              return this.renderExplore();
        }
    },

    /* ===================================================================
       SUB-NAV BAR
       =================================================================== */
    subNav() {
        const tabs = [
            { key: 'explore',     icon: 'fa-gopuram',       label: 'Explore Temples' },
            { key: 'my-bookings', icon: 'fa-calendar-check', label: 'My Bookings' },
            { key: 'profile',     icon: 'fa-user',          label: 'My Profile' },
        ];
        return `
        <div class="module-tabs" style="margin-bottom:20px;">
            ${tabs.map(t => `
                <button class="module-tab ${this.currentView === t.key ? 'active' : ''}"
                        onclick="TemplesModule.switchView('${t.key}')">
                    <i class="fas ${t.icon}"></i> ${t.label}
                </button>
            `).join('')}
        </div>`;
    },

    switchView(view) {
        this.currentView = view;
        App.navigateTo('temples');
    },

    /* ===================================================================
       EXPLORE TEMPLES — Tile Grid
       =================================================================== */
    renderExplore() {
        setTimeout(() => this.loadTemples(), 100);
        return `
        <div class="module-header">
            <h2><i class="fas fa-gopuram"></i> Explore Temples</h2>
            <p style="color:var(--text-muted);margin-top:4px">Discover and book services at temples across India</p>
        </div>
        ${this.subNav()}
        <div class="temples-search-bar" style="margin-bottom:20px;display:flex;gap:12px;align-items:center;">
            <div style="flex:1;position:relative;">
                <i class="fas fa-search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);"></i>
                <input type="text" id="templeSearchInput" class="form-control"
                    placeholder="Search temples by name..."
                    value="${this.searchQuery}"
                    onkeyup="TemplesModule.onSearchInput(this.value)"
                    style="padding-left:40px;width:100%;border-radius:12px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);padding:12px 16px 12px 40px;font-size:0.95rem;">
            </div>
        </div>
        <div id="templesGrid" class="temples-grid">
            <div style="text-align:center;padding:60px 0;color:var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
                Loading temples...
            </div>
        </div>`;
    },

    onSearchInput(value) {
        this.searchQuery = value;
        clearTimeout(this._searchDebounce);
        this._searchDebounce = setTimeout(() => this.loadTemples(), 300);
    },

    async loadTemples() {
        const grid = document.getElementById('templesGrid');
        if (!grid) return;

        try {
            const data = await TemplePortalService.getTemples(0, 50, this.searchQuery);
            this.templesCache = data.temples || [];

            if (this.templesCache.length === 0) {
                grid.innerHTML = `
                <div style="text-align:center;padding:80px 0;color:var(--text-muted);">
                    <i class="fas fa-gopuram" style="font-size:3rem;margin-bottom:16px;display:block;opacity:0.3;"></i>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary);">No temples found</h3>
                    <p>Try a different search or check back later.</p>
                </div>`;
                return;
            }

            grid.innerHTML = this.templesCache.map(t => this.templeCard(t)).join('');
        } catch (e) {
            console.error('[Temples] Load error:', e);
            grid.innerHTML = `
            <div style="text-align:center;padding:80px 0;color:var(--text-muted);">
                <i class="fas fa-exclamation-triangle" style="font-size:2.5rem;margin-bottom:16px;display:block;color:var(--primary-orange);"></i>
                <h3 style="margin-bottom:8px;">Unable to load temples</h3>
                <p>${e.message || 'Please try again later.'}</p>
                <button class="btn btn-primary" onclick="TemplesModule.loadTemples()" style="margin-top:16px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
        }
    },

    templeCard(temple) {
        const imgUrl = temple.image_url || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=250&fit=crop';
        const location = [temple.location, temple.district, temple.state].filter(Boolean).join(', ') || 'India';
        return `
        <div class="temple-card" onclick="TemplesModule.openTemple('${temple.id}')" style="cursor:pointer;">
            <div class="temple-card-img" style="background-image:url('${imgUrl}');height:180px;background-size:cover;background-position:center;border-radius:14px 14px 0 0;position:relative;">
                <div style="position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,rgba(0,0,0,0.7));border-radius:0 0 0 0;"></div>
            </div>
            <div class="temple-card-body" style="padding:16px;">
                <h3 class="temple-card-title" style="font-size:1.05rem;font-weight:700;margin-bottom:6px;color:var(--text-primary);">${temple.name}</h3>
                <p class="temple-card-location" style="font-size:0.82rem;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
                    <i class="fas fa-map-marker-alt" style="color:var(--primary-red);"></i> ${location}
                </p>
            </div>
        </div>`;
    },

    /* ===================================================================
       TEMPLE PROFILE PAGE
       =================================================================== */
    async openTemple(templeId) {
        this.selectedTemple = null;
        this.currentView = 'temple-detail';
        App.navigateTo('temples');

        try {
            const [temple, services] = await Promise.all([
                TemplePortalService.getTemple(templeId),
                TemplePortalService.getTempleServices(templeId),
            ]);
            this.selectedTemple = { ...temple, services };
            // Re-render with loaded data
            const content = document.getElementById('pageContent');
            if (content) {
                content.innerHTML = this.renderTempleDetail();
            }
        } catch (e) {
            console.error('[Temples] Load temple error:', e);
            App.showToast('Failed to load temple details', 'error');
        }
    },

    renderTempleDetail() {
        const t = this.selectedTemple;
        if (!t) {
            return `
            <div class="module-header">
                <button class="btn btn-outline" onclick="TemplesModule.switchView('explore')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>
            <div style="text-align:center;padding:80px 0;color:var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
                Loading temple details...
            </div>`;
        }

        const imgUrl = t.image_url || 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=400&fit=crop';
        const location = [t.location, t.district, t.state, t.country].filter(Boolean).join(', ') || 'India';
        const services = t.services || [];

        // Service type icon map
        const serviceIcons = {
            'ARCHANA': 'fa-om',
            'OFFERING': 'fa-hand-holding-dollar',
            'HALL_BOOKING': 'fa-building',
            'DONATION': 'fa-donate',
            'STORE': 'fa-store',
        };
        const serviceColors = {
            'ARCHANA': 'var(--primary-orange)',
            'OFFERING': 'var(--primary-teal)',
            'HALL_BOOKING': 'var(--primary-blue)',
            'DONATION': 'var(--primary-red)',
            'STORE': 'var(--primary-green, #4caf50)',
        };

        return `
        <div class="module-header" style="margin-bottom:0;">
            <button class="btn btn-outline" onclick="TemplesModule.switchView('explore')" style="margin-bottom:16px;">
                <i class="fas fa-arrow-left"></i> Back to Temples
            </button>
        </div>

        <!-- Hero Banner -->
        <div class="temple-hero" style="border-radius:16px;overflow:hidden;margin-bottom:24px;position:relative;height:280px;background-image:url('${imgUrl}');background-size:cover;background-position:center;">
            <div style="position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(0,0,0,0.85));display:flex;flex-direction:column;justify-content:flex-end;padding:28px;">
                <h1 style="font-size:1.8rem;font-weight:800;color:#fff;margin-bottom:6px;">${t.name}</h1>
                <p style="color:rgba(255,255,255,0.8);display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-map-marker-alt"></i> ${location}
                </p>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;">
            <!-- Info Cards Row -->
            <div class="card" style="border-radius:14px;padding:20px;">
                <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-clock" style="color:var(--primary-orange);"></i> Temple Timings
                </h3>
                <div style="display:flex;gap:20px;">
                    <div>
                        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Opening</div>
                        <div style="font-size:1.1rem;font-weight:700;color:var(--primary-green, #4caf50);">${t.opening_time || '06:00'}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Closing</div>
                        <div style="font-size:1.1rem;font-weight:700;color:var(--primary-red);">${t.closing_time || '20:00'}</div>
                    </div>
                </div>
            </div>
            <div class="card" style="border-radius:14px;padding:20px;">
                <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-phone" style="color:var(--primary-blue);"></i> Contact
                </h3>
                ${t.contact_number ? `<div style="margin-bottom:6px;"><i class="fas fa-phone-alt" style="width:20px;color:var(--text-muted);"></i> ${t.contact_number}</div>` : ''}
                ${t.email ? `<div><i class="fas fa-envelope" style="width:20px;color:var(--text-muted);"></i> ${t.email}</div>` : ''}
                ${!t.contact_number && !t.email ? '<div style="color:var(--text-muted);">Contact info not available</div>' : ''}
            </div>
        </div>

        ${t.history ? `
        <div class="card" style="border-radius:14px;padding:20px;margin-bottom:24px;">
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-book" style="color:var(--primary-orange);"></i> Temple History
            </h3>
            <p style="color:var(--text-secondary);line-height:1.7;">${t.history}</p>
        </div>` : ''}

        ${t.description ? `
        <div class="card" style="border-radius:14px;padding:20px;margin-bottom:24px;">
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-info-circle" style="color:var(--primary-blue);"></i> About
            </h3>
            <p style="color:var(--text-secondary);line-height:1.7;">${t.description}</p>
        </div>` : ''}

        ${t.live_stream_url ? `
        <div class="card" style="border-radius:14px;padding:20px;margin-bottom:24px;">
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-video" style="color:var(--primary-red);"></i> Live Streaming
            </h3>
            <a href="${t.live_stream_url}" target="_blank" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:8px;">
                <i class="fas fa-play-circle"></i> Watch Live
            </a>
        </div>` : ''}

        ${t.latitude && t.longitude ? `
        <div class="card" style="border-radius:14px;padding:20px;margin-bottom:24px;">
            <h3 style="font-size:1rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-map" style="color:var(--primary-teal);"></i> Location
            </h3>
            <a href="https://www.google.com/maps?q=${t.latitude},${t.longitude}" target="_blank" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:8px;">
                <i class="fas fa-external-link-alt"></i> Open in Google Maps
            </a>
        </div>` : ''}

        <!-- Services -->
        <div style="margin-bottom:24px;">
            <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-hands-praying" style="color:var(--primary-orange);"></i> Temple Services
            </h3>
            ${services.length === 0 ? `
                <div style="text-align:center;padding:40px;color:var(--text-muted);background:var(--glass-bg);border-radius:14px;border:1px solid var(--border);">
                    <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;opacity:0.4;"></i>
                    <p>No services available at this temple yet.</p>
                </div>
            ` : `
                <div class="temples-grid" style="grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));">
                    ${services.map(s => `
                        <div class="service-tile card" onclick="TemplesModule.openBookService('${s.id}')"
                            style="cursor:pointer;border-radius:14px;padding:20px;text-align:center;transition:all 0.2s;border:1px solid var(--border);">
                            <div style="width:48px;height:48px;border-radius:12px;background:${serviceColors[s.service_type] || 'var(--primary-blue)'};display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#fff;font-size:1.2rem;">
                                <i class="fas ${serviceIcons[s.service_type] || 'fa-hand-holding-heart'}"></i>
                            </div>
                            <h4 style="font-size:0.95rem;font-weight:700;margin-bottom:4px;color:var(--text-primary);">${s.service_name}</h4>
                            <div style="font-size:0.85rem;color:var(--primary-orange);font-weight:700;">₹${s.price.toLocaleString('en-IN')}</div>
                            ${s.description ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">${s.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        `;
    },

    /* ===================================================================
       BOOK SERVICE
       =================================================================== */
    openBookService(serviceId) {
        if (!this.selectedTemple || !this.selectedTemple.services) return;
        this.selectedService = this.selectedTemple.services.find(s => s.id === serviceId);
        if (!this.selectedService) {
            App.showToast('Service not found', 'error');
            return;
        }
        this.currentView = 'book-service';
        App.navigateTo('temples');
    },

    renderBookService() {
        const s = this.selectedService;
        const t = this.selectedTemple;
        if (!s || !t) {
            this.currentView = 'explore';
            return this.renderExplore();
        }

        // Pre-fill from profile if available
        const user = typeof AuthService !== 'undefined' ? AuthService.getCurrentUser() : null;

        return `
        <div class="module-header" style="margin-bottom:0;">
            <button class="btn btn-outline" onclick="TemplesModule.currentView='temple-detail'; App.navigateTo('temples');" style="margin-bottom:16px;">
                <i class="fas fa-arrow-left"></i> Back to ${t.name}
            </button>
        </div>

        <div class="card" style="border-radius:16px;padding:28px;max-width:600px;">
            <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;display:flex;align-items:center;gap:10px;">
                <i class="fas fa-calendar-plus" style="color:var(--primary-orange);"></i> Book Service
            </h2>
            <p style="color:var(--text-muted);margin-bottom:24px;">
                ${s.service_name} at <strong>${t.name}</strong>
            </p>

            <div style="background:var(--glass-bg);border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid var(--border);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Service</div>
                        <div style="font-weight:700;">${s.service_name}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">Amount</div>
                        <div style="font-size:1.3rem;font-weight:800;color:var(--primary-orange);">₹${s.price.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            </div>

            <form id="bookingForm" onsubmit="TemplesModule.submitBooking(event)">
                <div style="display:grid;gap:16px;">
                    <div>
                        <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Devotee Name *</label>
                        <input type="text" id="bookDeVoteeName" class="form-control" required placeholder="Enter your full name"
                            style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;">
                    </div>
                    <div>
                        <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Phone Number *</label>
                        <input type="tel" id="bookDevoteePhone" class="form-control" required placeholder="Enter phone number"
                            style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;">
                    </div>
                    <div>
                        <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Booking Date *</label>
                        <input type="date" id="bookDate" class="form-control" required
                            min="${new Date().toISOString().split('T')[0]}"
                            style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;">
                    </div>
                    <div>
                        <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Notes (Optional)</label>
                        <textarea id="bookNotes" rows="3" placeholder="Any special instructions..."
                            style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;resize:vertical;font-family:inherit;"></textarea>
                    </div>
                </div>

                <button type="submit" id="bookSubmitBtn" class="btn btn-primary" style="margin-top:24px;width:100%;padding:14px;font-size:1rem;font-weight:700;border-radius:12px;">
                    <i class="fas fa-check-circle"></i> Confirm Booking — ₹${s.price.toLocaleString('en-IN')}
                </button>
            </form>
        </div>`;
    },

    async submitBooking(event) {
        event.preventDefault();
        const btn = document.getElementById('bookSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            const booking = await TemplePortalService.createBooking({
                temple_id: this.selectedTemple.id,
                service_id: this.selectedService.id,
                booking_date: document.getElementById('bookDate').value,
                devotee_name: document.getElementById('bookDeVoteeName').value,
                devotee_phone: document.getElementById('bookDevoteePhone').value,
                notes: document.getElementById('bookNotes')?.value || '',
            });

            this.lastBooking = booking;
            App.showToast('Booking created successfully!', 'success');
            this.currentView = 'payment';
            App.navigateTo('temples');
        } catch (e) {
            console.error('[Temples] Booking error:', e);
            App.showToast(e.message || 'Booking failed', 'error');
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-check-circle"></i> Confirm Booking — ₹${this.selectedService.price.toLocaleString('en-IN')}`;
        }
    },

    /* ===================================================================
       QR / UPI PAYMENT PAGE
       =================================================================== */
    renderPayment() {
        const booking = this.lastBooking;
        if (!booking) {
            this.currentView = 'explore';
            return this.renderExplore();
        }

        // Load payment details asynchronously
        setTimeout(() => this.loadPaymentDetails(booking.id), 100);

        return `
        <div class="module-header" style="margin-bottom:0;">
            <button class="btn btn-outline" onclick="TemplesModule.switchView('my-bookings')" style="margin-bottom:16px;">
                <i class="fas fa-arrow-left"></i> My Bookings
            </button>
        </div>

        <div class="card" style="border-radius:16px;padding:32px;max-width:500px;text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg, var(--primary-orange), #ff8a65);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#fff;font-size:1.6rem;">
                <i class="fas fa-qrcode"></i>
            </div>
            <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:4px;">Complete Payment</h2>
            <p style="color:var(--text-muted);margin-bottom:24px;">Scan the QR code or use UPI ID to pay</p>

            <div style="background:var(--glass-bg);border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid var(--border);">
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                    <span style="color:var(--text-muted);">Service</span>
                    <span style="font-weight:700;">${booking.service_name || 'Service'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                    <span style="color:var(--text-muted);">Booking ID</span>
                    <span style="font-weight:600;font-size:0.85rem;">${String(booking.id).slice(0, 8).toUpperCase()}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:var(--text-muted);">Amount</span>
                    <span style="font-size:1.3rem;font-weight:800;color:var(--primary-orange);">₹${booking.amount.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <!-- QR Code Container -->
            <div id="paymentQRContainer" style="background:#fff;border-radius:14px;padding:24px;margin-bottom:20px;display:inline-block;">
                <div id="qrCodeEl" style="display:flex;align-items:center;justify-content:center;min-height:200px;">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#999;"></i>
                </div>
            </div>

            <div id="upiIdDisplay" style="margin-bottom:20px;color:var(--text-muted);font-size:0.9rem;">
                Loading payment details...
            </div>

            <div style="background:rgba(255,183,77,0.1);border-radius:12px;padding:16px;border:1px solid rgba(255,183,77,0.2);text-align:left;">
                <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:8px;color:var(--primary-orange);">
                    <i class="fas fa-info-circle"></i> Payment Instructions
                </h4>
                <ol style="font-size:0.82rem;color:var(--text-secondary);padding-left:16px;line-height:1.8;">
                    <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                    <li>Scan the QR code above</li>
                    <li>Verify the amount and complete payment</li>
                    <li>Your booking will be confirmed automatically</li>
                </ol>
            </div>

            <button class="btn btn-outline" onclick="TemplesModule.switchView('my-bookings')" style="margin-top:20px;">
                <i class="fas fa-list"></i> View My Bookings
            </button>
        </div>`;
    },

    async loadPaymentDetails(bookingId) {
        try {
            const payment = await TemplePortalService.getBookingPayment(bookingId);
            const upiId = payment.upi_id || 'temple@upi';
            const amount = payment.amount;

            // Display UPI ID
            const upiDisplay = document.getElementById('upiIdDisplay');
            if (upiDisplay) {
                upiDisplay.innerHTML = `
                    <div style="font-weight:700;color:var(--text-primary);font-size:1rem;margin-bottom:4px;">UPI ID: ${upiId}</div>
                    <button onclick="navigator.clipboard.writeText('${upiId}');App.showToast('UPI ID copied!','success');"
                        style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.8rem;color:var(--text-secondary);">
                        <i class="fas fa-copy"></i> Copy UPI ID
                    </button>`;
            }

            // Generate QR code (UPI deep link format)
            const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Temple&am=${amount}&cu=INR&tn=TempleService`;
            const qrEl = document.getElementById('qrCodeEl');
            if (qrEl && typeof QRCode !== 'undefined') {
                qrEl.innerHTML = '';
                new QRCode(qrEl, {
                    text: upiLink,
                    width: 200,
                    height: 200,
                    colorDark: '#1a237e',
                    colorLight: '#ffffff',
                });
            } else if (qrEl) {
                // Fallback if QRCode library not loaded
                qrEl.innerHTML = `
                    <div style="padding:20px;color:#666;">
                        <i class="fas fa-qrcode" style="font-size:4rem;margin-bottom:12px;display:block;"></i>
                        <p style="font-size:0.85rem;">QR Code</p>
                        <p style="font-size:0.75rem;word-break:break-all;max-width:200px;">${upiLink}</p>
                    </div>`;
            }
        } catch (e) {
            console.error('[Temples] Payment details error:', e);
            const upiDisplay = document.getElementById('upiIdDisplay');
            if (upiDisplay) {
                upiDisplay.innerHTML = '<span style="color:var(--primary-red);">Could not load payment details</span>';
            }
        }
    },

    /* ===================================================================
       MY BOOKINGS
       =================================================================== */
    renderMyBookings() {
        setTimeout(() => this.loadMyBookings(), 100);
        return `
        <div class="module-header">
            <h2><i class="fas fa-calendar-check"></i> My Bookings</h2>
            <p style="color:var(--text-muted);margin-top:4px">Your service bookings across temples</p>
        </div>
        ${this.subNav()}
        <div id="myBookingsList">
            <div style="text-align:center;padding:60px 0;color:var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
                Loading your bookings...
            </div>
        </div>`;
    },

    async loadMyBookings() {
        const container = document.getElementById('myBookingsList');
        if (!container) return;

        try {
            const bookings = await TemplePortalService.getMyBookings();

            if (!bookings || bookings.length === 0) {
                container.innerHTML = `
                <div style="text-align:center;padding:80px 0;color:var(--text-muted);">
                    <i class="fas fa-calendar" style="font-size:3rem;margin-bottom:16px;display:block;opacity:0.3;"></i>
                    <h3 style="margin-bottom:8px;color:var(--text-secondary);">No bookings yet</h3>
                    <p>Explore temples and book services to see them here.</p>
                    <button class="btn btn-primary" onclick="TemplesModule.switchView('explore')" style="margin-top:16px;">
                        <i class="fas fa-gopuram"></i> Explore Temples
                    </button>
                </div>`;
                return;
            }

            const statusColors = {
                'PENDING': 'var(--primary-orange)',
                'PAID': 'var(--primary-green, #4caf50)',
                'CANCELLED': 'var(--primary-red)',
            };
            const statusIcons = {
                'PENDING': 'fa-clock',
                'PAID': 'fa-check-circle',
                'CANCELLED': 'fa-times-circle',
            };

            container.innerHTML = `
            <div class="data-table" style="border-radius:14px;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="padding:14px 16px;text-align:left;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Booking ID</th>
                            <th style="padding:14px 16px;text-align:left;font-size:0.78rem;text-transform:uppercase;">Temple</th>
                            <th style="padding:14px 16px;text-align:left;font-size:0.78rem;text-transform:uppercase;">Service</th>
                            <th style="padding:14px 16px;text-align:left;font-size:0.78rem;text-transform:uppercase;">Date</th>
                            <th style="padding:14px 16px;text-align:right;font-size:0.78rem;text-transform:uppercase;">Amount</th>
                            <th style="padding:14px 16px;text-align:center;font-size:0.78rem;text-transform:uppercase;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(b => `
                        <tr style="border-top:1px solid var(--border);">
                            <td style="padding:14px 16px;font-weight:600;font-size:0.85rem;">${String(b.id).slice(0, 8).toUpperCase()}</td>
                            <td style="padding:14px 16px;">${b.temple_name || '—'}</td>
                            <td style="padding:14px 16px;">${b.service_name || '—'}</td>
                            <td style="padding:14px 16px;">${new Date(b.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td style="padding:14px 16px;text-align:right;font-weight:700;color:var(--primary-orange);">₹${b.amount.toLocaleString('en-IN')}</td>
                            <td style="padding:14px 16px;text-align:center;">
                                <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:0.78rem;font-weight:700;background:${statusColors[b.status] || 'var(--primary-blue)'}22;color:${statusColors[b.status] || 'var(--primary-blue)'};">
                                    <i class="fas ${statusIcons[b.status] || 'fa-circle'}"></i> ${b.status}
                                </span>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        } catch (e) {
            console.error('[Temples] My bookings error:', e);
            container.innerHTML = `
            <div style="text-align:center;padding:80px 0;color:var(--text-muted);">
                <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:12px;display:block;color:var(--primary-orange);"></i>
                <p>Could not load bookings. ${e.message}</p>
                <button class="btn btn-primary" onclick="TemplesModule.loadMyBookings()" style="margin-top:12px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
        }
    },

    /* ===================================================================
       DEVOTEE PROFILE
       =================================================================== */
    renderProfile() {
        setTimeout(() => this.loadProfile(), 100);
        return `
        <div class="module-header">
            <h2><i class="fas fa-user"></i> My Profile</h2>
            <p style="color:var(--text-muted);margin-top:4px">Manage your devotee profile</p>
        </div>
        ${this.subNav()}
        <div id="profileContainer" style="max-width:600px;">
            <div style="text-align:center;padding:60px 0;color:var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;"></i>
            </div>
        </div>`;
    },

    async loadProfile() {
        const container = document.getElementById('profileContainer');
        if (!container) return;

        try {
            const profile = await TemplePortalService.getMyProfile();
            container.innerHTML = `
            <div class="card" style="border-radius:16px;padding:28px;">
                <form id="profileForm" onsubmit="TemplesModule.saveProfile(event)">
                    <div style="display:grid;gap:16px;">
                        <div>
                            <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Name</label>
                            <input type="text" id="profName" class="form-control" value="${profile.name || ''}" placeholder="Your full name"
                                style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;">
                        </div>
                        <div>
                            <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Nakshatra (Star)</label>
                            <select id="profNakshatra" class="form-control"
                                style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;">
                                <option value="">Select Nakshatra</option>
                                ${(window.NAKSHATRAS || []).map(n => `<option value="${n}" ${profile.nakshatra === n ? 'selected' : ''}>${n}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Gothram</label>
                            <input type="text" id="profGothram" class="form-control" value="${profile.gothram || ''}" placeholder="Enter gothram"
                                style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;">
                        </div>
                        <div>
                            <label style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);display:block;margin-bottom:6px;">Address</label>
                            <textarea id="profAddress" rows="3" placeholder="Enter your address"
                                style="border-radius:10px;padding:12px 14px;border:1px solid var(--border);background:var(--glass-bg);color:var(--text-primary);width:100%;font-size:0.95rem;resize:vertical;font-family:inherit;">${profile.address || ''}</textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top:24px;width:100%;padding:14px;font-size:1rem;font-weight:700;border-radius:12px;">
                        <i class="fas fa-save"></i> Save Profile
                    </button>
                </form>
            </div>`;
        } catch (e) {
            container.innerHTML = `
            <div class="card" style="border-radius:16px;padding:28px;text-align:center;color:var(--text-muted);">
                <i class="fas fa-user-circle" style="font-size:3rem;margin-bottom:12px;display:block;opacity:0.3;"></i>
                <p>Could not load profile. ${e.message}</p>
                <button class="btn btn-primary" onclick="TemplesModule.loadProfile()" style="margin-top:12px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
        }
    },

    async saveProfile(event) {
        event.preventDefault();
        try {
            await TemplePortalService.updateMyProfile({
                name: document.getElementById('profName').value,
                nakshatra: document.getElementById('profNakshatra').value,
                gothram: document.getElementById('profGothram').value,
                address: document.getElementById('profAddress').value,
            });
            App.showToast('Profile updated successfully!', 'success');
        } catch (e) {
            App.showToast(e.message || 'Failed to update profile', 'error');
        }
    },
};

console.log('[Modules] temples.js loaded');
