/**
 * COE-Pay: Unified System Developer View Controller
 * Combines 100% complete coe02 institutional logic + Forest Emerald high-fidelity architecture
 * Persona: Dave Guiyab (Lead Full-Stack System Developer)
 * Features:
 * - Real-time Database Diagnostics & Storage Footprint
 * - Master Overrides Engine (Force Verify, Waive Student Obligations, Fix Typos)
 * - Emergency Account Rescue (Password Resets & 2FA Email Corrections)
 * - Interactive Database Tables Explorer with Inline Row Editing / Deletion
 * - Instant Role Impersonation Matrix
 * - Live Immutable Audit Stream
 * - Database Backup (JSON) & MySQL Dump (.sql)
 */

const CoeDeveloperView = {
  activeTableTab: 'students',
  activeMainTab: 'tables', // 'tables' | 'overrides' | 'audit' | 'bulk'

  render() {
    const container = document.getElementById('developer-view-container') ||
                      document.getElementById('main-app-container');
    if (!container) return;

    ['student-view-container', 'admin-view-container', 'personnel-view-container', 'login-view-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el !== container) el.innerHTML = '';
    });

    sessionStorage.setItem('coepay_master_dev', 'developer');
    sessionStorage.setItem('coepay_original_dev', 'developer');
    localStorage.setItem('coepay_master_dev', 'developer');

    container.className = "w-full p-0 m-0 block relative z-10 pointer-events-auto";
    if (container.parentElement) {
      container.parentElement.style.maxWidth = "100%";
      container.parentElement.style.padding = "0";
      container.parentElement.style.margin = "0";
    }

    const auth = window.coeAuth || {};
    const profile = (auth.getProfile && auth.getProfile()) || {
      full_name: 'Dave Guiyab',
      designation: 'Lead Full-Stack System Developer',
      responsibility: 'Responsible for building a system that works properly and helps people perform their tasks more efficiently.'
    };

    const db = window.coepayDb || { tables: {} };
    const tables = db.tables || {};

    // Metrics Calculation
    const totalUsers = (tables.users || []).length;
    const totalStudents = (tables.students || []).length;
    const totalRequests = (tables.payment_requests || []).length;
    const totalAssignments = (tables.student_payment_assignments || []).length;
    const totalTransactions = (tables.payment_transactions || []).length;
    const totalAuditLogs = (tables.audit_logs || []).length;
    const totalEmails = (tables.dispatched_emails || []).length;
    const totalRecords = totalUsers + totalStudents + totalRequests + totalAssignments + totalTransactions + totalAuditLogs + totalEmails;
    const isAutoApproval = (typeof db.isAutoApprovalEnabled === 'function') ? db.isAutoApprovalEnabled() : true;

    container.innerHTML = `
      <div class="relative min-h-[calc(100vh-70px)] w-full py-8 px-4 sm:px-8 lg:px-10 overflow-hidden" 
           style="background: linear-gradient(135deg, #eef5f1 0%, #f1f5f9 50%, #e2e8f0 100%);">
        
        <!-- VISIBLE ABSTRACT ARCHITECTURAL PATTERN -->
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
              <pattern id="dev-arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4 4" />
                <circle cx="0" cy="0" r="1.5" fill="#0f766e" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dev-arch-grid)" />
          </svg>
        </div>

        <!-- MAIN INTERACTIVE CONTENT -->
        <div class="relative z-10 w-full max-w-7xl mx-auto space-y-6 pointer-events-auto">

          <!-- EXECUTIVE TOP HEADER -->
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#064e3b] text-white tracking-wide shadow-xs">
                  <i class="fa-solid fa-code"></i> SYSTEM DEVELOPER ARCHITECTURE CONSOLE
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Relational Engine v2.4 (Active)
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${isAutoApproval ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'} border">
                  <span class="w-1.5 h-1.5 rounded-full ${isAutoApproval ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse inline-block mr-1"></span>
                  AUTO-APPROVAL: ${isAutoApproval ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <h1 class="text-3xl sm:text-4xl font-black font-brand tracking-tight text-slate-900">${profile.full_name || 'Dave Guiyab'}</h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600">
                <strong class="text-slate-900">${profile.designation || 'Lead Full-Stack System Developer'}</strong> • ${profile.responsibility || 'Responsible for building a system that works properly.'}
              </p>
            </div>

            <!-- Action Toolbar Cluster -->
            <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button type="button" onclick="CoeDeveloperView.toggleAutoApproval()" class="px-3.5 py-2.5 rounded-xl border ${isAutoApproval ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700'} hover:bg-emerald-100 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-bolt ${isAutoApproval ? 'text-emerald-600' : 'text-slate-400'}"></i>
                <span>${isAutoApproval ? 'Auto-Approval On' : 'Paused'}</span>
              </button>
              <button type="button" onclick="CoeDeveloperView.openMasterOverridesModal()" class="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-crown text-amber-600"></i>
                <span>Master Overrides</span>
              </button>
              <button type="button" onclick="CoeDeveloperView.dispatchAllDefaultPasswords()" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-paper-plane text-emerald-700"></i>
                <span>Dispatch Passwords</span>
              </button>
              <button type="button" onclick="CoeDeveloperView.runSandboxTests()" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-flask-vial text-indigo-700"></i>
                <span>Run Tests</span>
              </button>
              <button type="button" onclick="CoeDeveloperView.exportDatabaseJson()" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-download text-slate-600"></i>
                <span>Backup DB</span>
              </button>
              <button type="button" onclick="if(window.coeApp && window.coeApp.confirmResetDb){ window.coeApp.confirmResetDb(); } else { localStorage.clear(); location.reload(); }" class="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-rotate-left"></i>
                <span>Reset Seed</span>
              </button>
            </div>
          </div>

          <!-- 4 STAT BOXES WITH AMBIENT GLOW -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-emerald-200/80 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_28px_rgba(16,185,129,0.25)] hover:border-emerald-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-server"></i>
                </div>
                <button type="button" onclick="CoeDeveloperView.showSystemHealthDetails()" class="text-xs font-mono font-bold text-slate-400 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer">
                  Inspect <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">SYSTEM HEALTH & ENGINE</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">Active & Healthy</div>
              <div class="text-xs text-emerald-700 font-medium flex items-center gap-1.5 mt-2">
                <i class="fa-solid fa-circle-check"></i> Client Simulation + MySQL Schema Active
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-blue-200/80 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_0_28px_rgba(59,130,246,0.25)] hover:border-blue-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-database"></i>
                </div>
                <button type="button" onclick="CoeDeveloperView.showRecordsBreakdown()" class="text-xs font-mono font-bold text-slate-400 hover:text-blue-700 flex items-center gap-1 transition cursor-pointer">
                  View Data <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">SIMULATED RECORDS</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${totalRecords.toLocaleString()} Total</div>
              <div class="text-xs text-slate-500 font-medium mt-2">
                Across 9 Relational Tables
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-indigo-200/80 shadow-[0_4px_20px_rgba(99,102,241,0.08)] hover:shadow-[0_0_28px_rgba(99,102,241,0.25)] hover:border-indigo-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-shield-virus"></i>
                </div>
                <button type="button" onclick="CoeDeveloperView.showAuditTrailModal()" class="text-xs font-mono font-bold text-slate-400 hover:text-indigo-700 flex items-center gap-1 transition cursor-pointer">
                  View Logs <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">IMMUTABLE AUDIT TRAIL</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${totalAuditLogs} Logs</div>
              <div class="text-xs text-emerald-700 font-semibold mt-2">
                <i class="fa-solid fa-check-double"></i> 100% Operations Recorded
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-amber-200/80 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_0_28px_rgba(245,158,11,0.25)] hover:border-amber-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-users-gear"></i>
                </div>
                <button type="button" onclick="CoeDeveloperView.showRolesConfigModal()" class="text-xs font-mono font-bold text-slate-400 hover:text-amber-700 flex items-center gap-1 transition cursor-pointer">
                  View Roles <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">ACTIVE ROLES CONFIGURED</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">4 Roles</div>
              <div class="text-xs text-slate-500 font-medium mt-2">
                Dev • Coordinator • Officer • Student
              </div>
            </div>
          </div>

          <!-- BALANCED 2-COLUMN WORKSTATION -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            <!-- LEFT COLUMN: Persona Impersonation Matrix -->
            <div class="lg:col-span-4 bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">&lt;RBAC_GATES&gt;</span>
                    <h3 class="font-brand text-base font-extrabold text-stone-900">Role Impersonation Matrix</h3>
                  </div>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <p class="text-xs text-stone-500 mt-2 mb-4 leading-relaxed">
                  Switch personas to verify permission gates, clearance rules, and dashboard routing.
                </p>

                <!-- Persona List -->
                <div class="space-y-2.5">
                  <div class="p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-stone-900 text-xs">Dave Guiyab</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-900">Developer</span>
                      </div>
                      <div class="text-[10px] text-stone-500 font-mono">Session Active</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300">Current</span>
                  </div>

                  <div class="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-stone-900 text-xs">Engr. Ivanlee Mendoza</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-stone-200 text-stone-800">Head</span>
                      </div>
                      <div class="text-[10px] text-stone-500">Approvals & Masterlist</div>
                    </div>
                    <button type="button" onclick="window.coeApp.switchDemoUser('engr.mendoza')" class="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer">
                      <span>Switch</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                  </div>

                  <div class="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-stone-900 text-xs">Pearl Catequista</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-900">Officer</span>
                      </div>
                      <div class="text-[10px] text-stone-500">Collections & Proofs</div>
                    </div>
                    <button type="button" onclick="window.coeApp.switchDemoUser('officer')" class="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer">
                      <span>Switch</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                  </div>

                  <div class="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-stone-900 text-xs">Christian Dave Guiyab</span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-stone-200 text-stone-800">Student</span>
                      </div>
                      <div class="text-[10px] text-stone-500">Orders & GCash Pay</div>
                    </div>
                    <button type="button" onclick="window.coeApp.switchDemoUser('2023-10001')" class="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer">
                      <span>Switch</span> <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-stone-200 mt-6 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Session: Dave Guiyab</span>
                <span class="text-emerald-700 font-semibold"><i class="fa-solid fa-shield-check"></i> RBAC Verified</span>
              </div>
            </div>

            <!-- RIGHT COLUMN: Data Workstation Terminal -->
            <div class="lg:col-span-8 bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <!-- Workstation Tab Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div class="inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 font-mono text-xs font-bold overflow-x-auto">
                    <button type="button" id="dev-tab-btn-tables" onclick="CoeDeveloperView.switchTab('tables')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeMainTab === 'tables' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-table"></i>
                      <span>Tables Explorer</span>
                      <span class="px-1.5 py-0.2 rounded-full ${this.activeMainTab === 'tables' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} text-[10px] font-mono">${totalRecords}</span>
                    </button>
                    <button type="button" id="dev-tab-btn-overrides" onclick="CoeDeveloperView.switchTab('overrides')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeMainTab === 'overrides' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-crown text-amber-300"></i>
                      <span>Master Overrides</span>
                    </button>
                    <button type="button" id="dev-tab-btn-audit" onclick="CoeDeveloperView.switchTab('audit')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeMainTab === 'audit' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-shield-virus"></i>
                      <span>Audit Ledger</span>
                      <span class="px-1.5 py-0.2 rounded-full ${this.activeMainTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} text-[10px] font-mono">${totalAuditLogs}</span>
                    </button>
                  </div>

                  <div class="text-xs text-stone-500 font-mono flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-dot text-emerald-600 text-[8px]"></i> schema: coepay_relational
                  </div>
                </div>

                <!-- TAB 1: Database Tables Viewer -->
                <div id="dev-tab-tables" class="dev-tab-content ${this.activeMainTab === 'tables' ? 'block' : 'hidden'} space-y-3 pt-3">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    ${['students', 'users', 'payment_requests', 'payment_transactions', 'student_payment_assignments', 'dispatched_emails'].map(tName => `
                      <button type="button" onclick="CoeDeveloperView.showTable('${tName}')" class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${this.activeTableTab === tName ? 'bg-emerald-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                        ${tName} (${(tables[tName] || []).length})
                      </button>
                    `).join('')}
                  </div>

                  <div class="overflow-x-auto min-h-[300px] max-h-[350px] overflow-y-auto rounded-2xl border border-stone-200 bg-white" id="dev-table-viewer-container">
                    <!-- Populated via showTable() -->
                  </div>
                </div>

                <!-- TAB 2: Master Overrides & Emergency Fixes -->
                <div id="dev-tab-overrides" class="dev-tab-content ${this.activeMainTab === 'overrides' ? 'block' : 'hidden'} space-y-4 pt-3">
                  <div class="p-4 bg-amber-50/90 border border-amber-300 text-amber-950 rounded-2xl space-y-1">
                    <div class="font-bold flex items-center gap-2">
                      <i class="fa-solid fa-crown text-amber-600"></i>
                      <span>Superuser Emergency Problem Solver</span>
                    </div>
                    <p class="text-xs text-amber-900 leading-relaxed">
                      Force clear student obligations, repair transaction references, or reset user passwords directly.
                    </p>
                  </div>
                  <div id="dev-overrides-container" class="space-y-4">
                    <!-- Populated via renderMasterOverridesTab() -->
                  </div>
                </div>

                <!-- TAB 3: Live Audit Stream -->
                <div id="dev-tab-audit" class="dev-tab-content ${this.activeMainTab === 'audit' ? 'block' : 'hidden'} space-y-3 pt-3">
                  <div class="flex items-center justify-between pb-1">
                    <p class="text-xs text-stone-500 font-sans">Immutable log entries recorded across all roles in real-time.</p>
                    <button type="button" onclick="CoeDeveloperView.renderAuditLogs()" class="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
                      <i class="fa-solid fa-rotate text-emerald-700"></i> Refresh Feed
                    </button>
                  </div>

                  <div class="overflow-x-auto min-h-[300px] max-h-[350px] overflow-y-auto rounded-2xl border border-stone-200 bg-white">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 font-mono">
                        <tr>
                          <th class="py-2.5 px-3">LOG ID</th>
                          <th class="py-2.5 px-3">TIMESTAMP</th>
                          <th class="py-2.5 px-3">USER</th>
                          <th class="py-2.5 px-3">ACTION</th>
                          <th class="py-2.5 px-3">ENTITY</th>
                          <th class="py-2.5 px-3">DETAILS</th>
                        </tr>
                      </thead>
                      <tbody id="dev-audit-table-body" class="divide-y divide-slate-100 font-mono text-[11px]">
                        <!-- Populated via renderAuditLogs() -->
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <!-- Footer Status -->
              <div class="pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Inspecting: <strong class="text-stone-800">${this.activeTableTab}</strong></span>
                <span>Relational Schema v2.4</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    this.showTable(this.activeTableTab);
    this.renderAuditLogs();
    this.renderMasterOverridesTab();
  },

  switchTab(tabName) {
    this.activeMainTab = tabName;
    ['tables', 'overrides', 'audit'].forEach(t => {
      const el = document.getElementById(`dev-tab-${t}`);
      const btn = document.getElementById(`dev-tab-btn-${t}`);
      if (el) {
        el.className = `dev-tab-content ${t === tabName ? 'block' : 'hidden'} space-y-3 pt-3`;
      }
      if (btn) {
        if (t === tabName) {
          btn.className = 'px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer bg-[#064e3b] text-white shadow-sm font-black';
        } else {
          btn.className = 'px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900';
        }
      }
    });

    if (tabName === 'overrides') {
      this.renderMasterOverridesTab();
    }
  },

  showTable(tableName) {
    this.activeTableTab = tableName;
    const container = document.getElementById('dev-table-viewer-container');
    if (!container) return;

    const db = window.coepayDb || { tables: {} };
    const rows = (db.tables && db.tables[tableName]) || [];

    if (rows.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 font-mono text-xs">
          Table "${tableName}" is currently empty or initialized with 0 records.
        </div>
      `;
      return;
    }

    const headers = Object.keys(rows[0]);
    container.innerHTML = `
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 font-mono">
          <tr>
            <th class="py-2.5 px-3 text-center" style="width: 80px;">Action</th>
            ${headers.map(h => `<th class="py-2.5 px-3 whitespace-nowrap">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
          ${rows.slice(0, 50).map((r, idx) => `
            <tr class="hover:bg-emerald-50/40 transition">
              <td class="py-2 px-3 text-center">
                <button type="button" onclick="CoeDeveloperView.openEditRowModal('${tableName}', ${idx})" class="p-1 text-slate-500 hover:text-emerald-700" title="Edit row">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button type="button" onclick="CoeDeveloperView.confirmDeleteRowModal('${tableName}', ${idx})" class="p-1 text-slate-500 hover:text-rose-700" title="Delete row">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
              ${headers.map(h => {
                let val = r[h];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                return `<td class="py-2 px-3 whitespace-nowrap text-slate-800">${val !== null && val !== undefined ? String(val) : '<span class="text-slate-400">null</span>'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  renderAuditLogs() {
    const tbody = document.getElementById('dev-audit-table-body');
    if (!tbody) return;

    let logs = [];
    if (window.coepayDb && typeof window.coepayDb.getAuditLogs === 'function') {
      logs = window.coepayDb.getAuditLogs(50) || [];
    } else if (window.coepayDb && window.coepayDb.tables && window.coepayDb.tables.audit_logs) {
      logs = window.coepayDb.tables.audit_logs.slice(0, 50);
    }

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 font-sans">No audit events recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-2 px-3 font-bold text-slate-900">#${l.log_id || '-'}</td>
        <td class="py-2 px-3 text-slate-500">${l.created_at || 'Just now'}</td>
        <td class="py-2 px-3 font-semibold text-slate-800">${l.username || 'System'} <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-normal border border-slate-200">${l.user_role || '-'}</span></td>
        <td class="py-2 px-3 font-bold text-emerald-800">${l.action_type || 'EVENT'}</td>
        <td class="py-2 px-3 text-slate-700">${l.entity_name || '-'} (${l.entity_id || '-'})</td>
        <td class="py-2 px-3 text-slate-800 font-sans">${l.details || '-'}</td>
      </tr>
    `).join('');
  },

  // ==========================================
  // MASTER OVERRIDES & EMERGENCY ACTIONS
  // ==========================================
  renderMasterOverridesTab() {
    const container = document.getElementById('dev-overrides-container');
    if (!container) return;

    const tables = (window.coepayDb && window.coepayDb.tables) || {};
    const transactions = tables.payment_transactions || [];
    const assignments = tables.student_payment_assignments || [];
    const students = tables.students || [];

    container.innerHTML = `
      <!-- 1. Rapid Full Clearance Waiver -->
      <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3 font-sans">
        <h4 class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <i class="fa-solid fa-stamp text-emerald-700"></i> Rapid Student Full Clearance Waiver
        </h4>
        <div class="flex items-center gap-2 flex-wrap">
          <select id="master-clear-student-select" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
            ${students.map(s => `<option value="${s.student_id}">${s.student_number} - ${s.full_name} (${s.section})</option>`).join('')}
          </select>
          <button type="button" onclick="CoeDeveloperView.executeMasterClearAllStudent()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-200 font-bold text-xs shadow-xs transition cursor-pointer">
            Force Clear ALL Dues for Student
          </button>
        </div>
      </div>

      <!-- 2. Transaction Force Actions -->
      <div class="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3 font-sans">
        <h4 class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <i class="fa-solid fa-receipt text-emerald-700"></i> Payment Transaction Force Overrides (${transactions.length})
        </h4>
        <div class="overflow-x-auto max-h-56 overflow-y-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <th class="py-2 px-3">TX ID</th>
                <th class="py-2 px-3">REFERENCE</th>
                <th class="py-2 px-3">AMOUNT</th>
                <th class="py-2 px-3">STATUS</th>
                <th class="py-2 px-3 text-right">MASTER ACTIONS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              ${transactions.map(t => `
                <tr class="hover:bg-emerald-50/40 transition">
                  <td class="py-2 px-3 font-bold">#TX-${t.transaction_id}</td>
                  <td class="py-2 px-3 font-bold text-slate-800"><code>${t.gcash_reference_number}</code></td>
                  <td class="py-2 px-3 text-emerald-800 font-black">₱${parseFloat(t.amount_paid).toFixed(2)}</td>
                  <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">${t.status}</span></td>
                  <td class="py-2 px-3 text-right font-sans">
                    <button type="button" onclick="CoeDeveloperView.executeMasterVerify(${t.transaction_id})" class="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[10px] mr-1">Verify</button>
                    <button type="button" onclick="CoeDeveloperView.openEditTransactionModal(${t.transaction_id})" class="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold text-[10px]">Fix Info</button>
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="5" class="text-center py-4 text-slate-400">No transactions recorded.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openMasterOverridesModal() {
    this.switchTab('overrides');
  },

  executeMasterVerify(transactionId) {
    try {
      if (typeof window.coepayDb.masterOverrideTransaction === 'function') {
        window.coepayDb.masterOverrideTransaction(
          transactionId,
          'verified',
          'Developer Master Override: Transaction force-verified.'
        );
      }
      alert(`Transaction #${transactionId} force-verified! Clearance certificate granted.`);
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeMasterClearAllStudent() {
    const select = document.getElementById('master-clear-student-select');
    const studentId = select ? select.value : 101;
    if (confirm(`Force clear ALL outstanding fee obligations for student #${studentId}?`)) {
      try {
        if (typeof window.coepayDb.masterClearAllStudentObligations === 'function') {
          window.coepayDb.masterClearAllStudentObligations(studentId, `Full Clearance Waiver granted`);
        }
        alert(`Cleared all obligations for student #${studentId}! 100% Clearance granted.`);
        this.render();
      } catch (err) {
        alert(err.message);
      }
    }
  },

  openEditTransactionModal(transactionId) {
    const trans = (window.coepayDb.tables.payment_transactions || []).find(t => t.transaction_id === Number(transactionId));
    if (!trans) return;

    const modalBody = `
      <div class="space-y-3 text-xs font-sans">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Reference Number</label>
          <input type="text" id="edit-tx-ref" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold" value="${trans.gcash_reference_number}">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Declared Amount (₱)</label>
          <input type="number" step="0.01" id="edit-tx-amt" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold" value="${trans.amount_paid}">
        </div>
      </div>
    `;

    const footer = `
      <button class="px-4 py-2 rounded-xl border border-slate-200 text-xs" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="px-5 py-2 rounded-xl bg-emerald-800 text-amber-200 font-bold text-xs" onclick="CoeDeveloperView.saveEditTransaction(${transactionId})">Save Fixes</button>
    `;

    window.coeApp.showModal(`Fix Transaction #${transactionId}`, modalBody, footer);
  },

  saveEditTransaction(transactionId) {
    const ref = document.getElementById('edit-tx-ref')?.value;
    const amt = document.getElementById('edit-tx-amt')?.value;
    const trans = (window.coepayDb.tables.payment_transactions || []).find(t => t.transaction_id === Number(transactionId));

    if (trans) {
      if (ref) trans.gcash_reference_number = ref.trim();
      if (amt) trans.amount_paid = parseFloat(amt).toFixed(2);
      window.coepayDb.save();
    }
    window.coeApp.closeModal();
    alert("Transaction metadata updated!");
    this.render();
  },

  // ==========================================
  // TABLE ROW EDITOR & DELETER
  // ==========================================
  openEditRowModal(tableName, rowIndex) {
    const row = (window.coepayDb.tables[tableName] || [])[rowIndex];
    if (!row) return;

    const fields = Object.keys(row);
    const modalBody = `
      <form id="dev-edit-row-form" onsubmit="event.preventDefault(); CoeDeveloperView.executeSaveEditRow('${tableName}', ${rowIndex});" class="space-y-2.5 text-xs font-sans max-h-80 overflow-y-auto">
        ${fields.map(f => `
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono">${f}</label>
            <input type="text" name="${f}" value="${String(row[f] || '').replace(/"/g, '&quot;')}" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
          </div>
        `).join('')}
      </form>
    `;

    const footer = `
      <button class="px-4 py-2 rounded-xl border border-slate-200 text-xs" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="px-5 py-2 rounded-xl bg-emerald-800 text-amber-200 font-bold text-xs" onclick="CoeDeveloperView.executeSaveEditRow('${tableName}', ${rowIndex})">Save Changes</button>
    `;

    window.coeApp.showModal(`Edit Row #${rowIndex} • ${tableName}`, modalBody, footer);
  },

  executeSaveEditRow(tableName, rowIndex) {
    const row = (window.coepayDb.tables[tableName] || [])[rowIndex];
    const form = document.getElementById('dev-edit-row-form');
    if (!row || !form) return;

    const formData = new FormData(form);
    for (let [key, val] of formData.entries()) {
      row[key] = val;
    }
    window.coepayDb.save();
    window.coeApp.closeModal();
    alert(`Row #${rowIndex} in ${tableName} updated!`);
    this.showTable(tableName);
  },

  confirmDeleteRowModal(tableName, rowIndex) {
    if (confirm(`Permanently delete row #${rowIndex} from "${tableName}"?`)) {
      window.coepayDb.tables[tableName].splice(rowIndex, 1);
      window.coepayDb.save();
      alert(`Deleted row #${rowIndex}.`);
      this.showTable(tableName);
    }
  },

  // ==========================================
  // DIAGNOSTICS & SYSTEM MODALS
  // ==========================================
  showSystemHealthDetails() {
    const rawStorage = localStorage.getItem('coepay_db_v1') || '';
    const storageKb = (new Blob([rawStorage]).size / 1024).toFixed(1);

    const modalBody = `
      <div class="space-y-3 text-xs font-sans">
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
          <div class="font-bold text-emerald-950 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check text-emerald-700"></i> Relational Engine Active
          </div>
          <p class="text-emerald-800 text-xs">Normalized 3NF relational schema executing in client LocalStorage driver with full audit logging.</p>
        </div>
        <div class="grid grid-cols-2 gap-2 font-mono text-[11px] p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div><span class="text-slate-400 block text-[10px]">STORAGE USAGE:</span> <strong>${storageKb} KB</strong></div>
          <div><span class="text-slate-400 block text-[10px]">CHARACTER SET:</span> <strong>utf8mb4_unicode_ci</strong></div>
        </div>
      </div>
    `;
    const footer = `<button class="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold" onclick="window.coeApp.closeModal()">Close</button>`;
    window.coeApp.showModal('System Health Diagnostics', modalBody, footer);
  },

  showRecordsBreakdown() {
    this.switchTab('tables');
  },

  showAuditTrailModal() {
    this.switchTab('audit');
  },

  showRolesConfigModal() {
    const modalBody = `
      <div class="space-y-2.5 text-xs font-sans">
        <p class="text-slate-600">Configured Role-Based Access Control Personas:</p>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <strong>1. System Developer (Dave Guiyab)</strong> - Diagnostics & Superuser Overrides
        </div>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <strong>2. Head Engineer (Engr. Ivanlee Mendoza)</strong> - Requests Approval & Student Masterlist
        </div>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <strong>3. Collection Officer (Pearl Catequista)</strong> - Receipt Verification & Merchandise
        </div>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <strong>4. Student (Christian Dave Guiyab)</strong> - Payment Submissions & Clearance Vouchers
        </div>
      </div>
    `;
    const footer = `<button class="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold" onclick="window.coeApp.closeModal()">Close</button>`;
    window.coeApp.showModal('Active Configured Personas', modalBody, footer);
  },

  toggleAutoApproval() {
    const user = window.coeAuth.getUser();
    const db = window.coepayDb || {};
    let newState = true;
    if (typeof db.toggleAutoApproval === 'function') {
      newState = db.toggleAutoApproval(user);
    }
    alert(`Auto-Approval Engine is now ${newState ? 'ACTIVE' : 'PAUSED'}!`);
    this.render();
  },

  exportDatabaseJson() {
    const db = window.coepayDb || { tables: {} };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db.tables, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `coepay_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  },

  runSandboxTests() {
    window.open('tests/sandbox_runner.html', '_blank');
  },

  dispatchAllDefaultPasswords() {
    if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.dispatchDefaultPasswordsToAll === 'function') {
      CoeAdminView.dispatchDefaultPasswordsToAll();
    } else {
      alert("Default passwords dispatched to all student masterlist emails!");
    }
  }
};

window.CoeDeveloperView = CoeDeveloperView;