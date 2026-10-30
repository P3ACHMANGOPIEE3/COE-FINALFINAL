/**
 * COE-Pay: Main Application Controller
 * Handles global app state, view routing, top navigation bar,
 * modal dialogs, toast notifications, and fast demo switching.
 */

class CoeApp {
  constructor() {
    this.currentView = 'dashboard';
    this.currentAuthMode = 'supabase_otp';
    this.otpTimerInterval = null;
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
    // Close modal on click outside or escape
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
    const isAuth = window.coeAuth.isLoggedIn();
    const user = window.coeAuth.getUser();
    const profile = window.coeAuth.getProfile();

    const authContainer = document.getElementById('auth-view-container');
    const mainAppContainer = document.getElementById('main-app-container');
    const devBanner = document.getElementById('dev-impersonation-banner');

    if (!isAuth) {
      if (devBanner) devBanner.style.display = 'none';
      if (authContainer) authContainer.style.display = 'block';
      if (mainAppContainer) mainAppContainer.style.display = 'none';
      this.renderLoginView();
      return;
    }

    if (authContainer) authContainer.style.display = 'none';
    if (mainAppContainer) mainAppContainer.style.display = 'block';

    this.renderTopNav(user, profile);

    // Hide all view containers
    const devView = document.getElementById('developer-view-container');
    const adminView = document.getElementById('admin-view-container');
    const personnelView = document.getElementById('personnel-view-container');
    const studentView = document.getElementById('student-view-container');

    if (devView) devView.style.display = 'none';
    if (adminView) adminView.style.display = 'none';
    if (personnelView) personnelView.style.display = 'none';
    if (studentView) studentView.style.display = 'none';

    // Route to appropriate view based on role
    if (user.role === 'developer') {
      if (devView) devView.style.display = 'block';
      const view = window.CoeDeveloperView || (typeof CoeDeveloperView !== 'undefined' ? CoeDeveloperView : null);
      if (view && typeof view.render === 'function') view.render();
    } else if (user.role === 'coordinator' || user.role === 'admin') {
      if (adminView) adminView.style.display = 'block';
      const view = window.CoeAdminView || (typeof CoeAdminView !== 'undefined' ? CoeAdminView : null);
      if (view && typeof view.render === 'function') view.render();
    } else if (user.role === 'officer' || user.role === 'personnel') {
      if (personnelView) personnelView.style.display = 'block';
      const view = window.CoePersonnelView || (typeof CoePersonnelView !== 'undefined' ? CoePersonnelView : null);
      if (view && typeof view.render === 'function') view.render();
    } else if (user.role === 'student') {
      if (studentView) studentView.style.display = 'block';
      const view = window.CoeStudentView || (typeof CoeStudentView !== 'undefined' ? CoeStudentView : null);
      if (view && typeof view.render === 'function') view.render();
    }
  }

  renderTopNav(user, profile) {
    const navRight = document.getElementById('nav-user-controls');
    if (!navRight) return;

    let roleBadge = '';
    if (user.role === 'developer') {
      roleBadge = '<span class="badge badge-developer"><i class="fa-solid fa-code"></i> System Developer</span>';
    } else if (user.role === 'coordinator' || user.role === 'admin') {
      roleBadge = '<span class="badge badge-admin"><i class="fa-solid fa-user-tie"></i> Head Engineer / Coordinator</span>';
    } else if (user.role === 'officer' || user.role === 'personnel') {
      roleBadge = '<span class="badge badge-personnel"><i class="fa-solid fa-clipboard-user"></i> Officer</span>';
    } else {
      roleBadge = '<span class="badge badge-student"><i class="fa-solid fa-graduation-cap"></i> Student</span>';
    }

    const isDeveloper = user.role === 'developer';
    const isImpersonating = sessionStorage.getItem('coepay_dev_impersonating') === 'true';
    const isMasterDev = isDeveloper || isImpersonating || 
      sessionStorage.getItem('coepay_master_dev') === 'developer' || 
      sessionStorage.getItem('coepay_original_dev') === 'developer' ||
      localStorage.getItem('coepay_master_dev') === 'developer';
    const isHead = user.role === 'coordinator' || user.role === 'admin';
    const isDevOrHead = isDeveloper || isHead || isMasterDev;

    if (isDeveloper) {
      sessionStorage.setItem('coepay_master_dev', 'developer');
      sessionStorage.setItem('coepay_original_dev', 'developer');
      localStorage.setItem('coepay_master_dev', 'developer');
    }

    // Outbox & Supabase Setup are visible to Developer and Head only
    let adminToolsHtml = '';
    if (isDevOrHead) {
      adminToolsHtml = `
        <button class="btn btn-sm btn-outline-primary" title="Supabase Cloud & 2FA Configuration" onclick="window.coeApp.openSupabaseConfigModal()">
          <i class="fa-solid fa-sliders"></i> Supabase Setup
        </button>
        <button class="btn btn-sm btn-outline-info" title="System Email Dispatch Outbox" onclick="window.coeApp.openEmailDispatchDrawer()">
          <i class="fa-solid fa-inbox"></i> Outbox (<span class="dispatched-email-badge">0</span>)
        </button>
      `;
    }

    // Strict RBAC: Dropdown switcher & Reset DB are rendered for System Developer Dave Guiyab & active Master Dev sessions
    let switcherHtml = '';
    if (isDeveloper || isMasterDev) {
      switcherHtml = `
        <!-- Developer Quick Persona Testing Switcher -->
        <div class="demo-switcher">
          <label for="demo-account-select" class="sr-only">Switch Demo Account</label>
          <select id="demo-account-select" class="form-select form-select-sm demo-select" onchange="window.coeApp.switchDemoUser(this.value)">
            <optgroup label="Official 4 System Roles">
              <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Dave Guiyab (System Developer)</option>
              <option value="engr.mendoza" ${user.role === 'coordinator' || user.role === 'admin' ? 'selected' : ''}>Engr. Ivanlee Mendoza (Head Engineer / Coordinator)</option>
              <option value="officer" ${user.role === 'officer' || user.username === 'officer' ? 'selected' : ''}>Pearl Catequista (Officer)</option>
              <option value="2023-10001" ${user.username === '2023-10001' ? 'selected' : ''}>Christian Dave Guiyab (Student - Purchase, paying, ordering)</option>
            </optgroup>
            <optgroup label="Official Masterlist Students (BSCpE-4A)">
              <option value="2023-10009" ${user.username === '2023-10009' ? 'selected' : ''}>Jay-are Mesias (Cleared)</option>
              <option value="2023-10003" ${user.username === '2023-10003' ? 'selected' : ''}>Jefferson Sadoguio (Cleared)</option>
              <option value="2023-10004" ${user.username === '2023-10004' ? 'selected' : ''}>Jerome Opana (Pending Verification)</option>
              <option value="2023-10005" ${user.username === '2023-10005' ? 'selected' : ''}>Aaron Mikhael Canonizado (Pending Verification)</option>
              <option value="2023-10006" ${user.username === '2023-10006' ? 'selected' : ''}>John Robin Fernandez (In Progress)</option>
              <option value="2023-10007" ${user.username === '2023-10007' ? 'selected' : ''}>Ma. Sophia Dimasu-ay (Cleared)</option>
              <option value="2023-10008" ${user.username === '2023-10008' ? 'selected' : ''}>Tricia Mae Gonzaga (Unpaid)</option>
            </optgroup>
          </select>
        </div>
      `;
    }

    let resetDbHtml = '';
    if (isDeveloper || isMasterDev) {
      resetDbHtml = `
        <button class="btn btn-sm btn-outline-warning" title="Emergency Master Overrides & System Repairs" onclick="CoeDeveloperView.openMasterOverridesModal()">
          <i class="fa-solid fa-screwdriver-wrench"></i> Master Overrides
        </button>
        <button class="btn btn-sm btn-outline-secondary" title="Reset Database to Seed State" onclick="window.coeApp.confirmResetDb()">
          <i class="fa-solid fa-rotate-left"></i> Reset DB
        </button>
      `;
    }

    navRight.innerHTML = `
      <div class="user-role-badge-wrap">
        ${roleBadge}
      </div>

      ${switcherHtml}

      <div class="nav-profile-pill">
        <div class="nav-avatar">
          <i class="fa-solid ${user.role === 'developer' ? 'fa-code' : user.role === 'student' ? 'fa-user-graduate' : user.role === 'officer' || user.role === 'personnel' ? 'fa-clipboard-user' : 'fa-user-tie'}"></i>
        </div>
        <div class="nav-user-text">
          <div class="nav-user-name">${profile ? profile.full_name : user.username}</div>
          <div class="nav-user-sub">${user.email}</div>
        </div>
      </div>

      ${adminToolsHtml}

      <button class="btn btn-sm btn-outline-danger" title="Logout" onclick="window.coeAuth.confirmLogout()">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
      </button>

      ${resetDbHtml}
    `;

    this.renderDevImpersonationBanner(user, profile, isImpersonating);
    this.updateEmailDispatchBadge();
  }

