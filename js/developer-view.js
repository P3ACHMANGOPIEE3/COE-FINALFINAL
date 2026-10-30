/**
 * COE-Pay: System Developer View Controller
 * Persona: Dave Guiyab (System Developer)
 * Responsibility: Building a system that works properly and helps people perform their tasks more efficiently.
 * Features: System health diagnostics, database inspection, audit log monitor,
 * sandbox testing runner, schema integrity, and role impersonation.
 */

const CoeDeveloperView = {
  activeTableTab: 'students',

  render() {
    const container = document.getElementById('developer-view-container');
    if (!container) return;

    sessionStorage.setItem('coepay_master_dev', 'developer');
    sessionStorage.setItem('coepay_original_dev', 'developer');
    localStorage.setItem('coepay_master_dev', 'developer');

    const user = window.coeAuth.getUser();
    const profile = window.coeAuth.getProfile();
    const tables = window.coepayDb.tables;

    // Database Metrics
    const totalUsers = (tables.users || []).length;
    const totalStudents = (tables.students || []).length;
    const totalRequests = (tables.payment_requests || []).length;
    const totalAssignments = (tables.student_payment_assignments || []).length;
    const totalTransactions = (tables.payment_transactions || []).length;
    const totalAuditLogs = (tables.audit_logs || []).length;
    const totalEmails = (tables.dispatched_emails || []).length;
    const totalTerms = (tables.academic_terms || []).length;
    const totalCategories = (tables.payment_categories || []).length;
    const totalPersonnel = (tables.personnel || []).length;
    const totalRecords = totalUsers + totalStudents + totalRequests + totalAssignments + totalTransactions + totalAuditLogs + totalEmails + totalTerms + totalCategories + totalPersonnel;
    const isAutoApproval = window.coepayDb.isAutoApprovalEnabled();

    container.innerHTML = `
      <!-- Developer Subheader -->
      <div class="view-header">
        <div>
          <span class="badge badge-developer"><i class="fa-solid fa-code"></i> System Developer Console</span>
          <h1 class="page-title">${profile.full_name || 'Dave Guiyab'}</h1>
          <p class="page-subtitle">
            <strong>${profile.designation || 'Lead Full-Stack System Developer'}</strong> • 
            ${profile.responsibility || 'Responsible for building a system that works properly and helps people perform their tasks more efficiently.'}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn ${isAutoApproval ? 'btn-outline-success font-bold' : 'btn-outline-secondary'}" onclick="CoeDeveloperView.toggleAutoApproval()" title="Toggle Smart Payment Auto-Approval Engine">
            <i class="fa-solid fa-bolt ${isAutoApproval ? 'text-success' : ''}"></i> Auto-Approval: <strong>${isAutoApproval ? 'ACTIVE' : 'PAUSED'}</strong>
          </button>
          <button class="btn btn-primary" onclick="CoeDeveloperView.openAddStudentModal()" title="Enroll student with custom password & dispatch email">
            <i class="fa-solid fa-user-plus"></i> Enroll Student with Password
          </button>
          <button class="btn btn-warning" onclick="CoeDeveloperView.openMasterOverridesModal()" title="Emergency Master Overrides & System Problem Solver">
            <i class="fa-solid fa-crown"></i> Master Overrides
          </button>
          <button class="btn btn-outline" onclick="CoeDeveloperView.dispatchAllDefaultPasswords()" title="Send default password (password123) to all masterlist emails">
            <i class="fa-solid fa-paper-plane text-primary"></i> Dispatch Passwords
          </button>
          <button class="btn btn-outline" onclick="window.coeApp.openEmailDispatchDrawer()" title="View System Email Outbox">
            <i class="fa-solid fa-inbox text-emerald"></i> Outbox (<span id="dev-email-count">${totalEmails}</span>)
          </button>
          <button class="btn btn-outline" onclick="CoeDeveloperView.runSandboxTests()">
            <i class="fa-solid fa-flask-vial text-primary"></i> Run Tests
          </button>
          <button class="btn btn-outline" onclick="CoeAdminView.exportSqlDump()">
            <i class="fa-solid fa-file-code"></i> Export SQL
          </button>
          <button class="btn btn-outline" onclick="CoeDeveloperView.exportDatabaseJson()">
            <i class="fa-solid fa-download"></i> Backup DB
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.coeApp.confirmResetDb()">
            <i class="fa-solid fa-rotate-left"></i> Reset Seed
          </button>
        </div>
      </div>

      <!-- Developer KPI Metrics (Clickable Interactive Cards) -->
      <div class="stats-grid">
        <div class="stat-card clickable-card" onclick="CoeDeveloperView.showSystemHealthDetails()" title="Click to inspect System Health & Engine Architecture">
          <span class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</span>
          <div class="stat-icon bg-emerald-subtle">
            <i class="fa-solid fa-server text-emerald"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">System Health & Engine</div>
            <div class="stat-value text-success">Active & Healthy</div>
            <div class="stat-footnote text-muted">Client Simulation + MySQL Schema Active</div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoeDeveloperView.showRecordsBreakdown()" title="Click to view Database Records Breakdown by Table">
          <span class="card-click-pill"><i class="fa-solid fa-list-check"></i> View Data</span>
          <div class="stat-icon bg-blue-subtle">
            <i class="fa-solid fa-database text-primary"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Simulated Records</div>
            <div class="stat-value">${totalRecords.toLocaleString()}</div>
            <div class="stat-footnote text-muted">Across 9 Relational Tables</div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoeDeveloperView.showAuditTrailModal()" title="Click to view Real-Time Audit Log Ledger">
          <span class="card-click-pill"><i class="fa-solid fa-shield-halved"></i> View Logs</span>
          <div class="stat-icon bg-indigo-subtle">
            <i class="fa-solid fa-shield-virus text-indigo"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Immutable Audit Trail</div>
            <div class="stat-value">${totalAuditLogs} Logs</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-check-double"></i> 100% Operations Recorded</div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoeDeveloperView.showRolesConfigModal()" title="Click to inspect Configured Personas & Permissions">
          <span class="card-click-pill"><i class="fa-solid fa-users"></i> View Roles</span>
          <div class="stat-icon bg-amber-subtle">
            <i class="fa-solid fa-users-gear text-amber"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Active Roles Configured</div>
            <div class="stat-value">4 Roles</div>
            <div class="stat-footnote text-muted">Dev • Coordinator • Officer • Student</div>
          </div>
        </div>
      </div>

      <!-- Quick Role Impersonation Matrix -->
      <div class="card mt-3">
        <div class="card-header flex-between">
          <div>
            <h2 class="card-title"><i class="fa-solid fa-users-viewfinder text-primary"></i> Role Testing & Impersonation Matrix</h2>
            <p class="card-subtitle">Quickly switch between personas to verify role-based permissions, workflows, and dashboard routing.</p>
          </div>
        </div>
        <div class="card-body">
          <div class="role-matrix-grid">
            <!-- 1. System Developer -->
            <div class="role-matrix-card active">
              <div class="role-matrix-header">
                <span class="badge badge-developer"><i class="fa-solid fa-code"></i> Developer</span>
                <span class="current-pill">Current Session</span>
              </div>
              <h4 class="mt-2">Dave Guiyab</h4>
              <p class="text-muted small">Building a system that works properly and helps people perform tasks efficiently.</p>
              <button class="btn btn-xs btn-outline-primary mt-2 w-100" disabled>Active View</button>
            </div>

            <!-- 2. Head Engineer / Coordinator -->
            <div class="role-matrix-card">
              <div class="role-matrix-header">
                <span class="badge badge-admin"><i class="fa-solid fa-user-tie"></i> Head Engineer</span>
                <span class="badge badge-outline">Approver</span>
              </div>
              <h4 class="mt-2">Engr. Ivanlee Mendoza</h4>
              <p class="text-muted small">Approve request, add student, bulk upload masterlist, manage compliance.</p>
              <button class="btn btn-xs btn-primary mt-2 w-100" onclick="window.coeApp.switchDemoUser('engr.mendoza')">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to Coordinator
              </button>
            </div>

            <!-- 3. Officer -->
            <div class="role-matrix-card">
              <div class="role-matrix-header">
                <span class="badge badge-personnel"><i class="fa-solid fa-clipboard-user"></i> Officer</span>
                <span class="badge badge-outline">Collector</span>
              </div>
              <h4 class="mt-2">Pearl Catequista</h4>
              <p class="text-muted small">Request for adding items, seminars, and other fees; inspect receipts.</p>
              <button class="btn btn-xs btn-primary mt-2 w-100" onclick="window.coeApp.switchDemoUser('officer')">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to Officer
              </button>
            </div>

            <!-- 4. Student -->
            <div class="role-matrix-card">
              <div class="role-matrix-header">
                <span class="badge badge-student"><i class="fa-solid fa-graduation-cap"></i> Student</span>
                <span class="badge badge-outline">Payer</span>
              </div>
              <h4 class="mt-2">Christian Dave Guiyab</h4>
              <p class="text-muted small">Purchase, paying, ordering; submit GCash payments, get clearance vouchers.</p>
              <button class="btn btn-xs btn-primary mt-2 w-100" onclick="window.coeApp.switchDemoUser('2023-10001')">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Developer Tabs: Database Explorer, Master Overrides, Audit Log Feed, Bulk Ingestion -->
      <div class="admin-tabs-nav mt-4">
        <button class="tab-btn active" id="dev-tab-btn-tables" onclick="CoeDeveloperView.switchTab('tables')">
          <i class="fa-solid fa-table"></i> Database Tables Explorer (${totalRecords})
        </button>
        <button class="tab-btn" id="dev-tab-btn-overrides" onclick="CoeDeveloperView.switchTab('overrides')">
          <i class="fa-solid fa-crown text-amber"></i> Master Overrides & Emergency Fixes
        </button>
        <button class="tab-btn" id="dev-tab-btn-audit" onclick="CoeDeveloperView.switchTab('audit')">
          <i class="fa-solid fa-shield-virus"></i> Real-Time Audit Ledger (${totalAuditLogs})
        </button>
        <button class="tab-btn" id="dev-tab-btn-bulk" onclick="CoeDeveloperView.switchTab('bulk')">
          <i class="fa-solid fa-cloud-arrow-up"></i> Bulk Masterlist Integration
        </button>
      </div>

      <!-- TAB 1: Database Explorer -->
      <div id="dev-tab-tables" class="dev-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div class="flex-gap flex-wrap">
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'students' ? 'btn-primary' : 'btn-outline'}" data-table="students" onclick="CoeDeveloperView.showTable('students')">
                students (${totalStudents})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'users' ? 'btn-primary' : 'btn-outline'}" data-table="users" onclick="CoeDeveloperView.showTable('users')">
                users (${totalUsers})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'payment_requests' ? 'btn-primary' : 'btn-outline'}" data-table="payment_requests" onclick="CoeDeveloperView.showTable('payment_requests')">
                payment_requests (${totalRequests})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'payment_transactions' ? 'btn-primary' : 'btn-outline'}" data-table="payment_transactions" onclick="CoeDeveloperView.showTable('payment_transactions')">
                payment_transactions (${totalTransactions})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'student_payment_assignments' ? 'btn-primary' : 'btn-outline'}" data-table="student_payment_assignments" onclick="CoeDeveloperView.showTable('student_payment_assignments')">
                assignments (${totalAssignments})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'dispatched_emails' ? 'btn-primary' : 'btn-outline'}" data-table="dispatched_emails" onclick="CoeDeveloperView.showTable('dispatched_emails')">
                emails (${totalEmails})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'audit_logs' ? 'btn-primary' : 'btn-outline'}" data-table="audit_logs" onclick="CoeDeveloperView.showTable('audit_logs')">
                audit_logs (${totalAuditLogs})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'academic_terms' ? 'btn-primary' : 'btn-outline'}" data-table="academic_terms" onclick="CoeDeveloperView.showTable('academic_terms')">
                terms (${totalTerms})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'payment_categories' ? 'btn-primary' : 'btn-outline'}" data-table="payment_categories" onclick="CoeDeveloperView.showTable('payment_categories')">
                categories (${totalCategories})
              </button>
              <button class="btn btn-xs dev-table-btn ${this.activeTableTab === 'personnel' ? 'btn-primary' : 'btn-outline'}" data-table="personnel" onclick="CoeDeveloperView.showTable('personnel')">
                personnel (${totalPersonnel})
              </button>
            </div>
            <div class="small text-muted font-mono" id="dev-active-table-name">Table: ${this.activeTableTab}</div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;" id="dev-table-viewer-container">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: Master Overrides & Emergency System Repairs -->
      <div id="dev-tab-overrides" class="dev-tab-content" style="display:none;">
        <div class="card mb-3 border-warning" style="border-left: 5px solid #F59E0B;">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h2 class="card-title text-amber font-bold" style="font-size: 1.15rem; margin-bottom: 0.25rem;">
                  <i class="fa-solid fa-crown"></i> Developer Master Override & Emergency Problem Solver
                </h2>
                <p class="card-subtitle mb-0">
                  When problems occur that the <strong>Program Head (Dean)</strong>, <strong>Officer</strong>, or <strong>Student</strong> cannot resolve (stalled/disputed payments, erroneous student obligations, locked payment requests, or forgotten credentials), the System Developer has unrestricted authority to override, repair, and clear records with an immutable audit log.
                </p>
              </div>
              <div class="flex-gap">
                <button class="btn btn-sm btn-outline-warning" onclick="CoeDeveloperView.renderMasterOverridesTab()">
                  <i class="fa-solid fa-rotate"></i> Refresh Overrides
                </button>
              </div>
            </div>
          </div>
        </div>

        <div id="dev-overrides-container">
          <!-- Dynamically populated by renderMasterOverridesTab() -->
        </div>
      </div>

      <!-- TAB 2: Live Audit Trail -->
      <div id="dev-tab-audit" class="dev-tab-content" style="display:none;">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Live Audit Stream</h2>
              <p class="card-subtitle">Immutable log entries recorded across all 4 roles.</p>
            </div>
            <button class="btn btn-xs btn-outline" onclick="CoeDeveloperView.renderAuditLogs()">
              <i class="fa-solid fa-rotate"></i> Refresh Feed
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table small">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>User / Persona</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody id="dev-audit-table-body">
                  <!-- Populated by renderAuditLogs() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Masterlist Bulk Upload Sandbox -->
      <div id="dev-tab-bulk" class="dev-tab-content" style="display:none;">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Bulk Masterlist Ingestion Tester</h2>
              <p class="card-subtitle">Directly invoke or test the bulk student upload workflow.</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="CoeMasterlistUpload.openModal()">
              <i class="fa-solid fa-file-arrow-up"></i> Launch Bulk Upload Modal
            </button>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <i class="fa-solid fa-circle-info"></i> As System Developer, you can test the bulk upload feature, download sample templates (.csv/.xlsx), and verify that records are correctly upserted and mapped to authorized fees.
            </div>
            <div class="mt-3 flex-gap">
              <button class="btn btn-outline" onclick="CoeMasterlistUpload.downloadTemplate('csv')">
                <i class="fa-solid fa-file-csv text-success"></i> Download Sample CSV
              </button>
              <button class="btn btn-outline" onclick="CoeMasterlistUpload.downloadTemplate('xlsx')">
                <i class="fa-solid fa-file-excel text-emerald"></i> Download Sample Excel (.xlsx)
              </button>
              <button class="btn btn-outline-primary" onclick="CoeDeveloperView.runSandboxTests()">
                <i class="fa-solid fa-flask-vial"></i> Open Visual Test Runner
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.showTable(this.activeTableTab);
    this.renderAuditLogs();
  },

  switchTab(tabName) {
    const tabs = ['tables', 'overrides', 'audit', 'bulk'];
    tabs.forEach(t => {
      const el = document.getElementById(`dev-tab-${t}`);
      const btn = document.getElementById(`dev-tab-btn-${t}`);
      if (el) el.style.display = t === tabName ? 'block' : 'none';
      if (btn) {
        if (t === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (tabName === 'overrides') {
      this.renderMasterOverridesTab();
    }
  },

  showTable(tableName) {
    this.activeTableTab = tableName;
    const container = document.getElementById('dev-table-viewer-container');
    const label = document.getElementById('dev-active-table-name');
    if (label) label.innerText = `Table: ${tableName}`;

    // Update active button state
    const btns = document.querySelectorAll('.dev-table-btn');
    btns.forEach(b => {
      if (b.getAttribute('data-table') === tableName) {
        b.classList.remove('btn-outline');
        b.classList.add('btn-primary');
      } else {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      }
    });

    if (!container) return;

    const rows = window.coepayDb.tables[tableName] || [];
    if (rows.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-muted">
          Table "${tableName}" is currently empty.
          <div class="mt-2">
            <button class="btn btn-xs btn-primary" onclick="CoeDeveloperView.openInsertRowModal('${tableName}')">
              <i class="fa-solid fa-plus"></i> Insert First Record
            </button>
          </div>
        </div>
      `;
      return;
    }

    const headers = Object.keys(rows[0]);
    container.innerHTML = `
      <div class="p-2 border-bottom flex-between bg-light">
        <div class="small text-muted">
          Showing <strong>${Math.min(rows.length, 50)} of ${rows.length} records</strong>. Full Developer CRUD & Master Row Overrides Active.
        </div>
        <button class="btn btn-xs btn-primary" onclick="CoeDeveloperView.openInsertRowModal('${tableName}')">
          <i class="fa-solid fa-plus"></i> Insert Record into ${tableName}
        </button>
      </div>
      <table class="data-table small">
        <thead>
          <tr>
            <th style="width: 100px; text-align: center;">Dev Action</th>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.slice(0, 50).map((r, idx) => `
            <tr>
              <td style="text-align: center;">
                <div class="d-inline-flex gap-1">
                  <button class="btn btn-xs btn-outline-primary" style="padding: 2px 6px; font-size: 0.72rem;" onclick="CoeDeveloperView.openEditRowModal('${tableName}', ${idx})" title="Edit Record Row">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button class="btn btn-xs btn-outline-danger" style="padding: 2px 6px; font-size: 0.72rem;" onclick="CoeDeveloperView.confirmDeleteRowModal('${tableName}', ${idx})" title="Delete Record Row">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
              ${headers.map(h => {
                let val = r[h];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                return `<td>${val !== null && val !== undefined ? String(val) : '<span class="text-muted">null</span>'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${rows.length > 50 ? `<div class="p-2 text-center text-muted small">Showing first 50 of ${rows.length} records.</div>` : ''}
    `;
  },

  inspectTableDirectly(tableName) {
    if (window.coeApp && typeof window.coeApp.closeModal === 'function') {
      window.coeApp.closeModal();
    }
    this.switchTab('tables');
    this.showTable(tableName);
    const target = document.getElementById('dev-tab-tables');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  showSystemHealthDetails() {
    const sb = window.CoeSupabaseAuth;
    const sbStatus = (sb && typeof sb.getStatus === 'function') ? sb.getStatus() : { isSandbox: true, url: '' };
    const rawStorage = localStorage.getItem('coepay_db_v1') || '';
    const storageBytes = new Blob([rawStorage]).size;
    const storageKb = (storageBytes / 1024).toFixed(1);
    const tablesCount = Object.keys(window.coepayDb.tables || {}).length;

    const modalBody = `
      <div class="system-health-modal py-2">
        <div class="text-center mb-3">
          <div style="font-size: 2.5rem; color: #10B981; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-server"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">System Health & Diagnostics Inspector</h3>
          <p class="text-muted small mt-1">Core architectural status, relational engine state, and active runtime configuration.</p>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="p-3 bg-light rounded border">
              <div class="text-muted small font-bold text-uppercase">Relational Engine</div>
              <div class="font-bold text-success mt-1" style="font-size: 1.05rem;"><i class="fa-solid fa-circle-check"></i> Active & Synchronized</div>
              <div class="small text-muted mt-1">MySQL 8.0+ Relational Schema / Client LocalStorage Driver</div>
            </div>
          </div>
          <div class="col-6">
            <div class="p-3 bg-light rounded border">
              <div class="text-muted small font-bold text-uppercase">Supabase Auth Gateway</div>
              <div class="font-bold ${!sbStatus.isSandbox ? 'text-success' : 'text-amber'} mt-1" style="font-size: 1.05rem;">
                <i class="fa-solid ${!sbStatus.isSandbox ? 'fa-cloud-check' : 'fa-flask'}"></i> ${!sbStatus.isSandbox ? 'Live Cloud Connected' : 'Offline Sandbox Mode'}
              </div>
              <div class="small text-muted mt-1 font-mono">${!sbStatus.isSandbox ? sbStatus.url : 'Simulating OTP and sessions locally'}</div>
            </div>
          </div>
        </div>

        <div class="card p-3 mb-3 border">
          <h5 class="font-bold small text-uppercase text-muted mb-2"><i class="fa-solid fa-microchip"></i> Engine Runtime Metrics</h5>
          <table class="table table-sm table-borderless small mb-0">
            <tbody>
              <tr>
                <td class="text-muted" style="width: 40%;">Database Driver Key:</td>
                <td><code class="font-bold">coepay_db_v1</code></td>
              </tr>
              <tr>
                <td class="text-muted">Active Relational Tables:</td>
                <td><strong>${tablesCount} Tables</strong> (Normalized 3NF)</td>
              </tr>
              <tr>
                <td class="text-muted">Storage Footprint:</td>
                <td><strong>${storageKb} KB</strong> used in client storage</td>
              </tr>
              <tr>
                <td class="text-muted">Character Collation:</td>
                <td><code class="font-bold">utf8mb4_unicode_ci</code></td>
              </tr>
              <tr>
                <td class="text-muted">System Timestamp:</td>
                <td>${window.coepayDb.getNowTimestamp()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-0" style="border-radius: 8px;">
          <i class="fa-solid fa-circle-info text-primary" style="font-size: 1.25rem;"></i>
          <div>All payment calculations, unique reference constraints, and audit trails are evaluated strictly per operation.</div>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.openSupabaseConfigModal()">
        <i class="fa-solid fa-sliders"></i> Supabase Setup
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">
        <i class="fa-solid fa-check"></i> Close
      </button>
    `;

    window.coeApp.showModal('System Health & Engine', modalBody, footer, 'modal-lg');
  },

  showRecordsBreakdown() {
    const tables = window.coepayDb.tables || {};
    const tableKeys = [
      { key: 'students', label: 'Students Masterlist', icon: 'fa-user-graduate', color: '#0284c7' },
      { key: 'users', label: 'System Users & Credentials', icon: 'fa-users', color: '#6366f1' },
      { key: 'payment_requests', label: 'Payment Dues & Requests', icon: 'fa-file-invoice-dollar', color: '#10b981' },
      { key: 'payment_transactions', label: 'GCash Payment Submissions', icon: 'fa-money-bill-transfer', color: '#f59e0b' },
      { key: 'student_payment_assignments', label: 'Student Obligations & Clearance', icon: 'fa-clipboard-check', color: '#8b5cf6' },
      { key: 'dispatched_emails', label: 'Outbox Email Records', icon: 'fa-envelope-open-text', color: '#ec4899' },
      { key: 'audit_logs', label: 'Audit Trail Ledger', icon: 'fa-shield-halved', color: '#ef4444' },
      { key: 'academic_terms', label: 'Academic Terms & Semesters', icon: 'fa-calendar-days', color: '#14b8a6' },
      { key: 'payment_categories', label: 'Fee Classifications', icon: 'fa-tags', color: '#f97316' },
      { key: 'personnel', label: 'Department Personnel Profiles', icon: 'fa-user-tie', color: '#06b6d4' }
    ];

    let total = 0;
    tableKeys.forEach(t => {
      total += (tables[t.key] || []).length;
    });

    const modalBody = `
      <div class="records-breakdown-modal py-2">
        <div class="text-center mb-3">
          <div style="font-size: 2.5rem; color: #0284C7; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-database"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Simulated Database Records Breakdown</h3>
          <p class="text-muted small mt-1">Total of <strong>${total} records</strong> across <strong>${tableKeys.length} relational tables</strong>. Click any table to inspect its live rows.</p>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle small mb-0">
            <thead class="bg-light">
              <tr>
                <th>Table Name</th>
                <th>Description</th>
                <th class="text-center">Record Count</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              ${tableKeys.map(t => {
                const count = (tables[t.key] || []).length;
                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <i class="fa-solid ${t.icon}" style="color: ${t.color}; width: 18px;"></i>
                        <code class="font-bold" style="font-size: 0.88rem;">${t.key}</code>
                      </div>
                    </td>
                    <td class="text-muted">${t.label}</td>
                    <td class="text-center">
                      <span class="badge ${count > 0 ? 'badge-primary' : 'badge-secondary'}" style="font-size: 0.82rem; padding: 0.25rem 0.6rem;">
                        ${count} rows
                      </span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-xs btn-outline-primary" onclick="CoeDeveloperView.inspectTableDirectly('${t.key}')">
                        <i class="fa-solid fa-table-cells"></i> Inspect Table
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoeDeveloperView.exportDatabaseJson()">
        <i class="fa-solid fa-download"></i> Backup All (JSON)
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">
        <i class="fa-solid fa-check"></i> Done
      </button>
    `;

    window.coeApp.showModal('Database Records Breakdown', modalBody, footer, 'modal-lg');
  },

  showAuditTrailModal() {
    const logs = window.coepayDb.getAuditLogs(100);

    const modalBody = `
      <div class="audit-trail-modal py-2">
        <div class="text-center mb-3">
          <div style="font-size: 2.5rem; color: #4F46E5; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-shield-virus"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Immutable System Audit Trail</h3>
          <p class="text-muted small mt-1">Chronological ledger of security events, authorizations, payments, and masterlist updates (${logs.length} logged events).</p>
        </div>

        <div class="table-responsive" style="max-height: 420px; overflow-y: auto;">
          <table class="table table-hover table-sm small align-middle mb-0">
            <thead class="table-light sticky-top" style="position: sticky; top: 0; background: #F8FAFC; z-index: 2;">
              <tr>
                <th style="width: 60px;">ID</th>
                <th style="width: 140px;">Timestamp</th>
                <th>User / Persona</th>
                <th>Action Type</th>
                <th>Entity Target</th>
                <th>Details & Metadata</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr><td colspan="6" class="text-center py-4 text-muted">No audit log records found.</td></tr>
              ` : logs.map(l => `
                <tr>
                  <td><code class="text-muted">#${l.log_id}</code></td>
                  <td class="text-muted small font-mono">${l.created_at}</td>
                  <td>
                    <strong>${l.username || 'System'}</strong> 
                    <span class="badge badge-light small">${l.user_role || '-'}</span>
                  </td>
                  <td>
                    <span class="action-tag action-${(l.action_type || '').toLowerCase()}">
                      ${l.action_type}
                    </span>
                  </td>
                  <td><code class="small text-primary">${l.entity_name}</code> ${l.entity_id ? `(#${l.entity_id})` : ''}</td>
                  <td class="small" style="max-width: 280px; word-break: break-word;">${l.details || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoeDeveloperView.inspectTableDirectly('audit_logs')">
        <i class="fa-solid fa-table"></i> Open Full Table
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">
        <i class="fa-solid fa-check"></i> Close
      </button>
    `;

    window.coeApp.showModal('Audit Trail Ledger', modalBody, footer, 'modal-xl');
  },

  showRolesConfigModal() {
    const roles = [
      {
        role: 'developer',
        name: 'Dave Guiyab',
        username: 'developer',
        email: 'gosoytoth@gmail.com',
        badge: 'Lead Developer',
        badgeColor: 'badge-primary',
        desc: 'System health diagnostics, table inspector, sandbox test suites, and audit monitor.',
        icon: 'fa-code'
      },
      {
        role: 'coordinator',
        usernameKey: 'engr.mendoza',
        name: 'Engr. Ivanlee Mendoza',
        username: 'engr.mendoza',
        email: 'azdhaha799@gmail.com',
        badge: 'Coordinator / Dean',
        badgeColor: 'badge-success',
        desc: 'Approve fee requests, student masterlist upload (.csv/.xlsx), and departmental compliance.',
        icon: 'fa-user-tie'
      },
      {
        role: 'officer',
        usernameKey: 'officer',
        name: 'Pearl Catequista',
        username: 'officer',
        email: 'pearl.catequista@icct.edu.ph',
        badge: 'Officer / Treasurer',
        badgeColor: 'badge-amber',
        desc: 'Submit fee requests, inspect GCash payment receipts, and monitor section collection sheets.',
        icon: 'fa-clipboard-check'
      },
      {
        role: 'student',
        usernameKey: '2023-10001',
        name: 'Christian Dave Guiyab',
        username: '2023-10001',
        email: 'christian.guiyab@students.edu.ph',
        badge: 'Student (BSCpE-4A)',
        badgeColor: 'badge-secondary',
        desc: 'Purchase, paying, ordering. Submit 13-digit GCash receipts, download official clearance certificates.',
        icon: 'fa-user-graduate'
      }
    ];

    const modalBody = `
      <div class="roles-config-modal py-2">
        <div class="text-center mb-3">
          <div style="font-size: 2.5rem; color: #F59E0B; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-users-gear"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Active Configured Roles & Personas</h3>
          <p class="text-muted small mt-1">Four primary personas designed for role-based governance, testing, and approval workflows.</p>
        </div>

        <div class="row g-3">
          ${roles.map(r => `
            <div class="col-12 col-md-6 mb-2">
              <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between" style="background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <div style="width: 34px; height: 34px; border-radius: 8px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; color: #0284C7;">
                        <i class="fa-solid ${r.icon}"></i>
                      </div>
                      <div>
                        <strong style="font-size: 0.95rem;">${r.name}</strong>
                        <div class="small text-muted font-mono">${r.username}</div>
                      </div>
                    </div>
                    <span class="badge ${r.badgeColor} small">${r.badge}</span>
                  </div>
                  <div class="small text-muted mb-2">
                    <i class="fa-regular fa-envelope text-primary"></i> <strong>${r.email}</strong>
                  </div>
                  <p class="small text-muted mb-3" style="line-height: 1.4;">${r.desc}</p>
                </div>
                <button class="btn btn-sm btn-outline-primary w-100" onclick="window.coeApp.closeModal(); window.coeApp.switchDemoUser('${r.usernameKey || r.username}')">
                  <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to ${r.name}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">
        <i class="fa-solid fa-check"></i> Close
      </button>
    `;

    window.coeApp.showModal('Active Roles Configured', modalBody, footer, 'modal-lg');
  },

  renderAuditLogs() {
    const tbody = document.getElementById('dev-audit-table-body');
    if (!tbody) return;

    const logs = window.coepayDb.getAuditLogs(50);
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>#${l.log_id}</td>
        <td class="small text-muted">${l.created_at}</td>
        <td><strong>${l.username || 'System'}</strong> <span class="badge badge-light">${l.user_role || '-'}</span></td>
        <td><span class="action-tag action-${(l.action_type || '').toLowerCase()}">${l.action_type}</span></td>
        <td><code>${l.entity_name}</code> (${l.entity_id || '-'})</td>
        <td>${l.details}</td>
      </tr>
    `).join('');
  },

  exportDatabaseJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.coepayDb.tables, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `coepay_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    window.coeApp.showToast("Database JSON backup exported successfully!", "success");
  },

  runSandboxTests() {
    window.open('tests/sandbox_runner.html', '_blank');
  },

  // ==========================================
  // MASTER OVERRIDES & EMERGENCY PROBLEM SOLVER
  // ==========================================

  renderMasterOverridesTab() {
    const container = document.getElementById('dev-overrides-container');
    if (!container) return;

    const tables = window.coepayDb.tables;
    const transactions = tables.payment_transactions || [];
    const assignments = tables.student_payment_assignments || [];
    const requests = tables.payment_requests || [];
    const users = tables.users || [];
    const students = tables.students || [];

    const studentsMap = {};
    students.forEach(s => { studentsMap[s.student_id] = s; });

    const requestsMap = {};
    requests.forEach(r => { requestsMap[r.request_id] = r; });

    const assignmentsMap = {};
    assignments.forEach(a => { assignmentsMap[a.assignment_id] = a; });

    container.innerHTML = `
      <!-- Tool 1: Transactions & Receipts Fixer -->
      <div class="card mb-4">
        <div class="card-header flex-between">
          <div>
            <h3 class="card-title"><i class="fa-solid fa-receipt text-emerald"></i> 1. Payment Transactions & GCash Receipt Override</h3>
            <p class="card-subtitle">Force verify stalled transactions, reopen rejected submissions, or correct GCash reference numbers and amounts.</p>
          </div>
          <span class="badge badge-primary">${transactions.length} Transactions</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 320px; overflow-y: auto;">
            <table class="table table-hover table-sm small align-middle mb-0">
              <thead class="table-light sticky-top" style="position: sticky; top: 0; background: #F8FAFC; z-index: 2;">
                <tr>
                  <th>Tx ID & Date</th>
                  <th>Student</th>
                  <th>Fee Title</th>
                  <th>Ref # & Amount</th>
                  <th>Status</th>
                  <th class="text-end" style="min-width: 220px;">Master Developer Actions</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.length === 0 ? `
                  <tr><td colspan="6" class="text-center py-4 text-muted">No transactions found in system.</td></tr>
                ` : transactions.map(t => {
                  const asgn = assignmentsMap[t.assignment_id] || {};
                  const st = studentsMap[asgn.student_id] || {};
                  const req = requestsMap[asgn.request_id] || {};
                  const statusBadge = t.status === 'verified'
                    ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Verified</span>'
                    : t.status === 'pending_verification'
                    ? '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending</span>'
                    : '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Rejected</span>';

                  return `
                    <tr>
                      <td>
                        <strong>#TX-${t.transaction_id}</strong>
                        <div class="text-muted small font-mono">${t.payment_timestamp || '-'}</div>
                      </td>
                      <td>
                        <strong>${st.full_name || 'Student #' + asgn.student_id}</strong>
                        <div class="text-muted small">${st.student_number || ''} • ${st.section || ''}</div>
                      </td>
                      <td>${req.title || 'Fee #' + asgn.request_id}</td>
                      <td>
                        <code class="font-bold text-primary">${t.gcash_reference_number}</code>
                        <div class="font-bold text-success">₱${parseFloat(t.amount_paid || 0).toFixed(2)}</div>
                      </td>
                      <td>${statusBadge}</td>
                      <td class="text-end">
                        <div class="d-inline-flex gap-1 flex-wrap justify-content-end">
                          ${t.status !== 'verified' ? `
                            <button class="btn btn-xs btn-success" onclick="CoeDeveloperView.executeMasterVerify(${t.transaction_id})" title="Force Verify transaction and issue clearance">
                              <i class="fa-solid fa-bolt"></i> Verify
                            </button>
                          ` : ''}
                          ${t.status !== 'pending_verification' ? `
                            <button class="btn btn-xs btn-warning" onclick="CoeDeveloperView.executeMasterReopen(${t.transaction_id})" title="Reopen transaction to pending verification">
                              <i class="fa-solid fa-rotate-left"></i> Reopen
                            </button>
                          ` : ''}
                          ${t.status !== 'rejected' ? `
                            <button class="btn btn-xs btn-outline-danger" onclick="CoeDeveloperView.openMasterRejectModal(${t.transaction_id})" title="Force Reject submission">
                              <i class="fa-solid fa-xmark"></i> Reject
                            </button>
                          ` : ''}
                          <button class="btn btn-xs btn-outline-primary" onclick="CoeDeveloperView.openEditTransactionModal(${t.transaction_id})" title="Edit Reference Number or Amount">
                            <i class="fa-solid fa-pen"></i> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tool 2: Student Clearance & Obligation Waivers -->
      <div class="card mb-4">
        <div class="card-header flex-between">
          <div>
            <h3 class="card-title"><i class="fa-solid fa-graduation-cap text-indigo"></i> 2. Student Payment Clearance & Obligation Waivers</h3>
            <p class="card-subtitle">Force clear unpaid obligations for scholarship grantees, financial hardship, or administrative corrections.</p>
          </div>
          <span class="badge badge-indigo">${assignments.length} Total Dues</span>
        </div>
        <div class="card-body">
          <!-- Rapid Full Clearance Bar -->
          <div class="p-3 bg-light rounded border mb-3 flex-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <label for="master-clear-student-select" class="font-bold small mb-0 text-muted">
                <i class="fa-solid fa-certificate text-primary"></i> Rapid Clearance Waiver for Student:
              </label>
              <select id="master-clear-student-select" class="form-select form-select-sm" style="max-width: 280px;">
                ${students.map(s => `
                  <option value="${s.student_id}">${s.student_number} - ${s.full_name} (${s.section})</option>
                `).join('')}
              </select>
            </div>
            <button class="btn btn-sm btn-primary" onclick="CoeDeveloperView.executeMasterClearAllStudent()">
              <i class="fa-solid fa-stamp"></i> Force Clear ALL Dues for Student
            </button>
          </div>

          <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-hover table-sm small align-middle mb-0">
              <thead class="table-light sticky-top" style="position: sticky; top: 0; background: #F8FAFC; z-index: 2;">
                <tr>
                  <th>Asgn ID</th>
                  <th>Student</th>
                  <th>Fee Title</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Voucher Code</th>
                  <th class="text-end">Master Override Actions</th>
                </tr>
              </thead>
              <tbody>
                ${assignments.map(a => {
                  const st = studentsMap[a.student_id] || {};
                  const req = requestsMap[a.request_id] || {};
                  const statusBadge = a.status === 'paid'
                    ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Cleared</span>'
                    : a.status === 'pending_verification'
                    ? '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending Verif</span>'
                    : '<span class="badge badge-secondary">Unpaid</span>';

                  return `
                    <tr>
                      <td><code class="text-muted">#ASG-${a.assignment_id}</code></td>
                      <td>
                        <strong>${st.full_name || 'Student #' + a.student_id}</strong>
                        <div class="small text-muted">${st.student_number || ''}</div>
                      </td>
                      <td>${req.title || 'Fee #' + a.request_id}</td>
                      <td class="font-bold">₱${parseFloat(req.amount || 0).toFixed(2)}</td>
                      <td>${statusBadge}</td>
                      <td>${a.clearance_voucher_code ? `<code class="font-bold text-success">${a.clearance_voucher_code}</code>` : '<span class="text-muted small">-</span>'}</td>
                      <td class="text-end">
                        <div class="d-inline-flex gap-1 justify-content-end">
                          ${a.status !== 'paid' ? `
                            <button class="btn btn-xs btn-success" onclick="CoeDeveloperView.executeMasterWaiveAssignment(${a.assignment_id})" title="Force Waive & Clear Due">
                              <i class="fa-solid fa-wand-magic-sparkles"></i> Force Clear
                            </button>
                          ` : `
                            <button class="btn btn-xs btn-outline-secondary" onclick="CoeDeveloperView.executeMasterResetAssignment(${a.assignment_id})" title="Reset to unpaid">
                              <i class="fa-solid fa-rotate-left"></i> Reset Unpaid
                            </button>
                          `}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tool 3: Payment Request Reopener & Force Authorizer -->
      <div class="card mb-4">
        <div class="card-header flex-between">
          <div>
            <h3 class="card-title"><i class="fa-solid fa-file-invoice-dollar text-primary"></i> 3. Payment Request Authorization & Reopen Controller</h3>
            <p class="card-subtitle">Bypass approval bottlenecks by force-authorizing requests or reopening locked requests for faculty officers.</p>
          </div>
          <span class="badge badge-primary">${requests.length} Requests</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 280px; overflow-y: auto;">
            <table class="table table-hover table-sm small align-middle mb-0">
              <thead class="table-light sticky-top" style="position: sticky; top: 0; background: #F8FAFC; z-index: 2;">
                <tr>
                  <th>Request ID</th>
                  <th>Title & Description</th>
                  <th>Cohort</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th class="text-end">Master Override Actions</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => {
                  const statusBadge = r.status === 'authorized'
                    ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Authorized</span>'
                    : r.status === 'pending_authorization'
                    ? '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending Approval</span>'
                    : r.status === 'rejected'
                    ? '<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> Rejected</span>'
                    : '<span class="badge badge-secondary">Closed</span>';

                  return `
                    <tr>
                      <td><strong>REQ-${r.request_id}</strong></td>
                      <td>
                        <strong>${r.title}</strong>
                        <div class="text-muted small">${(r.description || '').slice(0, 45)}...</div>
                      </td>
                      <td>${r.target_section || 'All Sections'} (Yr ${r.target_year_level || 'All'})</td>
                      <td class="font-bold text-primary">₱${parseFloat(r.amount).toFixed(2)}</td>
                      <td>${statusBadge}</td>
                      <td class="text-end">
                        <div class="d-inline-flex gap-1 justify-content-end">
                          ${r.status !== 'authorized' ? `
                            <button class="btn btn-xs btn-success" onclick="CoeDeveloperView.executeMasterAuthorizeRequest(${r.request_id})" title="Force Authorize Request">
                              <i class="fa-solid fa-stamp"></i> Force Authorize
                            </button>
                          ` : ''}
                          ${r.status === 'authorized' || r.status === 'rejected' ? `
                            <button class="btn btn-xs btn-warning" onclick="CoeDeveloperView.executeMasterReopenRequest(${r.request_id})" title="Reopen Request for modification">
                              <i class="fa-solid fa-pen-to-square"></i> Reopen
                            </button>
                          ` : ''}
                          <button class="btn btn-xs btn-outline-danger" onclick="CoeDeveloperView.executeMasterCancelRequest(${r.request_id})" title="Cancel or close request">
                            <i class="fa-solid fa-ban"></i> Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tool 4: Student & User Account Rescue -->
      <div class="card mb-4">
        <div class="card-header flex-between">
          <div>
            <h3 class="card-title"><i class="fa-solid fa-user-shield text-amber"></i> 4. Student & User Account Emergency Rescue</h3>
            <p class="card-subtitle">Instant password resets, email updates (to fix 2FA delivery failures), and account unlocks.</p>
          </div>
          <span class="badge badge-amber">${users.length} Users</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 280px; overflow-y: auto;">
            <table class="table table-hover table-sm small align-middle mb-0">
              <thead class="table-light sticky-top" style="position: sticky; top: 0; background: #F8FAFC; z-index: 2;">
                <tr>
                  <th>User ID</th>
                  <th>Username & Role</th>
                  <th>Institutional Email</th>
                  <th>Status</th>
                  <th class="text-end">Rescue Actions</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><code>#${u.user_id}</code></td>
                    <td>
                      <strong>${u.username}</strong>
                      <span class="badge badge-light ms-1">${u.role}</span>
                    </td>
                    <td>
                      <code class="text-primary font-bold">${u.email}</code>
                    </td>
                    <td>
                      <span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status || 'active'}</span>
                    </td>
                    <td class="text-end">
                      <div class="d-inline-flex gap-1 justify-content-end">
                        <button class="btn btn-xs btn-outline-warning" onclick="CoeDeveloperView.openSetUserPasswordModal('${u.username}')" title="Set custom password & dispatch email">
                          <i class="fa-solid fa-key"></i> Set Pass & Dispatch
                        </button>
                        <button class="btn btn-xs btn-warning" onclick="CoeDeveloperView.executeResetUserPassword('${u.username}')" title="Reset password to password123">
                          <i class="fa-solid fa-rotate-left"></i> Reset
                        </button>
                        <button class="btn btn-xs btn-outline-primary" onclick="CoeDeveloperView.openEditUserAccountModal(${u.user_id})" title="Update Email or Student Details">
                          <i class="fa-solid fa-user-pen"></i> Fix Email / Info
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  openMasterOverridesModal() {
    const modalBody = `
      <div class="master-overrides-modal py-2">
        <div class="text-center mb-3">
          <div style="font-size: 2.5rem; color: #F59E0B; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-crown"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Emergency Master Overrides & System Problem Solver</h3>
          <p class="text-muted small mt-1">Superuser controls to resolve issues when Program Head, Officer, or Student cannot proceed.</p>
        </div>

        <div class="d-flex gap-2 justify-content-center mb-3">
          <button class="btn btn-sm btn-outline-primary" onclick="window.coeApp.closeModal(); CoeDeveloperView.switchTab('overrides'); const t = document.getElementById('dev-tab-overrides'); if(t) t.scrollIntoView({behavior:'smooth'});">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full Overrides Console
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="window.coeApp.closeModal(); window.coeApp.returnToDeveloper();">
            <i class="fa-solid fa-code"></i> Return to Developer View
          </button>
        </div>

        <div id="modal-overrides-content" style="max-height: 520px; overflow-y: auto;">
          <!-- Dynamically populated -->
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">
        <i class="fa-solid fa-check"></i> Close
      </button>
    `;

    window.coeApp.showModal('Developer Master Overrides', modalBody, footer, 'modal-xl');

    // Populate modal overrides content
    const modalContent = document.getElementById('modal-overrides-content');
    if (modalContent) {
      const container = document.createElement('div');
      container.id = 'dev-overrides-container';
      modalContent.appendChild(container);
      this.renderMasterOverridesTab();
    }
  },

  // --- Master Override Handlers ---

  executeMasterVerify(transactionId) {
    try {
      window.coepayDb.masterOverrideTransaction(
        transactionId,
        'verified',
        'Developer Master Override: Transaction force-verified and official clearance voucher issued.'
      );
      window.coeApp.showToast(`Transaction #${transactionId} force-verified successfully! Clearance certificate issued.`, 'success');
      this.renderMasterOverridesTab();
      if (typeof CoePersonnelView !== 'undefined' && typeof CoePersonnelView.render === 'function') CoePersonnelView.render();
      if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.render === 'function') CoeAdminView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeMasterReopen(transactionId) {
    try {
      window.coepayDb.masterOverrideTransaction(
        transactionId,
        'pending_verification',
        'Developer Master Override: Reopened for re-inspection.'
      );
      window.coeApp.showToast(`Transaction #${transactionId} reopened with status pending_verification.`, 'info');
      this.renderMasterOverridesTab();
      if (typeof CoePersonnelView !== 'undefined' && typeof CoePersonnelView.render === 'function') CoePersonnelView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  openMasterRejectModal(transactionId) {
    const trans = (window.coepayDb.tables.payment_transactions || []).find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const modalBody = `
      <div class="py-2">
        <p>Enter developer rejection reason for transaction <strong>#TX-${transactionId}</strong> (Ref: <code>${trans.gcash_reference_number}</code>):</p>
        <div class="form-group mt-3">
          <label class="form-label font-bold small">Rejection Remarks *</label>
          <textarea id="master-reject-reason-input" class="form-control" rows="3" placeholder="e.g. Invalid reference number / Unreadable receipt / Erroneous submission..."></textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="CoeDeveloperView.confirmMasterReject(${transactionId})">
        <i class="fa-solid fa-xmark"></i> Confirm Master Rejection
      </button>
    `;

    window.coeApp.showModal(`Developer Override: Reject Transaction #${transactionId}`, modalBody, footer);
  },

  confirmMasterReject(transactionId) {
    const reason = document.getElementById('master-reject-reason-input')?.value || 'Rejected via Developer Master Override';
    try {
      window.coepayDb.masterOverrideTransaction(transactionId, 'rejected', reason);
      window.coeApp.closeModal();
      window.coeApp.showToast(`Transaction #${transactionId} marked as rejected.`, 'warning');
      this.renderMasterOverridesTab();
      if (typeof CoePersonnelView !== 'undefined' && typeof CoePersonnelView.render === 'function') CoePersonnelView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  openEditTransactionModal(transactionId) {
    const trans = (window.coepayDb.tables.payment_transactions || []).find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const modalBody = `
      <div class="py-2">
        <p class="small text-muted mb-3">Adjust transaction metadata to repair student submission typos.</p>
        <div class="form-group mb-2">
          <label class="form-label small font-bold">GCash Reference Number (13 Digits)</label>
          <input type="text" id="edit-tx-ref" class="form-control" value="${trans.gcash_reference_number}">
        </div>
        <div class="form-group mb-2">
          <label class="form-label small font-bold">Declared Amount Paid (₱)</label>
          <input type="number" step="0.01" id="edit-tx-amt" class="form-control" value="${trans.amount_paid}">
        </div>
        <div class="form-group mb-2">
          <label class="form-label small font-bold">Sender Name</label>
          <input type="text" id="edit-tx-sender" class="form-control" value="${trans.gcash_sender_name}">
        </div>
        <div class="form-group mb-2">
          <label class="form-label small font-bold">Student Notes / Reason</label>
          <input type="text" id="edit-tx-notes" class="form-control" value="${trans.student_notes || ''}">
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="CoeDeveloperView.saveEditTransaction(${transactionId})">
        <i class="fa-solid fa-floppy-disk"></i> Save Transaction Fixes
      </button>
    `;

    window.coeApp.showModal(`Fix Transaction #${transactionId}`, modalBody, footer);
  },

  saveEditTransaction(transactionId) {
    const ref = document.getElementById('edit-tx-ref')?.value;
    const amt = document.getElementById('edit-tx-amt')?.value;
    const sender = document.getElementById('edit-tx-sender')?.value;
    const notes = document.getElementById('edit-tx-notes')?.value;

    const trans = (window.coepayDb.tables.payment_transactions || []).find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    if (ref) trans.gcash_reference_number = ref.trim();
    if (amt) trans.amount_paid = parseFloat(amt).toFixed(2);
    if (sender) trans.gcash_sender_name = sender.trim();
    if (notes !== undefined) trans.student_notes = notes.trim();
    trans.updated_at = window.coepayDb.getNowTimestamp();

    window.coepayDb.save();
    window.coepayDb.logAudit(
      1,
      'MASTER_OVERRIDE_TRANSACTION',
      'payment_transactions',
      transactionId,
      `Developer edited transaction #${transactionId} data (Ref: ${ref}, Amt: ${amt})`
    );

    window.coeApp.closeModal();
    window.coeApp.showToast(`Transaction #${transactionId} repaired successfully!`, 'success');
    this.renderMasterOverridesTab();
    if (typeof CoePersonnelView !== 'undefined' && typeof CoePersonnelView.render === 'function') CoePersonnelView.render();
  },

  executeMasterWaiveAssignment(assignmentId) {
    try {
      window.coepayDb.masterOverrideAssignment(
        assignmentId,
        'paid',
        'Developer Master Fee Waiver / Institutional Grant Clearance'
      );
      window.coeApp.showToast(`Payment obligation #${assignmentId} cleared via developer waiver!`, 'success');
      this.renderMasterOverridesTab();
      if (typeof CoeStudentView !== 'undefined' && typeof CoeStudentView.render === 'function') CoeStudentView.render();
      if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.render === 'function') CoeAdminView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeMasterResetAssignment(assignmentId) {
    try {
      window.coepayDb.masterOverrideAssignment(
        assignmentId,
        'unpaid',
        'Developer reset obligation to unpaid.'
      );
      window.coeApp.showToast(`Assignment #${assignmentId} reset to unpaid.`, 'info');
      this.renderMasterOverridesTab();
      if (typeof CoeStudentView !== 'undefined' && typeof CoeStudentView.render === 'function') CoeStudentView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeMasterClearAllStudent(explicitStudentId = null) {
    let studentId = explicitStudentId;
    if (!studentId) {
      const select = document.getElementById('master-clear-student-select');
      if (select) studentId = select.value;
    }
    if (!studentId) return;
    const student = (window.coepayDb.tables.students || []).find(s => s.student_id === Number(studentId));
    const name = student ? student.full_name : `Student #${studentId}`;

    if (confirm(`Force clear ALL outstanding fee obligations for ${name}? An official clearance waiver will be issued.`)) {
      try {
        const count = window.coepayDb.masterClearAllStudentObligations(studentId, `Full Clearance Waiver granted to ${name}`);
        window.coeApp.showToast(`Cleared ${count} obligations for ${name}! 100% Clearance granted.`, 'success');
        this.renderMasterOverridesTab();
        if (typeof CoeStudentView !== 'undefined' && typeof CoeStudentView.render === 'function') CoeStudentView.render();
        if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.render === 'function') CoeAdminView.render();
      } catch (err) {
        alert(err.message);
      }
    }
  },

  executeMasterAuthorizeRequest(requestId) {
    try {
      window.coepayDb.masterOverridePaymentRequest(
        requestId,
        'authorized',
        'Authorized via Developer Master Override. Cohort fee obligations generated.'
      );
      window.coeApp.showToast(`Payment request REQ-${requestId} authorized and activated!`, 'success');
      this.renderMasterOverridesTab();
      if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.render === 'function') CoeAdminView.render();
      if (typeof CoePersonnelView !== 'undefined' && typeof CoePersonnelView.render === 'function') CoePersonnelView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeMasterReopenRequest(requestId) {
    try {
      window.coepayDb.masterOverridePaymentRequest(
        requestId,
        'pending_authorization',
        'Reopened by Developer for administrative adjustments.'
      );
      window.coeApp.showToast(`Payment request REQ-${requestId} reopened for modification.`, 'info');
      this.renderMasterOverridesTab();
      if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.render === 'function') CoeAdminView.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeMasterCancelRequest(requestId) {
    if (confirm(`Cancel or close payment request REQ-${requestId}?`)) {
      try {
        window.coepayDb.masterOverridePaymentRequest(
          requestId,
          'closed',
          'Request canceled/closed by Developer.'
        );
        window.coeApp.showToast(`Payment request REQ-${requestId} closed.`, 'warning');
        this.renderMasterOverridesTab();
        if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.render === 'function') CoeAdminView.render();
      } catch (err) {
        alert(err.message);
      }
    }
  },

  executeResetUserPassword(username) {
    const user = (window.coepayDb.tables.users || []).find(u => u.username === username);
    if (!user) {
      alert(`User "${username}" not found.`);
      return;
    }

    user.password_hash = 'password123';
    user.updated_at = window.coepayDb.getNowTimestamp();
    window.coepayDb.save();
    window.coepayDb.logAudit(
      1,
      'MASTER_ACCOUNT_UPDATE',
      'users',
      user.user_id,
      `Developer reset password for "${username}" to default "password123"`
    );

    window.coeApp.showToast(`Password for "${username}" has been reset to "password123"!`, 'success');
    this.renderMasterOverridesTab();
  },

  openEditUserAccountModal(userId) {
    const user = (window.coepayDb.tables.users || []).find(u => u.user_id === Number(userId));
    if (!user) return;
    const student = (window.coepayDb.tables.students || []).find(s => s.user_id === user.user_id);

    const modalBody = `
      <div class="py-2">
        <p class="small text-muted mb-3">Update credentials or institutional email (essential when 2FA OTP emails cannot be delivered due to email typos).</p>
        <div class="form-group mb-2">
          <label class="form-label small font-bold">Username</label>
          <input type="text" class="form-control" value="${user.username}" readonly style="background:#f1f5f9;">
        </div>
        <div class="form-group mb-2">
          <label class="form-label small font-bold">Registered Email Address (2FA OTP Target) *</label>
          <input type="email" id="edit-user-email" class="form-control font-bold text-primary" value="${user.email}" required>
        </div>
        ${student ? `
          <div class="form-group mb-2">
            <label class="form-label small font-bold">Student Full Name</label>
            <input type="text" id="edit-user-fullname" class="form-control" value="${student.full_name}">
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label small font-bold">Section</label>
              <input type="text" id="edit-user-section" class="form-control" value="${student.section}">
            </div>
            <div class="col-6">
              <label class="form-label small font-bold">Program</label>
              <input type="text" id="edit-user-program" class="form-control" value="${student.program}">
            </div>
          </div>
        ` : ''}
        <div class="form-group mb-2">
          <label class="form-label small font-bold">Set New Password (Optional)</label>
          <input type="password" id="edit-user-newpass" class="form-control" placeholder="Leave blank to keep current password">
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="CoeDeveloperView.saveEditUserAccount(${userId})">
        <i class="fa-solid fa-floppy-disk"></i> Save Account Updates
      </button>
    `;

    window.coeApp.showModal(`Rescue Account • ${user.username}`, modalBody, footer);
  },

  saveEditUserAccount(userId) {
    const email = document.getElementById('edit-user-email')?.value;
    const fullName = document.getElementById('edit-user-fullname')?.value;
    const section = document.getElementById('edit-user-section')?.value;
    const program = document.getElementById('edit-user-program')?.value;
    const newPass = document.getElementById('edit-user-newpass')?.value;

    if (!email) {
      alert("Email address is required.");
      return;
    }

    try {
      const updates = { email };
      if (fullName) updates.full_name = fullName;
      if (section) updates.section = section;
      if (program) updates.program = program;
      if (newPass && newPass.length >= 6) updates.password = newPass;

      window.coepayDb.masterUpdateAccount(userId, updates);
      window.coeApp.closeModal();
      window.coeApp.showToast(`Account updated successfully! New email: ${email}`, 'success');
      this.renderMasterOverridesTab();
    } catch (err) {
      alert(err.message);
    }
  },

  // --- Direct Table Row Editor & Deleter ---

  openEditRowModal(tableName, rowIndex) {
    const row = (window.coepayDb.tables[tableName] || [])[rowIndex];
    if (!row) return;

    const fields = Object.keys(row);
    const modalBody = `
      <div class="edit-row-modal py-2">
        <p class="text-muted small mb-3">
          Direct Developer Override: Editing row <code>#${rowIndex}</code> in table <strong>${tableName}</strong>.
          Changes will persist immediately into the relational database engine.
        </p>
        <form id="dev-edit-row-form" onsubmit="event.preventDefault(); CoeDeveloperView.executeSaveEditRow('${tableName}', ${rowIndex});">
          <div class="row g-2" style="max-height: 420px; overflow-y: auto;">
            ${fields.map(f => {
              const val = row[f] !== null && row[f] !== undefined ? String(row[f]) : '';
              const isReadOnly = f === 'created_at';
              return `
                <div class="col-12 col-md-6 mb-2">
                  <label class="form-label small font-mono font-bold text-muted">${f}</label>
                  <input type="text" class="form-control form-control-sm" name="${f}" value="${val.replace(/"/g, '&quot;')}" ${isReadOnly ? 'readonly style="background:#f1f5f9;"' : ''}>
                </div>
              `;
            }).join('')}
          </div>
        </form>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="CoeDeveloperView.executeSaveEditRow('${tableName}', ${rowIndex})">
        <i class="fa-solid fa-floppy-disk"></i> Save Row Changes
      </button>
    `;

    window.coeApp.showModal(`Edit Row • Table: ${tableName}`, modalBody, footer, 'modal-lg');
  },

  executeSaveEditRow(tableName, rowIndex) {
    const row = (window.coepayDb.tables[tableName] || [])[rowIndex];
    if (!row) return;

    const form = document.getElementById('dev-edit-row-form');
    if (!form) return;

    const formData = new FormData(form);
    const updated = {};
    for (let [key, val] of formData.entries()) {
      if (typeof row[key] === 'number') {
        updated[key] = val === '' ? null : Number(val);
      } else if (typeof row[key] === 'boolean') {
        updated[key] = val === 'true' || val === '1';
      } else {
        updated[key] = val === 'null' ? null : val;
      }
    }

    if (row.hasOwnProperty('updated_at')) {
      updated.updated_at = window.coepayDb.getNowTimestamp();
    }

    Object.assign(row, updated);
    window.coepayDb.save();
    window.coepayDb.logAudit(
      1,
      'MASTER_DATABASE_ROW_UPDATE',
      tableName,
      rowIndex,
      `Developer edited row #${rowIndex} in table ${tableName}`
    );

    window.coeApp.closeModal();
    window.coeApp.showToast(`Updated record in ${tableName} successfully!`, 'success');
    this.showTable(tableName);
  },

  confirmDeleteRowModal(tableName, rowIndex) {
    const row = (window.coepayDb.tables[tableName] || [])[rowIndex];
    if (!row) return;

    if (confirm(`Are you sure you want to permanently delete row #${rowIndex} from table "${tableName}"? This action is audited.`)) {
      window.coepayDb.tables[tableName].splice(rowIndex, 1);
      window.coepayDb.save();
      window.coepayDb.logAudit(
        1,
        'MASTER_DATABASE_ROW_DELETE',
        tableName,
        rowIndex,
        `Developer deleted row #${rowIndex} from table ${tableName}`
      );
      window.coeApp.showToast(`Record deleted from ${tableName}.`, 'info');
      this.showTable(tableName);
    }
  },

  openInsertRowModal(tableName) {
    const sample = (window.coepayDb.tables[tableName] || [])[0] || {};
    const fields = Object.keys(sample);
    if (fields.length === 0) {
      alert("Cannot detect table schema: Table is empty without initial structure.");
      return;
    }

    const modalBody = `
      <div class="insert-row-modal py-2">
        <p class="text-muted small mb-3">
          Insert new record into table <strong>${tableName}</strong>. Enter field values below:
        </p>
        <form id="dev-insert-row-form" onsubmit="event.preventDefault(); CoeDeveloperView.executeInsertRow('${tableName}');">
          <div class="row g-2" style="max-height: 420px; overflow-y: auto;">
            ${fields.map(f => `
              <div class="col-12 col-md-6 mb-2">
                <label class="form-label small font-mono font-bold text-muted">${f}</label>
                <input type="text" class="form-control form-control-sm" name="${f}" placeholder="${f}">
              </div>
            `).join('')}
          </div>
        </form>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-success" onclick="CoeDeveloperView.executeInsertRow('${tableName}')">
        <i class="fa-solid fa-plus"></i> Insert Record
      </button>
    `;

    window.coeApp.showModal(`Insert Record • Table: ${tableName}`, modalBody, footer, 'modal-lg');
  },

  executeInsertRow(tableName) {
    const form = document.getElementById('dev-insert-row-form');
    if (!form) return;

    const sample = (window.coepayDb.tables[tableName] || [])[0] || {};
    const formData = new FormData(form);
    const newRecord = {};

    for (let [key, val] of formData.entries()) {
      if (sample.hasOwnProperty(key) && typeof sample[key] === 'number') {
        newRecord[key] = val === '' ? 0 : Number(val);
      } else {
        newRecord[key] = val;
      }
    }

    if (!newRecord.created_at) newRecord.created_at = window.coepayDb.getNowTimestamp();
    if (sample.hasOwnProperty('updated_at') && !newRecord.updated_at) newRecord.updated_at = window.coepayDb.getNowTimestamp();

    window.coepayDb.tables[tableName].push(newRecord);
    window.coepayDb.save();
    window.coepayDb.logAudit(
      1,
      'MASTER_DATABASE_ROW_INSERT',
      tableName,
      null,
      `Developer inserted new record into table ${tableName}`
    );

    window.coeApp.closeModal();
    window.coeApp.showToast(`Inserted new record into ${tableName}!`, 'success');
    this.showTable(tableName);
  },

  dispatchAllDefaultPasswords() {
    if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.dispatchDefaultPasswordsToAll === 'function') {
      CoeAdminView.dispatchDefaultPasswordsToAll();
    } else {
      const results = window.coepayDb.dispatchDefaultPasswordsToAllMasterlist();
      window.coeApp.showToast(`Dispatched default passwords to ${results.length} masterlist students!`, 'success');
      window.coeApp.updateEmailDispatchBadge();
    }
  },

  openAddStudentModal() {
    if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.openAddStudentModal === 'function') {
      CoeAdminView.openAddStudentModal();
      return;
    }
  },

  openSetUserPasswordModal(username) {
    const user = window.coepayDb.findUserByIdentifier(username);
    if (!user) {
      alert(`User ${username} not found.`);
      return;
    }

    const currentPass = user.password_custom || 'password123';

    const modalBody = `
      <form id="dev-set-password-form" onsubmit="event.preventDefault(); CoeDeveloperView.saveSetUserPassword(${user.user_id});">
        <div class="text-center mb-3">
          <div style="font-size: 2.25rem; color: #F59E0B; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-key"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Developer Password Rescue & Dispatch</h3>
          <p class="text-muted small mt-1">
            Override the password for user <strong>${user.username}</strong> (${user.role.toUpperCase()}) and optionally dispatch credentials via email.
          </p>
        </div>

        <div class="card p-3 mb-3" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
          <div class="detail-item"><span class="label">Username:</span> <span class="value font-bold">${user.username}</span></div>
          <div class="detail-item"><span class="label">Registered Email:</span> <span class="value font-bold text-primary">${user.email}</span></div>
          <div class="detail-item"><span class="label">Active Password:</span> <span class="value font-mono"><code style="background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:4px;">${currentPass}</code></span></div>
        </div>

        <div class="form-group mb-3">
          <div class="flex-between align-center mb-1">
            <label class="form-label font-bold mb-0">New Password *</label>
            <button type="button" class="btn btn-xs btn-outline-secondary" onclick="CoeAdminView.generateRandomPassword('dev-rescue-new-pass')">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Generate
            </button>
          </div>
          <div style="position: relative;">
            <input type="text" id="dev-rescue-new-pass" class="form-control font-mono font-bold" value="${currentPass}" required style="padding-right: 2.5rem;">
            <button type="button" onclick="window.coeApp.togglePasswordVisibility('dev-rescue-new-pass', this)" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748B; cursor: pointer;">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>
        </div>

        <div class="form-check p-2" style="background: #F1F5F9; border-radius: 6px;">
          <input class="form-check-input ms-1" type="checkbox" id="dev-rescue-dispatch-email" checked style="cursor: pointer;">
          <label class="form-check-label font-bold small ms-1" for="dev-rescue-dispatch-email" style="cursor: pointer;">
            <i class="fa-solid fa-paper-plane text-success"></i> Dispatch Updated Credentials to User's Email Immediately
          </label>
          <div class="small text-muted ms-4">Records transmission in system outbox and audit log.</div>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-warning" onclick="document.getElementById('dev-set-password-form').requestSubmit();">
        <i class="fa-solid fa-shield-check"></i> Apply Password & Dispatch
      </button>
    `;

    window.coeApp.showModal('Account Password Override', modalBody, footer);
  },

  saveSetUserPassword(userId) {
    const newPass = document.getElementById('dev-rescue-new-pass')?.value?.trim();
    const dispatchEmail = document.getElementById('dev-rescue-dispatch-email')?.checked;

    if (!newPass) {
      alert("Please provide a new password.");
      return;
    }

    try {
      window.coepayDb.masterUpdateAccount(userId, {
        password: newPass,
        dispatch_email: dispatchEmail
      });
      window.coeApp.closeModal();
      window.coeApp.showToast(`Password updated successfully! ${dispatchEmail ? 'Email credentials dispatched to outbox.' : ''}`, 'success');
      if (window.coeApp && window.coeApp.updateEmailDispatchBadge) {
        window.coeApp.updateEmailDispatchBadge();
      }
      this.render();
      this.renderMasterOverridesTab();
    } catch (err) {
      alert(err.message);
    }
  },

  toggleAutoApproval() {
    const user = window.coeAuth.getUser();
    const newState = window.coepayDb.toggleAutoApproval(user);
    window.coeApp.showToast(`Auto-Approval Engine is now ${newState ? 'ACTIVE (Instant Approval)' : 'PAUSED (Manual Queue)'}!`, 'info');
    this.render();
  }
};

window.CoeDeveloperView = CoeDeveloperView;
