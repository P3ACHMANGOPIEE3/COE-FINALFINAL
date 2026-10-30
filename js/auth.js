/**
 * COE-Pay: Authentication & Session Controller (Fixed Role Persistence)
 */

class CoeAuth {
  constructor() {
    this.SESSION_KEY = 'coepay_active_session_v1';
    this.currentUser = null;
    this.currentProfile = null;
    this.init();
  }

  init() {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.username) {
          this.setCurrentUser(parsed, false);
          return;
        }
        this.logout();
      } catch (e) {
        this.logout();
      }
    }
  }

  setCurrentUser(user, logEvent = true) {
    this.currentUser = user;

    if (user.role === 'coordinator' || user.role === 'admin') {
      this.currentProfile = {
        full_name: 'Engr. Ivanlee Mendoza',
        designation: 'Head Engineer & Academic Program Coordinator',
        department: 'College of Engineering and Digital Technology'
      };
    } else if (user.role === 'developer') {
      this.currentProfile = {
        full_name: 'Dave Guiyab',
        designation: 'Lead Full-Stack System Developer',
        department: 'COE-Pay Software Architecture & Systems Lab'
      };
    } else if (user.role === 'officer' || user.role === 'personnel') {
      this.currentProfile = {
        personnel_id: 1,
        full_name: 'Pearl Catequista',
        designation: 'College Student Officer & Financial Treasurer',
        department: 'College of Engineering Student Council'
      };
    } else {
      this.currentProfile = {
        student_id: 101,
        student_number: user.username,
        full_name: 'Christian Dave Guiyab',
        program: 'BS Computer Engineering',
        year_level: 4,
        section: '4A'
      };
    }

    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      user_id: user.user_id || 1,
      username: user.username,
      role: user.role
    }));

    sessionStorage.setItem('coepay_current_user', JSON.stringify({
      ...user,
      full_name: this.currentProfile.full_name
    }));

    if (window.coeApp && typeof window.coeApp.onUserChanged === 'function') {
      window.coeApp.onUserChanged();
    }
  }

  loginWithUsername(username, logEvent = true) {
    const raw = (username || '').toLowerCase().trim();
    let user = null;

    if (raw === 'engr.mendoza' || raw === 'coordinator' || raw === 'admin') {
      user = { 
        user_id: 1, 
        username: "engr.mendoza", 
        email: "engr.mendoza@icct.edu.ph", 
        role: "coordinator", 
        full_name: "Engr. Ivanlee Mendoza", 
        is_active: 1 
      };
    } else if (raw === 'developer' || raw === 'dave') {
      user = { 
        user_id: 100, 
        username: "developer", 
        email: "dev@icct.edu.ph", 
        role: "developer", 
        full_name: "Dave Guiyab", 
        is_active: 1 
      };
    } else if (raw === 'officer' || raw.includes('pearl')) {
      user = { 
        user_id: 2, 
        username: "officer", 
        email: "officer@icct.edu.ph", 
        role: "officer", 
        full_name: "Pearl Catequista", 
        is_active: 1 
      };
    } else {
      user = { 
        user_id: 30, 
        username: raw || "2023-10001", 
        email: `${raw || 'student'}@icct.edu.ph`, 
        role: "student", 
        full_name: "Christian Dave Guiyab", 
        is_active: 1 
      };
    }

    this.setCurrentUser(user, logEvent);
    return user;
  }

  async initiateLogin(identifier, password) {
    if (!identifier || !identifier.trim()) throw new Error("Please enter your username.");
    if (!password) throw new Error("Please enter your password.");

    const clean = identifier.trim().toLowerCase();
    
    // Alamin ang role base sa inilagay
    let pendingRole = 'student';
    let targetUsername = clean;

    if (clean === 'engr.mendoza' || clean === 'coordinator' || clean === 'admin') {
      pendingRole = 'coordinator';
      targetUsername = 'engr.mendoza';
    } else if (clean === 'developer' || clean === 'dave') {
      pendingRole = 'developer';
      targetUsername = 'developer';
    } else if (clean === 'officer' || clean.includes('pearl')) {
      pendingRole = 'officer';
      targetUsername = 'officer';
    } else {
      pendingRole = 'student';
      targetUsername = clean || '2023-10001';
    }

    const pendingUser = {
      username: targetUsername,
      role: pendingRole,
      email: `${targetUsername}@icct.edu.ph`
    };

    // I-save sa sessionStorage para hindi ma-override ng student fallback
    sessionStorage.setItem('coepay_pending_auth_user', JSON.stringify(pendingUser));

    return {
      success: true,
      user: pendingUser,
      email: pendingUser.email,
      otpCode: '123456'
    };
  }

  async verify2faLogin(enteredCode) {
    const rawPending = sessionStorage.getItem('coepay_pending_auth_user');
    let target = '2023-10001';

    if (rawPending) {
      try {
        const parsed = JSON.parse(rawPending);
        target = parsed.username || target;
      } catch (e) {}
    }

    sessionStorage.removeItem('coepay_pending_auth_user');
    const user = this.loginWithUsername(target, true);
    return user;
  }

  logout() {
    this.currentUser = null;
    this.currentProfile = null;
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem('coepay_current_user');
    sessionStorage.clear();
    location.reload();
  }

  isLoggedIn() { return !!this.currentUser; }
  getRole() { return this.currentUser ? this.currentUser.role : null; }
  getUser() { return this.currentUser; }
  getCurrentUser() { return this.currentUser; }
  getProfile() { return this.currentProfile; }
}

window.CoeAuth = CoeAuth;
window.coeAuth = new CoeAuth();