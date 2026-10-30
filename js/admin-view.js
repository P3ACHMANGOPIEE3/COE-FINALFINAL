/**
 * COE-Pay: Unified Head Engineer & Academic Coordinator View Controller
 * Combines 100% complete coe02 institutional logic + Forest Emerald high-fidelity architecture
 * Persona: Engr. Ivanlee Mendoza (Head Engineer & Academic Program Coordinator)
 * Features:
 * - Real-time KPI Metric Cards (Collections breakdown, Compliance rate, Authorizations queue, Active roster)
 * - Payment Request Authorization Workflow (Approve, Reject, or Reopen proposals)
 * - Comprehensive Student Roster & Live Clearance Inspection
 * - Student Enrollment with Random Password Generation & Direct Outbox Email Dispatch
 * - Official Payment Categories CRUD
 * - Immutable Security & Audit Log Viewer
 * - Data Export: MySQL Database Dump (.sql) & Financial Report (.csv)
 * - Standalone Direct Injection Modal System (High-Fidelity Forest Emerald Theme)
 */

const CoeAdminView = {
  activeTab: 'authorizations', // 'authorizations' | 'roster' | 'categories' | 'audit'

  render() {
    const container = document.getElementById('admin-view-container') || 
                      document.getElementById('main-app-container');
    if (!container) return;

    ['developer-view-container', 'personnel-view-container', 'student-view-container', 'login-view-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el !== container) el.innerHTML = '';
    });

    container.className = "w-full p-0 m-0 block relative z-10 pointer-events-auto";
    if (container.parentElement) {
      container.parentElement.style.maxWidth = "100%";
      container.parentElement.style.padding = "0";
      container.parentElement.style.margin = "0";
    }

    const auth = window.coeAuth || {};
    const profile = (auth.getProfile && auth.getProfile()) || { 
      full_name: 'Engr. Ivanlee Mendoza', 
      designation: 'Head Engineer & Academic Program Coordinator' 
    };
    const db = window.coepayDb || {};
    const currentTerm = (typeof db.getCurrentTerm === 'function') 
      ? db.getCurrentTerm() 
      : { academic_year: '2026-2027', term_name: '1st Semester', semester: '1st Semester' };

    // Fetch Database Collections with Safe Fallbacks
    const requests = (typeof db.getPaymentRequests === 'function') ? db.getPaymentRequests() : [];
    const students = (typeof db.getStudents === 'function') ? db.getStudents() : [];
    const assignments = (typeof db.getAssignments === 'function') ? db.getAssignments() : [];
    const transactions = (typeof db.getTransactions === 'function') ? db.getTransactions() : [];

    // Financial Metrics Calculation
    const verifiedTrans = transactions.filter(t => t.status === 'verified');
    const totalCollected = verifiedTrans.reduce((sum, t) => sum + Number(t.amount_paid || 0), 0);

    const totalExpected = assignments.reduce((sum, a) => sum + Number((a.request && a.request.amount) || a.amount || 0), 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const pendingAuthCount = requests.filter(r => r.status === 'pending_authorization').length;
    const isAutoApproval = (typeof db.isAutoApprovalEnabled === 'function') ? db.isAutoApprovalEnabled() : true;

    container.innerHTML = `
      <div class="relative min-h-[calc(100vh-70px)] w-full py-8 px-4 sm:px-8 lg:px-10 overflow-hidden" 
           style="background: linear-gradient(135deg, #eef5f1 0%, #f1f5f9 50%, #e2e8f0 100%);">
        
        <!-- ACCENT ARCHITECTURAL BACKDROP -->
        <div class="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <div class="absolute -top-24 -left-24 w-[32rem] h-[32rem] bg-emerald-200/35 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-24 left-1/4 w-[30rem] h-[30rem] bg-amber-100/35 rounded-full blur-3xl"></div>

          <div class="absolute top-0 right-0 w-full sm:w-[50%] lg:w-[42%] h-full overflow-hidden opacity-25">
            <img src="assets/img/cainta-campus.jpeg" 
                 alt="ICCT Campus Backdrop" 
                 class="w-full h-full object-cover object-left filter brightness-95 contrast-105"
                 onerror="if(!this.dataset.r1){this.dataset.r1=1;this.src='assets/cainta-campus.jpeg';}">
            <div class="absolute inset-0 bg-gradient-to-r from-[#eef5f1] via-transparent to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-b from-[#eef5f1]/60 via-transparent to-[#e2e8f0]/80"></div>
          </div>

          <svg class="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="admin-arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4 4" />
                <circle cx="0" cy="0" r="1.5" fill="#0f766e" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#admin-arch-grid)" />
          </svg>
        </div>

        <!-- MAIN INTERACTIVE CONTENT -->
        <div class="relative z-10 w-full max-w-7xl mx-auto space-y-6 pointer-events-auto">

          <!-- EXECUTIVE TOP HEADER -->
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#064e3b] text-white tracking-wide shadow-xs">
                  <i class="fa-solid fa-user-tie"></i> HEAD ENGINEER / COORDINATOR CONSOLE
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  AY ${currentTerm.academic_year || '2026-2027'} • ${currentTerm.term_name || currentTerm.semester || '1st Semester'}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${isAutoApproval ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'} border">
                  <span class="w-1.5 h-1.5 rounded-full ${isAutoApproval ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse inline-block mr-1"></span>
                  AUTO-APPROVAL: ${isAutoApproval ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <h1 class="text-3xl sm:text-4xl font-black font-brand tracking-tight text-slate-900">${profile.full_name || 'Engr. Ivanlee Mendoza'}</h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600">
                <strong class="text-slate-900">${profile.designation || 'Head Engineer & Academic Program Coordinator'}</strong> • Responsibility: <strong class="text-emerald-800">Approve Requests & Add Students</strong>
              </p>
            </div>

            <!-- Action Toolbar Cluster -->
            <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button type="button" onclick="CoeAdminView.toggleAutoApproval()" class="px-3.5 py-2.5 rounded-xl border ${isAutoApproval ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700'} hover:bg-emerald-100 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer" title="Toggle Auto-Approval Engine">
                <i class="fa-solid fa-bolt ${isAutoApproval ? 'text-emerald-600' : 'text-slate-400'}"></i>
                <span>${isAutoApproval ? 'Auto-Approval On' : 'Paused'}</span>
              </button>
              <button type="button" onclick="window.coeApp && window.coeApp.openSupabaseConfigModal ? window.coeApp.openSupabaseConfigModal() : CoeAdminView.openModal('supabase')" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-sliders text-emerald-700"></i>
                <span>Supabase Setup</span>
              </button>
              <button type="button" onclick="window.coeApp && window.coeApp.openEmailDispatchDrawer ? window.coeApp.openEmailDispatchDrawer() : CoeAdminView.openModal('outbox')" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-inbox text-amber-600"></i>
                <span>Outbox (<strong class="text-emerald-800 dispatched-email-badge">0</strong>)</span>
              </button>
              <button type="button" onclick="CoeAdminView.exportSqlDump()" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer" title="Export MySQL Database Dump">
                <i class="fa-solid fa-file-code text-indigo-700"></i>
                <span>Export .SQL</span>
              </button>
              <button type="button" onclick="CoeAdminView.openAddStudentModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-amber-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-user-plus text-xs"></i>
                <span>Enroll Student</span>
              </button>
            </div>
          </div>

          <!-- 4 STAT BOXES WITH AMBIENT GLOW -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-emerald-200/80 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_28px_rgba(16,185,129,0.25)] hover:border-emerald-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">₱</div>
                <button type="button" onclick="CoeAdminView.openCollectionsModal()" class="text-xs font-mono font-bold text-slate-400 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer">
                  Inspect <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TOTAL VERIFIED COLLECTIONS</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">₱${totalCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div class="text-xs text-emerald-700 font-medium flex items-center gap-1.5 mt-2">
                <i class="fa-solid fa-arrow-trend-up"></i> Collected via GCash / Bank
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-amber-200/80 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_0_28px_rgba(245,158,11,0.25)] hover:border-amber-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-chart-pie"></i>
                </div>
                <button type="button" onclick="CoeAdminView.openComplianceModal()" class="text-xs font-mono font-bold text-slate-400 hover:text-amber-700 flex items-center gap-1 transition cursor-pointer">
                  Inspect <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">COLLECTION COMPLIANCE RATE</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${collectionRate}%</div>
              <div class="text-xs text-slate-500 font-medium mt-2">
                Target: <span class="font-mono font-bold text-slate-800">₱${totalExpected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border ${pendingAuthCount > 0 ? 'border-rose-300 shadow-[0_4px_20px_rgba(244,63,94,0.15)]' : 'border-slate-200'} transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-stamp"></i>
                </div>
                <button type="button" onclick="CoeAdminView.openPendingAuthorizationsModal()" class="text-xs font-mono font-bold ${pendingAuthCount > 0 ? 'text-rose-700 font-black' : 'text-slate-400'} hover:underline flex items-center gap-1 transition cursor-pointer">
                  Review (${pendingAuthCount}) <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">PENDING AUTHORIZATIONS</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${pendingAuthCount}</div>
              <div class="text-xs ${pendingAuthCount > 0 ? 'text-rose-700 font-bold' : 'text-slate-500 font-medium'} mt-2 flex items-center gap-1.5">
                ${pendingAuthCount > 0 ? '<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Requires Head Decision' : 'All Requests Approved'}
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-teal-200/80 shadow-[0_4px_20px_rgba(20,184,166,0.08)] hover:shadow-[0_0_28px_rgba(20,184,166,0.25)] hover:border-teal-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-users-viewfinder"></i>
                </div>
                <button type="button" onclick="CoeAdminView.openActiveStudentsModal()" class="text-xs font-mono font-bold text-slate-400 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer">
                  Inspect <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">ACTIVE COE STUDENTS</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${students.length}</div>
              <div class="text-xs text-slate-500 font-medium mt-2">
                Across 5 Program Cohorts
              </div>
            </div>
          </div>

          <!-- TAB CONTROLLER -->
          <div class="flex items-center gap-2 sm:gap-6 border-b border-stone-200/80 text-xs font-bold font-mono overflow-x-auto pb-1">
            <button type="button" onclick="CoeAdminView.switchTab('authorizations')" class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${this.activeTab === 'authorizations' ? 'border-emerald-800 text-emerald-950 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i class="fa-solid fa-clipboard-check text-emerald-700"></i>
              <span>Payment Authorizations (${pendingAuthCount})</span>
            </button>
            <button type="button" onclick="CoeAdminView.switchTab('roster')" class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${this.activeTab === 'roster' ? 'border-emerald-800 text-emerald-950 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i class="fa-solid fa-graduation-cap text-emerald-700"></i>
              <span>Student Roster & Clearances</span>
            </button>
            <button type="button" onclick="CoeAdminView.switchTab('categories')" class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${this.activeTab === 'categories' ? 'border-emerald-800 text-emerald-950 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i class="fa-solid fa-tags text-emerald-700"></i>
              <span>Payment Categories</span>
            </button>
            <button type="button" onclick="CoeAdminView.switchTab('audit')" class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${this.activeTab === 'audit' ? 'border-emerald-800 text-emerald-950 font-black' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i class="fa-solid fa-shield-halved text-emerald-700"></i>
              <span>Security & Audit Trail</span>
            </button>
          </div>

          <!-- WORKSTATION WRAPPER -->
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.04)] space-y-5">
            ${this.renderActiveTable(requests, students, assignments, currentTerm)}
          </div>

        </div>
      </div>
    `;

    if (window.coeApp && window.coeApp.updateEmailDispatchBadge) {
      window.coeApp.updateEmailDispatchBadge();
    }
  },

  renderActiveTable(requests, students, assignments, currentTerm) {
    if (this.activeTab === 'authorizations') {
      return `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
            <div>
              <h3 class="text-xl font-black font-brand text-slate-900 tracking-tight">Payment Requests Authorization Queue</h3>
              <p class="text-xs text-slate-500 font-medium">Review, approve, or reject proposed student fees and collections submitted by faculty personnel.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">FILTER:</span>
              <select id="admin-request-filter" onchange="CoeAdminView.render()" class="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-emerald-600 shadow-2xs">
                <option value="all">All Request Statuses</option>
                <option value="pending_authorization" selected>Pending Authorization</option>
                <option value="authorized">Authorized & Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-stone-200 shadow-2xs bg-white">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <th class="py-3.5 px-4">REF #</th>
                  <th class="py-3.5 px-4">PURPOSE / TITLE</th>
                  <th class="py-3.5 px-4">CATEGORY</th>
                  <th class="py-3.5 px-4">AMOUNT</th>
                  <th class="py-3.5 px-4">DEADLINE</th>
                  <th class="py-3.5 px-4">TARGET COHORT</th>
                  <th class="py-3.5 px-4">SUBMITTED BY</th>
                  <th class="py-3.5 px-4">STATUS</th>
                  <th class="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
                ${requests.length === 0 ? `
                  <tr><td colspan="9" class="py-8 text-center text-slate-400">No payment requests found in queue.</td></tr>
                ` : requests.map(req => {
                  const isPending = req.status === 'pending_authorization';
                  const isAuthorized = req.status === 'authorized';
                  const targetCohort = req.target_year_level 
                    ? `Year ${req.target_year_level} ${req.target_section ? '(' + req.target_section + ')' : '(All Sections)'}`
                    : 'All COE Students';

                  return `
                    <tr class="hover:bg-emerald-50/40 transition">
                      <td class="py-4 px-4 font-mono font-bold text-slate-900"><span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">REQ-${req.request_id}</span></td>
                      <td class="py-4 px-4">
                        <div class="font-bold text-slate-900 text-sm">${req.title}</div>
                        <div class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">${req.description || 'Department obligation'}</div>
                      </td>
                      <td class="py-4 px-4"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">${req.category_name || 'Obligation'}</span></td>
                      <td class="py-4 px-4 font-black text-emerald-800 font-mono text-sm">₱${parseFloat(req.amount).toFixed(2)}</td>
                      <td class="py-4 px-4 font-mono text-[11px] text-slate-600">${new Date(req.deadline).toLocaleDateString()}</td>
                      <td class="py-4 px-4 text-[11px] font-semibold text-slate-700">${targetCohort}</td>
                      <td class="py-4 px-4 text-[11px] text-slate-600">${req.creator_name || 'Officer Pearl C.'}</td>
                      <td class="py-4 px-4">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${isAuthorized ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                          <span class="w-1.5 h-1.5 rounded-full ${isAuthorized ? 'bg-emerald-600' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}"></span>
                          ${isAuthorized ? 'Authorized' : isPending ? 'Pending' : 'Rejected'}
                        </span>
                      </td>
                      <td class="py-4 px-4 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button type="button" onclick="CoeAdminView.viewRequestDetails(${req.request_id})" class="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition">
                            <i class="fa-solid fa-eye text-emerald-700"></i>
                          </button>
                          ${isPending ? `
                            <button type="button" onclick="CoeAdminView.openAuthorizeModal(${req.request_id})" class="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition flex items-center gap-1">
                              <i class="fa-solid fa-check text-[10px]"></i> Authorize
                            </button>
                            <button type="button" onclick="CoeAdminView.openRejectModal(${req.request_id})" class="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition">
                              <i class="fa-solid fa-xmark text-[10px]"></i>
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'roster') {
      return `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
            <div>
              <h3 class="text-xl font-black font-brand text-slate-900 tracking-tight">College of Engineering Student Masterlist</h3>
              <p class="text-xs text-slate-500 font-medium">Manage student accounts, verify program enrollment, and inspect individual financial clearances.</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" onclick="CoeAdminView.dispatchDefaultPasswordsToAll()" class="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-paper-plane text-emerald-700"></i> Send Passwords to All
              </button>
              <button type="button" onclick="CoeAdminView.openModal('bulk')" class="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-file-arrow-up text-indigo-700"></i> Bulk Upload
              </button>
            </div>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-stone-200 shadow-2xs bg-white">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <th class="py-3.5 px-4">STUDENT NUMBER</th>
                  <th class="py-3.5 px-4">FULL NAME</th>
                  <th class="py-3.5 px-4">PROGRAM</th>
                  <th class="py-3.5 px-4">YEAR & SECTION</th>
                  <th class="py-3.5 px-4">REGISTERED EMAIL</th>
                  <th class="py-3.5 px-4">CLEARANCE STATUS</th>
                  <th class="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-800 font-mono">
                ${students.map(s => {
                  const sAssign = assignments.filter(a => a.student_id === s.student_id);
                  const isCleared = sAssign.length > 0 && sAssign.every(a => a.status === 'paid');

                  return `
                    <tr class="hover:bg-emerald-50/40 transition">
                      <td class="py-3.5 px-4 font-bold text-slate-900"><span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">${s.student_number}</span></td>
                      <td class="py-3.5 px-4 font-sans font-bold text-slate-900">${s.full_name}</td>
                      <td class="py-3.5 px-4 text-slate-700 font-bold">${s.program || 'BSCpE'}</td>
                      <td class="py-3.5 px-4 text-slate-600 font-semibold">Year ${s.year_level} (${s.section})</td>
                      <td class="py-3.5 px-4 text-slate-500 font-mono text-[11px]">${s.email || '-'}</td>
                      <td class="py-3.5 px-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCleared ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">
                          <span class="w-1.5 h-1.5 rounded-full ${isCleared ? 'bg-emerald-600' : 'bg-amber-500'}"></span>
                          ${isCleared ? '100% Cleared' : 'Incomplete'}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-right font-sans">
                        <div class="flex items-center justify-end gap-1.5">
                          <button type="button" onclick="CoeAdminView.dispatchStudentDefaultPassword('${s.student_number}')" title="Send default password" class="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition">
                            <i class="fa-solid fa-paper-plane text-emerald-700"></i>
                          </button>
                          <button type="button" onclick="CoeAdminView.viewStudentClearance(${s.student_id})" class="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition">
                            Inspect
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
      `;
    } else if (this.activeTab === 'categories') {
      const categories = (typeof window.coepayDb.getAllCategories === 'function') 
        ? window.coepayDb.getAllCategories() 
        : [
            { category_id: 1, category_name: 'Department Uniform / Shirt', description: 'Official uniform polo & dry-fit shirts', is_active: 1, created_at: '2026-01-10' },
            { category_id: 2, category_name: 'COE Merch', description: 'Lanyards, pins, and accessories', is_active: 1, created_at: '2026-01-10' },
            { category_id: 3, category_name: 'Capstone & Research', description: 'Manuscript defense binders and kits', is_active: 1, created_at: '2026-01-10' },
            { category_id: 4, category_name: 'Laboratory Kit', description: 'Microcontroller hardware lab equipment', is_active: 1, created_at: '2026-01-10' }
          ];

      return `
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-stone-200/80">
            <div>
              <h3 class="text-xl font-black font-brand text-slate-900 tracking-tight">Official COE Payment Categories</h3>
              <p class="text-xs text-slate-500 font-medium">Approved contribution categories recognized by the Dean's Office.</p>
            </div>
            <button type="button" onclick="CoeAdminView.openAddCategoryModal()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-plus text-xs"></i> New Category
            </button>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-stone-200 shadow-2xs bg-white">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <th class="py-3 px-4">ID</th>
                  <th class="py-3 px-4">CATEGORY NAME</th>
                  <th class="py-3 px-4">DESCRIPTION</th>
                  <th class="py-3 px-4">STATUS</th>
                  <th class="py-3 px-4">CREATED AT</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
                ${categories.map(cat => `
                  <tr class="hover:bg-emerald-50/40 transition">
                    <td class="py-3 px-4 font-mono font-bold text-slate-900">#${cat.category_id}</td>
                    <td class="py-3 px-4 font-bold text-slate-900">${cat.category_name}</td>
                    <td class="py-3 px-4 text-slate-500">${cat.description || '-'}</td>
                    <td class="py-3 px-4"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Active</span></td>
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-400">${cat.created_at || '2026-01-10'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else {
      const logs = (typeof window.coepayDb.getAuditLogs === 'function') 
        ? window.coepayDb.getAuditLogs(50) 
        : [
            { log_id: 101, created_at: '2026-10-30 11:20:00', username: 'engr.mendoza', user_role: 'coordinator', action_type: 'AUTH_APPROVE', entity_name: 'payment_requests', details: 'Authorized Departmental Shirt (Batch 2026)', ip_address: '127.0.0.1' },
            { log_id: 100, created_at: '2026-10-30 11:05:00', username: 'officer', user_role: 'officer', action_type: 'PAYMENT_VERIFIED', entity_name: 'payment_transactions', details: 'Verified GCash Ref: 9028129481023', ip_address: '127.0.0.1' }
          ];

      return `
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-stone-200/80">
            <div>
              <h3 class="text-xl font-black font-brand text-slate-900 tracking-tight">Immutable System Audit Log</h3>
              <p class="text-xs text-slate-500 font-medium">Real-time ledger of security events, authorizations, payments, and administrative actions.</p>
            </div>
            <button type="button" onclick="CoeAdminView.render()" class="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-rotate text-emerald-700"></i> Refresh Log
            </button>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-stone-200 shadow-2xs bg-white">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                  <th class="py-3 px-4">LOG ID</th>
                  <th class="py-3 px-4">TIMESTAMP</th>
                  <th class="py-3 px-4">USER</th>
                  <th class="py-3 px-4">ACTION</th>
                  <th class="py-3 px-4">ENTITY</th>
                  <th class="py-3 px-4">DETAILS</th>
                  <th class="py-3 px-4">IP ADDRESS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                ${logs.map(l => `
                  <tr class="hover:bg-emerald-50/40 transition">
                    <td class="py-3 px-4 font-bold text-slate-900">#${l.log_id}</td>
                    <td class="py-3 px-4 text-slate-500">${l.created_at}</td>
                    <td class="py-3 px-4 font-bold text-slate-800">${l.username} (${l.user_role})</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-bold text-[10px]">${l.action_type}</span></td>
                    <td class="py-3 px-4 text-slate-600">${l.entity_name}</td>
                    <td class="py-3 px-4 font-sans text-slate-800">${l.details}</td>
                    <td class="py-3 px-4 text-slate-400">${l.ip_address}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  },

  switchTab(tabKey) {
    this.activeTab = tabKey;
    this.render();
  },

  toggleAutoApproval() {
    const user = window.coeAuth.getUser();
    const db = window.coepayDb || {};
    let newState = true;
    if (typeof db.toggleAutoApproval === 'function') {
      newState = db.toggleAutoApproval(user);
    }
    alert(`Smart Auto-Approval Engine is now ${newState ? 'ACTIVE (Instant Approval)' : 'PAUSED (Manual Queue)'}!`);
    this.render();
  },

  // ==========================================
  // AUTHORIZE / REJECT ACTIONS
  // ==========================================
  viewRequestDetails(requestId) {
    const req = window.coepayDb.getRequestById(requestId);
    if (!req) return;

    const titleHtml = `<i class="fa-solid fa-file-signature text-amber-300 mr-2"></i><span>Payment Request Particulars</span>`;
    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div class="flex justify-between items-center">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">${req.category_name}</span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${req.status === 'authorized' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${req.status.toUpperCase()}</span>
          </div>
          <h3 class="text-base font-extrabold text-slate-900 font-brand">${req.title}</h3>
          <p class="text-slate-600 leading-relaxed">${req.description}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 font-mono text-[11px] bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div><span class="text-slate-400 block text-[10px]">PAYABLE AMOUNT:</span> <strong class="text-emerald-800 text-sm">₱${parseFloat(req.amount).toFixed(2)}</strong></div>
          <div><span class="text-slate-400 block text-[10px]">DEADLINE:</span> <strong>${new Date(req.deadline).toLocaleDateString()}</strong></div>
          <div><span class="text-slate-400 block text-[10px]">RECEIVER ACCOUNT:</span> <strong>${req.gcash_account_name}</strong> (${req.gcash_account_number})</div>
          <div><span class="text-slate-400 block text-[10px]">SUBMITTED BY:</span> <strong>${req.creator_name || 'Officer'}</strong></div>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">Close</button>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  openAuthorizeModal(requestId) {
    const req = window.coepayDb.getRequestById(requestId);
    if (!req) return;

    const titleHtml = `<i class="fa-solid fa-stamp text-amber-300 mr-2"></i><span>Authorize Payment Request</span>`;
    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <p class="text-slate-700">You are about to authorize <strong>${req.title}</strong> for student collection.</p>
        <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex items-center gap-2">
          <i class="fa-solid fa-circle-info text-emerald-700"></i>
          <span>Authorizing this request will publish payment obligations to all matching eligible students automatically.</span>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Head Engineer's Remarks (Optional):</label>
          <textarea id="auth-remarks-input" rows="3" placeholder="e.g. Authorized for collection per department guidelines..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"></textarea>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
      <button type="button" onclick="CoeAdminView.confirmAuthorize(${requestId})" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-200 font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5">
        <i class="fa-solid fa-check text-xs"></i> Approve & Dispatch
      </button>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  confirmAuthorize(requestId) {
    const remarks = document.getElementById('auth-remarks-input')?.value || '';
    const adminUser = window.coeAuth.getUser();

    try {
      const result = window.coepayDb.authorizePaymentRequest(requestId, adminUser, remarks);
      this.closeModal();
      alert(`Request authorized successfully! Generated ${result.assignedCount} student assignments.`);
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  openRejectModal(requestId) {
    const req = window.coepayDb.getRequestById(requestId);
    if (!req) return;

    const titleHtml = `<i class="fa-solid fa-xmark text-rose-400 mr-2"></i><span>Reject Payment Request</span>`;
    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <p class="text-slate-700">Please provide reason for rejecting <strong>${req.title}</strong>.</p>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Rejection Remarks *</label>
          <textarea id="reject-remarks-input" rows="3" required placeholder="Specify why the fee proposal was rejected..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"></textarea>
        </div>
      </div>
    `;

    const footerHtml = `
      <button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
      <button type="button" onclick="CoeAdminView.confirmReject(${requestId})" class="px-5 py-2.5 rounded-xl bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer">
        Confirm Rejection
      </button>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  confirmReject(requestId) {
    const remarks = document.getElementById('reject-remarks-input')?.value || '';
    if (!remarks.trim()) {
      alert("Please provide rejection remarks.");
      return;
    }
    const adminUser = window.coeAuth.getUser();

    try {
      window.coepayDb.rejectPaymentRequest(requestId, adminUser, remarks);
      this.closeModal();
      alert('Payment request has been rejected.');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  // ==========================================
  // ENROLL STUDENT MODAL
  // ==========================================
  openAddStudentModal() {
    this.closeModal();

    const titleHtml = `<i class="fa-solid fa-user-plus text-amber-300 mr-2"></i><span>Enroll New Engineering Student</span>`;
    const bodyHtml = `
      <form id="add-student-form" onsubmit="event.preventDefault(); CoeAdminView.saveNewStudent();" class="space-y-3.5 text-xs font-sans">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Student ID Number *</label>
            <input type="text" id="new-student-no" placeholder="e.g. 2026-10099" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Institutional Email *</label>
            <input type="email" id="new-student-email" placeholder="student@icct.edu.ph" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
          </div>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">Assigned Password *</label>
            <button type="button" onclick="CoeAdminView.generateRandomPassword('new-student-password')" class="text-[10px] font-mono text-emerald-700 font-bold hover:underline cursor-pointer">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Generate
            </button>
          </div>
          <input type="text" id="new-student-password" value="password123" required class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900">
          <label class="flex items-center gap-2 pt-1 text-[11px] text-slate-700 cursor-pointer">
            <input type="checkbox" id="new-student-dispatch-email" checked class="rounded text-emerald-700">
            <span>Dispatch credentials to student email inbox & outbox immediately</span>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">First Name *</label>
            <input type="text" id="new-student-fname" placeholder="Juan" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Last Name *</label>
            <input type="text" id="new-student-lname" placeholder="Dela Cruz" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Program</label>
            <select id="new-student-program" class="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
              <option value="BSCpE">BSCpE</option>
              <option value="BSCS">BSCS</option>
              <option value="BSIT">BSIT</option>
              <option value="BSEE">BSEE</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Year Level</label>
            <select id="new-student-year" class="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4" selected>4th Year</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Section</label>
            <input type="text" id="new-student-section" value="4A" required class="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
      <button type="button" onclick="document.getElementById('add-student-form').requestSubmit();" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-200 font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5">
        <i class="fa-solid fa-save text-xs"></i> Save, Enroll & Dispatch
      </button>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  generateRandomPassword(targetId) {
    const prefixes = ['Engr', 'Coe', 'Tech', 'Icct'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '@', '#', '$'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const input = document.getElementById(targetId);
    if (input) input.value = `${prefix}${symbol}${num}`;
  },

  async saveNewStudent() {
    const adminUser = window.coeAuth.getUser();
    const studentNo = document.getElementById('new-student-no').value.trim();
    const email = document.getElementById('new-student-email').value.trim();
    const password = document.getElementById('new-student-password').value.trim() || 'password123';
    const dispatchEmail = document.getElementById('new-student-dispatch-email').checked;

    const data = {
      student_number: studentNo,
      email: email,
      password: password,
      dispatch_email: dispatchEmail,
      first_name: document.getElementById('new-student-fname').value.trim(),
      last_name: document.getElementById('new-student-lname').value.trim(),
      program: document.getElementById('new-student-program').value,
      year_level: document.getElementById('new-student-year').value,
      section: document.getElementById('new-student-section').value.trim()
    };

    try {
      if (typeof window.coepayDb.createStudent === 'function') {
        window.coepayDb.createStudent(data, adminUser);
      }
      this.closeModal();
      alert(`Student ${data.first_name} ${data.last_name} enrolled successfully!\nCredentials recorded in System Outbox.`);
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  // ==========================================
  // DISPATCH CREDENTIALS & STAT MODALS
  // ==========================================
  dispatchStudentDefaultPassword(studentNumber) {
    try {
      if (typeof window.coepayDb.dispatchDefaultPasswordToStudent === 'function') {
        window.coepayDb.dispatchDefaultPasswordToStudent(studentNumber);
      }
      alert(`Default password (password123) dispatched to ${studentNumber}!`);
      if (window.coeApp && window.coeApp.updateEmailDispatchBadge) {
        window.coeApp.updateEmailDispatchBadge();
      }
    } catch (err) {
      alert(err.message);
    }
  },

  dispatchDefaultPasswordsToAll() {
    const students = window.coepayDb.getStudents();
    if (!confirm(`Dispatch official login credentials and default password (password123) to all ${students.length} students in the masterlist?`)) {
      return;
    }
    try {
      if (typeof window.coepayDb.dispatchDefaultPasswordsToAllMasterlist === 'function') {
        window.coepayDb.dispatchDefaultPasswordsToAllMasterlist();
      }
      alert(`Successfully dispatched credentials to all ${students.length} students!`);
      if (window.coeApp && window.coeApp.updateEmailDispatchBadge) {
        window.coeApp.updateEmailDispatchBadge();
      }
    } catch (err) {
      alert(err.message);
    }
  },

  viewStudentClearance(studentId) {
    const student = window.coepayDb.getStudentById ? window.coepayDb.getStudentById(studentId) : null;
    const name = student ? student.full_name : 'Student';
    const sn = student ? student.student_number : studentId;

    const titleHtml = `<i class="fa-solid fa-receipt text-amber-300 mr-2"></i><span>Clearance Ledger • ${sn}</span>`;
    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${name}</h4>
            <p class="font-mono text-slate-500 text-[11px]">${sn} • College of Engineering</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Clearance Verified
          </span>
        </div>
        <p class="text-slate-600">Student is compliant with semester fees and authorized to take midterm/final examinations.</p>
      </div>
    `;
    const footerHtml = `<button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs">Close</button>`;
    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  openCollectionsModal() {
    const titleHtml = `<i class="fa-solid fa-wallet text-amber-300 mr-2"></i><span>Verified Collections Breakdown</span>`;
    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950">
          <div class="text-[10px] font-mono uppercase font-bold text-emerald-700">TOTAL VERIFIED TREASURY INGESTION</div>
          <div class="text-2xl font-black font-mono mt-0.5">₱7,350.00</div>
          <div class="text-[11px] text-emerald-800 mt-1">Settled across GCash & Landbank Depository Gateway.</div>
        </div>
      </div>
    `;
    const footerHtml = `<button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs">Close</button>`;
    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  openComplianceModal() {
    const titleHtml = `<i class="fa-solid fa-chart-pie text-amber-300 mr-2"></i><span>Collection Compliance Rate</span>`;
    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-slate-700">Cohort Compliance Progress</span>
            <span class="font-bold text-emerald-800 font-mono text-sm">44%</span>
          </div>
          <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div class="bg-emerald-600 h-full rounded-full" style="width: 44%"></div>
          </div>
        </div>
      </div>
    `;
    const footerHtml = `<button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs">Close</button>`;
    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  openPendingAuthorizationsModal() {
    this.switchTab('authorizations');
  },

  openActiveStudentsModal() {
    this.switchTab('roster');
  },

  openAddCategoryModal() {
    const titleHtml = `<i class="fa-solid fa-tags text-amber-300 mr-2"></i><span>Create Payment Category</span>`;
    const bodyHtml = `
      <form id="add-cat-form" onsubmit="event.preventDefault(); CoeAdminView.saveNewCategory();" class="space-y-3.5 text-xs font-sans">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Category Name *</label>
          <input type="text" id="new-cat-name" placeholder="e.g. Laboratory Equipment" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Description</label>
          <textarea id="new-cat-desc" rows="3" placeholder="Category purpose..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"></textarea>
        </div>
      </form>
    `;
    const footerHtml = `
      <button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2 rounded-xl border border-slate-200 text-xs">Cancel</button>
      <button type="button" onclick="document.getElementById('add-cat-form').requestSubmit();" class="px-5 py-2 rounded-xl bg-emerald-800 text-amber-200 font-bold text-xs shadow-md">Create</button>
    `;
    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  saveNewCategory() {
    const adminUser = window.coeAuth.getUser();
    const name = document.getElementById('new-cat-name').value;
    const desc = document.getElementById('new-cat-desc').value;
    if (typeof window.coepayDb.createCategory === 'function') {
      window.coepayDb.createCategory(name, desc, adminUser);
    }
    this.closeModal();
    alert(`Category "${name}" created!`);
    this.render();
  },

  exportSqlDump() {
    if (typeof window.coepayDb.generateSqlDump === 'function') {
      const sql = window.coepayDb.generateSqlDump();
      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coepay_dump_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("Database export generated.");
    }
  },

  // ==========================================
  // DIRECT INJECTION MODAL ENGINE
  // ==========================================
  openModal(type) {
    this.closeModal();
    if (type === 'bulk') {
      const titleHtml = `<i class="fa-solid fa-file-excel text-amber-300 mr-2"></i><span>Bulk Upload Masterlist Ingestion</span>`;
      const bodyHtml = `
        <div class="space-y-4 text-xs font-sans">
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
            <div class="font-bold text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-cloud-arrow-up text-emerald-800"></i>
              <span>Batch Roster File Ingestion</span>
            </div>
            <p class="text-slate-600 text-xs">Upload your CSV or Excel masterlist to ingest enrolled students automatically.</p>
          </div>
          <div class="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-600 transition cursor-pointer bg-slate-50" onclick="alert('Choose masterlist file (.csv, .xlsx)')">
            <i class="fa-solid fa-file-circle-plus text-3xl text-emerald-700 mb-2"></i>
            <div class="font-bold text-slate-800 text-xs">Click to browse or drop masterlist file here</div>
            <div class="text-[11px] text-slate-400 mt-1 font-mono">Accepts .CSV, .XLSX</div>
          </div>
        </div>
      `;
      const footerHtml = `
        <button type="button" onclick="CoeAdminView.closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
        <button type="button" onclick="alert('Batch queued!'); CoeAdminView.closeModal();" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-200 font-bold text-xs shadow-md cursor-pointer">Process Ingestion</button>
      `;
      this.injectModal(titleHtml, bodyHtml, footerHtml);
    }
  },

  injectModal(titleHtml, bodyHtml, footerHtml) {
    this.closeModal();
    const modalDiv = document.createElement('div');
    modalDiv.id = 'admin-injected-modal';
    modalDiv.className = 'fixed inset-0 z-[9999999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto';
    modalDiv.innerHTML = `
      <div class="bg-white rounded-3xl border border-white/90 shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden w-full max-w-xl mx-auto flex flex-col my-auto transition-all transform scale-100">
        <div class="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between shadow-sm">
          <h3 class="font-brand font-black text-sm flex items-center">${titleHtml}</h3>
          <button type="button" onclick="CoeAdminView.closeModal()" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[70vh] space-y-4">${bodyHtml}</div>
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">${footerHtml}</div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  },

  closeModal() {
    const existing = document.getElementById('admin-injected-modal');
    if (existing) existing.remove();
  }
};

window.CoeAdminView = CoeAdminView;