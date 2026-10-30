/**
 * COE-Pay: Main Application Controller
 * Handles global app state, view routing, top navigation bar,
 * modal dialogs, toast notifications, Supabase/MySQL session bridge,
 * and high-fidelity Forest Emerald & Cainta Campus interface.
 */

class CoeApp {
  constructor() {
    this.currentView = 'dashboard';
    this.currentAuthMode = 'supabase_otp';
    this.otpCooldownInterval = null;
    this.resetOtpCooldownInterval = null;
    this.init();
  }

  init() {
    const run = async () => {
      this.bindGlobalEvents();
      await this.checkIncomingSupabaseSession();
      this.renderApp();
      this.bindSupabaseAuthStateListener();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  async checkIncomingSupabaseSession() {
    if (window.CoeSupabaseAuth && window.CoeSupabaseAuth.client && !window.CoeSupabaseAuth.isSandbox) {
      try {
        const { data, error } = await window.CoeSupabaseAuth.client.auth.getSession();
        if (data && data.session && data.session.user) {
          const user = await window.coeAuth.loginWithSupabaseSession(data.session);
          if (user) {
            if (window.location.hash && window.location.hash.includes('access_token')) {
              window.history.replaceState(null, null, window.location.pathname);
            }
          }
        }
      } catch (err) {
        console.warn("[COE-Pay] Supabase incoming session check:", err.message);
      }
    }
  }

  bindSupabaseAuthStateListener() {
    if (window.CoeSupabaseAuth && window.CoeSupabaseAuth.client && !window.CoeSupabaseAuth.isSandbox) {
      try {
        window.CoeSupabaseAuth.client.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session && !window.coeAuth.isLoggedIn()) {
            try {
              const user = await window.coeAuth.loginWithSupabaseSession(session);
              if (user) {
                if (window.location.hash && window.location.hash.includes('access_token')) {
                  window.history.replaceState(null, null, window.location.pathname);
                }
                this.renderApp();
                this.showToast(`Logged in successfully via Supabase Email Link! Welcome, ${user.first_name || user.username}.`, 'success');
              }
            } catch (err) {
              this.showToast(err.message, 'warning');
            }
          }
        });
      } catch (e) {}
    }
  }

  bindGlobalEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    const modalBackdrop = document.getElementById('global-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.closeModal();
        }
      });
    }
  }

  onUserChanged() {
    this.renderApp();
  }

  renderApp() {
    const isAuth = window.coeAuth && typeof window.coeAuth.isLoggedIn === 'function' && window.coeAuth.isLoggedIn();
    const user = isAuth ? window.coeAuth.getUser() : null;
    const profile = isAuth ? window.coeAuth.getProfile() : null;

    const authContainer = document.getElementById('auth-view-container') || document.getElementById('login-view-container');
    const mainAppContainer = document.getElementById('main-app-container');
    const devBanner = document.getElementById('dev-impersonation-banner');

    if (!isAuth) {
      if (devBanner) devBanner.style.display = 'none';
      if (authContainer) authContainer.style.display = 'block';
      this.renderLoginView();
      return;
    }

    if (authContainer) authContainer.style.display = 'none';
    if (mainAppContainer) {
      mainAppContainer.style.display = 'block';
      mainAppContainer.className = "flex-1 w-full relative p-0 m-0 block";
    }

    this.renderTopNav(user, profile);

    const devView = document.getElementById('developer-view-container');
    const adminView = document.getElementById('admin-view-container');
    const personnelView = document.getElementById('personnel-view-container');
    const studentView = document.getElementById('student-view-container');

    [devView, adminView, personnelView, studentView].forEach(v => {
      if (v) {
        v.style.display = 'none';
        v.classList.add('hidden');
        v.classList.remove('block');
      }
    });

    if (user.role === 'developer') {
      if (devView) {
        devView.style.display = 'block';
        devView.classList.remove('hidden');
      }
      const view = window.CoeDeveloperView || (typeof CoeDeveloperView !== 'undefined' ? CoeDeveloperView : null);
      if (view && typeof view.render === 'function') view.render();
    } else if (user.role === 'coordinator' || user.role === 'admin') {
      if (adminView) {
        adminView.style.display = 'block';
        adminView.classList.remove('hidden');
      }
      const view = window.CoeAdminView || (typeof CoeAdminView !== 'undefined' ? CoeAdminView : null);
      if (view && typeof view.render === 'function') view.render();
    } else if (user.role === 'officer' || user.role === 'personnel') {
      if (personnelView) {
        personnelView.style.display = 'block';
        personnelView.classList.remove('hidden');
      }
      const view = window.CoePersonnelView || (typeof CoePersonnelView !== 'undefined' ? CoePersonnelView : null);
      if (view && typeof view.render === 'function') view.render();
    } else {
      if (studentView) {
        studentView.style.display = 'block';
        studentView.classList.remove('hidden');
      }
      const view = window.CoeStudentView || (typeof CoeStudentView !== 'undefined' ? CoeStudentView : null);
      if (view && typeof view.render === 'function') view.render();
    }
  }

  renderTopNav(user, profile) {
    const navRight = document.getElementById('nav-user-controls');
    if (!navRight) return;

    let roleBadge = '';
    if (user.role === 'developer') {
      roleBadge = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300"><i class="fa-solid fa-code"></i> System Developer</span>';
    } else if (user.role === 'coordinator' || user.role === 'admin') {
      roleBadge = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"><i class="fa-solid fa-user-tie"></i> Head Engineer</span>';
    } else if (user.role === 'officer' || user.role === 'personnel') {
      roleBadge = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300"><i class="fa-solid fa-clipboard-user"></i> Officer</span>';
    } else {
      roleBadge = '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300"><i class="fa-solid fa-graduation-cap"></i> Student</span>';
    }

    const isDeveloper = user.role === 'developer';
    const isImpersonating = sessionStorage.getItem('coepay_dev_impersonating') === 'true';

    let switcherHtml = '';
    if (isDeveloper) {
      switcherHtml = `
        <div class="relative">
          <select id="demo-account-select" class="text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 font-semibold text-stone-800 focus:outline-none focus:border-emerald-700 cursor-pointer" onchange="window.coeApp.switchDemoUser(this.value)">
            <optgroup label="Official Roles">
              <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Dave Guiyab (Developer)</option>
              <option value="engr.mendoza" ${user.role === 'coordinator' || user.role === 'admin' ? 'selected' : ''}>Engr. Ivanlee Mendoza (Head)</option>
              <option value="officer" ${user.role === 'officer' || user.username === 'officer' ? 'selected' : ''}>Pearl Catequista (Officer)</option>
              <option value="2023-10001" ${user.username === '2023-10001' ? 'selected' : ''}>Christian Dave Guiyab (Student)</option>
            </optgroup>
            <optgroup label="BSCpE-4A Masterlist">
              <option value="2023-10009" ${user.username === '2023-10009' ? 'selected' : ''}>Jay-are Mesias (Cleared)</option>
              <option value="2023-10003" ${user.username === '2023-10003' ? 'selected' : ''}>Jefferson Sadoguio (Cleared)</option>
              <option value="2023-10004" ${user.username === '2023-10004' ? 'selected' : ''}>Jerome Opana (Pending)</option>
              <option value="2023-10005" ${user.username === '2023-10005' ? 'selected' : ''}>Aaron Mikhael Canonizado (Pending)</option>
              <option value="2023-10006" ${user.username === '2023-10006' ? 'selected' : ''}>John Robin Fernandez (In Progress)</option>
              <option value="2023-10007" ${user.username === '2023-10007' ? 'selected' : ''}>Ma. Sophia Dimasu-ay (Cleared)</option>
              <option value="2023-10008" ${user.username === '2023-10008' ? 'selected' : ''}>Tricia Mae Gonzaga (Unpaid)</option>
            </optgroup>
          </select>
        </div>
      `;
    }

    let resetDbHtml = '';
    if (isDeveloper) {
      resetDbHtml = `
        <button class="px-2.5 py-1.5 rounded-xl border border-stone-300 text-stone-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold transition" title="Reset Database to Seed State" onclick="window.coeApp.confirmResetDb()">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      `;
    }

    navRight.innerHTML = `
      <div class="flex items-center gap-2">
        ${roleBadge}
      </div>

      ${switcherHtml}

      <div class="flex items-center gap-2.5 bg-stone-100 border border-stone-300/80 rounded-xl px-3 py-1.5">
        <div class="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center text-xs font-bold">
          <i class="fa-solid ${user.role === 'developer' ? 'fa-code' : user.role === 'student' ? 'fa-user-graduate' : user.role === 'officer' || user.role === 'personnel' ? 'fa-clipboard-user' : 'fa-user-tie'}"></i>
        </div>
        <div class="text-left hidden sm:block">
          <div class="text-xs font-bold text-stone-800 leading-tight">${profile ? profile.full_name : user.username}</div>
          <div class="text-[10px] text-stone-500 font-medium">${user.email}</div>
        </div>
      </div>

      <button class="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition flex items-center gap-1.5" title="System Email Dispatch Outbox" onclick="window.coeApp.openEmailDispatchDrawer()">
        <i class="fa-solid fa-inbox text-emerald-700"></i>
        <span class="hidden md:inline">Outbox</span>
        <span class="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold dispatched-email-badge">0</span>
      </button>

      <button class="px-3 py-1.5 rounded-xl bg-stone-200 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-bold transition flex items-center gap-1.5" title="Logout" onclick="window.coeAuth.confirmLogout ? window.coeAuth.confirmLogout() : window.coeAuth.logout()">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        <span class="hidden md:inline">Logout</span>
      </button>

      ${resetDbHtml}
    `;

    this.renderDevImpersonationBanner(user, profile, isImpersonating);
    this.updateEmailDispatchBadge();
  }

  renderDevImpersonationBanner(user, profile, isImpersonating) {
    let banner = document.getElementById('dev-impersonation-banner');
    if (!banner) return;

    if (!isImpersonating) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }

    banner.style.display = 'flex';
    banner.className = 'dev-impersonation-banner bg-amber-50 border-b border-amber-300 text-amber-950 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs';
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-user-ninja text-amber-700"></i>
        <span><strong>Developer Impersonation Active:</strong> Testing view as <strong>${profile ? profile.full_name : user.username}</strong> (${user.role.toUpperCase()}).</span>
      </div>
      <div class="flex items-center gap-2">
        <select class="text-xs bg-white border border-amber-300 rounded-lg px-2 py-1 font-semibold text-stone-800" onchange="window.coeApp.switchDemoUser(this.value)">
          <optgroup label="Roles">
            <option value="developer">Dave Guiyab (Developer)</option>
            <option value="engr.mendoza" ${user.role === 'coordinator' || user.role === 'admin' ? 'selected' : ''}>Engr. Ivanlee Mendoza (Coordinator)</option>
            <option value="officer" ${user.role === 'officer' ? 'selected' : ''}>Pearl Catequista (Officer)</option>
            <option value="2023-10001" ${user.username === '2023-10001' ? 'selected' : ''}>Christian Dave Guiyab (Student)</option>
          </optgroup>
          <optgroup label="Students">
            <option value="2023-10009" ${user.username === '2023-10009' ? 'selected' : ''}>Jay-are Mesias</option>
            <option value="2023-10003" ${user.username === '2023-10003' ? 'selected' : ''}>Jefferson Sadoguio</option>
            <option value="2023-10004" ${user.username === '2023-10004' ? 'selected' : ''}>Jerome Opana</option>
            <option value="2023-10005" ${user.username === '2023-10005' ? 'selected' : ''}>Aaron Mikhael Canonizado</option>
            <option value="2023-10006" ${user.username === '2023-10006' ? 'selected' : ''}>John Robin Fernandez</option>
            <option value="2023-10007" ${user.username === '2023-10007' ? 'selected' : ''}>Ma. Sophia Dimasu-ay</option>
            <option value="2023-10008" ${user.username === '2023-10008' ? 'selected' : ''}>Tricia Mae Gonzaga</option>
          </optgroup>
        </select>
        <button class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition" onclick="window.coeApp.returnToDeveloper()">
          <i class="fa-solid fa-rotate-left"></i> Return to Dev
        </button>
      </div>
    `;
  }

  // =========================================================================
  // HIGH-FIDELITY FOREST EMERALD LOGIN VIEW
  // =========================================================================
  // =========================================================================
  // HIGH-FIDELITY FOREST EMERALD LOGIN VIEW (2-COLUMN BALANCED)
  // =========================================================================
  // =========================================================================
  // HIGH-FIDELITY FOREST EMERALD LOGIN VIEW (WITH SUPABASE CLOUD STATUS)
  // =========================================================================
  // =========================================================================
  // HIGH-FIDELITY FOREST EMERALD LOGIN VIEW (CAINTA CAMPUS ASSETS RESTORED)
  // =========================================================================
  // =========================================================================
  // HIGH-FIDELITY FOREST EMERALD LOGIN VIEW (CLEAN TEXT HERO & BACKGROUND)
  // =========================================================================
  renderLoginView() {
    const authContainer = document.getElementById('auth-view-container') || 
                          document.getElementById('login-view-container') || 
                          document.getElementById('main-app-container');
    if (!authContainer) return;

    const sbStatus = (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.getStatus === 'function')
      ? window.CoeSupabaseAuth.getStatus()
      : { isSandbox: true, url: '' };
    const isLiveSupabase = !sbStatus.isSandbox;

    authContainer.className = "relative min-h-[calc(100vh-70px)] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden";

    authContainer.innerHTML = `
      <!-- FULL-SCREEN AMBIENT BLURRED BACKDROP -->
      <div id="portal-backdrop" class="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <img src="assets/img/cainta-campus.jpeg" 
             alt="ICCT Campus Backdrop" 
             class="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.08] blur-[1px] scale-105"
             onerror="if(!this.dataset.r1){this.dataset.r1=1;this.src='assets/cainta-campus.jpeg';}else if(!this.dataset.r2){this.dataset.r2=1;this.src='cainta-campus.jpeg';}">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-emerald-950/60 to-slate-950/85"></div>
      </div>

      <!-- 2-COLUMN BALANCED GATEWAY GRID -->
      <div class="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 my-auto">
        
        <!-- KALIWANG COLUMN: PURE BRANDING HERO TEXT (WALANG INNER PICTURE) -->
        <div class="w-full lg:w-7/12 space-y-5 text-left">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 backdrop-blur-md shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <i class="fa-solid fa-building-columns text-[11px]"></i> ICCT Colleges Cainta Main Campus
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black font-brand tracking-tight text-white leading-[1.12] drop-shadow-xl">
            Institute of <br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">Creative Computer</span> <br>
            Technology
          </h1>

          <p class="text-base sm:text-lg text-emerald-100/90 max-w-xl font-normal leading-relaxed drop-shadow-md">
            Centralized Student Payment Authorization, Collection, and Academic Clearance Gateway.
          </p>

          <div class="pt-2">
            <span class="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-md font-mono">
              COE-Pay Centralized Gateway
            </span>
          </div>
        </div>

        <!-- KANANG COLUMN: AUTH CARD -->
        <div class="w-full lg:w-5/12 max-w-md mx-auto lg:mx-0">
          <div class="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.50)] space-y-4">
            
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-mono">PORTAL ACCESS</span>
                <h2 class="text-xl font-extrabold font-brand text-slate-900 mt-0.5">Sign in to COE-Pay</h2>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${isLiveSupabase ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'} border">
                <span class="w-1.5 h-1.5 rounded-full ${isLiveSupabase ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse"></span>
                ${isLiveSupabase ? 'SUPABASE LIVE' : '2FA SANDBOX'}
              </span>
            </div>

            <!-- Supabase Cloud Status Indicator -->
            <div class="p-2.5 rounded-xl ${isLiveSupabase ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-amber-50/80 border-amber-300 text-amber-950'} border text-xs flex items-center justify-between">
              <span class="flex items-center gap-1.5 font-semibold text-[11px]">
                <i class="fa-solid ${isLiveSupabase ? 'fa-cloud-check text-emerald-700' : 'fa-flask text-amber-700'}"></i>
                <span>${isLiveSupabase ? 'Supabase 2FA Cloud Active' : 'Sandbox Mode (Offline Simulation)'}</span>
              </span>
              <button type="button" class="text-[10px] font-mono text-emerald-800 font-bold hover:underline cursor-pointer" onclick="window.coeApp.openSupabaseConfigModal()">
                Settings
              </button>
            </div>

            <!-- Credentials Form -->
            <form id="login-form" onsubmit="event.preventDefault(); window.coeApp.handleLogin();" class="space-y-3.5">
              <div>
                <label class="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <i class="fa-solid fa-user text-slate-500 text-[10px]"></i>
                  <span>Username, Email, or Student ID *</span>
                </label>
                <div class="relative">
                  <input type="text" id="login-username" required autocomplete="username"
                         placeholder="e.g. 2023-10001, engr.mendoza, or developer"
                         class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition">
                  <i class="fa-solid fa-key text-slate-400 absolute right-3.5 top-3 text-xs"></i>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-lock text-slate-500 text-[10px]"></i>
                    <span>Password *</span>
                  </label>
                  <a href="javascript:void(0)" onclick="window.coeApp.openForgotPasswordModal ? window.coeApp.openForgotPasswordModal() : alert('Contact coordinator for password reset.')" class="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div class="relative">
                  <input type="password" id="login-password" required autocomplete="current-password"
                         placeholder="Enter password (default: password123)"
                         class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition">
                  <button type="button" onclick="window.coeApp.togglePasswordVisibility('login-password', this)" class="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs text-slate-600">
                <i class="fa-solid fa-shield-halved text-emerald-700 text-xs mt-0.5 flex-shrink-0"></i>
                <p class="text-[10px] leading-relaxed">
                  <strong class="text-slate-800 font-bold">Two-Factor Security:</strong> Dispatches 6-digit verification code to registered email address via Supabase Auth.
                </p>
              </div>

              <button type="submit" id="btn-login-submit"
                      class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-sans">
                <span>Sign In with 2-Factor Authentication</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </form>

            <!-- Quick Fill Persona Buttons -->
            <div class="pt-2 border-t border-slate-100 space-y-2">
              <div class="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span class="font-bold uppercase tracking-wider text-slate-600">
                  <i class="fa-solid fa-users text-slate-400"></i> QUICK FILL:
                </span>
                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                  PASS: PASSWORD123
                </span>
              </div>

              <div class="grid grid-cols-4 gap-1.5 text-xs">
                <button type="button" onclick="window.coeApp.fillCredentials('2023-10001', 'password123')" 
                        class="py-1 px-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition text-[10px] flex items-center justify-center gap-1 font-mono cursor-pointer">
                  <i class="fa-solid fa-graduation-cap text-[9px] text-slate-400"></i> Student
                </button>
                <button type="button" onclick="window.coeApp.fillCredentials('engr.mendoza', 'password123')" 
                        class="py-1 px-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition text-[10px] flex items-center justify-center gap-1 font-mono cursor-pointer">
                  <i class="fa-solid fa-user-tie text-[9px] text-slate-400"></i> Coord
                </button>
                <button type="button" onclick="window.coeApp.fillCredentials('officer', 'password123')" 
                        class="py-1 px-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition text-[10px] flex items-center justify-center gap-1 font-mono cursor-pointer">
                  <i class="fa-solid fa-calculator text-[9px] text-slate-400"></i> Officer
                </button>
                <button type="button" onclick="window.coeApp.fillCredentials('developer', 'password123')" 
                        class="py-1 px-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition text-[10px] flex items-center justify-center gap-1 font-mono cursor-pointer">
                  <i class="fa-solid fa-code text-[9px] text-slate-400"></i> Dev
                </button>
              </div>
            </div>

            <!-- Footer Utilities -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span class="hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5" onclick="window.coeApp.openSupabaseConfigModal()">
                <i class="fa-solid fa-sliders text-emerald-700"></i> Cloud Setup
              </span>
              <span class="hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5" onclick="window.coeApp.openEmailDispatchDrawer()">
                <i class="fa-solid fa-inbox text-amber-600"></i> Outbox (<span class="dispatched-email-badge">0</span>)
              </span>
            </div>

          </div>
        </div>

      </div>
    `;

    this.updateEmailDispatchBadge();
  }
  fillCredentials(username, password) {
    const u = document.getElementById('login-username');
    const p = document.getElementById('login-password');
    if (u) u.value = username;
    if (p) p.value = password;
  }

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    }
  }

  async handleLogin() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    const u = usernameInput ? usernameInput.value.trim() : '';
    const p = passwordInput ? passwordInput.value : '';

    if (!u) {
      alert("Please enter your Username, Email, or Student ID.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Validating credentials...`;
    }

    try {
      const otpSession = await window.coeAuth.initiateLogin(u, p);
      this.showOtpModal(otpSession);
      this.updateEmailDispatchBadge();
    } catch (err) {
      alert(err.message || "Login failed. Please check your credentials.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In with 2-Factor Authentication</span> <i class="fa-solid fa-arrow-right text-xs"></i>`;
      }
    }
  }

  showOtpModal(otpSession) {
    this.currentOtpSession = otpSession || {};
    const email = otpSession.email || 'student@icct.edu.ph';
    const user = otpSession.user;
    const displayName = user ? (user.full_name || user.first_name || user.username) : 'Account';
    const roleTag = user && user.role ? user.role.toUpperCase() : 'USER';

    const modalBody = `
      <div class="text-center py-2 space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto text-xl shadow-sm">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        
        <div>
          <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider block font-mono">TWO-FACTOR VERIFICATION</span>
          <h3 class="text-xl font-extrabold font-brand text-slate-900 mt-0.5">Enter 6-Digit OTP</h3>
          <p class="text-xs text-slate-500 mt-1">Dispatched to: <strong class="text-slate-800 font-mono">${email}</strong></p>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs text-left">
          <div class="flex items-center justify-between font-mono">
            <span class="text-slate-400 text-[10px] uppercase font-bold">VERIFYING ACCOUNT:</span>
            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">${roleTag}</span>
          </div>
          <div class="font-bold text-slate-900 text-sm">${displayName}</div>
        </div>

        <form id="otp-verify-form" onsubmit="event.preventDefault(); window.coeApp.submitOtpVerification();" class="space-y-3">
          <div class="grid grid-cols-6 gap-2 max-w-[280px] mx-auto">
            <input type="text" maxlength="1" value="1" class="app-otp-box text-center font-mono font-black text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none transition">
            <input type="text" maxlength="1" value="2" class="app-otp-box text-center font-mono font-black text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none transition">
            <input type="text" maxlength="1" value="3" class="app-otp-box text-center font-mono font-black text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none transition">
            <input type="text" maxlength="1" value="4" class="app-otp-box text-center font-mono font-black text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none transition">
            <input type="text" maxlength="1" value="5" class="app-otp-box text-center font-mono font-black text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none transition">
            <input type="text" maxlength="1" value="6" class="app-otp-box text-center font-mono font-black text-lg py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:outline-none transition">
          </div>
          <div id="otp-error-alert" class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs hidden"></div>
        </form>

        <div class="text-[11px] text-slate-500 font-mono">
          <span>Didn't receive the code? </span>
          <button type="button" id="btn-resend-otp" class="font-bold text-emerald-700 hover:underline cursor-pointer" onclick="window.coeApp.handleResendOtp()">Resend OTP</button>
          <span id="otp-cooldown-text" class="text-slate-400"> (60s)</span>
        </div>
      </div>
    `;

    const footer = `
      <div class="flex items-center justify-between w-full">
        <button class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs cursor-pointer transition" onclick="window.coeApp.closeModal()">
          Back
        </button>
        <button id="btn-submit-otp" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 text-amber-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer font-sans" onclick="window.coeApp.submitOtpVerification()">
          <i class="fa-solid fa-shield-check text-xs"></i>
          <span>Verify OTP & Enter Gateway</span>
        </button>
      </div>
    `;

    this.showModal('Two-Factor Verification', modalBody, footer);
    this.bindOtpBoxListeners();
    this.startOtpCooldownTimer(60);
  }

  bindOtpBoxListeners() {
    const boxes = document.querySelectorAll('.app-otp-box');
    boxes.forEach(box => {
      box.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && e.target.nextElementSibling) {
          e.target.nextElementSibling.focus();
        }
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && e.target.previousElementSibling) {
          e.target.previousElementSibling.focus();
        }
      });
    });
  }

  startOtpCooldownTimer(seconds = 60) {
    if (this.otpCooldownInterval) clearInterval(this.otpCooldownInterval);
    let remaining = seconds;
    const txt = document.getElementById('otp-cooldown-text');
    const btn = document.getElementById('btn-resend-otp');

    if (btn) btn.disabled = true;
    this.otpCooldownInterval = setInterval(() => {
      remaining -= 1;
      if (txt) txt.innerText = remaining > 0 ? ` (${remaining}s)` : '';
      if (remaining <= 0) {
        clearInterval(this.otpCooldownInterval);
        if (btn) btn.disabled = false;
      }
    }, 1000);
  }

  async submitOtpVerification() {
    const boxes = document.querySelectorAll('.app-otp-box');
    const entered = Array.from(boxes).map(b => b.value).join('');
    const submitBtn = document.getElementById('btn-submit-otp');
    const errAlert = document.getElementById('otp-error-alert');

    if (!entered || entered.length < 6) {
      if (errAlert) {
        errAlert.innerText = 'Please enter all 6 digits of the OTP code.';
        errAlert.classList.remove('hidden');
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
    }

    try {
      let user = null;
      if (window.coeAuth && typeof window.coeAuth.verify2faLogin === 'function') {
        user = await window.coeAuth.verify2faLogin(entered);
      } else {
        user = window.coeAuth.loginWithUsername(this.currentOtpSession?.user?.username || 'developer');
      }
      this.closeModal();
      this.showToast(`Welcome to COE-Pay Gateway, ${user.full_name || user.username}!`, 'success');
      this.renderApp();
    } catch (err) {
      if (errAlert) {
        errAlert.innerText = err.message || 'OTP verification failed.';
        errAlert.classList.remove('hidden');
      } else {
        alert(err.message);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-shield-check text-xs"></i> <span>Verify OTP & Enter Gateway</span>`;
      }
    }
  }

  async handleResendOtp() {
    try {
      const res = await window.coeAuth.resendOtp();
      this.showToast(`New verification code dispatched to ${res.email}`, 'info');
      this.startOtpCooldownTimer(60);
      this.updateEmailDispatchBadge();
    } catch (err) {
      alert(err.message);
    }
  }

  // ==========================================
  // CLOUD CONFIG & EMAIL OUTBOX CONTROLLER
  // ==========================================
  openSupabaseConfigModal() {
    const sb = window.CoeSupabaseAuth;
    const currentUrl = (sb && sb.config && sb.config.url && !sb.config.url.includes('your-project-id')) ? sb.config.url : '';
    const currentKey = (sb && sb.config && sb.config.anonKey && !sb.config.anonKey.includes('placeholder')) ? sb.config.anonKey : '';
    const isConnected = sb && !sb.isSandbox;

    const modalBody = `
      <div class="py-2 space-y-4">
        <div class="text-center">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto mb-2 text-xl shadow-sm">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h4 class="font-brand text-lg font-bold text-slate-900">Supabase Auth Settings</h4>
          <p class="text-slate-600 text-xs mt-1 max-w-sm mx-auto">
            Connect COE-Pay to your live Supabase project to dispatch real 6-digit OTP codes.
          </p>
        </div>

        <div class="p-3 rounded-xl ${isConnected ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-amber-50 border border-amber-300 text-amber-950'} text-xs">
          <div class="font-bold flex items-center gap-1.5">
            <i class="fa-solid ${isConnected ? 'fa-circle-check text-emerald-700' : 'fa-triangle-exclamation text-amber-600'}"></i>
            <span>${isConnected ? 'Connected to Live Supabase Cloud' : 'Running Offline Sandbox Simulation'}</span>
          </div>
          <div class="text-[11px] mt-1 text-slate-600">
            ${isConnected ? `Connected URL: <code>${currentUrl}</code>` : 'Simulating locally with pre-filled OTP codes.'}
          </div>
        </div>

        <form id="supabase-config-form" onsubmit="event.preventDefault(); window.coeApp.saveSupabaseConfig();" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Supabase Project URL *</label>
            <input type="url" id="sb-input-url" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-700 font-mono"
                   placeholder="https://your-project-id.supabase.co" value="${currentUrl}" required>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Supabase Anon Public Key *</label>
            <textarea id="sb-input-anon-key" rows="2" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-700 font-mono"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." required>${currentKey}</textarea>
          </div>
        </form>
      </div>
    `;

    const footer = `
      <div class="flex items-center justify-end gap-2.5 w-full">
        <button class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition" onclick="window.coeApp.resetSupabaseConfigToSandbox()">
          Use Sandbox
        </button>
        <button class="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer" onclick="window.coeApp.saveSupabaseConfig()">
          <i class="fa-solid fa-cloud-arrow-up text-[11px]"></i>
          <span>Save & Connect</span>
        </button>
      </div>
    `;

    this.showModal('Supabase Setup', modalBody, footer);
  }

  saveSupabaseConfig() {
    const url = document.getElementById('sb-input-url')?.value?.trim();
    const key = document.getElementById('sb-input-anon-key')?.value?.trim();

    if (!url || !key) {
      alert("Please enter both the Supabase Project URL and Anon Public Key.");
      return;
    }

    if (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.updateConfig === 'function') {
      window.CoeSupabaseAuth.updateConfig(url, key);
      this.closeModal();
      this.showToast("Supabase project settings saved!", "success");
    }
  }

  resetSupabaseConfigToSandbox() {
    if (confirm("Switch back to offline sandbox mode?")) {
      if (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.resetToSandbox === 'function') {
        window.CoeSupabaseAuth.resetToSandbox();
        this.closeModal();
        this.showToast("Switched back to Sandbox Mode.", "info");
      }
    }
  }

  openForgotPasswordModal() {
    const modalBody = `
      <div class="py-2 space-y-4">
        <div class="text-center">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center mx-auto mb-2 text-xl shadow-sm">
            <i class="fa-solid fa-key"></i>
          </div>
          <h4 class="font-brand text-lg font-bold text-slate-900">Password Recovery</h4>
          <p class="text-slate-600 text-xs mt-1 max-w-sm mx-auto">
            Input your registered email to receive a recovery code.
          </p>
        </div>

        <form id="forgot-password-form" onsubmit="event.preventDefault(); window.coeApp.submitForgotPassword();" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Registered Student Email *</label>
            <input type="email" id="forgot-email-input" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-700 font-mono"
                   placeholder="e.g. sdimasuay13@gmail.com" required autofocus>
          </div>
        </form>
      </div>
    `;

    const footer = `
      <div class="flex items-center justify-end gap-2.5 w-full">
        <button class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition" onclick="window.coeApp.closeModal()">
          Cancel
        </button>
        <button class="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer" onclick="window.coeApp.submitForgotPassword()">
          <i class="fa-solid fa-paper-plane text-[11px]"></i>
          <span>Send Code</span>
        </button>
      </div>
    `;

    this.showModal('Forgot Password', modalBody, footer);
  }

  submitForgotPassword() {
    const email = document.getElementById('forgot-email-input')?.value;
    if (!email) return;
    this.closeModal();
    this.showToast(`Recovery code dispatched to ${email}`, 'success');
  }

  updateEmailDispatchBadge() {
    const emails = (window.coepayDb && typeof window.coepayDb.getDispatchedEmails === 'function') 
      ? window.coepayDb.getDispatchedEmails() 
      : [];
    document.querySelectorAll('.dispatched-email-badge').forEach(el => {
      el.textContent = emails.length;
    });
  }

  openEmailDispatchDrawer() {
    const emails = (window.coepayDb && typeof window.coepayDb.getDispatchedEmails === 'function')
      ? window.coepayDb.getDispatchedEmails()
      : [];

    const emailRowsHtml = emails.length === 0 ? `
      <div class="text-center py-6 text-slate-400">
        <i class="fa-regular fa-envelope-open text-3xl"></i>
        <p class="text-xs mt-2">No system emails dispatched yet.</p>
      </div>
    ` : emails.map(m => `
      <div class="p-3 bg-white border border-slate-200 rounded-xl mb-2.5">
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="text-xs font-bold text-slate-800">${m.subject}</span>
          <span class="text-[10px] text-slate-400 font-mono">${m.dispatched_at}</span>
        </div>
        <div class="text-[11px] text-slate-600 mb-2">
          <strong>To:</strong> ${m.recipient_name} &lt;${m.recipient_email}&gt;
        </div>
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-28 overflow-y-auto">${m.body_text}</div>
      </div>
    `).join('');

    const modalBody = `
      <div class="max-h-[500px] overflow-y-auto space-y-2">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <p class="text-xs text-slate-600 mb-0">Total: <strong>${emails.length}</strong> transmissions</p>
          <button class="text-xs text-emerald-800 font-bold hover:underline cursor-pointer" onclick="window.coeApp.openEmailDispatchDrawer()">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
        ${emailRowsHtml}
      </div>
    `;

    const footer = `
      <button class="px-4 py-2 rounded-xl bg-emerald-800 text-amber-200 font-bold text-xs cursor-pointer" onclick="window.coeApp.closeModal()">Close Outbox</button>
    `;

    this.showModal('COE-Pay System Mail Outbox', modalBody, footer);
  }

  switchDemoUser(username) {
    sessionStorage.setItem('coepay_dev_impersonating', 'true');
    window.coeAuth.loginWithUsername(username, true);
    this.showToast(`Switched view to ${username}`, 'info');
    this.renderApp();
  }

  returnToDeveloper() {
    sessionStorage.removeItem('coepay_dev_impersonating');
    window.coeAuth.loginWithUsername('developer', true);
    this.showToast('Returned to Developer Console', 'success');
    this.renderApp();
  }

  confirmResetDb() {
    if (confirm("Reset COE-Pay database to its initial seed state?")) {
      if (window.coepayDb && typeof window.coepayDb.resetToSeed === 'function') {
        window.coepayDb.resetToSeed();
      }
      sessionStorage.removeItem('coepay_dev_impersonating');
      window.coeAuth.loginWithUsername('developer', false);
      this.showToast("Database restored to default seed.", "info");
      this.renderApp();
    }
  }

  // ==========================================
  // DIRECT INJECTION MODAL ENGINE
  // ==========================================
  showModal(title, bodyHtml, footerHtml = null) {
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.id = 'active-app-modal-overlay';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in';

    overlay.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100 max-h-[90vh]">
        <div class="px-6 py-4 bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <h3 class="font-bold font-brand text-base flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>${title}</span>
          </h3>
          <button type="button" onclick="window.coeApp.closeModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="p-6 overflow-y-auto space-y-4 text-slate-800 text-xs">
          ${bodyHtml}
        </div>
        ${footerHtml ? `
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          ${footerHtml}
        </div>` : ''}
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (this.otpCooldownInterval) {
      clearInterval(this.otpCooldownInterval);
      this.otpCooldownInterval = null;
    }
    const existing = document.getElementById('active-app-modal-overlay');
    if (existing) existing.remove();
    document.body.style.overflow = '';
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const borderCol = type === 'success' ? 'border-emerald-600 text-emerald-950' : type === 'warning' ? 'border-amber-500 text-amber-950' : 'border-slate-800 text-slate-900';
    toast.className = `p-3.5 bg-white border-l-4 ${borderCol} rounded-xl shadow-lg border border-slate-200 text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0`;

    let icon = 'fa-circle-info text-emerald-800';
    if (type === 'success') icon = 'fa-circle-check text-emerald-600';
    if (type === 'warning') icon = 'fa-triangle-exclamation text-amber-600';
    if (type === 'danger') icon = 'fa-circle-xmark text-rose-600';

    toast.innerHTML = `
      <i class="fa-solid ${icon} text-sm"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global App Instance
window.coeApp = new CoeApp();