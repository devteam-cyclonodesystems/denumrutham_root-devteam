/* =====================
   COMMUNICATION MODULE
   (Merged WhatsApp & Live Streaming)
   ===================== */
window.CommunicationModule = {
    // WhatsApp State
    templates: [
        { id: 'TPL001/0326', name: 'Booking Confirmation', trigger: 'On booking confirmed', msg: '🙏 Namaste {name}! Your {type} booking (#{id}) is confirmed for {date} at {time}. Temple: Sri Venkateswara. — TMS Pro', status: 'active', sent: 142 },
        { id: 'TPL002/0326', name: 'Donation Receipt', trigger: 'On donation recorded', msg: '🙏 Thank you {name}! Your donation of ₹{amount} to {category} has been received. Receipt: {receipt}. — TMS Pro', status: 'active', sent: 86 },
        { id: 'TPL003/0326', name: 'Event Reminder', trigger: '1 day before event', msg: '🔔 Reminder: {event} is tomorrow at {time}. We look forward to seeing you! — TMS Pro', status: 'active', sent: 245 },
        { id: 'TPL004/0326', name: 'Festival Announcement', trigger: 'Manual broadcast', msg: '🎉 Join us for {festival} celebrations! Special poojas, cultural programs, and Anna Daanam. Date: {date}. — TMS Pro', status: 'active', sent: 1520 },
        { id: 'TPL005/0326', name: 'Store Order Update', trigger: 'On order status change', msg: '📦 Your order (#{id}) is now {status}. Track: {link}. — TMS Pro', status: 'paused', sent: 38 },
        { id: 'TPL006/0326', name: 'Birthday Blessings', trigger: 'On devotee birthday', msg: '🎂 Happy Birthday {name}! May the divine blessings be with you always. Visit our temple for special blessings. — TMS Pro', status: 'active', sent: 312 },
    ],
    logs: [
        { to: 'Rajesh Kumar', phone: '9876543210', template: 'Booking Confirmation', time: '10 min ago', status: 'delivered', createdBy: 'Admin' },
        { to: 'Lakshmi Devi', phone: '9871234560', template: 'Donation Receipt', time: '32 min ago', status: 'delivered', createdBy: 'Admin' },
        { to: 'Broadcast (1,520)', phone: 'All devotees', template: 'Festival Announcement', time: '2 hours ago', status: 'sent', createdBy: 'Admin' },
        { to: 'Priya S.', phone: '9871234564', template: 'Store Order Update', time: '3 hours ago', status: 'delivered', createdBy: 'Admin' },
        { to: 'Karthik S.', phone: '9876543213', template: 'Event Reminder', time: 'Yesterday', status: 'failed', createdBy: 'Admin' },
    ],

    // Live Streaming State
    streams: [
        { id: 'LS001/0326', title: 'Morning Suprabhatam & Abhishekam', schedule: 'Daily 5:00 AM', status: 'scheduled', viewers: 0, duration: '1 hour', createdBy: 'Admin' },
        { id: 'LS002/0326', title: 'Noon Archanai & Deeparadhana', schedule: 'Daily 12:00 PM', status: 'live', viewers: 342, duration: '45 min', createdBy: 'Admin' },
        { id: 'LS003/0326', title: 'Evening Deeparadhana', schedule: 'Daily 6:30 PM', status: 'scheduled', viewers: 0, duration: '30 min', createdBy: 'Admin' },
        { id: 'LS004/0326', title: 'Maha Shivaratri Special', schedule: 'Feb 26, 2026 - All Day', status: 'scheduled', viewers: 0, duration: '12 hours', createdBy: 'Admin' },
        { id: 'LS005/0326', title: 'Weekly Pravachanam', schedule: 'Every Sunday 10:00 AM', status: 'scheduled', viewers: 0, duration: '2 hours', createdBy: 'Admin' },
    ],
    stats: { totalViewers: 52400, avgViewers: 285, peakViewers: 1820, totalHours: 1450 },

    // Email State
    emailCampaigns: [
        { id: 'EML001', name: 'Monthly Newsletter - Feb 2026', subject: 'Temple Highlights & Upcoming Events', status: 'sent', sentTo: 8400, openRate: '42%' },
        { id: 'EML002', name: 'Maha Shivaratri Invitation', subject: 'Join us for Maha Shivaratri 2026', status: 'scheduled', sentTo: 15200, openRate: '-' },
        { id: 'EML003', name: 'Donation Drive 2026', subject: 'Support Anna Daanam Program', status: 'draft', sentTo: 0, openRate: '-' }
    ],
    emailLogs: [
        { to: 'rajesh.k@example.com', subject: 'Donation Receipt', time: '10 min ago', status: 'delivered' },
        { to: 'lakshmi.d@example.com', subject: 'Hall Booking Confirmation', time: '1 hour ago', status: 'delivered' },
        { to: 'priya.s@example.com', subject: 'Password Reset', time: '2 hours ago', status: 'bounced' }
    ],

    currentTab: 'whatsapp',

    switchTab(tab) {
        this.currentTab = tab;
        App.navigateTo('communication');
    },

    render() {
        const totalSent = this.templates.reduce((s, t) => s + t.sent, 0);
        const active = this.templates.filter(t => t.status === 'active').length;
        const lb = s => s === 'delivered' ? 'badge-success' : s === 'sent' ? 'badge-info' : s === 'failed' ? 'badge-danger' : 'badge-warning';

        const live = this.streams.find(s => s.status === 'live');
        const sb = s => s === 'live' ? 'badge-danger' : s === 'scheduled' ? 'badge-info' : 'badge-success';

        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-bullhorn"></i> Communication Hub</h1>
            <div style="display:flex;gap:10px">
                ${this.currentTab === 'live' ? `<button class="btn btn-danger" onclick="CommunicationModule.goLive()"><i class="fas fa-broadcast-tower"></i> Go Live</button>` : ''}
                ${this.currentTab === 'whatsapp' ? `<button class="btn btn-success" onclick="CommunicationModule.broadcast()"><i class="fab fa-whatsapp"></i> New WA Broadcast</button>` : ''}
                ${this.currentTab === 'email' ? `<button class="btn btn-primary" onclick="CommunicationModule.newEmailCampaign()"><i class="fas fa-envelope"></i> New Email Campaign</button>` : ''}
            </div>
        </div>

        <div class="section-card" style="padding:0; margin-bottom: 24px; background: transparent; box-shadow: none;">
            <div class="tabs-bar" style="margin: 0;">
                <button class="tab-btn ${this.currentTab === 'whatsapp' ? 'active' : ''}" onclick="CommunicationModule.switchTab('whatsapp')"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                <button class="tab-btn ${this.currentTab === 'email' ? 'active' : ''}" onclick="CommunicationModule.switchTab('email')"><i class="fas fa-envelope"></i> Email</button>
                <button class="tab-btn ${this.currentTab === 'live' ? 'active' : ''}" onclick="CommunicationModule.switchTab('live')"><i class="fas fa-video"></i> Live Streaming</button>
            </div>
        </div>

        ${this.currentTab === 'whatsapp' ? this.renderWhatsAppTab(totalSent, lb) :
                this.currentTab === 'email' ? this.renderEmailTab(lb) :
                    this.renderLiveTab(live, sb)}
        `;
    },

    renderWhatsAppTab(totalSent, lb) {
        return `
        <div style="display:flex; gap: 20px; align-items: stretch; margin-bottom: 24px; flex-wrap: wrap">
            <div class="section-card" style="flex: 1; margin:0; min-width: 300px">
                <div class="section-header"><div class="section-title"><i class="fab fa-whatsapp"></i> WhatsApp Status</div></div>
                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="kpi-card" style="background:var(--grad-green); padding: 15px;"><i class="fab fa-whatsapp kpi-icon"></i><div class="kpi-label">Messages Sent</div><div class="kpi-value" style="font-size:1.5rem">${totalSent.toLocaleString()}</div></div>
                    <div class="kpi-card" style="background:var(--grad-blue); padding: 15px;"><i class="fas fa-file-alt kpi-icon"></i><div class="kpi-label">Templates</div><div class="kpi-value" style="font-size:1.5rem">${this.templates.length}</div></div>
                </div>
            </div>
        </div>

        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-file-alt"></i> Message Templates</div>
                <button class="btn btn-outline btn-sm" onclick="CommunicationModule.addTemplate()"><i class="fas fa-plus"></i> New Template</button>
            </div>
            ${this.templates.map(t => `<div class="workflow-card ${t.status === 'active' ? 'active-wf' : 'paused-wf'}" style="cursor:default">
                <div class="wf-icon" style="background:${t.status === 'active' ? 'var(--grad-green)' : 'var(--grad-orange)'}"><i class="fab fa-whatsapp"></i></div>
                <div class="wf-info" style="flex:1">
                    <div class="wf-name">${t.name} <span class="badge" style="font-size:0.7rem; color:#666; margin-left: 6px;">${t.id}</span></div>
                    <div class="wf-desc">Trigger: ${t.trigger}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;background:#f8f9fc;padding:8px 12px;border-radius:8px;font-style:italic">${t.msg}</div>
                    <div class="wf-stats"><span class="wf-stat"><strong>${t.sent}</strong> sent</span></div>
                </div>
                <div class="wf-toggle ${t.status === 'active' ? 'on' : ''}" onclick="CommunicationModule.toggleTemplate('${t.id}',this)"></div>
            </div>`).join('')}
        </div>
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-history"></i> Recent Messages</div></div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>Recipient</th><th>Phone</th><th>Template</th><th>Time</th><th>User / Sender</th><th>Status</th></tr></thead><tbody>
                ${this.logs.map(l => `<tr><td><strong>${l.to}</strong></td><td>${l.phone}</td><td>${l.template}</td><td>${l.time}</td><td><i class="fas fa-user-circle"></i> ${l.createdBy}</td><td><span class="badge ${lb(l.status)}">${l.status}</span></td></tr>`).join('')}
            </tbody></table>
            </div>
        </div>
        `;
    },

    renderEmailTab(lb) {
        return `
        <div style="display:flex; gap: 20px; align-items: stretch; margin-bottom: 24px; flex-wrap: wrap">
            <div class="section-card" style="flex: 1; margin:0; min-width: 300px">
                <div class="section-header"><div class="section-title"><i class="fas fa-envelope"></i> Email Status</div></div>
                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="kpi-card" style="background:var(--grad-purple); padding: 15px;"><i class="fas fa-paper-plane kpi-icon"></i><div class="kpi-label">Emails Sent (Monthly)</div><div class="kpi-value" style="font-size:1.5rem">12,450</div></div>
                    <div class="kpi-card" style="background:var(--grad-orange); padding: 15px;"><i class="fas fa-envelope-open kpi-icon"></i><div class="kpi-label">Avg Open Rate</div><div class="kpi-value" style="font-size:1.5rem">46%</div></div>
                </div>
            </div>
        </div>

        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-images"></i> Campaigns</div></div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>Campaign ID</th><th>Name / Subject</th><th>Status</th><th>Sent To</th><th>Open Rate</th><th>Actions</th></tr></thead><tbody>
                ${this.emailCampaigns.map(c => `<tr>
                    <td><strong>${c.id}</strong></td>
                    <td><strong>${c.name}</strong><br><small style="color:var(--text-muted)">${c.subject}</small></td>
                    <td><span class="badge ${c.status === 'sent' ? 'badge-success' : c.status === 'scheduled' ? 'badge-info' : 'badge-warning'}">${c.status}</span></td>
                    <td>${c.sentTo.toLocaleString()}</td>
                    <td><strong>${c.openRate}</strong></td>
                    <td>
                        <button class="action-btn edit-btn" onclick="CommunicationModule.editEmailCampaign('${c.id}')"><i class="fas fa-pen"></i></button>
                    </td>
                </tr>`).join('')}
            </tbody></table>
            </div>
        </div>

        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-history"></i> Recent Outgoing Emails</div></div>
            <div style="overflow-x:auto">
            <table class="data-table"><thead><tr><th>Recipient Email</th><th>Subject</th><th>Time</th><th>Status</th></tr></thead><tbody>
                ${this.emailLogs.map(l => `<tr><td><strong>${l.to}</strong></td><td>${l.subject}</td><td>${l.time}</td><td><span class="badge ${lb(l.status)}">${l.status}</span></td></tr>`).join('')}
            </tbody></table>
            </div>
        </div>
        `;
    },

    renderLiveTab(live, sb) {
        return `
        <div style="display:flex; gap: 20px; align-items: stretch; margin-bottom: 24px; flex-wrap: wrap">
            <div class="section-card" style="flex: 1; margin:0; min-width: 300px">
                <div class="section-header"><div class="section-title"><i class="fas fa-video"></i> Live Stream Status</div>
                    <button class="btn btn-outline btn-sm" onclick="CommunicationModule.scheduleStream()"><i class="fas fa-plus"></i> Schedule Stream</button>
                </div>
                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="kpi-card" style="background:var(--grad-red); padding: 15px;"><i class="fas fa-eye kpi-icon"></i><div class="kpi-label">Current Viewers</div><div class="kpi-value" style="font-size:1.5rem">${live ? live.viewers : 0}</div></div>
                    <div class="kpi-card" style="background:var(--grad-teal); padding: 15px;"><i class="fas fa-chart-bar kpi-icon"></i><div class="kpi-label">Total Hours</div><div class="kpi-value" style="font-size:1.5rem">${this.stats.totalHours.toLocaleString()}</div></div>
                </div>
            </div>
        </div>

        ${live ? `<div class="section-card">
            <div class="section-header"><div class="section-title" style="color:var(--primary-red)"><i class="fas fa-circle" style="animation:pulse 1.5s infinite"></i> Live Now: ${live.title}</div><span class="badge badge-danger" style="font-size:0.85rem;padding:6px 16px"><i class="fas fa-eye"></i> ${live.viewers} watching</span></div>
            <div class="video-container" style="max-width: 600px; border-radius: 12px; overflow: hidden; position: relative; background: #000; height: 337px; margin-bottom: 16px;">
                <div class="live-badge" style="position:absolute; top:12px; left:12px; background:var(--primary-red); color:#fff; padding:4px 12px; border-radius:4px; font-weight:700; font-size:0.8rem; z-index:2">● LIVE</div>
                <div class="play-overlay" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); z-index:1"><i class="fas fa-play" style="font-size:3rem; color:rgba(255,255,255,0.8)"></i></div>
                <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));padding:20px;color:#fff;z-index:2">
                    <div style="font-weight:700;font-size:1.1rem">${live.title}</div>
                    <div style="font-size:0.82rem;opacity:0.7">Sri Venkateswara Temple • ${live.schedule}</div>
                </div>
            </div>
        </div>`: ''}

        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-calendar"></i> Stream Schedule</div></div>
            ${this.streams.map(s => `<div class="workflow-card ${s.status === 'live' ? '' : 'active-wf'}" style="border-left-color:${s.status === 'live' ? 'var(--primary-red)' : 'var(--primary-teal)'}">
                <div class="wf-icon" style="background:${s.status === 'live' ? 'var(--grad-red)' : 'var(--grad-teal)'}"><i class="fas ${s.status === 'live' ? 'fa-broadcast-tower' : 'fa-video'}"></i></div>
                <div class="wf-info"><div class="wf-name">${s.title}</div><div class="wf-desc">${s.schedule} • ${s.duration}</div>
                ${s.status === 'live' ? `<div class="wf-stats"><span class="wf-stat"><strong>${s.viewers}</strong> viewers</span></div>` : ''}</div>
                <span style="font-size:0.75rem; color: #888; font-style:italic; margin-right: 12px;"><i class="fas fa-user-circle"></i> ${s.createdBy}</span>
                <span class="badge ${sb(s.status)}" style="font-size:0.8rem;padding:6px 14px;margin-right:8px;">${s.status === 'live' ? '● LIVE' : s.status}</span>
                <button class="action-btn edit-btn" style="margin-left:auto" onclick="CommunicationModule.editStream('${s.id}')"><i class="fas fa-pen"></i></button>
            </div>`).join('')}
        </div>
        `;
    },

    toggleTemplate(id, el) { const t = this.templates.find(x => x.id === id); if (t) { t.status = t.status === 'active' ? 'paused' : 'active'; el.classList.toggle('on'); App.showToast(`Template ${t.status}!`, t.status === 'active' ? 'success' : 'warning'); } },
    broadcast() { App.showToast('Broadcast sent to all 3,450 contacts!', 'success'); AuditLog.add('Broadcast', 'Communication', 'Sent WhatsApp broadcast to all contacts'); },
    addTemplate() {
        App.openModal(`<div class="modal-header"><h3 class="modal-title">New WhatsApp Template</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="CommunicationModule.saveTemplate(event)">
            <div class="form-group"><label class="form-label">Template Name</label><input type="text" class="form-control" id="wa_name" required></div>
            <div class="form-group"><label class="form-label">Trigger</label><select class="form-control" id="wa_trigger"><option>On booking confirmed</option><option>On donation recorded</option><option>On order status change</option><option>1 day before event</option><option>On devotee birthday</option><option>Manual broadcast</option></select></div>
            <div class="form-group"><label class="form-label">Message</label><textarea class="form-control" id="wa_msg" rows="4" required placeholder="Use {name}, {date}, {amount} etc."></textarea></div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>`);
    },
    saveTemplate(e) {
        e.preventDefault();
        const existingId = document.getElementById('wa_id')?.value;
        if (existingId) {
            const index = this.templates.findIndex(t => t.id === existingId);
            if (index > -1) {
                this.templates[index].name = document.getElementById('wa_name').value;
                this.templates[index].trigger = document.getElementById('wa_trigger').value;
                this.templates[index].msg = document.getElementById('wa_msg').value;
                AuditLog.add('Edit', 'Communication', `Edited WhatsApp template ${existingId}`);
                App.closeModal();
                App.showToast('Template updated successfully!', 'success');
                App.navigateTo('communication');
                return;
            }
        }

        this.templates.push({
            id: RefNumberGenerator.generateSequential('TPL', this.templates, 3),
            name: document.getElementById('wa_name').value,
            trigger: document.getElementById('wa_trigger').value,
            msg: document.getElementById('wa_msg').value,
            status: 'active',
            sent: 0
        });
        AuditLog.add('Create', 'Communication', 'Created new WhatsApp template');
        App.closeModal();
        App.showToast('Template created!', 'success');
        App.navigateTo('communication');
    },
    editEmailCampaign(id) {
        const camp = this.emailCampaigns.find(c => c.id === id);
        if (!camp) return;
        App.openModal(`<div class="modal-header"><h3 class="modal-title">Edit Email Campaign</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="CommunicationModule.saveEmailCampaign(event)">
            <input type="hidden" id="em_id" value="${camp.id}">
            <div class="form-group"><label class="form-label">Campaign Name</label><input type="text" class="form-control" id="em_name" value="${camp.name}" required></div>
            <div class="form-group"><label class="form-label">Email Subject</label><input type="text" class="form-control" id="em_subject" value="${camp.subject}" required></div>
            <div class="form-group"><label class="form-label">Status</label>
                <select class="form-control" id="em_status">
                    <option value="draft" ${camp.status === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="scheduled" ${camp.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="sent" ${camp.status === 'sent' ? 'selected' : ''}>Sent</option>
                </select>
            </div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update Campaign</button></div>
        </form>`);
    },
    newEmailCampaign() {
        App.openModal(`<div class="modal-header"><h3 class="modal-title">New Email Campaign</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="CommunicationModule.saveEmailCampaign(event)">
            <input type="hidden" id="em_id" value="">
            <div class="form-group"><label class="form-label">Campaign Name</label><input type="text" class="form-control" id="em_name" required></div>
            <div class="form-group"><label class="form-label">Email Subject</label><input type="text" class="form-control" id="em_subject" required></div>
            <div class="form-group"><label class="form-label">Message Body</label><textarea class="form-control" id="em_body" rows="6" required placeholder="Write your email here..."></textarea></div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Schedule Campaign</button></div>
        </form>`);
    },
    saveEmailCampaign(e) {
        e.preventDefault();
        const existingId = document.getElementById('em_id').value;
        if (existingId) {
            const index = this.emailCampaigns.findIndex(c => c.id === existingId);
            if (index > -1) {
                this.emailCampaigns[index].name = document.getElementById('em_name').value;
                this.emailCampaigns[index].subject = document.getElementById('em_subject').value;
                if (document.getElementById('em_status')) {
                    this.emailCampaigns[index].status = document.getElementById('em_status').value;
                }
                AuditLog.add('Edit', 'Communication', `Updated Email campaign: ${existingId}`);
                App.closeModal();
                App.showToast('Email Campaign updated successfully!', 'success');
                App.navigateTo('communication');
                return;
            }
        }

        this.emailCampaigns.unshift({
            id: RefNumberGenerator.generateSequential('EML', this.emailCampaigns, 3),
            name: document.getElementById('em_name').value,
            subject: document.getElementById('em_subject').value,
            status: 'scheduled',
            sentTo: 0,
            openRate: '-'
        });
        AuditLog.add('Create', 'Communication', 'Scheduled new Email campaign: ' + document.getElementById('em_name').value);
        App.closeModal();
        App.showToast('Email Campaign scheduled successfully!', 'success');
        App.navigateTo('communication');
    },
    scheduleStream() {
        App.openModal(`<div class="modal-header"><h3 class="modal-title">Schedule Live Stream</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="CommunicationModule.saveStream(event)">
            <input type="hidden" id="ls_id" value="">
            <div class="form-group"><label class="form-label">Event/Pooja Title</label><input type="text" class="form-control" id="ls_title" required></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Schedule Date & Time</label><input type="text" class="form-control" id="ls_schedule" required placeholder="e.g. Feb 28, 2026 - 10:00 AM"></div>
                <div class="form-group"><label class="form-label">Duration</label><input type="text" class="form-control" id="ls_duration" required placeholder="e.g. 2 hours"></div>
            </div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Schedule</button></div>
        </form>`);
    },
    editStream(id) {
        const stream = this.streams.find(s => s.id === id);
        if (!stream) return;
        App.openModal(`<div class="modal-header"><h3 class="modal-title">Edit Live Stream</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="CommunicationModule.saveStream(event)">
            <input type="hidden" id="ls_id" value="${stream.id}">
            <div class="form-group"><label class="form-label">Event/Pooja Title</label><input type="text" class="form-control" id="ls_title" value="${stream.title}" required></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">Schedule Date & Time</label><input type="text" class="form-control" id="ls_schedule" value="${stream.schedule}" required></div>
                <div class="form-group"><label class="form-label">Duration</label><input type="text" class="form-control" id="ls_duration" value="${stream.duration}" required></div>
            </div>
            <div class="form-group"><label class="form-label">Status</label>
                <select class="form-control" id="ls_status">
                    <option value="scheduled" ${stream.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="live" ${stream.status === 'live' ? 'selected' : ''}>Live</option>
                    <option value="completed" ${stream.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Update</button></div>
        </form>`);
    },
    saveStream(e) {
        e.preventDefault();
        const existingId = document.getElementById('ls_id').value;
        if (existingId) {
            const index = this.streams.findIndex(s => s.id === existingId);
            if (index > -1) {
                this.streams[index].title = document.getElementById('ls_title').value;
                this.streams[index].schedule = document.getElementById('ls_schedule').value;
                this.streams[index].duration = document.getElementById('ls_duration').value;
                if (document.getElementById('ls_status')) {
                    this.streams[index].status = document.getElementById('ls_status').value;
                }
                AuditLog.add('Edit', 'Communication', `Updated stream: ${existingId}`);
                App.closeModal();
                App.showToast('Stream schedule updated!', 'success');
                App.navigateTo('communication');
                return;
            }
        }

        this.streams.push({
            id: RefNumberGenerator.generateSequential('LS', this.streams, 3),
            title: document.getElementById('ls_title').value,
            schedule: document.getElementById('ls_schedule').value,
            duration: document.getElementById('ls_duration').value,
            status: 'scheduled',
            viewers: 0,
            createdBy: App.currentUser
        });
        AuditLog.add('Create', 'Communication', `Scheduled stream: ${document.getElementById('ls_title').value}`);
        App.closeModal();
        App.showToast('Stream scheduled successfully!', 'success');
        App.navigateTo('communication');
    },
    goLive() {
        App.showToast('Stream started! Viewers will be notified via WhatsApp.', 'success');
        AuditLog.add('Stream', 'Communication', 'Started new Live Stream');
    }
};
