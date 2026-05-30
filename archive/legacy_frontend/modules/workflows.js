/* =====================
   WORKFLOW AUTOMATIONS MODULE
   ===================== */
window.WorkflowsModule = {
    workflows: [
        { id: 'WF-01', name: 'Booking Confirmation', desc: 'Automatically send WhatsApp confirmation when archanai booking is confirmed', trigger: 'On Booking Confirmed', action: 'Send WhatsApp (TPL-01) + Create Calendar Entry', status: 'active', executions: 142, lastRun: '2 min ago', icon: 'fa-bell', color: 'var(--grad-green)' },
        { id: 'WF-02', name: 'Donation Receipt Generator', desc: 'Auto-generate 80G tax receipt and send via WhatsApp/Email on donation', trigger: 'On Donation Recorded', action: 'Generate PDF Receipt + Send WhatsApp (TPL-02)', status: 'active', executions: 86, lastRun: '32 min ago', icon: 'fa-receipt', color: 'var(--grad-blue)' },
        { id: 'WF-03', name: 'Low Stock Alert', desc: 'Alert store manager and auto-create purchase order when stock falls below minimum', trigger: 'Stock < Min Threshold', action: 'WhatsApp Alert to Manager + Create Purchase Order', status: 'active', executions: 24, lastRun: '5 hours ago', icon: 'fa-exclamation-triangle', color: 'var(--grad-orange)' },
        { id: 'WF-04', name: 'Payroll Auto-Process', desc: 'Automatically calculate and process monthly payroll on the 28th of each month', trigger: '28th of Every Month', action: 'Calculate Salaries + Generate Payslips + Bank Transfer', status: 'active', executions: 11, lastRun: 'Feb 1, 2026', icon: 'fa-money-bill', color: 'var(--grad-teal)' },
        { id: 'WF-05', name: 'Event Reminder', desc: 'Send WhatsApp reminders to booked devotees 1 day before their scheduled event', trigger: '1 Day Before Event', action: 'Send WhatsApp (TPL-03) + SMS Backup', status: 'active', executions: 245, lastRun: 'Yesterday', icon: 'fa-clock', color: 'var(--grad-purple)' },
        { id: 'WF-06', name: 'Hall Booking Approval Chain', desc: 'Route hall booking requests through Manager → Trustee approval chain', trigger: 'On Hall Booking Created', action: 'Notify Manager → On Approve → Notify Trustee → Confirm', status: 'active', executions: 18, lastRun: '1 day ago', icon: 'fa-sitemap', color: 'var(--grad-blue)' },
        { id: 'WF-07', name: 'Birthday Blessings', desc: 'Automatically send birthday wishes to devotees on their birth date', trigger: 'On Devotee Birthday', action: 'Send WhatsApp (TPL-06) + Special Prasadam Note', status: 'active', executions: 312, lastRun: 'Today', icon: 'fa-birthday-cake', color: 'var(--grad-pink)' },
        { id: 'WF-08', name: 'Daily Accounting Summary', desc: 'Consolidate all income/expenses and send daily financial summary to trustees', trigger: 'Every Day 9:00 PM', action: 'Generate Summary Report + Email to Trustees', status: 'active', executions: 365, lastRun: 'Yesterday 9 PM', icon: 'fa-chart-pie', color: 'var(--grad-green)' },
        { id: 'WF-09', name: 'Live Stream Notification', desc: 'Notify all devotees when a live stream starts', trigger: 'On Stream Started', action: 'WhatsApp Broadcast (TPL-04 variant) + Push Notification', status: 'paused', executions: 45, lastRun: '3 days ago', icon: 'fa-video', color: 'var(--grad-red)' },
        { id: 'WF-10', name: 'Store Order Fulfillment', desc: 'Track order from placement to delivery with status updates', trigger: 'On Order Created', action: 'Assign to Packing → Ship → Deliver → Send Updates', status: 'active', executions: 156, lastRun: '3 hours ago', icon: 'fa-truck', color: 'var(--grad-orange)' },
    ],

    logs: [
        { workflow: 'Booking Confirmation', time: '10 min ago', status: 'success', detail: 'ARC-001 → WhatsApp sent to Rajesh Kumar' },
        { workflow: 'Donation Receipt Generator', time: '32 min ago', status: 'success', detail: 'DON-001 → Receipt REC-001 generated & sent' },
        { workflow: 'Low Stock Alert', time: '5 hours ago', status: 'success', detail: 'Camphor stock at 12 → PO created, Manager notified' },
        { workflow: 'Event Reminder', time: 'Yesterday', status: 'success', detail: '15 reminders sent for tomorrow events' },
        { workflow: 'Live Stream Notification', time: '3 days ago', status: 'failed', detail: 'Broadcast failed — API timeout' },
        { workflow: 'Daily Accounting Summary', time: 'Yesterday 9 PM', status: 'success', detail: 'Summary: Income ₹70,900 / Expense ₹15,600' },
    ],

    render() {
        const active = this.workflows.filter(w => w.status === 'active').length;
        const totalExec = this.workflows.reduce((s, w) => s + w.executions, 0);
        const lb = s => s === 'success' ? 'badge-success' : 'badge-danger';
        return `
        <div class="page-header">
            <h1 class="page-title"><i class="fas fa-cogs"></i> Workflow Automations</h1>
            <button class="btn btn-primary" onclick="WorkflowsModule.createWorkflow()"><i class="fas fa-plus"></i> Create Workflow</button>
        </div>
        <div class="kpi-grid">
            <div class="kpi-card" style="background:var(--grad-green)"><i class="fas fa-cogs kpi-icon"></i><div class="kpi-label">Active Workflows</div><div class="kpi-value">${active}</div><div class="kpi-sub">of ${this.workflows.length} total</div></div>
            <div class="kpi-card" style="background:var(--grad-blue)"><i class="fas fa-play kpi-icon"></i><div class="kpi-label">Total Executions</div><div class="kpi-value">${totalExec.toLocaleString()}</div><div class="kpi-sub">All time</div></div>
            <div class="kpi-card" style="background:var(--grad-teal)"><i class="fas fa-check-circle kpi-icon"></i><div class="kpi-label">Success Rate</div><div class="kpi-value">98.2%</div><div class="kpi-sub">Last 30 days</div></div>
            <div class="kpi-card" style="background:var(--grad-orange)"><i class="fas fa-clock kpi-icon"></i><div class="kpi-label">Time Saved</div><div class="kpi-value">~120 hrs</div><div class="kpi-sub">This month</div></div>
        </div>
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-bolt"></i> All Workflows</div></div>
            ${this.workflows.map(w => `<div class="workflow-card ${w.status === 'active' ? 'active-wf' : 'paused-wf'}">
                <div class="wf-icon" style="background:${w.color}"><i class="fas ${w.icon}"></i></div>
                <div class="wf-info" style="flex:1">
                    <div class="wf-name">${w.name} <span class="badge ${w.status === 'active' ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem;margin-left:6px">${w.status}</span></div>
                    <div class="wf-desc">${w.desc}</div>
                    <div style="margin-top:6px;font-size:0.75rem">
                        <span style="color:var(--primary-blue)"><strong>Trigger:</strong> ${w.trigger}</span><br>
                        <span style="color:var(--primary-teal)"><strong>Action:</strong> ${w.action}</span>
                    </div>
                    <div class="wf-stats"><span class="wf-stat"><strong>${w.executions}</strong> runs</span><span class="wf-stat">Last: <strong>${w.lastRun}</strong></span></div>
                </div>
                <div class="wf-toggle ${w.status === 'active' ? 'on' : ''}" onclick="WorkflowsModule.toggle('${w.id}',this)"></div>
            </div>`).join('')}
        </div>
        <div class="section-card">
            <div class="section-header"><div class="section-title"><i class="fas fa-history"></i> Execution Log</div></div>
            <table class="data-table"><thead><tr><th>Workflow</th><th>Time</th><th>Status</th><th>Detail</th></tr></thead><tbody>
                ${this.logs.map(l => `<tr><td><strong>${l.workflow}</strong></td><td>${l.time}</td><td><span class="badge ${lb(l.status)}">${l.status}</span></td><td style="font-size:0.82rem">${l.detail}</td></tr>`).join('')}
            </tbody></table>
        </div>`;
    },

    toggle(id, el) { const w = this.workflows.find(x => x.id === id); if (w) { w.status = w.status === 'active' ? 'paused' : 'active'; el.classList.toggle('on'); App.showToast(`${w.name} ${w.status}!`, w.status === 'active' ? 'success' : 'warning'); } },
    createWorkflow() {
        App.openModal(`<div class="modal-header"><h3 class="modal-title">Create Workflow</h3><button class="modal-close" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="WorkflowsModule.save(event)">
            <div class="form-group"><label class="form-label">Workflow Name</label><input type="text" class="form-control" id="wf_name" required></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="wf_desc" required></textarea></div>
            <div class="form-row"><div class="form-group"><label class="form-label">Trigger</label><select class="form-control" id="wf_trigger"><option>On Booking Confirmed</option><option>On Donation Recorded</option><option>Stock &lt; Min Threshold</option><option>On Order Created</option><option>1 Day Before Event</option><option>On Devotee Birthday</option><option>On Stream Started</option><option>Daily at specific time</option><option>Monthly on specific date</option></select></div>
            <div class="form-group"><label class="form-label">Action</label><select class="form-control" id="wf_action"><option>Send WhatsApp Message</option><option>Generate PDF Receipt</option><option>Create Purchase Order</option><option>Send Email</option><option>Push Notification</option><option>Update Status</option><option>Multi-step Chain</option></select></div></div>
            <div class="form-actions"><button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Create</button></div>
        </form>`);
    },
    save(e) { e.preventDefault(); this.workflows.push({ id: RefNumberGenerator.generateSequential('WF', this.workflows, 2), name: document.getElementById('wf_name').value, desc: document.getElementById('wf_desc').value, trigger: document.getElementById('wf_trigger').value, action: document.getElementById('wf_action').value, status: 'active', executions: 0, lastRun: 'Never', icon: 'fa-cog', color: 'var(--grad-blue)' }); App.closeModal(); App.showToast('Workflow created!', 'success'); App.navigateTo('workflows'); }
};