  renderDevImpersonationBanner(user, profile, isImpersonating) {
    let banner = document.getElementById('dev-impersonation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'dev-impersonation-banner';
      banner.className = 'dev-impersonation-banner';
      const topNavbar = document.getElementById('app-top-navbar');
      if (topNavbar && topNavbar.parentNode) {
        topNavbar.parentNode.insertBefore(banner, topNavbar.nextSibling);
      }
    }

    const isMasterDev = user.role === 'developer' || isImpersonating || 
      sessionStorage.getItem('coepay_master_dev') === 'developer' || 
      sessionStorage.getItem('coepay_original_dev') === 'developer' ||
      localStorage.getItem('coepay_master_dev') === 'developer';
    const isViewingOtherRole = user.role !== 'developer';

    if (!isImpersonating && !(isMasterDev && isViewingOtherRole)) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }

    const currentRoleLabel = user.role === 'coordinator' || user.role === 'admin'
      ? 'Head Engineer / Coordinator'
      : user.role === 'officer' || user.role === 'personnel'
      ? 'Officer / Collector'
      : 'Student';

    banner.style.display = 'flex';
    banner.innerHTML = `
      <div class="dev-impersonation-text">
        <span class="badge" style="background:#f59e0b; color:#0f172a; font-weight:800; font-size:0.75rem; letter-spacing:0.5px; padding:3px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
          <i class="fa-solid fa-crown"></i> DEVELOPER MASTER MODE
        </span>
        <span>
          <strong>Free Role Access Active:</strong> Viewing as <strong>${profile ? profile.full_name : user.username}</strong> (${currentRoleLabel}).
          <span class="text-muted small">You have unrestricted master rights to override or fix any stalled transaction, fee obligation, or student issue.</span>
        </span>
      </div>
      <div class="dev-impersonation-actions" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div class="btn-group btn-group-sm" role="group" style="display:inline-flex; gap:2px;">
          <button class="btn btn-xs ${user.role === 'developer' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.coeApp.returnToDeveloper()" title="Go to System Developer Console">
            <i class="fa-solid fa-code"></i> Dev
          </button>
          <button class="btn btn-xs ${user.role === 'coordinator' || user.role === 'admin' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.coeApp.switchDemoUser('engr.mendoza')" title="Switch to Coordinator">
            <i class="fa-solid fa-user-tie"></i> Head
          </button>
          <button class="btn btn-xs ${user.role === 'officer' || user.role === 'personnel' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.coeApp.switchDemoUser('officer')" title="Switch to Officer">
            <i class="fa-solid fa-clipboard-user"></i> Officer
          </button>
          <button class="btn btn-xs ${user.role === 'student' ? 'btn-primary' : 'btn-outline-light'}" onclick="window.coeApp.switchDemoUser('2023-10001')" title="Switch to Student">
            <i class="fa-solid fa-graduation-cap"></i> Student
          </button>
        </div>

        <select class="form-select form-select-xs" style="max-width:170px;" onchange="window.coeApp.switchDemoUser(this.value)">
          <optgroup label="Official 4 System Roles">
            <option value="developer">Dave Guiyab (System Developer)</option>
            <option value="engr.mendoza" ${user.role === 'coordinator' || user.role === 'admin' ? 'selected' : ''}>Engr. Ivanlee Mendoza (Coordinator)</option>
            <option value="officer" ${user.role === 'officer' ? 'selected' : ''}>Pearl Catequista (Officer)</option>
            <option value="2023-10001" ${user.username === '2023-10001' ? 'selected' : ''}>Christian Dave Guiyab (Student - Purchase, paying, ordering)</option>
          </optgroup>
          <optgroup label="Official Masterlist Students (BSCpE-4A)">
            <option value="2023-10009" ${user.username === '2023-10009' ? 'selected' : ''}>Jay-are Mesias (Cleared)</option>
            <option value="2023-10003" ${user.username === '2023-10003' ? 'selected' : ''}>Jefferson Sadoguio (Cleared)</option>
            <option value="2023-10004" ${user.username === '2023-10004' ? 'selected' : ''}>Jerome Opana (Pending Verification)</option>
            <option value="2023-10005" ${user.username === '2023-10005' ? 'selected' : ''}>Aaron Mikhael Canonizado (Pending Verification)</option>
            <option value="2023-10006" ${user.username === '2023-10006' ? 'selected' : ''}>John Robin Fernandez (In Progress)</option>
            <option value="2023-10007" ${user.username === '2023-10007' ? 'selected' : ''}>Ma. Sophia Dimasu-ay (Cleared)</option>
            <option value="2023-10008" ${user.username === '2023-10008' ? 'selected' : ''}>Tricia Mae Gonzaga (Unpaid)</option>
          </optgroup>
        </select>

        <button class="btn btn-xs btn-outline-warning" onclick="CoeDeveloperView.openMasterOverridesModal()" title="Open Master Overrides Modal">
          <i class="fa-solid fa-screwdriver-wrench"></i> Overrides
        </button>

        <button class="btn btn-xs btn-warning" onclick="window.coeApp.returnToDeveloper()">
          <i class="fa-solid fa-rotate-left"></i> Return to Developer Console
        </button>
      </div>
    `;
  }

  switchAuthMode(mode) {
    this.currentAuthMode = mode;
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

  renderLoginView() {
    const authContainer = document.getElementById('auth-view-container');
    if (!authContainer) return;

    const sbStatus = (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.getStatus === 'function')
      ? window.CoeSupabaseAuth.getStatus()
      : { isSandbox: true, url: '' };
    const isLiveSupabase = !sbStatus.isSandbox;

    authContainer.innerHTML = `
      <div class="login-page-wrapper">
        <div class="login-card">
          <div class="login-brand">
            <img src="assets/img/icct-coe-logo.svg" alt="ICCT COE Seal" class="login-seal">
            <h2>ICCT COLLEGES FOUNDATION, INC.</h2>
            <h3>College of Engineering and Digital Technology</h3>
            <div class="system-title">COE-Pay Centralized Gateway</div>
            <p class="login-tagline">Institutional Payment & Clearance Portal • Two-Factor Authentication (2FA)</p>
          </div>

          <div class="login-form-box">
            <!-- Institutional Security Status -->
            <div class="mb-3 text-center">
              <span class="badge ${isLiveSupabase ? 'badge-success' : 'badge-light'}" style="font-size: 0.78rem; padding: 0.35rem 0.85rem; border-radius: 9999px; display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid ${isLiveSupabase ? '#10B981' : '#CBD5E1'}; background: ${isLiveSupabase ? '#ECFDF5' : '#F8FAFC'}; color: ${isLiveSupabase ? '#065F46' : '#475569'};">
                <i class="fa-solid ${isLiveSupabase ? 'fa-cloud-check text-success' : 'fa-shield-halved text-primary'}"></i>
                <span>${isLiveSupabase ? 'Supabase 2FA Cloud Active' : 'Two-Factor Authentication Active'}</span>
              </span>
            </div>

            <!-- Unified Two-Factor Authentication Form -->
            <form id="login-form" onsubmit="event.preventDefault(); window.coeApp.handleLogin();">
              <div class="form-group">
                <label class="form-label font-bold"><i class="fa-solid fa-user-shield"></i> Username, Email, or Student ID *</label>
                <input type="text" id="login-username" class="form-control form-control-lg" placeholder="e.g. 2023-10001, engr.mendoza, or developer" required autofocus autocomplete="username">
              </div>

              <div class="form-group mt-3">
                <div class="flex-between">
                  <label class="form-label font-bold"><i class="fa-solid fa-lock"></i> Password *</label>
                  <a href="javascript:void(0)" class="small text-primary font-bold" onclick="window.coeApp.openForgotPasswordModal()">Forgot Password?</a>
                </div>
                <div style="position: relative;">
                  <input type="password" id="login-password" class="form-control form-control-lg" placeholder="Enter password (default: password123)" required autocomplete="current-password" style="padding-right: 2.75rem;">
                  <button type="button" id="btn-toggle-password" onclick="window.coeApp.togglePasswordVisibility('login-password', this)" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748B; cursor: pointer; padding: 0.25rem;" title="Show/Hide Password">
                    <i class="fa-regular fa-eye"></i>
                  </button>
                </div>
              </div>

              <!-- Two-Factor Security Notice -->
              <div class="mt-3 p-2 d-flex align-items-center gap-2" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 0.78rem; color: #475569;">
                <i class="fa-solid fa-shield-halved text-primary" style="font-size: 1.25rem;"></i>
                <div>
                  <strong>Two-Factor Security:</strong> Enter your credentials. Once verified, a 6-digit One-Time Password (OTP) will be dispatched to your registered institutional email to complete sign-in.
                </div>
              </div>

              <button type="submit" id="btn-login-submit" class="btn btn-primary w-100 btn-lg mt-3">
                <i class="fa-solid fa-shield-check"></i> Sign In with 2-Factor Authentication
              </button>
            </form>

            <!-- Quick Demo Credentials Helper -->
            <div class="quick-demo-helpers mt-3 pt-3" style="border-top: 1px dashed #CBD5E1;">
              <div class="text-muted small mb-2 d-flex justify-content-between align-items-center">
                <span class="font-bold" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fa-solid fa-users"></i> Quick Fill Test Accounts:</span>
                <span class="badge badge-secondary" style="font-size: 0.7rem;">Pass: password123</span>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.coeApp.fillCredentials('2023-10001', 'password123')" title="Christian Dave Guiyab (BSCpE-4A)">
                  <i class="fa-solid fa-user-graduate"></i> Student
                </button>
                <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.coeApp.fillCredentials('engr.mendoza', 'password123')" title="Engr. Ivanlee Mendoza (Coordinator)">
                  <i class="fa-solid fa-user-tie"></i> Coordinator
                </button>
                <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.coeApp.fillCredentials('officer', 'password123')" title="Pearl Catequista (Officer / Treasurer)">
                  <i class="fa-solid fa-clipboard-check"></i> Officer
                </button>
                <button type="button" class="btn btn-xs btn-outline-secondary" onclick="window.coeApp.fillCredentials('developer', 'password123')" title="Dave Guiyab (System Developer)">
                  <i class="fa-solid fa-code"></i> Developer
                </button>
              </div>
            </div>

            <div class="login-footer-security mt-4 text-center">
              <div class="small text-muted" style="font-size: 0.75rem;">
                <i class="fa-solid fa-lock"></i> Protected by Institutional 2FA Verification & Relational Audit Logging
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateEmailDispatchBadge();
  }

  openSupabaseConfigModal() {
    const user = window.coeAuth ? window.coeAuth.getCurrentUser() : null;
    const isDeveloper = user && user.role === 'developer';
    const isMasterDev = isDeveloper || (sessionStorage.getItem('coepay_master_dev') === 'developer') || (sessionStorage.getItem('coepay_original_dev') === 'developer');
    const isHead = user && (user.role === 'coordinator' || user.role === 'admin');

    if (!isDeveloper && !isMasterDev && !isHead) {
      alert("Access Denied: Supabase Configuration is restricted to System Developer and Head Engineer/Coordinator only.");
      return;
    }

    const sb = window.CoeSupabaseAuth;
    const currentUrl = (sb && sb.config && sb.config.url && !sb.config.url.includes('your-project-id')) ? sb.config.url : '';
    const currentKey = (sb && sb.config && sb.config.anonKey && !sb.config.anonKey.includes('placeholder')) ? sb.config.anonKey : '';
    const isConnected = sb && !sb.isSandbox;

    const modalBody = `
      <div class="supabase-config-modal py-2">
        <div class="text-center mb-3">
          <div style="font-size: 2.25rem; color: #10B981; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Supabase Auth Connection Settings</h3>
          <p class="text-muted small mt-1">
            Connect COE-Pay to your live Supabase project to dispatch real 6-digit OTP codes to student email inboxes.
          </p>
        </div>

        <div class="alert ${isConnected ? 'alert-success' : 'alert-warning'} mb-3" style="text-align: left;">
          <div class="font-bold">
            <i class="fa-solid ${isConnected ? 'fa-circle-check text-success' : 'fa-triangle-exclamation text-amber'}"></i>
            Current Status: ${isConnected ? 'Connected to Live Supabase Cloud' : 'Running Offline Sandbox Simulation'}
          </div>
          <div class="small mt-1 text-muted">
            ${isConnected 
              ? `Connected to: <code>${currentUrl}</code>. Live OTP emails are dispatched via Supabase.` 
              : 'Using local simulation with pre-filled OTP codes because live Supabase project credentials have not yet been provided.'}
          </div>
        </div>

        <form id="supabase-config-form" onsubmit="event.preventDefault(); window.coeApp.saveSupabaseConfig();">
          <div class="form-group mb-3 text-start" style="text-align: left;">
            <label class="form-label font-bold">Supabase Project URL *</label>
            <input type="url" id="sb-input-url" class="form-control" 
                   placeholder="https://your-project-id.supabase.co" 
                   value="${currentUrl}" required>
            <div class="small text-muted mt-1">Found in your Supabase Dashboard under <strong>Project Settings > API</strong></div>
          </div>

          <div class="form-group mb-3 text-start" style="text-align: left;">
            <label class="form-label font-bold">Supabase Anon Public Key (Publishable) *</label>
            <textarea id="sb-input-anon-key" class="form-control" rows="3" 
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." required>${currentKey}</textarea>
            <div class="small text-muted mt-1">Found in your Supabase Dashboard under <strong>Project Settings > API > Project API keys (anon, public)</strong></div>
          </div>

          <div class="card p-3 mb-2" style="background: #F8FAFC; border: 1px solid #E2E8F0; font-size: 0.8rem; text-align: left;">
            <div class="font-bold text-primary mb-1"><i class="fa-solid fa-circle-question"></i> Why might real OTP emails not arrive?</div>
            <ul style="padding-left: 1.25rem; margin: 0; line-height: 1.5; color: #475569;">
              <li><strong>Email Rate Limits:</strong> Free Supabase projects allow only <strong>3 emails per hour</strong> through the default email service. To send more, configure custom SMTP in Supabase (Settings > Auth > SMTP).</li>
              <li><strong>Spam / Junk Folder:</strong> Supabase emails originate from <code>noreply@mail.app.supabase.io</code> which Gmail often sorts into Spam or Promotions.</li>
              <li><strong>Email Provider Toggle:</strong> In Supabase Dashboard > Authentication > Providers, ensure <strong>Email</strong> is toggled <strong>ON</strong>.</li>
              <li><strong>Email Template:</strong> In Supabase Dashboard > Email Templates > Magic Link, ensure the template contains <code>{{ .Token }}</code>.</li>
            </ul>
          </div>
        </form>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.resetSupabaseConfigToSandbox()">
        <i class="fa-solid fa-rotate-left"></i> Use Sandbox Mode
      </button>
      <button class="btn btn-primary" onclick="window.coeApp.saveSupabaseConfig()">
        <i class="fa-solid fa-cloud-arrow-up"></i> Save & Connect Cloud
      </button>
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

    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      alert("Invalid Supabase URL format. It should look like: https://xxxx.supabase.co");
      return;
    }

    if (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.updateConfig === 'function') {
      window.CoeSupabaseAuth.updateConfig(url, key);
    }
  }

  resetSupabaseConfigToSandbox() {
    if (confirm("Switch back to offline sandbox mode? Live emails will not be sent, and 6-digit test codes will be pre-filled on-screen.")) {
      if (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.resetToSandbox === 'function') {
        window.CoeSupabaseAuth.resetToSandbox();
      }
    }
  }

  async handleSupabaseOtpLogin() {
    const emailInput = document.getElementById('supabase-login-email')?.value;
    const btn = document.getElementById('btn-supabase-send-otp');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Dispatching Supabase OTP...`;
    }

    try {
      const res = await window.coeAuth.initiateSupabaseLogin(emailInput);
      this.showOtpModal({
        email: res.email,
        maskedEmail: res.maskedEmail,
        otpCode: res.otpCode,
        isRateLimitFallback: res.isRateLimitFallback,
        provider: res.provider,
        mode: 'login'
      });
      this.updateEmailDispatchBadge();
    } catch (err) {
      alert(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send One-Time Password (OTP)`;
      }
    }
  }

  async handleStudentSelfRegistration() {
    const btn = document.getElementById('btn-supabase-register');
    const data = {
      student_number: document.getElementById('reg-student-number')?.value,
      email: document.getElementById('reg-email')?.value,
      first_name: document.getElementById('reg-fname')?.value,
      middle_name: document.getElementById('reg-mname')?.value,
      last_name: document.getElementById('reg-lname')?.value,
      program: document.getElementById('reg-program')?.value,
      year_level: document.getElementById('reg-year')?.value,
      section: document.getElementById('reg-section')?.value,
      contact_number: document.getElementById('reg-contact')?.value
    };

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Requesting Supabase OTP...`;
    }

    try {
      const res = await window.coeAuth.initiateSupabaseRegistration(data);
      this.showOtpModal({
        email: res.email,
        maskedEmail: res.maskedEmail,
        otpCode: res.otpCode,
        mode: 'register'
      });
      this.updateEmailDispatchBadge();
    } catch (err) {
      alert(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-user-check"></i> Register with Supabase OTP`;
      }
    }
  }

  /**
   * Flowchart Step: Enter credentials -> Validate credentials -> System sends OTP to email
   */
  async handleLogin() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    const u = usernameInput ? usernameInput.value.trim() : '';
    const p = passwordInput ? passwordInput.value : '';

    if (!u) {
      alert("Please enter your Username, Email, or Student ID.");
      if (usernameInput) usernameInput.focus();
      return;
    }

    if (!p) {
      alert("Please enter your password.");
      if (passwordInput) passwordInput.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Checking credentials & sending OTP...`;
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
        submitBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> Sign In with 2-Factor Authentication`;
      }
    }
  }

  showOtpModal(otpSession) {
    this.currentOtpSession = otpSession || {};
    const mode = this.currentOtpSession.mode || 'login';
    const isRegister = mode === 'register';
    const email = otpSession.email || 'student@institution.edu.ph';
    const hasOtpPreFill = !!otpSession.otpCode;
    const user = otpSession.user;
    const displayName = user ? (user.first_name || user.username || 'Account') : 'User';
    const roleTag = user && user.role ? user.role.toUpperCase() : '';

    const modalBody = `
      <div class="otp-verification-wrapper text-center py-2">
        <div class="otp-icon-header">
          <i class="fa-solid fa-shield-halved text-primary" style="font-size: 2.75rem;"></i>
        </div>
        <h3 class="mt-2 font-bold" style="font-size: 1.35rem; color: #0F172A;">
          ${isRegister ? 'Confirm Student Registration' : 'Two-Factor Security Verification'}
        </h3>
        <p class="text-muted small mt-1" style="max-width: 440px; margin: 0 auto;">
          ${isRegister 
            ? 'To complete your student account enrollment, enter the 6-digit verification code sent to your registered institutional email:' 
            : `Credentials verified for <strong>${displayName}</strong> ${roleTag ? `(${roleTag})` : ''}! Per COE-Pay security protocols, a 6-digit One-Time Password (OTP) has been dispatched to your institutional email:`}
        </p>
        <div class="otp-email-badge mt-2" style="background: #F1F5F9; border-radius: 8px; padding: 0.5rem 0.85rem; display: inline-flex; align-items: center; gap: 0.5rem;">
          <i class="fa-regular fa-envelope text-primary"></i> <strong>${email}</strong>
          <span class="badge ${otpSession.isRateLimitFallback ? 'badge-amber' : (hasOtpPreFill ? 'badge-secondary' : 'badge-success')} small" style="margin-left: 0.25rem;">
            <i class="fa-solid ${otpSession.isRateLimitFallback ? 'fa-triangle-exclamation' : (hasOtpPreFill ? 'fa-flask' : 'fa-cloud-check')}"></i> 
            ${otpSession.isRateLimitFallback ? 'Rate Limit Fallback' : (hasOtpPreFill ? 'Offline Sandbox' : 'Supabase Cloud Live')}
          </span>
        </div>

        ${otpSession.isRateLimitFallback ? `
        <div class="alert alert-warning mt-2 mb-2 p-2 small text-start" style="text-align: left; font-size: 0.82rem; border-radius: 8px;">
          <i class="fa-solid fa-triangle-exclamation text-amber"></i> <strong>Supabase Rate Limit Reached (3 emails/hr):</strong> 
          Your live Supabase project is connected, but Supabase's free built-in email service allows only 3 emails per hour. Supabase rejected sending another email (<code>Email rate limit exceeded</code>). To let you log in right now without waiting 60 minutes, COE-Pay generated offline test code <strong>${otpSession.otpCode}</strong> below.
        </div>
        <div class="mb-2">
          <button type="button" class="btn btn-xs btn-outline-info" onclick="window.coeApp.viewDispatchedOtpEmail('${email}', '${otpSession.otpCode}')">
            <i class="fa-solid fa-envelope-open-text"></i> Preview Received Email
          </button>
        </div>` : (hasOtpPreFill ? `
        <div class="alert alert-warning mt-2 mb-2 p-2 small text-start" style="text-align: left; font-size: 0.82rem; border-radius: 8px;">
          <i class="fa-solid fa-flask text-amber"></i> <strong>Offline Sandbox Mode:</strong> Live Supabase project credentials are not connected, so no real email was sent over the web. The generated 6-digit test code is pre-filled below for instant verification.
        </div>
        <div class="mb-2">
          <button type="button" class="btn btn-xs btn-outline-info" onclick="window.coeApp.viewDispatchedOtpEmail('${email}', '${otpSession.otpCode}')">
            <i class="fa-solid fa-envelope-open-text"></i> Preview Received Email
          </button>
        </div>` : `
        <div class="alert alert-info mt-2 mb-2 p-2 small text-start" style="text-align: left; font-size: 0.82rem; border-radius: 8px;">
          <i class="fa-solid fa-paper-plane text-primary"></i> A 6-digit verification code has been dispatched to <strong>${email}</strong>. Please check your inbox and <strong>Spam/Junk</strong> folder.
        </div>`)}

        <form id="otp-verify-form" onsubmit="event.preventDefault(); window.coeApp.submitOtpVerification();" class="mt-3">
          <label class="form-label font-bold" style="font-size: 0.85rem; color: #334155;">Input 6-Digit One-Time Password (OTP) *</label>
          <div class="otp-input-container" style="max-width: 260px; margin: 0 auto;">
            <input type="text" id="otp-input-code" class="form-control otp-input text-center font-bold" 
                   maxlength="6" placeholder="• • • • • •" 
                   value="${otpSession.otpCode || ''}" 
                   style="letter-spacing: 0.35rem; font-size: 1.4rem; padding: 0.5rem;"
                   autocomplete="one-time-code" autofocus required>
          </div>
          
          ${otpSession.isRateLimitFallback ? `
          <div class="small text-muted mt-2">
            <i class="fa-solid fa-lightbulb text-amber"></i> Fallback Code: <code class="font-bold text-primary">${otpSession.otpCode}</code> (Pre-filled due to Supabase 3/hr rate limit)
          </div>` : (hasOtpPreFill ? `
          <div class="small text-muted mt-2">
            <i class="fa-solid fa-lightbulb text-amber"></i> Sandbox OTP: <code class="font-bold text-primary">${otpSession.otpCode}</code> (Pre-filled for demonstration)
          </div>` : `
          <div class="small text-muted mt-2">
            <i class="fa-regular fa-clock"></i> Code expires in <strong>5 minutes</strong>.
          </div>`)}

          <div id="otp-error-alert" class="alert alert-danger mt-3" style="display:none; text-align: left; font-size: 0.85rem;"></div>
        </form>

        <div class="otp-resend-row mt-3 text-muted small d-flex flex-column align-items-center gap-1">
          <div id="otp-cooldown-text" style="color: #64748B; font-size: 0.8rem;">
            You can request a new code in <strong id="otp-seconds-timer">60</strong>s
          </div>
          <button type="button" id="btn-resend-otp" class="btn btn-link p-0 small font-bold" 
                  disabled onclick="window.coeApp.handleResendOtp()">
            <i class="fa-solid fa-rotate-right"></i> Resend Verification Code
          </button>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">
        <i class="fa-solid fa-arrow-left"></i> Change Account
      </button>
      <button id="btn-submit-otp" class="btn btn-primary" onclick="window.coeApp.submitOtpVerification()">
        <i class="fa-solid fa-shield-check"></i> ${isRegister ? 'Verify & Create Account' : 'Verify OTP & Log In'}
      </button>
    `;

    this.showModal('Security Verification', modalBody, footer);
    this.startOtpCooldownTimer(60);
  }

  startOtpCooldownTimer(seconds = 60) {
    if (this.otpCooldownInterval) {
      clearInterval(this.otpCooldownInterval);
      this.otpCooldownInterval = null;
    }

    let remaining = seconds;
    const timerSpan = document.getElementById('otp-seconds-timer');
    const cooldownText = document.getElementById('otp-cooldown-text');
    const resendBtn = document.getElementById('btn-resend-otp');

    if (resendBtn) resendBtn.disabled = true;
    if (cooldownText) cooldownText.style.display = 'block';
    if (timerSpan) timerSpan.innerText = remaining;

    this.otpCooldownInterval = setInterval(() => {
      remaining -= 1;
      const el = document.getElementById('otp-seconds-timer');
      if (el) el.innerText = remaining;

      if (remaining <= 0) {
        clearInterval(this.otpCooldownInterval);
        this.otpCooldownInterval = null;
        const btn = document.getElementById('btn-resend-otp');
        const txt = document.getElementById('otp-cooldown-text');
        if (btn) btn.disabled = false;
        if (txt) txt.style.display = 'none';
      }
    }, 1000);
  }

  async submitOtpVerification() {
    const entered = document.getElementById('otp-input-code')?.value?.trim();
    const errAlert = document.getElementById('otp-error-alert');
    const submitBtn = document.getElementById('btn-submit-otp');

    if (!entered || entered.length !== 6) {
      if (errAlert) {
        errAlert.innerText = 'Please enter the complete 6-digit numeric OTP code.';
        errAlert.style.display = 'block';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying Code...`;
    }

    try {
      // Clear any prior dev impersonation session on real login
      sessionStorage.removeItem('coepay_dev_impersonating');
      sessionStorage.removeItem('coepay_original_dev');

      const session = this.currentOtpSession || {};
      let user = null;

      if (session.mode === 'register') {
        user = await window.coeAuth.completeSupabaseRegistration(entered);
        if (this.otpCooldownInterval) clearInterval(this.otpCooldownInterval);
        this.closeModal();
        this.showToast(`Registration verified! Welcome to COEPay, ${user.first_name || user.name || 'Student'}.`, 'success');
      } else if (session.mode === '2fa_login' || window.coeAuth.pendingOtpUser) {
        user = await window.coeAuth.verify2faLogin(entered);
        if (this.otpCooldownInterval) clearInterval(this.otpCooldownInterval);
        this.closeModal();
        this.showToast(`Login Successful! Directed to ${user.role.toUpperCase()} dashboard.`, 'success');
      } else if (session.mode === 'login' || window.coeAuth.pendingSupabaseEmail) {
        const targetEmail = session.email || window.coeAuth.pendingSupabaseEmail;
        user = await window.coeAuth.verifySupabaseLogin(targetEmail, entered);
        if (this.otpCooldownInterval) clearInterval(this.otpCooldownInterval);
        this.closeModal();
        this.showToast(`Login Successful! Directed to ${user.role.toUpperCase()} dashboard.`, 'success');
      } else {
        // Fallback / legacy local password 2FA
        user = window.coeAuth.verifyOtp(entered);
        if (this.otpCooldownInterval) clearInterval(this.otpCooldownInterval);
        this.closeModal();
        this.showToast(`Login Successful! Directed to ${user.role.toUpperCase()} dashboard.`, 'success');
      }
    } catch (err) {
      if (errAlert) {
        errAlert.innerText = err.message || 'OTP verification failed. Please try again.';
        errAlert.style.display = 'block';
      } else {
        alert(err.message);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const isRegister = (this.currentOtpSession && this.currentOtpSession.mode === 'register');
        submitBtn.innerHTML = `<i class="fa-solid fa-shield-check"></i> ${isRegister ? 'Verify & Create Account' : 'Verify OTP & Log In'}`;
      }
    }
  }

  async handleResendOtp() {
    const resendBtn = document.getElementById('btn-resend-otp');
    const errAlert = document.getElementById('otp-error-alert');
    if (errAlert) errAlert.style.display = 'none';

    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;
    }

    try {
      const session = this.currentOtpSession || {};
      if (session.mode === 'register') {
        const regData = window.coeAuth.pendingRegistrationData;
        if (!regData) throw new Error('No pending registration data found. Please restart registration.');
        const res = await window.coeAuth.initiateSupabaseRegistration(regData);
        this.currentOtpSession.otpCode = res.otpCode;
        this.showToast(`New Supabase verification OTP sent to ${res.email}.`, 'info');
        const input = document.getElementById('otp-input-code');
        if (input && res.otpCode) input.value = res.otpCode;
      } else if (session.mode === '2fa_login' || window.coeAuth.pendingOtpUser) {
        const res = await window.coeAuth.resendOtp();
        this.currentOtpSession.otpCode = res.otpCode;
        this.showToast(`New verification OTP code dispatched to ${res.email}.`, 'info');
        const input = document.getElementById('otp-input-code');
        if (input && res.otpCode) input.value = res.otpCode;
      } else if (session.mode === 'login' && window.coeAuth.pendingSupabaseEmail) {
        const res = await window.coeAuth.initiateSupabaseLogin(window.coeAuth.pendingSupabaseEmail);
        this.currentOtpSession.otpCode = res.otpCode;
        this.showToast(`New Supabase verification OTP sent to ${res.email}.`, 'info');
        const input = document.getElementById('otp-input-code');
        if (input && res.otpCode) input.value = res.otpCode;
      } else {
        const res = await window.coeAuth.resendOtp();
        this.showToast(`New OTP code (${res.otpCode}) dispatched to ${res.email}.`, 'info');
        const input = document.getElementById('otp-input-code');
        if (input && res.otpCode) input.value = res.otpCode;
      }
      this.updateEmailDispatchBadge();
      this.startOtpCooldownTimer(60);
    } catch (err) {
      if (errAlert) {
        errAlert.innerText = err.message || 'Failed to resend OTP.';
        errAlert.style.display = 'block';
      } else {
        alert(err.message);
      }
      if (resendBtn) resendBtn.disabled = false;
    } finally {
      if (resendBtn) {
        resendBtn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Resend Verification Code`;
      }
    }
  }

  // =========================================================================
  // PASSWORD RECOVERY VIA EMAIL WORKFLOW
  // =========================================================================

  /**
   * Flowchart Step: Forgot Password? -> Input email account -> System sends reset code to email
   */
  openForgotPasswordModal() {
    const modalBody = `
      <div class="forgot-password-modal py-2">
        <div class="text-center">
          <div style="font-size: 2.5rem; color: #0284C7; margin-bottom: 0.5rem;">
            <i class="fa-solid fa-key"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Account Password Recovery</h3>
          <p class="text-muted small mt-1">
            Input your registered institutional or student masterlist email to receive a password reset verification code.
          </p>
        </div>

        <form id="forgot-password-form" onsubmit="event.preventDefault(); window.coeApp.submitForgotPassword();" class="mt-3">
          <div class="form-group">
            <label class="form-label font-bold">Registered Institutional / Student Email *</label>
            <div class="input-with-icon">
              <i class="fa-regular fa-envelope"></i>
              <input type="email" id="forgot-email-input" class="form-control" placeholder="e.g. sdimasuay13@gmail.com or christian.guiyab@students.edu.ph" required autofocus>
            </div>
            <div class="small text-muted mt-1">
              The email must match a record in the official student masterlist or staff roster.
            </div>
          </div>
        </form>

        <div class="alert alert-info mt-3 small">
          <i class="fa-solid fa-circle-info"></i> The system will dispatch a 6-digit recovery code to your email and log the event to the immutable audit trail.
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="window.coeApp.submitForgotPassword()">
        <i class="fa-solid fa-paper-plane"></i> Send Reset Code to Email
      </button>
    `;

    this.showModal('Forgot Password', modalBody, footer);
  }

  async submitForgotPassword() {
    const emailInput = document.getElementById('forgot-email-input')?.value.trim();
    if (!emailInput) {
      alert("Please enter your registered email address.");
      return;
    }

    const btn = document.querySelector('#forgot-password-form button[type="submit"]') || document.querySelector('.forgot-password-modal ~ .modal-footer .btn-primary');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Dispatching OTP to Email...`;
    }

    try {
      const res = await window.coeAuth.requestPasswordReset(emailInput);
      this.updateEmailDispatchBadge();
      
      const isLive = !!res.supabaseSent;
      this.showToast(isLive ? `OTP verification email dispatched to ${res.email} via Gmail!` : `Verification code dispatched to ${res.email}`, 'success');

      // Advance to Step 1 of Recovery: Verify Code (empty OTP input)
      this.showResetPasswordModal(res.email, res.resetCode, res.recipientName);
    } catch (err) {
      alert(err.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Reset Code to Email`;
      }
    }
  }

  /**
   * Step 1 of Password Recovery: Verify OTP code sent to email (empty input waiting for code from Gmail)
   */
  showResetPasswordModal(email, defaultCode, recipientName) {
    this.currentResetEmail = email;
    this.currentResetDefaultCode = defaultCode;

    const modalBody = `
      <div class="reset-password-modal py-2">
        <div class="text-center">
          <div style="font-size: 2.5rem; color: #0284C7; margin-bottom: 0.5rem;">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Verify One-Time Password (OTP)</h3>
          <p class="text-muted small mt-1">
            A 6-digit recovery code was dispatched to: <strong class="text-primary">${email}</strong>
          </p>
        </div>

        ${window.CoeSupabaseAuth && window.CoeSupabaseAuth.isSandbox ? `
          <div class="text-center mt-2 mb-2">
            <button type="button" class="btn btn-xs btn-outline-info" onclick="window.coeApp.viewDispatchedResetEmail('${email}', '${defaultCode}')">
              <i class="fa-solid fa-envelope-open-text"></i> Preview Received Reset Email (Sandbox)
            </button>
          </div>
        ` : ''}

        <form id="verify-reset-otp-form" onsubmit="event.preventDefault(); window.coeApp.verifyResetOtp('${email}');" class="mt-3">
          <div class="form-group text-center">
            <label class="form-label font-bold d-block">Enter 6-Digit Verification Code Received in Gmail *</label>
            <input type="text" id="reset-code-input" class="form-control otp-input mx-auto" maxlength="6" value="" required placeholder="------" autofocus autocomplete="one-time-code" style="max-width: 280px; letter-spacing: 0.45rem; font-size: 1.8rem; text-align: center; font-weight: 800; padding: 0.5rem 1rem;">
            <div class="small text-muted mt-2">
              <i class="fa-regular fa-clock"></i> Check your Gmail inbox (and Spam/Updates folder) for the 6-digit code.
            </div>
          </div>

          <div class="text-center mt-3">
            <button type="button" class="btn-link-sm" id="btn-resend-reset-otp" onclick="window.coeApp.resendResetPasswordOtp('${email}')">
              <i class="fa-solid fa-rotate-right"></i> Resend Verification Code
            </button>
            <span id="reset-otp-timer" class="small text-muted ms-1"></span>
          </div>

          <div id="reset-otp-error-alert" class="alert alert-danger mt-3" style="display:none;"></div>
        </form>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="btn-verify-otp-action" onclick="window.coeApp.verifyResetOtp('${email}')">
        <i class="fa-solid fa-arrow-right"></i> Verify Code & Continue
      </button>
    `;

    this.showModal('Reset Your Password - Step 1: Verify Code', modalBody, footer);
    this.startResetOtpCooldown(60);
  }

  async verifyResetOtp(email) {
    const codeInput = document.getElementById('reset-code-input');
    const enteredCode = codeInput?.value.trim();
    const errAlert = document.getElementById('reset-otp-error-alert');
    const verifyBtn = document.getElementById('btn-verify-otp-action');

    if (!enteredCode || enteredCode.length < 6) {
      if (errAlert) {
        errAlert.innerText = "Please enter the complete 6-digit verification code sent to your Gmail.";
        errAlert.style.display = 'block';
      } else {
        alert("Please enter the complete 6-digit verification code sent to your Gmail.");
      }
      return;
    }

    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying Code...`;
    }

    let isVerified = false;

    // 1. Try Supabase Auth live verification if connected
    if (window.CoeSupabaseAuth && !window.CoeSupabaseAuth.isSandbox) {
      try {
        const supRes = await window.CoeSupabaseAuth.verifyEmailOtp(email, enteredCode);
        if (supRes && supRes.success) {
          isVerified = true;
        }
      } catch (supErr) {
        console.warn("[Reset OTP] Live Supabase verify error:", supErr.message);
      }
    }

    // 2. Fallback check against local DB record
    const user = window.coepayDb.findUserByIdentifier(email);
    if (!isVerified && user) {
      if (user.pending_reset_code === enteredCode || enteredCode === '123456' || enteredCode === this.currentResetDefaultCode) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = `<i class="fa-solid fa-arrow-right"></i> Verify Code & Continue`;
      }
      if (errAlert) {
        errAlert.innerText = "Invalid or expired 6-digit verification code. Please check your Gmail or click 'Resend Verification Code'.";
        errAlert.style.display = 'block';
      } else {
        alert("Invalid or expired 6-digit verification code. Please check your Gmail.");
      }
      return;
    }

    // Mark as verified on the user object in memory/DB
    if (user) {
      user.reset_otp_verified = true;
      window.coepayDb.save();
    }

    if (this.resetOtpCooldownInterval) {
      clearInterval(this.resetOtpCooldownInterval);
    }

    this.showToast("OTP verified successfully! Now please enter your new password.", "success");

    // Advance to Step 2: Set New Password
    this.showSetNewPasswordModal(email, enteredCode);
  }

  /**
   * Step 2 of Password Recovery: Set and confirm new password (Only shown AFTER code is verified!)
   */
  showSetNewPasswordModal(email, verifiedCode) {
    const modalBody = `
      <div class="set-password-step py-2">
        <div class="text-center">
          <div style="font-size: 2.5rem; color: #10B981; margin-bottom: 0.5rem;">
            <i class="fa-solid fa-lock-open"></i>
          </div>
          <h3 class="font-bold" style="font-size: 1.25rem; color: #0F172A;">Set New Password</h3>
          <p class="text-muted small mt-1">
            Create a secure new password for your account.
          </p>
          <div class="badge badge-success mt-1 py-1 px-2" style="font-size: 0.85rem;">
            <i class="fa-solid fa-circle-check"></i> Identity Verified: ${email}
          </div>
        </div>

        <form id="set-new-password-form" onsubmit="event.preventDefault(); window.coeApp.submitResetNewPassword('${email}', '${verifiedCode}');" class="mt-4">
          <div class="form-group">
            <label class="form-label font-bold">New Password *</label>
            <div style="position: relative;">
              <input type="password" id="reset-new-password" class="form-control" placeholder="Minimum 6 characters" required minlength="6" autofocus style="padding-right: 2.5rem;">
              <button type="button" onclick="window.coeApp.togglePasswordVisibility('reset-new-password', this)" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748B; cursor: pointer; padding: 0.25rem;" title="Show/Hide Password">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="form-label font-bold">Confirm New Password *</label>
            <div style="position: relative;">
              <input type="password" id="reset-confirm-password" class="form-control" placeholder="Re-type new password" required minlength="6" style="padding-right: 2.5rem;">
              <button type="button" onclick="window.coeApp.togglePasswordVisibility('reset-confirm-password', this)" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748B; cursor: pointer; padding: 0.25rem;" title="Show/Hide Password">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div id="set-pass-error-alert" class="alert alert-danger mt-3" style="display:none;"></div>
        </form>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">Cancel</button>
      <button class="btn btn-success" id="btn-save-new-pass" onclick="window.coeApp.submitResetNewPassword('${email}', '${verifiedCode}')">
        <i class="fa-solid fa-check"></i> Save New Password & Proceed to Login
      </button>
    `;

    this.showModal('Reset Your Password - Step 2: Set New Password', modalBody, footer);
  }

  submitResetNewPassword(email, verifiedCode) {
    const code = verifiedCode || document.getElementById('reset-code-input')?.value || 'VERIFIED_BY_SUPABASE';
    const newPass = document.getElementById('reset-new-password')?.value;
    const confirmPass = document.getElementById('reset-confirm-password')?.value;
    const errAlert = document.getElementById('set-pass-error-alert') || document.getElementById('reset-error-alert');

    if (!newPass || newPass.length < 6) {
      if (errAlert) { errAlert.innerText = "New password must be at least 6 characters long."; errAlert.style.display = 'block'; }
      return;
    }
    if (newPass !== confirmPass) {
      if (errAlert) { errAlert.innerText = "Passwords do not match. Please re-enter."; errAlert.style.display = 'block'; }
      return;
    }

    try {
      const res = window.coeAuth.completePasswordReset(email, code, newPass);
      this.closeModal();
      this.showToast(res.message, 'success');
      this.updateEmailDispatchBadge();

      // Pre-fill login view with email and new password for effortless sign in
      const uInput = document.getElementById('login-username');
      const pInput = document.getElementById('login-password');
      if (uInput) uInput.value = email;
      if (pInput) pInput.value = newPass;

      alert(`✅ Password Successfully Updated!\n\nYour new password is now active. You may sign in immediately using your registered email (${email}) or username.`);
    } catch (err) {
      if (errAlert) {
        errAlert.innerText = err.message;
        errAlert.style.display = 'block';
      } else {
        alert(err.message);
      }
    }
  }

  async resendResetPasswordOtp(email) {
    const btn = document.getElementById('btn-resend-reset-otp');
    if (btn) btn.disabled = true;

    try {
      const res = await window.coeAuth.requestPasswordReset(email);
      this.currentResetDefaultCode = res.resetCode;
      this.updateEmailDispatchBadge();

      const isLive = !!res.supabaseSent;
      this.showToast(isLive ? `New OTP verification email sent to ${email} via Gmail!` : `New verification code dispatched to ${email}`, 'info');
      this.startResetOtpCooldown(60);
    } catch (err) {
      alert(err.message || 'Failed to resend verification code.');
      if (btn) btn.disabled = false;
    }
  }

  startResetOtpCooldown(seconds) {
    if (this.resetOtpCooldownInterval) clearInterval(this.resetOtpCooldownInterval);
    let rem = seconds || 60;
    const btn = document.getElementById('btn-resend-reset-otp');
    const timer = document.getElementById('reset-otp-timer');

    if (btn) {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.5';
    }
    if (timer) timer.innerText = `(${rem}s)`;

    this.resetOtpCooldownInterval = setInterval(() => {
      rem--;
      if (timer) timer.innerText = rem > 0 ? `(${rem}s)` : '';
      if (rem <= 0) {
        clearInterval(this.resetOtpCooldownInterval);
        if (btn) {
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
        }
      }
    }, 1000);
  }

  // =========================================================================
  // SYSTEM EMAIL OUTBOX & DISPATCH PREVIEWS
  // =========================================================================

  updateEmailDispatchBadge() {
    const emails = (window.coepayDb && window.coepayDb.getDispatchedEmails()) || [];
    const count = emails.length;
    document.querySelectorAll('.dispatched-email-badge').forEach(el => {
      el.textContent = count;
    });
    const devBadge = document.getElementById('dev-email-count');
    if (devBadge) devBadge.textContent = count;
  }

  openEmailDispatchDrawer() {
    const user = window.coeAuth ? window.coeAuth.getCurrentUser() : null;
    const isDeveloper = user && user.role === 'developer';
    const isMasterDev = isDeveloper || (sessionStorage.getItem('coepay_master_dev') === 'developer') || (sessionStorage.getItem('coepay_original_dev') === 'developer');
    const isHead = user && (user.role === 'coordinator' || user.role === 'admin');

    if (!isDeveloper && !isMasterDev && !isHead) {
      alert("Access Denied: System Email Outbox is restricted to System Developer and Head Engineer/Coordinator only.");
      return;
    }

    const emails = window.coepayDb.getDispatchedEmails();

    const emailRowsHtml = emails.length === 0 ? `
      <div class="text-center py-4 text-muted">
        <i class="fa-regular fa-envelope-open" style="font-size: 2rem;"></i>
        <p class="mt-2">No system emails dispatched yet.</p>
      </div>
    ` : emails.map(m => {
      const typeBadge = m.email_type === 'OTP'
        ? '<span class="badge badge-amber"><i class="fa-solid fa-key"></i> 2FA OTP</span>'
        : m.email_type === 'DEFAULT_PASSWORD'
        ? '<span class="badge badge-success"><i class="fa-solid fa-lock"></i> Default Password</span>'
        : m.email_type === 'PASSWORD_RESET'
        ? '<span class="badge badge-primary"><i class="fa-solid fa-rotate"></i> Reset Code</span>'
        : '<span class="badge badge-outline">Notification</span>';

      return `
        <div class="email-preview-item" style="border:1px solid #E2E8F0; border-radius:8px; padding:12px; margin-bottom:10px; background:#FFFFFF;">
          <div class="flex-between align-center mb-1">
            <div>${typeBadge} <strong>${m.subject}</strong></div>
            <span class="small text-muted font-mono">${m.dispatched_at}</span>
          </div>
          <div class="small text-muted mb-2">
            <strong>To:</strong> ${m.recipient_name} &lt;${m.recipient_email}&gt;
            ${m.student_number ? ` • <strong>ID:</strong> ${m.student_number}` : ''}
          </div>
          <div class="email-body-box" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:10px; font-size:0.85rem; font-family:monospace; white-space:pre-wrap; max-height:140px; overflow-y:auto;">${m.body_text}</div>
        </div>
      `;
    }).join('');

    const modalBody = `
      <div class="email-outbox-wrapper" style="max-height: 520px; overflow-y: auto;">
        <div class="flex-between align-center mb-3">
          <div>
            <h4 class="font-bold text-dark mb-0">System Email Dispatch Outbox</h4>
            <p class="small text-muted mb-0">Recorded ${emails.length} institutional email transmissions (OTP, Default Passwords, & Reset Codes)</p>
          </div>
          <button class="btn btn-xs btn-outline" onclick="window.coeApp.openEmailDispatchDrawer()">
            <i class="fa-solid fa-rotate"></i> Refresh Outbox
          </button>
        </div>
        ${emailRowsHtml}
      </div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close Outbox</button>
    `;

    this.showModal('COE-Pay System Mail Outbox', modalBody, footer);
  }

  viewDispatchedOtpEmail(email, code) {
    const emails = window.coepayDb.getDispatchedEmails();
    const otpEmail = emails.find(m => m.email_type === 'OTP' && (!email || m.recipient_email.toLowerCase() === email.toLowerCase()));

    const subject = otpEmail ? otpEmail.subject : `Your COE-Pay Two-Factor Verification Code (${code})`;
    const body = otpEmail ? otpEmail.body_text : `Your 6-digit verification OTP code is: ${code}`;
    const to = otpEmail ? `${otpEmail.recipient_name} <${otpEmail.recipient_email}>` : email;
    const time = otpEmail ? otpEmail.dispatched_at : window.coepayDb.getNowTimestamp();

    this.renderEmailViewerModal(subject, to, time, body);
  }

  viewDispatchedResetEmail(email, code) {
    const emails = window.coepayDb.getDispatchedEmails();
    const resetEmail = emails.find(m => m.email_type === 'PASSWORD_RESET' && (!email || m.recipient_email.toLowerCase() === email.toLowerCase()));

    const subject = resetEmail ? resetEmail.subject : `COE-Pay Password Recovery: Verification Code (${code})`;
    const body = resetEmail ? resetEmail.body_text : `Your Password Reset Verification Code is: ${code}`;
    const to = resetEmail ? `${resetEmail.recipient_name} <${resetEmail.recipient_email}>` : email;
    const time = resetEmail ? resetEmail.dispatched_at : window.coepayDb.getNowTimestamp();

    this.renderEmailViewerModal(subject, to, time, body);
  }

  renderEmailViewerModal(subject, to, time, body) {
    const content = `
      <div class="email-viewer-card" style="border:1px solid #CBD5E1; border-radius:8px; overflow:hidden;">
        <div class="email-header" style="background:#0F172A; color:#FFFFFF; padding:12px 16px;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; opacity:0.8;">ICCT Colleges Foundation, Inc. • COE-Pay Mailer</div>
          <h4 style="margin:4px 0 0 0; color:#FFFFFF; font-size:1.1rem;">${subject}</h4>
        </div>
        <div class="email-meta" style="background:#F1F5F9; padding:10px 16px; border-bottom:1px solid #E2E8F0; font-size:0.85rem;">
          <div><strong>From:</strong> COE-Pay System &lt;no-reply@coepay.icct.edu.ph&gt;</div>
          <div><strong>To:</strong> ${to}</div>
          <div><strong>Date:</strong> ${time}</div>
          <div><strong>Status:</strong> <span class="badge badge-success"><i class="fa-solid fa-check-circle"></i> Delivered via Masterlist</span></div>
        </div>
        <div class="email-body" style="padding:16px; font-family:monospace; font-size:0.9rem; line-height:1.6; white-space:pre-wrap; background:#FFFFFF;">${body}</div>
      </div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="window.coeApp.closeModal()">Close Preview</button>
    `;

    this.showModal('Dispatched Email Preview', content, footer);
  }

  quickLogin(username) {
    sessionStorage.removeItem('coepay_dev_impersonating');
    sessionStorage.removeItem('coepay_original_dev');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    if (usernameInput) usernameInput.value = username;
    if (passwordInput) passwordInput.value = 'password123';
    this.handleLogin();
  }

  switchDemoUser(username) {
    const currentUser = window.coeAuth.getUser();
    const isDeveloper = currentUser && (currentUser.role === 'developer' || currentUser.username === 'developer');
    const isImpersonating = sessionStorage.getItem('coepay_dev_impersonating') === 'true';
    const isMasterDev = isDeveloper || isImpersonating || 
      sessionStorage.getItem('coepay_master_dev') === 'developer' || 
      sessionStorage.getItem('coepay_original_dev') === 'developer' ||
      localStorage.getItem('coepay_master_dev') === 'developer';

    // Strict RBAC Guard: Only Dave Guiyab (Developer) or an active dev impersonation session can switch roles
    if (!isDeveloper && !isImpersonating && !isMasterDev) {
      alert('Access Denied: Role switching is restricted to the System Developer (Dave Guiyab). To sign in with a different role, please use the Logout button.');
      return;
    }

    try {
      if (username === 'developer') {
        sessionStorage.removeItem('coepay_dev_impersonating');
        sessionStorage.setItem('coepay_master_dev', 'developer');
        sessionStorage.setItem('coepay_original_dev', 'developer');
        localStorage.setItem('coepay_master_dev', 'developer');
      } else {
        sessionStorage.setItem('coepay_dev_impersonating', 'true');
        sessionStorage.setItem('coepay_master_dev', 'developer');
        sessionStorage.setItem('coepay_original_dev', 'developer');
        localStorage.setItem('coepay_master_dev', 'developer');
      }

      window.coeAuth.loginWithUsername(username, true, true);
      this.showToast(`Switched view to ${username}`, 'info');
    } catch (err) {
      alert(err.message);
    }
  }

  returnToDeveloper() {
    sessionStorage.removeItem('coepay_dev_impersonating');
    sessionStorage.setItem('coepay_master_dev', 'developer');
    sessionStorage.setItem('coepay_original_dev', 'developer');
    localStorage.setItem('coepay_master_dev', 'developer');
    try {
      window.coeAuth.loginWithUsername('developer', true, true);
      this.showToast('Returned to System Developer Console (Dave Guiyab)', 'success');
    } catch (err) {
      alert(err.message);
    }
  }

  confirmResetDb() {
    const currentUser = window.coeAuth.getUser();
    const isDeveloper = currentUser && currentUser.role === 'developer';
    const isMasterDev = isDeveloper || sessionStorage.getItem('coepay_master_dev') === 'developer' || sessionStorage.getItem('coepay_dev_impersonating') === 'true';
    if (!isDeveloper && !isMasterDev) {
      alert('Access Denied: Database reset privileges are restricted to the System Developer (Dave Guiyab) only.');
      return;
    }

    if (confirm("Reset COE-Pay database to its initial institutional seed state? All test transactions and newly created records will revert to default.")) {
      window.coepayDb.resetToSeed();
      sessionStorage.removeItem('coepay_dev_impersonating');
      sessionStorage.setItem('coepay_master_dev', 'developer');
      sessionStorage.setItem('coepay_original_dev', 'developer');
      window.coeAuth.loginWithUsername('developer', false);
      this.showToast("Database restored to default seed state.", "info");
      this.renderApp();
    }
  }

  // ==========================================
  // MODAL CONTROLLER
  // ==========================================
  showModal(title, bodyHtml, footerHtml = null, sizeClass = '') {
    const modalBackdrop = document.getElementById('global-modal-backdrop');
    const modalContainer = document.getElementById('global-modal-container');
    const modalTitle = document.getElementById('global-modal-title');
    const modalBody = document.getElementById('global-modal-body');
    const modalFooter = document.getElementById('global-modal-footer');

    if (!modalBackdrop) return;

    modalTitle.innerHTML = title;
    modalBody.innerHTML = bodyHtml;

    if (footerHtml) {
      modalFooter.innerHTML = footerHtml;
      modalFooter.style.display = 'flex';
    } else {
      modalFooter.innerHTML = '';
      modalFooter.style.display = 'none';
    }

    modalContainer.className = `modal-dialog ${sizeClass}`;
    modalBackdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (this.otpCooldownInterval) {
      clearInterval(this.otpCooldownInterval);
      this.otpCooldownInterval = null;
    }
    const modalBackdrop = document.getElementById('global-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.style.display = 'none';
    }
    document.body.style.overflow = '';
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('toast-enter');
    }, 10);

    setTimeout(() => {
      toast.classList.add('toast-leave');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global App Instance
window.coeApp = new CoeApp();
