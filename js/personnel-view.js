/**
 * COE-Pay: Faculty & Personnel View Controller
 * Handles payment request drafting/submission, transaction verification queue,
 * GCash receipt inspection, and section collection sheets.
 */

const CoePersonnelView = {
  render() {
    const container = document.getElementById('personnel-view-container');
    if (!container) return;

    const personnel = window.coeAuth.getProfile();
    const user = window.coeAuth.getUser();
    const currentTerm = window.coepayDb.getCurrentTerm();

    // Requests created by this personnel
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const allRequests = window.coepayDb.getPaymentRequests();

    // Transactions pending verification for requests created by this personnel (or all if chair)
    const myRequestIds = myRequests.map(r => r.request_id);
    const allPendingTransactions = window.coepayDb.getTransactions({ status: 'pending' });
    const pendingTransactions = allPendingTransactions.filter(t => myRequestIds.includes(t.request_id));

    // Stats
    const totalCollectedForMyReqs = myRequests.reduce((sum, r) => sum + r.stats.totalCollected, 0);
    const totalExpectedForMyReqs = myRequests.reduce((sum, r) => sum + r.stats.targetExpected, 0);
    const rate = totalExpectedForMyReqs > 0 ? Math.round((totalCollectedForMyReqs / totalExpectedForMyReqs) * 100) : 0;
    const isAutoApproval = window.coepayDb.isAutoApprovalEnabled();

    container.innerHTML = `
      <!-- Personnel / Officer Subheader -->
      <div class="view-header">
        <div>
          <span class="badge badge-personnel"><i class="fa-solid fa-clipboard-user"></i> Student Officer & Collection Console</span>
          <h1 class="page-title">${personnel.full_name || 'Pearl Catequista'}</h1>
          <p class="page-subtitle">
            <strong>${personnel.designation || 'College Student Officer & Financial Treasurer'}</strong> • 
            Responsibility: <strong>Request for adding items, seminars, and other fees; inspect receipts</strong>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="CoePersonnelView.openCreateRequestModal()">
            <i class="fa-solid fa-circle-plus"></i> Request Fee / Seminar / Item
          </button>
        </div>
      </div>

      <!-- Auto-Approval Engine Banner -->
      <div class="card p-3 mb-3" style="background: ${isAutoApproval ? '#F0FDF4' : '#F8FAFC'}; border: 1px solid ${isAutoApproval ? '#86EFAC' : '#CBD5E1'}; border-radius: 8px;">
        <div class="flex-between align-center">
          <div>
            <div class="font-bold d-flex align-items-center gap-2" style="color: ${isAutoApproval ? '#166534' : '#475569'};">
              <i class="fa-solid fa-bolt ${isAutoApproval ? 'text-success' : 'text-muted'}"></i> Smart Auto-Approval & Receipt Legitimacy Engine
              <span class="badge ${isAutoApproval ? 'badge-success' : 'badge-outline'}">${isAutoApproval ? 'ACTIVE' : 'PAUSED (MANUAL QUEUE)'}</span>
            </div>
            <div class="small text-muted mt-1">
              ${isAutoApproval 
                ? 'Valid 10-14 digit reference numbers with uploaded receipt proof are automatically verified and cleared in real time.' 
                : 'Auto-approval is paused. All submitted student payments are held in the verification queue below for manual officer review.'}
            </div>
          </div>
          <button class="btn btn-sm ${isAutoApproval ? 'btn-outline-danger' : 'btn-success'}" onclick="CoePersonnelView.toggleAutoApproval()">
            <i class="fa-solid ${isAutoApproval ? 'fa-pause' : 'fa-play'}"></i> ${isAutoApproval ? 'Pause Auto-Approval' : 'Enable Auto-Approval'}
          </button>
        </div>
      </div>

      <!-- Personnel Metrics -->
      <div class="stats-grid">
        <div class="stat-card clickable-card" onclick="CoePersonnelView.openOfficerCollectionsModal()" title="Click to inspect verified collections breakdown and transaction ledger">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</div>
          <div class="stat-icon bg-blue-subtle">
            <i class="fa-solid fa-peso-sign text-primary"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Collected for Your Requests</div>
            <div class="stat-value">₱${totalCollectedForMyReqs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-circle-check"></i> Credited to GCash Account</div>
          </div>
        </div>

        <div class="stat-card clickable-card ${pendingTransactions.length > 0 ? 'card-pulse' : ''}" onclick="CoePersonnelView.openOfficerPendingQueueModal()" title="Click to inspect pending receipts awaiting verification">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${pendingTransactions.length > 0 ? 'Review (' + pendingTransactions.length + ')' : 'Inspect'}</div>
          <div class="stat-icon bg-amber-subtle">
            <i class="fa-solid fa-receipt text-amber"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Pending Verification Queue</div>
            <div class="stat-value">${pendingTransactions.length}</div>
            <div class="stat-footnote ${pendingTransactions.length > 0 ? 'text-amber' : 'text-muted'}">
              ${pendingTransactions.length > 0 ? 'Receipts Awaiting Inspection' : 'Queue Cleared'}
            </div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoePersonnelView.openOfficerComplianceModal()" title="Click to inspect collection compliance rate and cohort progress">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</div>
          <div class="stat-icon bg-emerald-subtle">
            <i class="fa-solid fa-chart-line text-emerald"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Target Compliance Rate</div>
            <div class="stat-value">${rate}%</div>
            <div class="stat-footnote text-muted">Target: ₱${totalExpectedForMyReqs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="stat-card clickable-card" onclick="CoePersonnelView.openOfficerInitiatedRequestsModal()" title="Click to inspect active initiated fee & item requests">
          <div class="card-click-pill"><i class="fa-solid fa-arrow-up-right-from-square"></i> Inspect</div>
          <div class="stat-icon bg-indigo-subtle">
            <i class="fa-solid fa-folder-tree text-indigo"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Active Initiated Requests</div>
            <div class="stat-value">${myRequests.length}</div>
            <div class="stat-footnote text-muted">Academic Term: ${currentTerm.semester}</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs-nav">
        <button class="tab-btn active" onclick="CoePersonnelView.switchTab('verification')">
          <i class="fa-solid fa-shield-check"></i> Verification Queue (${pendingTransactions.length})
        </button>
        <button class="tab-btn" onclick="CoePersonnelView.switchTab('requests')">
          <i class="fa-solid fa-list-check"></i> My Payment Requests (${myRequests.length})
        </button>
        <button class="tab-btn" onclick="CoePersonnelView.switchTab('roster-monitor')">
          <i class="fa-solid fa-table-list"></i> Section Collection Monitoring
        </button>
      </div>

      <!-- TAB 1: Verification Queue -->
      <div id="personnel-tab-verification" class="admin-tab-content active">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Student Payment Verification Queue</h2>
              <p class="card-subtitle">Verify student GCash receipts, reference numbers, and match against your designated mobile wallet.</p>
            </div>
            <div class="small text-muted">
              <i class="fa-solid fa-shield-halved text-primary"></i> Anti-Fraud Reference Check Active
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Student Details</th>
                    <th>Request / Obligation</th>
                    <th>GCash Reference No.</th>
                    <th>Sender Info</th>
                    <th>Amount Paid</th>
                    <th>Payment Date</th>
                    <th>Receipt</th>
                    <th class="text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody id="personnel-verification-table-body">
                  <!-- Populated by renderVerificationQueue() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: My Payment Requests -->
      <div id="personnel-tab-requests" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Initiated Payment Requests</h2>
              <p class="card-subtitle">Contribution programs created by you under this academic term.</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="CoePersonnelView.openCreateRequestModal()">
              <i class="fa-solid fa-plus"></i> New Request
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Target Cohort</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Collection Progress</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody id="personnel-requests-table-body">
                  <!-- Populated by renderMyRequests() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Section Collection Monitoring -->
      <div id="personnel-tab-roster-monitor" class="admin-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Class & Section Master Collection Sheet</h2>
              <p class="card-subtitle">View student settlement compliance breakdown by section and export official billing sheets.</p>
            </div>
            <div class="flex-gap">
              <select id="personnel-monitor-request-select" class="form-select form-select-sm" onchange="CoePersonnelView.renderSectionMonitor()">
                ${myRequests.map(r => `<option value="${r.request_id}">${r.title} (₱${r.amount})</option>`).join('')}
              </select>
              <select id="personnel-monitor-status-filter" class="form-select form-select-sm" onchange="CoePersonnelView.renderSectionMonitor()">
                <option value="all">All Students</option>
                <option value="paid">✅ Paid Only (Settled)</option>
                <option value="pending_verification">⏳ Pending Verification</option>
                <option value="unpaid">⚠️ Unpaid / Overdue</option>
              </select>
              <button class="btn btn-sm btn-outline" onclick="CoePersonnelView.exportSectionCsv()">
                <i class="fa-solid fa-download"></i> Export Sheet (.csv)
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Section</th>
                    <th>Payment Status</th>
                    <th>GCash Reference</th>
                    <th>Amount</th>
                    <th>Verified Timestamp</th>
                    <th class="text-right">Inspection Action</th>
                  </tr>
                </thead>
                <tbody id="personnel-monitor-table-body">
                  <!-- Populated by renderSectionMonitor() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderVerificationQueue();
    this.renderMyRequests();
    this.renderSectionMonitor();
  },

  switchTab(tabKey) {
    document.querySelectorAll('#personnel-view-container .admin-tabs-nav .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#personnel-view-container .admin-tab-content').forEach(c => c.classList.remove('active'));

    const activeBtn = Array.from(document.querySelectorAll('#personnel-view-container .admin-tabs-nav .tab-btn')).find(b => b.textContent.toLowerCase().includes(tabKey));
    if (activeBtn) activeBtn.classList.add('active');

    const tabContent = document.getElementById(`personnel-tab-${tabKey}`);
    if (tabContent) tabContent.classList.add('active');
  },

  renderVerificationQueue() {
    const tbody = document.getElementById('personnel-verification-table-body');
    if (!tbody) return;

    const personnel = window.coeAuth.getProfile();
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const myRequestIds = myRequests.map(r => r.request_id);

    // Get all pending transactions for my requests (or all if chair)
    let pending = window.coepayDb.getTransactions({ status: 'pending' });
    if (myRequestIds.length > 0) {
      pending = pending.filter(t => myRequestIds.includes(t.request_id));
    }

    if (pending.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted"><i class="fa-solid fa-circle-check text-success"></i> No pending student payment verifications at this time.</td></tr>`;
      return;
    }

    tbody.innerHTML = pending.map(t => `
      <tr>
        <td><strong>#TX-${t.transaction_id}</strong></td>
        <td>
          <strong>${t.student.full_name}</strong>
          <div class="small text-muted">${t.student.student_number} • ${t.student.section}</div>
        </td>
        <td>
          <strong>${t.request.title}</strong>
          <div class="small text-muted">${t.request.category_name}</div>
        </td>
        <td>
          <code class="gcash-ref-code">${t.gcash_reference_number}</code>
        </td>
        <td>
          <div>${t.gcash_sender_name}</div>
          <div class="small text-muted">${t.gcash_sender_number}</div>
        </td>
        <td class="font-bold text-primary">₱${parseFloat(t.amount_paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
        <td class="small">${t.payment_timestamp}</td>
        <td>
          <button class="btn btn-xs btn-outline" onclick="CoePersonnelView.inspectReceipt(${t.transaction_id})">
            <i class="fa-solid fa-image"></i> View Receipt
          </button>
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn btn-xs btn-success" onclick="CoePersonnelView.confirmVerifyModal(${t.transaction_id})">
              <i class="fa-solid fa-check"></i> Verify
            </button>
            <button class="btn btn-xs btn-danger" onclick="CoePersonnelView.confirmRejectModal(${t.transaction_id})">
              <i class="fa-solid fa-xmark"></i> Reject
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  inspectReceipt(transactionId) {
    const trans = window.coepayDb.getTransactions().find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const receiptSvg = CoeReceiptHelper.generateGcashReceiptSvg({
      gcash_reference_number: trans.gcash_reference_number,
      amount_paid: trans.amount_paid,
      gcash_sender_name: trans.gcash_sender_name,
      gcash_sender_number: trans.gcash_sender_number,
      gcash_account_name: trans.request.gcash_account_name,
      gcash_account_number: trans.request.gcash_account_number,
      payment_timestamp: trans.payment_timestamp,
      title: trans.request.title
    });

    const modalBody = `
      <div class="receipt-inspection-modal">
        <div class="grid-2-col">
          <div class="receipt-preview-container">
            ${trans.receipt_image_data ? `
              <div class="card p-2 text-center" style="background:#0F172A; border-radius:8px;">
                <div class="d-flex justify-content-between align-items-center mb-2 px-1">
                  <span class="badge badge-success"><i class="fa-solid fa-camera"></i> Student Uploaded Screenshot Proof</span>
                  <button type="button" class="btn btn-xs btn-outline-light" onclick="window.open('${trans.receipt_image_data}', '_blank')">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Full Resolution
                  </button>
                </div>
                <img src="${trans.receipt_image_data}" alt="Uploaded Proof of Payment" style="max-height: 380px; max-width: 100%; border-radius: 6px; object-fit: contain; box-shadow: 0 4px 10px rgba(0,0,0,0.5); cursor: zoom-in;" onclick="window.open('${trans.receipt_image_data}', '_blank')">
                <div class="small mt-2 text-center" style="color:#94A3B8;"><i class="fa-solid fa-paperclip"></i> ${trans.receipt_file_name || 'receipt_screenshot.png'}</div>
              </div>
              <details class="mt-2" style="background:#F1F5F9; border-radius:6px; padding:6px 10px; cursor:pointer;">
                <summary class="small font-bold text-muted"><i class="fa-solid fa-receipt"></i> View System Generated e-Receipt Audit</summary>
                <div class="mt-2">${receiptSvg}</div>
              </details>
            ` : `
              ${receiptSvg}
            `}
          </div>
          <div class="inspection-details-panel">
            <h4>Verification Particulars</h4>
            <div class="detail-item mt-2">
              <span class="label">Student Name:</span>
              <span class="value font-bold">${trans.student.full_name} (${trans.student.student_number})</span>
            </div>
            <div class="detail-item">
              <span class="label">Section / Cohort:</span>
              <span class="value">${trans.student.program} - Year ${trans.student.year_level} (${trans.student.section})</span>
            </div>
            <div class="detail-item">
              <span class="label">Payable Obligation:</span>
              <span class="value">${trans.request.title}</span>
            </div>
            <div class="detail-item">
              <span class="label">Expected Amount:</span>
              <span class="value font-bold">₱${parseFloat(trans.request.amount).toFixed(2)}</span>
            </div>
            <div class="detail-item">
              <span class="label">Declared Amount Paid:</span>
              <span class="value font-bold text-success">₱${parseFloat(trans.amount_paid).toFixed(2)}</span>
            </div>
            <div class="detail-item">
              <span class="label">GCash Reference No.:</span>
              <span class="value"><code class="gcash-ref-code">${trans.gcash_reference_number}</code></span>
            </div>
            <div class="detail-item">
              <span class="label">Sender Name & Mobile:</span>
              <span class="value">${trans.gcash_sender_name} (${trans.gcash_sender_number})</span>
            </div>
            <div class="detail-item">
              <span class="label">Transaction Date:</span>
              <span class="value">${trans.payment_timestamp}</span>
            </div>
            ${trans.student_notes ? `
              <div class="detail-item">
                <span class="label">Student Notes:</span>
                <span class="value italic">"${trans.student_notes}"</span>
              </div>
            ` : ''}

            <div class="verification-action-box mt-3">
              <label class="form-label">Personnel Verification Note (Optional):</label>
              <input type="text" id="inspect-remarks-input" class="form-control" placeholder="e.g. Verified via GCash Merchant statement...">
              <div class="action-buttons mt-3">
                <button class="btn btn-success w-100" onclick="CoePersonnelView.executeVerify(${trans.transaction_id})">
                  <i class="fa-solid fa-check-circle"></i> Approve & Issue Official Clearance
                </button>
                <button class="btn btn-danger w-100 mt-1" onclick="CoePersonnelView.executeReject(${trans.transaction_id})">
                  <i class="fa-solid fa-circle-xmark"></i> Reject Submission
                </button>
              </div>
              ${(sessionStorage.getItem('coepay_master_dev') === 'developer' || sessionStorage.getItem('coepay_dev_impersonating') === 'true') ? `
                <div class="mt-2 pt-2 border-top">
                  <div class="small font-bold text-amber mb-1"><i class="fa-solid fa-crown"></i> Developer Master Override:</div>
                  <div class="d-flex gap-1">
                    <button class="btn btn-xs btn-outline-warning w-100" onclick="window.coeApp.closeModal(); CoeDeveloperView.openEditTransactionModal(${trans.transaction_id});">
                      <i class="fa-solid fa-pen"></i> Fix Ref / Amount
                    </button>
                    <button class="btn btn-xs btn-outline-secondary w-100" onclick="window.coeApp.closeModal(); CoeDeveloperView.executeMasterReopen(${trans.transaction_id});">
                      <i class="fa-solid fa-rotate-left"></i> Reopen
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    window.coeApp.showModal(`GCash Receipt Audit & Inspection • Ref #${trans.gcash_reference_number}`, modalBody, null, 'modal-lg');
  },

  confirmVerifyModal(transactionId) {
    this.inspectReceipt(transactionId);
  },

  confirmRejectModal(transactionId) {
    const trans = window.coepayDb.getTransactions().find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const modalBody = `
      <div>
        <p>Please enter the reason for rejecting student payment for <strong>${trans.student.full_name}</strong> (Ref: <code>${trans.gcash_reference_number}</code>).</p>
        <div class="form-group mt-3">
          <label class="form-label">Rejection Reason *</label>
          <textarea id="reject-reason-input" class="form-control" rows="3" placeholder="e.g. Unreadable receipt screenshot / GCash reference not found in statement / Amount paid is short..." required></textarea>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="CoePersonnelView.executeReject(${transactionId})">
        <i class="fa-solid fa-xmark"></i> Confirm Reject
      </button>
    `;

    window.coeApp.showModal('Reject Payment Submission', modalBody, footer);
  },

  executeVerify(transactionId) {
    const remarks = document.getElementById('inspect-remarks-input')?.value || 'Verified against merchant ledger.';
    const user = window.coeAuth.getUser();

    try {
      window.coepayDb.verifyPayment(transactionId, user, remarks);
      window.coeApp.closeModal();
      window.coeApp.showToast('Payment verified successfully! Student clearance granted.', 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeReject(transactionId) {
    const remarks = document.getElementById('reject-reason-input')?.value || 
                    document.getElementById('inspect-remarks-input')?.value || 
                    'Payment rejected due to invalid reference or unreadable receipt.';
    const user = window.coeAuth.getUser();

    try {
      window.coepayDb.rejectPayment(transactionId, user, remarks);
      window.coeApp.closeModal();
      window.coeApp.showToast('Payment submission rejected.', 'warning');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  toggleAutoApproval() {
    const user = window.coeAuth.getUser();
    const newState = window.coepayDb.toggleAutoApproval(user);
    window.coeApp.showToast(`Smart Auto-Approval Engine is now ${newState ? 'ACTIVE (Instant Approval)' : 'PAUSED (Manual Queue)'}!`, 'info');
    this.render();
  },

  renderMyRequests() {
    const tbody = document.getElementById('personnel-requests-table-body');
    if (!tbody) return;

    const personnel = window.coeAuth.getProfile();
    const requests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No requests initiated yet. Click "New Payment Request" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = requests.map(r => {
      const targetCohort = r.target_year_level 
        ? `Year ${r.target_year_level} ${r.target_section ? '(' + r.target_section + ')' : '(All Sections)'}`
        : 'All COE Students';

      return `
        <tr>
          <td><span class="badge badge-light">REQ-${r.request_id}</span></td>
          <td>
            <strong>${r.title}</strong>
            <div class="small text-muted">${r.description.substring(0, 45)}...</div>
          </td>
          <td><span class="badge badge-outline">${r.category_name}</span></td>
          <td class="font-bold text-primary">₱${parseFloat(r.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
          <td><span class="cohort-tag">${targetCohort}</span></td>
          <td class="small">${new Date(r.deadline).toLocaleDateString()}</td>
          <td>${CoeAdminView.getStatusBadge(r.status)}</td>
          <td>
            <div class="progress-bar-container small">
              <div class="progress-bar-fill" style="width: ${r.stats.collectionRate}%;"></div>
            </div>
            <div class="small text-muted mt-1">${r.stats.paidStudents}/${r.stats.totalStudents} (${r.stats.collectionRate}%)</div>
          </td>
          <td class="text-right">
            <button class="btn btn-xs btn-outline" onclick="CoeAdminView.viewRequestDetails(${r.request_id})">
              <i class="fa-solid fa-eye"></i> Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderSectionMonitor() {
    const select = document.getElementById('personnel-monitor-request-select');
    const statusFilter = document.getElementById('personnel-monitor-status-filter')?.value || 'all';
    const tbody = document.getElementById('personnel-monitor-table-body');
    if (!select || !tbody) return;

    const reqId = Number(select.value);
    if (!reqId) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Select a payment request above to monitor section compliance.</td></tr>`;
      return;
    }

    let assignments = window.coepayDb.getAssignments({ request_id: reqId });

    if (statusFilter !== 'all') {
      assignments = assignments.filter(a => a.status === statusFilter);
    }

    if (assignments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No student records found matching this status filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = assignments.map(a => {
      const trans = a.transaction || {};
      const isPaid = a.status === 'paid';
      const isPending = a.status === 'pending_verification';

      return `
        <tr>
          <td><strong>${a.student.student_number}</strong></td>
          <td>${a.student.full_name}</td>
          <td><span class="cohort-tag">${a.student.section}</span></td>
          <td>${CoeAdminView.getAssignmentStatusBadge(a.status)}</td>
          <td>${trans.gcash_reference_number ? `<code class="gcash-ref-code">${trans.gcash_reference_number}</code>` : '<span class="text-muted">-</span>'}</td>
          <td class="font-bold ${isPaid ? 'text-success' : 'text-main'}">₱${parseFloat(a.request.amount).toFixed(2)}</td>
          <td class="small">${trans.verified_at || trans.submitted_at || '-'}</td>
          <td class="text-right">
            ${isPaid && trans.transaction_id ? `
              <button class="btn btn-xs btn-outline-success" onclick="CoePersonnelView.inspectReceipt(${trans.transaction_id})">
                <i class="fa-solid fa-receipt"></i> View e-Receipt
              </button>
            ` : isPending && trans.transaction_id ? `
              <button class="btn btn-xs btn-amber" onclick="CoePersonnelView.inspectReceipt(${trans.transaction_id})">
                <i class="fa-solid fa-stamp"></i> Verify Receipt
              </button>
            ` : '<span class="text-muted small">Awaiting Payment</span>'}
          </td>
        </tr>
      `;
    }).join('');
  },

  openCreateRequestModal() {
    const categories = window.coepayDb.getCategories();
    const currentTerm = window.coepayDb.getCurrentTerm();
    const personnel = window.coeAuth.getProfile();

    const modalBody = `
      <form id="create-request-form" onsubmit="event.preventDefault(); CoePersonnelView.saveNewRequest();">
        <div class="form-group">
          <label class="form-label">Payment Purpose / Title *</label>
          <input type="text" id="req-title" class="form-control" placeholder="e.g. 1st Sem 2026-2027 BSCpE Laboratory Maintenance Fee" required>
        </div>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="req-category" class="form-select" required>
              ${categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Academic Term</label>
            <input type="text" class="form-control" value="${currentTerm.academic_year} (${currentTerm.semester})" readonly>
            <input type="hidden" id="req-term-id" value="${currentTerm.term_id}">
          </div>
        </div>

        <div class="form-group mt-2">
          <label class="form-label">Detailed Description / Instructions *</label>
          <textarea id="req-description" class="form-control" rows="3" placeholder="Detail the breakdown of fees, what it covers, and instructions for payment..." required></textarea>
        </div>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">Payable Amount per Student (PHP) *</label>
            <input type="number" step="0.01" min="1" id="req-amount" class="form-control" placeholder="350.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline Date & Time *</label>
            <input type="datetime-local" id="req-deadline" class="form-control" required>
          </div>
        </div>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">Target Year Level</label>
            <select id="req-target-year" class="form-select">
              <option value="">All Year Levels (College-wide)</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Section (Optional)</label>
            <input type="text" id="req-target-section" class="form-control" placeholder="e.g. BSCpE-4A (or leave blank for all sections)">
          </div>
        </div>

        <div class="section-divider mt-3"></div>
        <h4 class="mt-2"><i class="fa-solid fa-wallet text-primary"></i> Designated GCash Collection Account</h4>

        <div class="grid-2-col mt-2">
          <div class="form-group">
            <label class="form-label">GCash Account Full Name *</label>
            <input type="text" id="req-gcash-name" class="form-control" value="${personnel.full_name.toUpperCase()} (COE TREASURER)" required>
          </div>
          <div class="form-group">
            <label class="form-label">GCash Mobile Number *</label>
            <input type="text" id="req-gcash-number" class="form-control" value="${personnel.contact_number || '09171234567'}" required>
          </div>
        </div>

        <div class="form-group mt-3">
          <label class="checkbox-label">
            <input type="checkbox" id="req-submit-direct" checked>
            <span><strong>Submit immediately for Dean Authorization</strong> (Uncheck to save as draft)</span>
          </label>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="document.getElementById('create-request-form').requestSubmit();">
        <i class="fa-solid fa-paper-plane"></i> Submit Request
      </button>
    `;

    window.coeApp.showModal('Create Payment Request', modalBody, footer);

    // Set default deadline to 14 days from now
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const pad = (n) => String(n).padStart(2, '0');
    const defaultDeadline = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T23:59`;
    document.getElementById('req-deadline').value = defaultDeadline;
  },

  saveNewRequest() {
    const user = window.coeAuth.getUser();
    const data = {
      title: document.getElementById('req-title').value,
      category_id: document.getElementById('req-category').value,
      term_id: document.getElementById('req-term-id').value,
      description: document.getElementById('req-description').value,
      amount: document.getElementById('req-amount').value,
      deadline: document.getElementById('req-deadline').value.replace('T', ' ') + ':00',
      target_year_level: document.getElementById('req-target-year').value || null,
      target_section: document.getElementById('req-target-section').value || null,
      gcash_account_name: document.getElementById('req-gcash-name').value,
      gcash_account_number: document.getElementById('req-gcash-number').value,
      submit_for_authorization: document.getElementById('req-submit-direct').checked
    };

    try {
      window.coepayDb.createPaymentRequest(data, user);
      window.coeApp.closeModal();
      window.coeApp.showToast(
        data.submit_for_authorization 
          ? 'Payment request submitted for Dean authorization!' 
          : 'Payment request saved as draft.',
        'success'
      );
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  exportSectionCsv() {
    const select = document.getElementById('personnel-monitor-request-select');
    if (!select) return;
    const reqId = Number(select.value);
    const req = window.coepayDb.getRequestById(reqId);
    const assignments = window.coepayDb.getAssignments({ request_id: reqId });

    let csv = "Student_Number,Full_Name,Section,Status,GCash_Ref,Amount,Verified_At\n";
    assignments.forEach(a => {
      const trans = a.transaction || {};
      csv += `"${a.student.student_number}","${a.student.full_name}","${a.student.section}","${a.status}","${trans.gcash_reference_number || ''}","${req.amount}","${trans.verified_at || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_collection_${reqId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    window.coeApp.showToast('Section collection sheet exported!', 'success');
  },

  /**
   * Stat Card 1: Collections Breakdown & Verified Ledger for Officer's Requests
   */
  openOfficerCollectionsModal() {
    const personnel = window.coeAuth.getProfile() || {};
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const myRequestIds = myRequests.map(r => r.request_id);
    const allTransactions = window.coepayDb.getTransactions();
    const verifiedTrans = allTransactions.filter(t => t.status === 'verified' && (myRequestIds.length === 0 || myRequestIds.includes(t.request_id)));

    const totalCollected = verifiedTrans.reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);
    const gcashTotal = verifiedTrans.filter(t => (t.gateway_type || 'gcash').toLowerCase() !== 'bank').reduce((s, t) => s + Number(t.amount_paid || 0), 0);
    const bankTotal = verifiedTrans.filter(t => (t.gateway_type || '').toLowerCase() === 'bank').reduce((s, t) => s + Number(t.amount_paid || 0), 0);

    // Grouping by Request
    const byRequest = {};
    verifiedTrans.forEach(t => {
      const title = t.request_title || (t.request ? t.request.title : 'Department Fee');
      if (!byRequest[title]) {
        byRequest[title] = {
          count: 0,
          total: 0,
          category: t.category_name || (t.request ? t.request.category_name : 'General'),
          amountPerStudent: t.request ? t.request.amount : t.amount_paid
        };
      }
      byRequest[title].count++;
      byRequest[title].total += Number(t.amount_paid || 0);
    });

    const requestEntries = Object.entries(byRequest);

    const modalBody = `
      <div class="collections-breakdown-modal">
        <!-- Top Stats Row -->
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Verified Sum</div>
            <div class="stat-value text-success" style="font-size: 1.4rem;">₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-muted">${verifiedTrans.length} Verified Transactions</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">GCash Gateway</div>
            <div class="stat-value text-primary" style="font-size: 1.4rem;">₱${gcashTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-qrcode"></i> Credited to GCash Account</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Direct Bank Transfers</div>
            <div class="stat-value text-indigo" style="font-size: 1.4rem;">₱${bankTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-muted">Institutional Clearing</div>
          </div>
        </div>

        <!-- Breakdown by Fee / Obligation -->
        <h5 class="mb-2"><i class="fa-solid fa-tags text-primary"></i> Collections by Initiated Fee / Obligation</h5>
        <div class="grid-3-col mb-3" style="gap: 0.75rem;">
          ${requestEntries.length > 0 ? requestEntries.map(([title, data]) => `
            <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.65rem 0.85rem;">
              <div class="font-bold small text-truncate" title="${title}">${title}</div>
              <div class="text-success font-bold mt-1">₱${data.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div class="text-muted small">${data.count} paid student${data.count === 1 ? '' : 's'} • Fee: ₱${parseFloat(data.amountPerStudent).toFixed(2)}</div>
            </div>
          `).join('') : '<div class="alert alert-info py-2">No verified collection data recorded yet for your requests.</div>'}
        </div>

        <!-- Verified Transactions Table -->
        <div class="flex-between align-center mb-2">
          <h5 class="m-0"><i class="fa-solid fa-list-check text-emerald"></i> Verified Payment Transactions Ledger</h5>
          <span class="badge badge-success">${verifiedTrans.length} Verified Records</span>
        </div>
        <div class="table-responsive" style="max-height: 320px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Tx #</th>
                <th>Student</th>
                <th>Payable Obligation</th>
                <th>Amount Paid</th>
                <th>Reference #</th>
                <th>Date / Time</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              ${verifiedTrans.length > 0 ? verifiedTrans.map(t => `
                <tr>
                  <td><strong>#${t.transaction_id}</strong></td>
                  <td>
                    <strong>${t.student_name || (t.student ? t.student.full_name : 'COE Student')}</strong>
                    <div class="text-muted small">${t.student_number || (t.student ? t.student.student_number : '-')}</div>
                  </td>
                  <td>
                    <strong>${t.request_title || (t.request ? t.request.title : 'Department Obligation')}</strong>
                    <div class="text-muted small">${t.category_name || (t.request ? t.request.category_name : '-')}</div>
                  </td>
                  <td class="font-bold text-success">₱${parseFloat(t.amount_paid).toFixed(2)}</td>
                  <td><code class="gcash-ref-code">${t.gcash_reference_number || '-'}</code></td>
                  <td class="small">${t.verified_at || t.submitted_at || t.payment_timestamp || '-'}</td>
                  <td>
                    <button class="btn btn-xs btn-outline" onclick="CoePersonnelView.inspectReceipt(${t.transaction_id})">
                      <i class="fa-solid fa-image"></i> View
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" class="text-center py-3 text-muted">No verified payments found.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="CoePersonnelView.exportSectionCsv()">
        <i class="fa-solid fa-file-csv text-success"></i> Export Section CSV
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal('Collected Funds & Payment Ledger', modalBody, footer, 'modal-lg');
  },

  /**
   * Stat Card 2: Pending Verification Queue Inspection Modal
   */
  openOfficerPendingQueueModal() {
    const personnel = window.coeAuth.getProfile() || {};
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const myRequestIds = myRequests.map(r => r.request_id);
    const allPendingTransactions = window.coepayDb.getTransactions({ status: 'pending' });
    const pendingTrans = allPendingTransactions.filter(t => myRequestIds.length === 0 || myRequestIds.includes(t.request_id));
    const totalPendingAmount = pendingTrans.reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);

    const modalBody = `
      <div class="pending-queue-modal-wrapper">
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Pending Receipts</div>
            <div class="stat-value text-amber" style="font-size: 1.4rem;">${pendingTrans.length}</div>
            <div class="stat-footnote text-muted">Awaiting Inspection</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Amount Pending</div>
            <div class="stat-value text-primary" style="font-size: 1.4rem;">₱${totalPendingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-peso-sign"></i> Pending Verification</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Designated Mobile Wallet</div>
            <div class="stat-value text-indigo" style="font-size: 1.1rem; line-height: 1.4;">${personnel.full_name || 'Pearl Catequista'}</div>
            <div class="stat-footnote text-muted">GCash: 0917-555-0199</div>
          </div>
        </div>

        <div class="flex-between align-center mb-2">
          <h5 class="m-0"><i class="fa-solid fa-receipt text-amber"></i> Receipts Awaiting Verification & Matching</h5>
          <span class="badge badge-amber">${pendingTrans.length} in Queue</span>
        </div>

        <div class="table-responsive" style="max-height: 340px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Tx #</th>
                <th>Student Details</th>
                <th>Payable Obligation</th>
                <th>Amount</th>
                <th>GCash Reference #</th>
                <th>Submitted At</th>
                <th>Receipt Proof</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingTrans.length > 0 ? pendingTrans.map(t => `
                <tr>
                  <td><strong>#${t.transaction_id}</strong></td>
                  <td>
                    <strong>${t.student ? t.student.full_name : (t.student_name || 'Student')}</strong>
                    <div class="small text-muted font-mono">${t.student ? t.student.student_number : (t.student_number || '-')}</div>
                    <div class="small text-muted">${t.student ? (t.student.program + ' ' + t.student.year_level + '-' + t.student.section) : ''}</div>
                  </td>
                  <td>
                    <strong>${t.request ? t.request.title : (t.request_title || 'Obligation')}</strong>
                    <div class="small text-muted">${t.request ? t.request.category_name : ''}</div>
                  </td>
                  <td class="font-bold text-primary">₱${parseFloat(t.amount_paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  <td><code class="gcash-ref-code">${t.gcash_reference_number}</code></td>
                  <td class="small">${t.payment_timestamp || t.submitted_at || '-'}</td>
                  <td>
                    <button class="btn btn-xs btn-outline" onclick="CoePersonnelView.inspectReceipt(${t.transaction_id})">
                      <i class="fa-solid fa-image"></i> View
                    </button>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons" style="display: inline-flex; gap: 4px;">
                      <button class="btn btn-xs btn-success" onclick="window.coeApp.closeModal(); CoePersonnelView.confirmVerifyModal(${t.transaction_id})">
                        <i class="fa-solid fa-check"></i> Verify
                      </button>
                      <button class="btn btn-xs btn-danger" onclick="window.coeApp.closeModal(); CoePersonnelView.confirmRejectModal(${t.transaction_id})">
                        <i class="fa-solid fa-xmark"></i> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="8" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-circle-check text-success" style="font-size: 1.75rem;"></i>
                    <p class="mt-2 font-bold">Verification queue is completely clear!</p>
                    <p class="small">All submitted student payments have been reviewed.</p>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline-primary" onclick="window.coeApp.closeModal(); CoePersonnelView.switchTab('verification');">
        <i class="fa-solid fa-arrow-right"></i> Open Verification Tab
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal('Pending Verification Queue', modalBody, footer, 'modal-lg');
  },

  /**
   * Stat Card 3: Target Compliance Rate & Cohort Assessment Modal
   */
  openOfficerComplianceModal() {
    const personnel = window.coeAuth.getProfile() || {};
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const myRequestIds = myRequests.map(r => r.request_id);
    const allAssignments = window.coepayDb.getAssignments();
    const myAssignments = allAssignments.filter(a => myRequestIds.length === 0 || myRequestIds.includes(a.request_id));

    const totalExpected = myRequests.reduce((sum, r) => sum + r.stats.targetExpected, 0);
    const totalCollected = myRequests.reduce((sum, r) => sum + r.stats.totalCollected, 0);
    const remainingBalance = Math.max(0, totalExpected - totalCollected);
    const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const paidAssignments = myAssignments.filter(a => a.status === 'paid');
    const pendingAssignments = myAssignments.filter(a => a.status === 'pending_verification');
    const unpaidAssignments = myAssignments.filter(a => a.status === 'unpaid');

    const modalBody = `
      <div class="compliance-modal-wrapper">
        <!-- Progress Bar Card -->
        <div class="card mb-3 p-3" style="border: 1px solid var(--border-color); background: var(--bg-main);">
          <div class="flex-between align-center mb-1">
            <span class="font-bold">Overall Collection Target Compliance</span>
            <span class="badge badge-emerald font-bold" style="font-size: 0.95rem;">${rate}% Compliance</span>
          </div>
          <div class="progress-bar-container mt-2" style="height: 12px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
            <div class="progress-bar-fill" style="width: ${rate}%; height: 100%; background: linear-gradient(90deg, #10B981, #059669); transition: width 0.5s ease;"></div>
          </div>
          <div class="flex-between small text-muted mt-2">
            <span><strong class="text-success">₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> Collected</span>
            <span><strong class="text-danger">₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> Remaining</span>
            <span>Target: <strong>₱${totalExpected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        <!-- 3 KPIs Row -->
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Paid / Cleared</div>
            <div class="stat-value text-success" style="font-size: 1.35rem;">${paidAssignments.length} / ${myAssignments.length}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-circle-check"></i> Obligations Fulfilled</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Pending Verification</div>
            <div class="stat-value text-amber" style="font-size: 1.35rem;">${pendingAssignments.length} Students</div>
            <div class="stat-footnote text-amber"><i class="fa-solid fa-clock"></i> In Verification Queue</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Unsettled Obligations</div>
            <div class="stat-value text-danger" style="font-size: 1.35rem;">${unpaidAssignments.length} Students</div>
            <div class="stat-footnote text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Follow-up Needed</div>
          </div>
        </div>

        <!-- Request-by-Request Compliance Breakdown Table -->
        <h5 class="mb-2"><i class="fa-solid fa-layer-group text-primary"></i> Target Progress by Obligation</h5>
        <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Obligation Title</th>
                <th>Target Cohort</th>
                <th>Fee</th>
                <th>Expected Total</th>
                <th>Collected Total</th>
                <th>Compliance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${myRequests.map(r => {
                const reqRate = r.stats.targetExpected > 0 ? Math.round((r.stats.totalCollected / r.stats.targetExpected) * 100) : 0;
                const statusBadge = reqRate >= 100 
                  ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> 100% Cleared</span>'
                  : reqRate > 0 
                  ? `<span class="badge badge-info">${reqRate}% In Progress</span>`
                  : '<span class="badge badge-secondary">0% Uncollected</span>';
                const targetText = r.target_year_level ? `Year ${r.target_year_level}${r.target_section ? ' - ' + r.target_section : ''}` : 'All COE Students';

                return `
                  <tr>
                    <td>
                      <strong>${r.title}</strong>
                      <div class="small text-muted">${r.category_name}</div>
                    </td>
                    <td>${targetText}</td>
                    <td class="font-bold">₱${parseFloat(r.amount).toFixed(2)}</td>
                    <td class="font-bold">₱${r.stats.targetExpected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td class="font-bold text-success">₱${r.stats.totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="progress-bar-container" style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; min-width: 60px;">
                          <div style="width: ${reqRate}%; height: 100%; background: #10B981;"></div>
                        </div>
                        <span class="font-bold small">${reqRate}%</span>
                      </div>
                    </td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline-primary" onclick="window.coeApp.closeModal(); CoePersonnelView.switchTab('roster-monitor');">
        <i class="fa-solid fa-table-list"></i> Open Section Monitoring
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal('Target Compliance & Collection Rate', modalBody, footer, 'modal-lg');
  },

  /**
   * Stat Card 4: Active Initiated Requests Inspection Modal
   */
  openOfficerInitiatedRequestsModal() {
    const personnel = window.coeAuth.getProfile() || {};
    const myRequests = window.coepayDb.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id });
    const currentTerm = window.coepayDb.getCurrentTerm();

    const authorizedCount = myRequests.filter(r => r.status === 'authorized').length;
    const pendingAuthCount = myRequests.filter(r => r.status === 'pending_authorization').length;
    const draftCount = myRequests.filter(r => r.status === 'draft').length;
    const totalExpectedSum = myRequests.reduce((sum, r) => sum + r.stats.targetExpected, 0);

    const modalBody = `
      <div class="active-requests-modal-wrapper">
        <div class="stats-grid mb-3" style="grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Initiated</div>
            <div class="stat-value text-primary" style="font-size: 1.4rem;">${myRequests.length}</div>
            <div class="stat-footnote text-muted">Current Term (${currentTerm.semester})</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Authorized & Active</div>
            <div class="stat-value text-success" style="font-size: 1.4rem;">${authorizedCount}</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-circle-check"></i> Open for Payments</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Pending Approval</div>
            <div class="stat-value text-amber" style="font-size: 1.4rem;">${pendingAuthCount}</div>
            <div class="stat-footnote text-amber"><i class="fa-solid fa-clock"></i> Dean Review</div>
          </div>
          <div class="stat-card p-2" style="padding: 0.75rem 1rem;">
            <div class="stat-label">Total Target</div>
            <div class="stat-value text-indigo" style="font-size: 1.4rem;">₱${totalExpectedSum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            <div class="stat-footnote text-muted">Across All Cohorts</div>
          </div>
        </div>

        <div class="flex-between align-center mb-2">
          <h5 class="m-0"><i class="fa-solid fa-folder-tree text-indigo"></i> List of Initiated Payment Requests</h5>
          <span class="badge badge-primary">${myRequests.length} Requests</span>
        </div>

        <div class="table-responsive" style="max-height: 340px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <table class="data-table small">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Purpose / Title</th>
                <th>Category</th>
                <th>Target Cohort</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Progress</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${myRequests.length > 0 ? myRequests.map(r => {
                const statusBadge = r.status === 'authorized'
                  ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Authorized</span>'
                  : r.status === 'pending_authorization'
                  ? '<span class="badge badge-amber"><i class="fa-solid fa-clock"></i> Pending Authorization</span>'
                  : '<span class="badge badge-secondary">Draft</span>';
                const targetText = r.target_year_level ? `Year ${r.target_year_level}${r.target_section ? ' - ' + r.target_section : ''}` : 'All Students';

                return `
                  <tr>
                    <td><strong>#${r.request_id}</strong></td>
                    <td>
                      <strong>${r.title}</strong>
                      <div class="small text-muted text-truncate" style="max-width: 200px;" title="${r.description}">${r.description || '-'}</div>
                    </td>
                    <td><span class="badge badge-outline">${r.category_name}</span></td>
                    <td>${targetText}</td>
                    <td class="font-bold text-primary">₱${parseFloat(r.amount).toFixed(2)}</td>
                    <td class="small">${r.deadline ? r.deadline.slice(0, 10) : 'No deadline'}</td>
                    <td>${statusBadge}</td>
                    <td>
                      <div class="small font-bold text-success">₱${r.stats.totalCollected.toLocaleString('en-PH')} / ₱${r.stats.targetExpected.toLocaleString('en-PH')}</div>
                      <div class="small text-muted">${r.stats.paidCount} / ${r.stats.totalAssigned} Paid</div>
                    </td>
                    <td class="text-right">
                      <button class="btn btn-xs btn-outline-primary" onclick="window.coeApp.closeModal(); CoePersonnelView.selectRequestAndOpenMonitoring(${r.request_id})" title="View Section Collection Monitoring">
                        <i class="fa-solid fa-eye"></i> Monitor
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="9" class="text-center py-3 text-muted">No requests initiated yet.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline-primary" onclick="window.coeApp.closeModal(); CoePersonnelView.openCreateRequestModal();">
        <i class="fa-solid fa-circle-plus"></i> Request New Fee / Item
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close</button>
    `;

    window.coeApp.showModal('Active Initiated Requests & Obligations', modalBody, footer, 'modal-lg');
  },

  selectRequestAndOpenMonitoring(requestId) {
    this.switchTab('roster-monitor');
    const select = document.getElementById('personnel-monitor-request-select');
    if (select) {
      select.value = requestId;
      this.renderSectionMonitor();
    }
  }
};

// Export to global window object
window.CoePersonnelView = CoePersonnelView;
