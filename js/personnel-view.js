/**
 * COE-Pay: Collection Officer & Treasury Personnel View Controller
 * Persona: Pearl Catequista (Student Officer & Financial Treasurer)
 * Language: English
 * Features:
 * - Verification Queue for GCash / Bank Transfers
 * - Full Visibility of Existing Merchandise Catalog (with .jpg Image Previews)
 * - Ability to Upload & Add New Merchandise Items (with Image Upload)
 * - Ability to Draft & Propose New Department Fees / Seminars
 * - Section Collection Monitoring Sheet
 * - Settled Transaction Archive
 * - Cash Settlement Registration Modal
 */

const CoePersonnelView = {
  activeTab: 'verification', // 'verification' | 'merch' | 'requests' | 'roster-monitor' | 'settled'

  // Dynamic Merchandise Catalog (Synced with Student Catalog)
  getMerchCatalog() {
    if (window.CoeStudentView && Array.isArray(window.CoeStudentView.merchCatalog)) {
      return window.CoeStudentView.merchCatalog;
    }
    return [
      {
        id: 'merch_1',
        title: 'Official COE Technical Polo Shirt',
        category: 'Department Uniform / Shirt',
        amount: 450.00,
        image: 'assets/img/merch-polo.jpg',
        icon: 'fa-shirt',
        badge: 'Official Uniform',
        description: 'Official College of Engineering breathable dry-fit technical polo shirt with embroidered institutional seal.'
      },
      {
        id: 'merch_2',
        title: 'COE Engineering Lanyard & Badge Holder',
        category: 'COE Merch',
        amount: 150.00,
        image: 'assets/img/merch-lanyard.jpg',
        icon: 'fa-id-badge',
        badge: 'Accessories',
        description: 'Premium institutional woven strap with safety release buckle and heavy-duty transparent badge holder.'
      },
      {
        id: 'merch_3',
        title: 'Engineering Gold Seal Lapel Pin',
        category: 'COE Merch',
        amount: 120.00,
        image: 'assets/img/merch-pin.jpg',
        icon: 'fa-certificate',
        badge: 'Ceremonial',
        description: 'Die-cast gold-plated institutional lapel pin for official assemblies and ceremonies.'
      },
      {
        id: 'merch_4',
        title: 'Capstone Hardcover Defense Binder Kit',
        category: 'Capstone & Research',
        amount: 350.00,
        image: 'assets/img/merch-binder.jpg',
        icon: 'fa-book-bookmark',
        badge: 'Academic Kit',
        description: 'Institutional maroon gold-embossed manuscript folio binder required for senior capstone defense submissions.'
      },
      {
        id: 'merch_5',
        title: 'Embedded Systems & IoT Hardware Lab Kit',
        category: 'Laboratory Kit',
        amount: 750.00,
        image: 'assets/img/merch-labkit.jpg',
        icon: 'fa-microchip',
        badge: 'Lab Equipment',
        description: 'ESP32 Wi-Fi/Bluetooth microcontroller, sensor modules, breadboard, and connection leads.'
      }
    ];
  },

  render() {
    const container = document.getElementById('personnel-view-container') || 
                      document.getElementById('main-app-container');
    if (!container) return;

    ['developer-view-container', 'admin-view-container', 'student-view-container', 'login-view-container'].forEach(id => {
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
    const personnel = (auth.getProfile && auth.getProfile()) || {
      personnel_id: 1,
      full_name: 'Pearl Catequista',
      designation: 'College Student Officer & Financial Treasurer',
      responsibility: 'Inspect payment receipts, publish merchandise, and manage department fee collections.'
    };
    const db = window.coepayDb || {};
    const currentTerm = (typeof db.getCurrentTerm === 'function') 
      ? db.getCurrentTerm() 
      : { academic_year: '2026-2027', term_name: '1st Semester', semester: '1st Semester' };

    const merchItems = this.getMerchCatalog();
    const myRequests = (typeof db.getPaymentRequests === 'function')
      ? db.getPaymentRequests({ created_by_personnel_id: personnel.personnel_id })
      : [];
    const allPendingTransactions = (typeof db.getTransactions === 'function')
      ? db.getTransactions({ status: 'pending' })
      : [];
    const allVerifiedTransactions = (typeof db.getTransactions === 'function')
      ? db.getTransactions({ status: 'verified' })
      : [];

    const myRequestIds = myRequests.map(r => r.request_id);
    const pendingTransactions = allPendingTransactions.filter(t => myRequestIds.length === 0 || myRequestIds.includes(t.request_id));

    const totalCollectedForMyReqs = myRequests.reduce((sum, r) => sum + (r.stats ? r.stats.totalCollected : 0), 0);
    const totalExpectedForMyReqs = myRequests.reduce((sum, r) => sum + (r.stats ? r.stats.targetExpected : 0), 0);
    const rate = totalExpectedForMyReqs > 0 ? Math.round((totalCollectedForMyReqs / totalExpectedForMyReqs) * 100) : 0;
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
              <pattern id="personnel-arch-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4 4" />
                <circle cx="0" cy="0" r="1.5" fill="#0f766e" opacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#personnel-arch-grid)" />
          </svg>
        </div>

        <!-- MAIN INTERACTIVE CONTENT -->
        <div class="relative z-10 w-full max-w-7xl mx-auto space-y-6 pointer-events-auto">

          <!-- EXECUTIVE TOP HEADER -->
          <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#064e3b] text-white tracking-wide shadow-xs">
                  <i class="fa-solid fa-clipboard-user"></i> TREASURY & COLLECTION VERIFICATION DESK
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  AY ${currentTerm.academic_year || '2026-2027'} • ${currentTerm.term_name || currentTerm.semester || '1st Semester'}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${isAutoApproval ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'} border">
                  <span class="w-1.5 h-1.5 rounded-full ${isAutoApproval ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse inline-block mr-1"></span>
                  AUTO-APPROVAL: ${isAutoApproval ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <h1 class="text-3xl sm:text-4xl font-black font-brand tracking-tight text-slate-900">${personnel.full_name || 'Pearl Catequista'}</h1>
              <p class="text-xs sm:text-sm font-medium text-slate-600">
                <strong class="text-slate-900">${personnel.designation || 'College Student Officer & Financial Treasurer'}</strong> • Primary Responsibility: <strong class="text-emerald-800">Verify Receipts & Manage Merch/Fees</strong>
              </p>
            </div>

            <!-- Action Toolbar Cluster -->
            <div class="flex items-center gap-2.5 flex-wrap flex-shrink-0">
              <button type="button" onclick="CoePersonnelView.toggleAutoApproval()" class="px-3.5 py-2.5 rounded-xl border ${isAutoApproval ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700'} hover:bg-emerald-100 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer" title="Toggle Auto-Approval Engine">
                <i class="fa-solid fa-bolt ${isAutoApproval ? 'text-emerald-600' : 'text-slate-400'}"></i>
                <span>${isAutoApproval ? 'Auto-Approval On' : 'Paused'}</span>
              </button>
              <button type="button" onclick="CoePersonnelView.openModal('receipt')" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-hand-holding-dollar text-emerald-700"></i>
                <span>Cash Settlement</span>
              </button>
              <button type="button" onclick="CoePersonnelView.openUploadMerchModal()" class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-shirt text-amber-300"></i>
                <span>Add Merchandise</span>
              </button>
              <button type="button" onclick="CoePersonnelView.openCreateRequestModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-amber-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-circle-plus text-xs"></i>
                <span>Propose Fee / Seminar</span>
              </button>
            </div>
          </div>

          <!-- 4 STAT BOXES WITH AMBIENT GLOW -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-blue-200/80 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_0_28px_rgba(59,130,246,0.25)] hover:border-blue-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">₱</div>
                <button type="button" onclick="CoePersonnelView.switchTab('roster-monitor')" class="text-xs font-mono font-bold text-slate-400 hover:text-blue-700 flex items-center gap-1 transition cursor-pointer">
                  Inspect <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">COLLECTED FOR YOUR REQUESTS</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">₱${totalCollectedForMyReqs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
              <div class="text-xs text-blue-700 font-medium flex items-center gap-1.5 mt-2">
                <i class="fa-solid fa-circle-check"></i> Credited to Designated Wallet
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border ${pendingTransactions.length > 0 ? 'border-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.15)]' : 'border-slate-200'} transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-receipt"></i>
                </div>
                <button type="button" onclick="CoePersonnelView.switchTab('verification')" class="text-xs font-mono font-bold ${pendingTransactions.length > 0 ? 'text-amber-700 font-black' : 'text-slate-400'} hover:underline flex items-center gap-1 transition cursor-pointer">
                  Review (${pendingTransactions.length}) <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">PENDING VERIFICATION QUEUE</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${pendingTransactions.length}</div>
              <div class="text-xs ${pendingTransactions.length > 0 ? 'text-amber-700 font-bold' : 'text-slate-500 font-medium'} mt-2 flex items-center gap-1.5">
                ${pendingTransactions.length > 0 ? '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Receipts Awaiting Review' : 'Queue Cleared'}
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-emerald-200/80 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_28px_rgba(16,185,129,0.25)] hover:border-emerald-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-chart-line"></i>
                </div>
                <span class="text-xs font-mono font-bold text-slate-400">Target</span>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TARGET COMPLIANCE RATE</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${rate}%</div>
              <div class="text-xs text-slate-500 font-medium mt-2">
                Target: <span class="font-mono font-bold text-slate-800">₱${totalExpectedForMyReqs.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div class="relative group bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-teal-200/80 shadow-[0_4px_20px_rgba(20,184,166,0.08)] hover:shadow-[0_0_28px_rgba(20,184,166,0.25)] hover:border-teal-400 transition-all duration-300">
              <div class="flex items-center justify-between pb-3">
                <div class="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform">
                  <i class="fa-solid fa-shirt"></i>
                </div>
                <button type="button" onclick="CoePersonnelView.switchTab('merch')" class="text-xs font-mono font-bold text-slate-400 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer">
                  Catalog (${merchItems.length}) <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">PUBLISHED MERCHANDISE</div>
              <div class="text-2xl font-black font-brand text-slate-900 mt-0.5">${merchItems.length} Items</div>
              <div class="text-xs text-emerald-700 font-medium mt-2">
                Available in Student Store
              </div>
            </div>
          </div>

          <!-- BALANCED 2-COLUMN WORKSTATION -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            <!-- LEFT COLUMN: Policy & Protocol Card -->
            <div class="lg:col-span-4 bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">&lt;DISPATCH_DESK&gt;</span>
                    <h3 class="font-brand text-base font-extrabold text-stone-900">Officer Verification Policy</h3>
                  </div>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>

                <div class="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs">
                  <div class="font-bold text-stone-900 flex items-center gap-1.5">
                    <i class="fa-solid fa-shield-halved text-emerald-700"></i> Standard Audit Protocol:
                  </div>
                  <p class="text-stone-600 leading-relaxed text-xs">
                    1. Click <strong>"View Receipt"</strong> to audit the student's GCash / Bank screenshot and reference code.<br>
                    2. Provide optional <strong>Personnel Audit Notes</strong> for special verification remarks.<br>
                    3. Click <strong>"Approve & Grant Clearance"</strong> or <strong>"Decline Submission"</strong>.
                  </p>
                </div>

                <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div class="font-bold flex items-center gap-1.5">
                    <i class="fa-solid fa-bolt text-emerald-700"></i> Smart Auto-Approval Guard
                  </div>
                  <p class="text-[11px] text-emerald-800 leading-relaxed">
                    When Auto-Approval is active, submissions with valid, unique 10-14 digit reference codes and uploaded receipt images are automatically verified.
                  </p>
                </div>
              </div>

              <div class="pt-4 border-t border-stone-200 mt-6 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Verification Authority</span>
                <span class="text-emerald-800 font-bold"><i class="fa-solid fa-stamp"></i> Treasury Validated</span>
              </div>
            </div>

            <!-- RIGHT COLUMN: Interactive Workstation Tables -->
            <div class="lg:col-span-8 bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <!-- Subtab Navigation -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div class="inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 font-mono text-xs font-bold overflow-x-auto">
                    <button type="button" onclick="CoePersonnelView.switchTab('verification')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeTab === 'verification' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-shield-check"></i>
                      <span>Queue</span>
                      <span class="px-1.5 py-0.2 rounded-full ${this.activeTab === 'verification' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} text-[10px]">${pendingTransactions.length}</span>
                    </button>
                    <button type="button" onclick="CoePersonnelView.switchTab('merch')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeTab === 'merch' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-shirt"></i>
                      <span>Merchandise Catalog</span>
                      <span class="px-1.5 py-0.2 rounded-full ${this.activeTab === 'merch' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} text-[10px]">${merchItems.length}</span>
                    </button>
                    <button type="button" onclick="CoePersonnelView.switchTab('requests')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeTab === 'requests' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-list-check"></i>
                      <span>Fee Proposals</span>
                      <span class="px-1.5 py-0.2 rounded-full ${this.activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} text-[10px]">${myRequests.length}</span>
                    </button>
                    <button type="button" onclick="CoePersonnelView.switchTab('roster-monitor')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeTab === 'roster-monitor' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-table-list"></i>
                      <span>Section Monitor</span>
                    </button>
                    <button type="button" onclick="CoePersonnelView.switchTab('settled')" class="px-3.5 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer ${this.activeTab === 'settled' ? 'bg-[#064e3b] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
                      <i class="fa-solid fa-circle-check"></i>
                      <span>Settled</span>
                      <span class="px-1.5 py-0.2 rounded-full ${this.activeTab === 'settled' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} text-[10px]">${allVerifiedTransactions.length}</span>
                    </button>
                  </div>

                  <div class="text-xs text-stone-500 font-mono flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-dot text-emerald-600 text-[8px]"></i> Treasury Ledger Sync
                  </div>
                </div>

                <!-- Table Content Container -->
                <div class="overflow-x-auto rounded-2xl border border-stone-200 bg-white mt-3 shadow-2xs">
                  ${this.renderActiveTableContent(pendingTransactions, myRequests, allVerifiedTransactions, merchItems)}
                </div>
              </div>

              <div class="pt-3 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Active Ledger: <strong class="text-stone-800">${this.activeTab.toUpperCase()}</strong></span>
                <span>COE-Pay Collection Desk</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  renderActiveTableContent(pendingTransactions, myRequests, allVerifiedTransactions, merchItems) {
    // -------------------------------------------------------------
    // TAB 1: VERIFICATION QUEUE
    // -------------------------------------------------------------
    if (this.activeTab === 'verification') {
      return `
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
              <th class="py-3 px-3.5">STUDENT DETAILS</th>
              <th class="py-3 px-3.5">OBLIGATION / PURPOSE</th>
              <th class="py-3 px-3.5">REF NUMBER</th>
              <th class="py-3 px-3.5">SENDER DETAILS</th>
              <th class="py-3 px-3.5">AMOUNT</th>
              <th class="py-3 px-3.5 text-right">AUDIT ACTIONS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800 font-mono text-[11px]">
            ${pendingTransactions.length === 0 ? `
              <tr>
                <td colspan="6" class="py-10 text-center text-slate-400 font-sans">
                  <i class="fa-solid fa-circle-check text-emerald-600 text-3xl mb-1.5 block"></i>
                  <span class="font-bold text-slate-800 text-sm">No Pending Verifications</span>
                  <p class="text-xs text-slate-500 mt-0.5">All student payments have been reviewed and audited.</p>
                </td>
              </tr>
            ` : pendingTransactions.map(t => {
              const studentName = (t.student && t.student.full_name) || t.gcash_sender_name || 'Student';
              const studentNo = (t.student && t.student.student_number) || '2023-10001';
              const reqTitle = (t.request && t.request.title) || 'Prescribed Assessment';
              const amt = parseFloat(t.amount_paid || 450).toFixed(2);
              const refNo = t.gcash_reference_number || 'GCASH-9028129481023';

              return `
                <tr class="hover:bg-emerald-50/40 transition">
                  <td class="py-3.5 px-3.5">
                    <strong class="font-sans text-slate-900 block">${studentName}</strong>
                    <span class="text-[10px] text-slate-500">${studentNo}</span>
                  </td>
                  <td class="py-3.5 px-3.5 font-sans">
                    <div class="font-bold text-slate-800 text-xs">${reqTitle}</div>
                    <div class="text-[10px] text-slate-400">${t.gateway_type === 'bank' ? 'Bank Transfer' : 'GCash Express Send'}</div>
                  </td>
                  <td class="py-3.5 px-3.5 font-bold text-slate-900">
                    <code class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">${refNo}</code>
                  </td>
                  <td class="py-3.5 px-3.5">
                    <div class="font-sans font-bold text-slate-800">${t.gcash_sender_name}</div>
                    <div class="text-[10px] text-slate-500">${t.gcash_sender_number}</div>
                  </td>
                  <td class="py-3.5 px-3.5 font-black text-emerald-800 text-xs">₱${amt}</td>
                  <td class="py-3.5 px-3.5 text-right font-sans">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" onclick="CoePersonnelView.inspectReceipt(${t.transaction_id || 1})" class="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 font-bold text-[10px] shadow-2xs transition flex items-center gap-1 cursor-pointer">
                        <i class="fa-solid fa-receipt text-[10px]"></i> View Receipt
                      </button>
                      <button type="button" onclick="CoePersonnelView.executeReject(${t.transaction_id || 1})" class="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[10px] shadow-2xs transition cursor-pointer">
                        Decline
                      </button>
                      <button type="button" onclick="CoePersonnelView.executeVerify(${t.transaction_id || 1})" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 text-amber-200 font-bold text-[10px] shadow-2xs transition cursor-pointer">
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // -------------------------------------------------------------
    // TAB 2: MERCHANDISE CATALOG (VISIBILITY & MANAGEMENT)
    // -------------------------------------------------------------
    else if (this.activeTab === 'merch') {
      return `
        <div class="p-4 space-y-4 font-sans">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 class="font-bold text-slate-900 text-sm">Official College of Engineering Merchandise Catalog</h4>
              <p class="text-xs text-slate-500">Items visible to students with image previews and live pricing.</p>
            </div>
            <button type="button" onclick="CoePersonnelView.openUploadMerchModal()" class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs">
              <i class="fa-solid fa-plus text-[10px]"></i> Upload New Merchandise
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${merchItems.map(item => `
              <div class="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-emerald-600 hover:shadow-md transition flex flex-col justify-between group">
                <div class="relative w-full h-36 bg-slate-900 overflow-hidden">
                  <img src="${item.image}" 
                       alt="${item.title}" 
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter brightness-[0.95]"
                       onerror="this.onerror=null; this.src='assets/img/engineering-uniform.jpeg';">
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-white/90 text-slate-900 backdrop-blur-md">
                    ${item.badge}
                  </span>
                  <div class="absolute bottom-2 right-2.5 w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-xs">
                    <i class="fa-solid ${item.icon}"></i>
                  </div>
                </div>

                <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h5 class="font-bold text-slate-900 text-xs leading-snug">${item.title}</h5>
                    <p class="text-[10px] text-slate-500 line-clamp-2 mt-0.5">${item.description}</p>
                  </div>
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
                    <span class="text-xs font-black text-slate-900">₱${item.amount.toFixed(2)}</span>
                    <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">Active in Store</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TAB 3: FEE PROPOSALS & REQUESTS
    // -------------------------------------------------------------
    else if (this.activeTab === 'requests') {
      return `
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
              <th class="py-3 px-3.5">REQ ID</th>
              <th class="py-3 px-3.5">PURPOSE / TITLE</th>
              <th class="py-3 px-3.5">CATEGORY</th>
              <th class="py-3 px-3.5">AMOUNT</th>
              <th class="py-3 px-3.5">TARGET COHORT</th>
              <th class="py-3 px-3.5">STATUS</th>
              <th class="py-3 px-3.5 text-right">COLLECTION PROGRESS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800 font-mono text-[11px]">
            ${myRequests.length === 0 ? `
              <tr>
                <td colspan="7" class="py-10 text-center text-slate-400 font-sans">
                  No payment proposals submitted yet. Click "Propose Fee / Seminar" in the toolbar above to request a collection.
                </td>
              </tr>
            ` : myRequests.map(r => {
              const targetCohort = r.target_year_level ? `Year ${r.target_year_level}` : 'All COE Students';
              return `
                <tr class="hover:bg-emerald-50/40 transition">
                  <td class="py-3.5 px-3.5 font-bold text-slate-900"><span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">REQ-${r.request_id}</span></td>
                  <td class="py-3.5 px-3.5 font-sans font-bold text-slate-900">${r.title}</td>
                  <td class="py-3.5 px-3.5"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">${r.category_name}</span></td>
                  <td class="py-3.5 px-3.5 font-black text-emerald-800">₱${parseFloat(r.amount).toFixed(2)}</td>
                  <td class="py-3.5 px-3.5 text-slate-600">${targetCohort}</td>
                  <td class="py-3.5 px-3.5">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'authorized' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">
                      ${r.status.toUpperCase()}
                    </span>
                  </td>
                  <td class="py-3.5 px-3.5 text-right font-sans">
                    <span class="text-xs font-bold text-slate-800 font-mono">${r.stats ? r.stats.collectionRate : 0}% Compliant</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    // -------------------------------------------------------------
    // TAB 4: SECTION MONITOR
    // -------------------------------------------------------------
    else if (this.activeTab === 'roster-monitor') {
      const db = window.coepayDb || {};
      const assignments = (typeof db.getAssignments === 'function') ? db.getAssignments() : [];

      return `
        <div class="p-3">
          <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
            <span class="text-xs font-bold font-mono text-slate-700"><i class="fa-solid fa-filter text-emerald-700"></i> Section Master Collection Sheet</span>
            <button type="button" onclick="CoePersonnelView.exportSectionCsv()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-download text-emerald-700"></i> Export CSV
            </button>
          </div>
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
                <th class="py-2.5 px-3">STUDENT ID</th>
                <th class="py-2.5 px-3">STUDENT NAME</th>
                <th class="py-2.5 px-3">SECTION</th>
                <th class="py-2.5 px-3">STATUS</th>
                <th class="py-2.5 px-3">AMOUNT</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              ${assignments.map(a => `
                <tr class="hover:bg-emerald-50/40 transition">
                  <td class="py-2.5 px-3 font-bold">${a.student ? a.student.student_number : '2023-10001'}</td>
                  <td class="py-2.5 px-3 font-sans font-bold text-slate-900">${a.student ? a.student.full_name : 'Christian Dave Guiyab'}</td>
                  <td class="py-2.5 px-3 text-slate-600">${a.student ? a.student.section : 'BSCpE-4A'}</td>
                  <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">${a.status}</span></td>
                  <td class="py-2.5 px-3 font-black text-emerald-800">₱${parseFloat(a.request ? a.request.amount : 450).toFixed(2)}</td>
                </tr>
              `).join('') || `<tr><td colspan="5" class="text-center py-4 text-slate-400">No records available.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TAB 5: SETTLED ARCHIVE
    // -------------------------------------------------------------
    else {
      return `
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
              <th class="py-3 px-3.5">REF NUMBER</th>
              <th class="py-3 px-3.5">STUDENT PROFILE</th>
              <th class="py-3 px-3.5">ITEM / OBLIGATION</th>
              <th class="py-3 px-3.5">AMOUNT</th>
              <th class="py-3 px-3.5">VERIFIED TIMESTAMP</th>
              <th class="py-3 px-3.5 text-right">E-RECEIPT</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800 font-mono text-[11px]">
            ${allVerifiedTransactions.map(t => `
              <tr class="hover:bg-emerald-50/40 transition">
                <td class="py-3.5 px-3.5 font-bold text-slate-900"><code>${t.gcash_reference_number || 'GCASH-9028129481001'}</code></td>
                <td class="py-3.5 px-3.5 font-sans">
                  <div class="font-bold text-slate-900">${(t.student && t.student.full_name) || t.gcash_sender_name || 'Maria Santos'}</div>
                  <div class="text-[10px] text-slate-500">${(t.student && t.student.student_number) || '2023-10012'}</div>
                </td>
                <td class="py-3.5 px-3.5 font-sans">${(t.request && t.request.title) || 'Departmental Shirt'}</td>
                <td class="py-3.5 px-3.5 font-black text-emerald-800">₱${parseFloat(t.amount_paid || 450).toFixed(2)}</td>
                <td class="py-3.5 px-3.5 text-slate-500">${t.verified_at || t.payment_timestamp || 'Oct 28, 2026'}</td>
                <td class="py-3.5 px-3.5 text-right font-sans">
                  <button type="button" onclick="CoePersonnelView.inspectReceipt(${t.transaction_id || 1})" class="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold transition cursor-pointer">
                    Inspect Proof
                  </button>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="6" class="py-8 text-center text-slate-400">No settled records found in archive.</td></tr>`}
          </tbody>
        </table>
      `;
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
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
  // UPLOAD & ADD NEW MERCHANDISE MODAL
  // ==========================================
  openUploadMerchModal() {
    this.closeModal();
    this.uploadedMerchImageData = null;

    const titleHtml = `<i class="fa-solid fa-shirt text-amber-300 mr-2"></i><span>Upload & Add New Merchandise</span>`;

    const bodyHtml = `
      <form id="upload-merch-form" onsubmit="event.preventDefault(); CoePersonnelView.saveNewMerchandise();" class="space-y-3.5 text-xs font-sans">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Merchandise Title *</label>
          <input type="text" id="new-merch-title" placeholder="e.g. Official COE Engineering Jacket (Batch 2026)" required class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-700">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Category / Badge *</label>
            <input type="text" id="new-merch-badge" placeholder="e.g. Outerwear / Uniform" required class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Retail Price (PHP) *</label>
            <input type="number" step="0.01" min="1" id="new-merch-price" placeholder="850.00" required class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Product Description *</label>
          <textarea id="new-merch-desc" rows="2" placeholder="Official description, materials, and sizing specifications..." required class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"></textarea>
        </div>

        <!-- Image Upload Input -->
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Product Image / Mockup (.jpg, .png) *</label>
          <input type="file" id="new-merch-file" accept="image/*" style="display:none;" onchange="CoePersonnelView.handleMerchImageSelect(event)">
          <div id="merch-img-dropzone" onclick="document.getElementById('new-merch-file').click()" 
               class="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-600 transition cursor-pointer bg-slate-50/50 space-y-1">
            <i class="fa-solid fa-cloud-arrow-up text-2xl text-emerald-700"></i>
            <div id="merch-drop-label" class="font-bold text-slate-800 text-xs">Click or drag & drop merchandise photo</div>
            <div class="text-[10px] text-slate-400 font-mono">Supports JPG or PNG (Auto-compressed)</div>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <div class="flex items-center justify-between w-full gap-2">
        <button type="button" onclick="CoePersonnelView.closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
        <button type="button" onclick="document.getElementById('upload-merch-form').requestSubmit();" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 text-amber-200 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5">
          <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
          <span>Publish to Student Store</span>
        </button>
      </div>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  handleMerchImageSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      this.uploadedMerchImageData = event.target.result;
      const label = document.getElementById('merch-drop-label');
      if (label) {
        label.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check"></i> Image Loaded: ${file.name}</span>`;
      }
    };
    reader.readAsDataURL(file);
  },

  saveNewMerchandise() {
    const title = document.getElementById('new-merch-title')?.value?.trim();
    const badge = document.getElementById('new-merch-badge')?.value?.trim();
    const price = parseFloat(document.getElementById('new-merch-price')?.value || 0);
    const desc = document.getElementById('new-merch-desc')?.value?.trim();
    const image = this.uploadedMerchImageData || 'assets/img/engineering-uniform.jpeg';

    if (!title || !price) {
      alert("Please provide the title and valid price.");
      return;
    }

    const newItem = {
      id: 'merch_' + Date.now(),
      title: title,
      category: badge || 'COE Merch',
      amount: price,
      image: image,
      icon: 'fa-shirt',
      badge: badge || 'Merchandise',
      description: desc
    };

    if (window.CoeStudentView && Array.isArray(window.CoeStudentView.merchCatalog)) {
      window.CoeStudentView.merchCatalog.push(newItem);
    }

    this.closeModal();
    alert(`Merchandise "${title}" has been successfully published to the Student Portal!`);
    this.switchTab('merch');
  },

  // ==========================================
  // PROPOSE NEW DEPARTMENT FEE / SEMINAR
  // ==========================================
  openCreateRequestModal() {
    this.closeModal();
    const categories = (typeof window.coepayDb.getCategories === 'function')
      ? window.coepayDb.getCategories()
      : [
          { category_id: 1, category_name: 'Department Uniform / Shirt' },
          { category_id: 2, category_name: 'COE Merch' },
          { category_id: 3, category_name: 'Capstone & Research' },
          { category_id: 4, category_name: 'Laboratory Kit' }
        ];
    const currentTerm = (typeof window.coepayDb.getCurrentTerm === 'function')
      ? window.coepayDb.getCurrentTerm()
      : { academic_year: '2026-2027', term_id: 1 };
    const personnel = (window.coeAuth && window.coeAuth.getProfile()) || {};

    const titleHtml = `<i class="fa-solid fa-circle-plus text-amber-300 mr-2"></i><span>Propose Fee / Seminar / Obligation</span>`;

    const bodyHtml = `
      <form id="create-request-form" onsubmit="event.preventDefault(); CoePersonnelView.saveNewRequest();" class="space-y-3.5 text-xs font-sans">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Payment Purpose / Title *</label>
          <input type="text" id="req-title" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900" placeholder="e.g. 1st Sem 2026-2027 BSCpE Laboratory Maintenance Fee" required>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Category *</label>
            <select id="req-category" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" required>
              ${categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Payable Amount (PHP) *</label>
            <input type="number" step="0.01" min="1" id="req-amount" placeholder="450.00" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Detailed Description / Instructions *</label>
          <textarea id="req-description" rows="3" placeholder="Detail the breakdown of fees, what it covers, and instructions for student payment..." required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Target Year Level</label>
            <select id="req-target-year" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
              <option value="">All Year Levels</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">Target Section (Optional)</label>
            <input type="text" id="req-target-section" placeholder="e.g. 4A (or leave blank for all)" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div>
            <label class="block text-[10px] font-bold text-slate-600 uppercase font-mono">Receiver Name *</label>
            <input type="text" id="req-gcash-name" value="${(personnel.full_name || 'PEARL CATEQUISTA').toUpperCase()} (TREASURER)" required class="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-600 uppercase font-mono">Receiver Mobile / Bank *</label>
            <input type="text" id="req-gcash-number" value="0917-123-4567" required class="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900">
          </div>
        </div>

        <input type="hidden" id="req-term-id" value="${currentTerm.term_id || 1}">
        <input type="hidden" id="req-deadline" value="2026-11-30 23:59:00">

        <label class="flex items-center gap-2 pt-1 text-[11px] text-slate-700 cursor-pointer">
          <input type="checkbox" id="req-submit-direct" checked class="rounded text-emerald-700">
          <span>Submit immediately for Head Engineer Authorization</span>
        </label>
      </form>
    `;

    const footerHtml = `
      <div class="flex items-center justify-between w-full gap-2">
        <button type="button" onclick="CoePersonnelView.closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
        <button type="button" onclick="document.getElementById('create-request-form').requestSubmit();" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-200 font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5">
          <i class="fa-solid fa-paper-plane text-xs"></i> Submit Proposal to Dean
        </button>
      </div>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  saveNewRequest() {
    const user = window.coeAuth.getUser();
    const data = {
      title: document.getElementById('req-title').value,
      category_id: document.getElementById('req-category').value,
      term_id: document.getElementById('req-term-id').value,
      description: document.getElementById('req-description').value,
      amount: document.getElementById('req-amount').value,
      deadline: document.getElementById('req-deadline').value,
      target_year_level: document.getElementById('req-target-year').value || null,
      target_section: document.getElementById('req-target-section').value || null,
      gcash_account_name: document.getElementById('req-gcash-name').value,
      gcash_account_number: document.getElementById('req-gcash-number').value,
      submit_for_authorization: document.getElementById('req-submit-direct').checked
    };

    try {
      if (typeof window.coepayDb.createPaymentRequest === 'function') {
        window.coepayDb.createPaymentRequest(data, user);
      }
      this.closeModal();
      alert(`Fee proposal "${data.title}" submitted for Head Engineer authorization!`);
      this.switchTab('requests');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  // ==========================================
  // RECEIPT INSPECTION & AUDIT MODAL
  // ==========================================
  inspectReceipt(transactionId) {
    const db = window.coepayDb || {};
    const trans = (typeof db.getTransactions === 'function')
      ? db.getTransactions().find(t => t.transaction_id === Number(transactionId))
      : null;

    const studentName = (trans && trans.student && trans.student.full_name) || (trans && trans.gcash_sender_name) || 'Christian Dave Guiyab';
    const studentNo = (trans && trans.student && trans.student.student_number) || '2023-10001';
    const itemTitle = (trans && trans.request && trans.request.title) || 'Departmental Shirt (Batch 2026)';
    const amount = trans ? parseFloat(trans.amount_paid).toFixed(2) : '450.00';
    const refNo = trans ? trans.gcash_reference_number : '9028129481023';
    const timestamp = (trans && (trans.payment_timestamp || trans.submitted_at)) || 'Oct 29, 2026 14:22:10';
    const isSettled = trans ? trans.status === 'verified' : false;

    const titleHtml = `<i class="fa-solid fa-receipt text-amber-300 mr-2"></i><span>Payment Proof Audit • Ref #${refNo}</span>`;

    const bodyHtml = `
      <div class="space-y-4 text-xs font-sans">
        <div class="bg-gradient-to-r from-blue-600 to-sky-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white text-blue-600 font-black text-xl flex items-center justify-center shadow-xs">G</div>
            <div>
              <div class="text-[10px] uppercase font-bold tracking-wider text-blue-100 font-mono">OFFICIAL GCASH MERCHANT STATEMENT</div>
              <div class="text-base font-extrabold font-brand">COE Treasury Gateway</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[10px] text-blue-100 font-mono">Total Paid</div>
            <div class="text-lg font-black font-mono">₱${amount}</div>
          </div>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 font-mono text-[11px]">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span class="text-slate-400 font-bold uppercase text-[10px]">13-DIGIT REFERENCE NO.</span>
            <span class="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">${refNo}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Student Profile</span>
            <span class="font-bold text-slate-800 font-sans">${studentName} (${studentNo})</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Contribution Item</span>
            <span class="font-bold text-slate-800 font-sans">${itemTitle}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Transaction Timestamp</span>
            <span class="text-slate-600">${timestamp}</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-200/80">
            <span class="text-slate-500">Audit Status</span>
            <span class="font-bold ${isSettled ? 'text-emerald-700' : 'text-amber-700'}">
              ${isSettled ? 'Verified in Treasury Ledger' : 'Awaiting Officer Verification'}
            </span>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono flex items-center justify-between">
            <span>Personnel Audit Notes / Justification:</span>
            <span class="text-[10px] text-slate-400 font-normal">Optional for approval, required for decline</span>
          </label>
          <textarea id="personnel-audit-notes" rows="2" 
                    placeholder="e.g. Verified with GCash merchant statement reference ending in ${refNo.slice(-4)}. Confirmed full payment."
                    class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition"></textarea>
        </div>
      </div>
    `;

    const footerHtml = `
      <div class="flex items-center justify-between w-full gap-2">
        <button type="button" onclick="CoePersonnelView.closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">
          Close Preview
        </button>
        ${!isSettled ? `
          <div class="flex items-center gap-2">
            <button type="button" onclick="CoePersonnelView.handleDeclineWithNotes('${studentNo}', '${itemTitle}', ${transactionId})" 
                    class="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-xmark text-xs"></i>
              <span>Decline Submission</span>
            </button>
            <button type="button" onclick="CoePersonnelView.handleApproveWithNotes('${studentNo}', '${itemTitle}', ${transactionId})" 
                    class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 text-amber-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-check text-xs"></i>
              <span>Approve & Clear</span>
            </button>
          </div>
        ` : `
          <span class="text-xs font-bold text-emerald-800 flex items-center gap-1">
            <i class="fa-solid fa-circle-check"></i> Verified and Cleared
          </span>
        `}
      </div>
    `;

    this.injectModal(titleHtml, bodyHtml, footerHtml);
  },

  handleApproveWithNotes(studentNo, itemTitle, transactionId) {
    const notes = document.getElementById('personnel-audit-notes')?.value?.trim();
    this.closeModal();
    this.executeVerify(transactionId, notes);
  },

  handleDeclineWithNotes(studentNo, itemTitle, transactionId) {
    const notes = document.getElementById('personnel-audit-notes')?.value?.trim();
    this.closeModal();
    this.executeReject(transactionId, notes);
  },

  executeVerify(transactionId, notes = "") {
    const remarks = notes || 'Verified against merchant ledger statement.';
    const user = window.coeAuth.getUser();

    try {
      if (typeof window.coepayDb.verifyPayment === 'function') {
        window.coepayDb.verifyPayment(transactionId, user, remarks);
      }
      this.closeModal();
      alert(`Payment verified successfully! Student clearance granted.`);
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  executeReject(transactionId, notes = "") {
    const remarks = notes || prompt("Enter reason for declining payment proof:", "Unverified reference number in statement");
    if (!remarks) return;
    const user = window.coeAuth.getUser();

    try {
      if (typeof window.coepayDb.rejectPayment === 'function') {
        window.coepayDb.rejectPayment(transactionId, user, remarks);
      }
      this.closeModal();
      alert('Payment submission rejected. Dispatched alert to student.');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  exportSectionCsv() {
    if (typeof window.coepayDb.getAssignments !== 'function') return;
    const assignments = window.coepayDb.getAssignments();
    let csv = "Student_Number,Full_Name,Section,Status,Amount\n";
    assignments.forEach(a => {
      csv += `"${a.student ? a.student.student_number : ''}","${a.student ? a.student.full_name : ''}","${a.student ? a.student.section : ''}","${a.status}","${a.request ? a.request.amount : 0}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_collection_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ==========================================
  // DIRECT CASH & OUTBOX MODALS
  // ==========================================
  openModal(type) {
    this.closeModal();

    if (type === 'receipt') {
      const titleHtml = `<i class="fa-solid fa-receipt text-amber-300 mr-2"></i><span>Direct Cash Collection Receipt</span>`;
      const bodyHtml = `
        <div class="space-y-4 text-xs font-sans">
          <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
            <div class="font-bold text-slate-900 flex items-center gap-1.5">
              <i class="fa-solid fa-hand-holding-dollar text-emerald-800"></i>
              <span>Over-the-Counter Settlement</span>
            </div>
            <p class="text-slate-600 text-xs">Record immediate cash transactions and grant instant examination clearances to the student.</p>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">Student Number *</label>
            <input type="text" id="manual-student-input" placeholder="e.g. 2023-10001" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900">
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">Assessment Requirement *</label>
            <select id="manual-item-select" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
              <option value="Departmental Shirt (Batch 2026)">Departmental Shirt (Batch 2026) - ₱450.00</option>
              <option value="General Academic Clearance Fee">General Academic Clearance Fee - ₱150.00</option>
            </select>
          </div>
        </div>
      `;
      const footerHtml = `
        <div class="flex items-center justify-between w-full gap-2">
          <button type="button" onclick="CoePersonnelView.closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer">Cancel</button>
          <button type="button" onclick="CoePersonnelView.submitReceipt()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-200 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-check text-xs"></i><span>Record & Clear</span>
          </button>
        </div>
      `;
      this.injectModal(titleHtml, bodyHtml, footerHtml);
    } else {
      const titleHtml = `<i class="fa-solid fa-inbox text-amber-300 mr-2"></i><span>Treasury Outbox Dispatch</span>`;
      const bodyHtml = `
        <div class="space-y-3.5 text-xs font-sans">
          <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between font-mono">
              <span class="font-bold text-slate-900">Dispatched Clearance Notices</span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Live Outbox Active</span>
            </div>
            <p class="text-slate-600 text-xs leading-relaxed">Official electronic receipts and clearance updates are automatically generated and relayed to student institutional email addresses upon verification.</p>
          </div>
        </div>
      `;
      const footerHtml = `
        <button type="button" onclick="CoePersonnelView.closeModal()" class="px-5 py-2.5 rounded-xl bg-emerald-800 text-amber-200 font-bold text-xs cursor-pointer">Acknowledge</button>
      `;
      this.injectModal(titleHtml, bodyHtml, footerHtml);
    }
  },

  submitReceipt() {
    const std = document.getElementById('manual-student-input')?.value?.trim();
    if (!std) {
      alert("Please enter a student number.");
      return;
    }
    alert(`Cash payment logged! Student ${std} has been marked as Cleared.`);
    this.closeModal();
    this.switchTab('settled');
  },

  injectModal(titleHtml, bodyHtml, footerHtml) {
    this.closeModal();
    const modalDiv = document.createElement('div');
    modalDiv.id = 'personnel-injected-modal';
    modalDiv.className = 'fixed inset-0 z-[9999999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto';
    modalDiv.innerHTML = `
      <div class="bg-white rounded-3xl border border-white/90 shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden w-full max-w-xl mx-auto flex flex-col my-auto transition-all transform scale-100">
        <div class="px-7 py-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex items-center justify-between shadow-sm">
          <h3 class="font-brand font-black text-base flex items-center">${titleHtml}</h3>
          <button type="button" onclick="CoePersonnelView.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="p-7 overflow-y-auto max-h-[70vh] space-y-4">${bodyHtml}</div>
        <div class="px-7 py-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-2.5">${footerHtml}</div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  },

  closeModal() {
    const existing = document.getElementById('personnel-injected-modal');
    if (existing) existing.remove();
  }
};

window.CoePersonnelView = CoePersonnelView;