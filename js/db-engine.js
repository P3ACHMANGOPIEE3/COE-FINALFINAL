/**
 * COE-Pay: Relational Database Simulation Engine
 * Handles relational joins, constraint enforcement, auto-increment,
 * transaction processing, audit logging, and SQL export.
 */

class CoeDatabaseEngine {
  constructor() {
    this.STORAGE_KEY = 'coepay_db_v4';
    this.tables = {};
    this.init();
  }

  init() {
    let loaded = false;

    // 1. Check server pre-injected database from disk
    if (typeof window !== 'undefined' && window.COEPAY_SERVER_PERSISTED_DB && window.COEPAY_SERVER_PERSISTED_DB.users) {
      try {
        this.tables = JSON.parse(JSON.stringify(window.COEPAY_SERVER_PERSISTED_DB));
        loaded = true;
      } catch (e) {
        console.warn('Failed parsing server pre-injected DB', e);
      }
    }

    // 2. Fallback to / sync with browser localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const localParsed = JSON.parse(stored);
          if (!loaded && localParsed && localParsed.users) {
            this.tables = localParsed;
            loaded = true;
          } else if (loaded && localParsed) {
            // Merge newly enrolled students from localStorage if they aren't in disk yet
            if (Array.isArray(localParsed.students) && Array.isArray(this.tables.students)) {
              localParsed.students.forEach(ls => {
                if (!this.tables.students.some(s => s.student_number === ls.student_number)) {
                  this.tables.students.push(ls);
                }
              });
            }
            // Merge custom passwords or user records from localStorage
            if (Array.isArray(localParsed.users) && Array.isArray(this.tables.users)) {
              localParsed.users.forEach(lu => {
                const u = this.tables.users.find(tu => tu.user_id === lu.user_id || tu.username === lu.username);
                if (!u) {
                  this.tables.users.push(lu);
                } else if (lu.password_custom && (!u.password_custom || u.password_custom === 'password123')) {
                  u.password_custom = lu.password_custom;
                }
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse stored COE-Pay DB from localStorage", e);
      }
    }

    // 3. Fallback to seed data if neither source had valid data
    if (!loaded || !this.tables || !this.tables.users) {
      this.resetToSeed();
    }

    this.tables.dispatched_emails = this.tables.dispatched_emails || [];
    this.tables.system_settings = this.tables.system_settings || {
      auto_approval_enabled: true,
      require_receipt_upload: true,
      min_reference_length: 10,
      auto_clear_exam_status: true
    };
    this.syncOfficialMasterlist();
    this.ensureCorePersonas();
    this.autoCheckOverdueAssignments();
    this.save();
  }

  /**
   * Synchronizes the database against the official institutional student masterlist.
   * Ensures the 8 baseline official masterlist students are seeded and updated,
   * while permanently preserving all newly enrolled or bulk-uploaded students.
   */
  syncOfficialMasterlist() {
    if (!this.tables || !this.tables.students) return;
    this.tables.dispatched_emails = this.tables.dispatched_emails || [];

    const officialMasterlist = [
      { student_number: "2023-10001", first_name: "Christian Dave", middle_name: "D.", last_name: "Guiyab", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "christian.guiyab@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10009", first_name: "Jay-are", middle_name: null, last_name: "Mesias", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "sstephencurryy30@gmail.com", contact_number: "09391439718" },
      { student_number: "2023-10003", first_name: "Jefferson", middle_name: "C.", last_name: "Sadoguio", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "jeffesonsadoguio@gmail.com", contact_number: "09165938156" },
      { student_number: "2023-10004", first_name: "Jerome", middle_name: "R.", last_name: "Opana", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "jerome.opana@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10005", first_name: "Aaron Mikhael", middle_name: null, last_name: "Canonizado", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "aaron.canonizado@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10006", first_name: "John Robin", middle_name: "P.", last_name: "Fernandez", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "johnrobin.fernandez@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10007", first_name: "Ma. Sophia", middle_name: "B.", last_name: "Dimasu-ay", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "sdimasuay13@gmail.com", contact_number: "09636729211" },
      { student_number: "2023-10008", first_name: "Tricia Mae", middle_name: "S.", last_name: "Gonzaga", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "gonzagat634@gmail.com", contact_number: "009501807279" }
    ];

    // Ensure official baseline students exist and are synced without deleting any enrolled students
    officialMasterlist.forEach((m, idx) => {
      let student = this.tables.students.find(s => s.student_number === m.student_number);
      let user = this.tables.users.find(u => u.username === m.student_number);

      if (!user) {
        const assignedUid = 30 + idx;
        user = {
          user_id: assignedUid,
          username: m.student_number,
          email: m.email,
          password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq",
          role: "student",
          is_active: 1,
          last_login: null,
          created_at: this.getNowTimestamp(),
          updated_at: this.getNowTimestamp()
        };
        this.tables.users.push(user);
      } else {
        user.email = m.email;
        user.updated_at = this.getNowTimestamp();
      }

      if (!student) {
        const assignedSid = 101 + idx;
        student = {
          student_id: assignedSid,
          user_id: user.user_id,
          student_number: m.student_number,
          first_name: m.first_name,
          middle_name: m.middle_name,
          last_name: m.last_name,
          program: m.program,
          year_level: m.year_level,
          section: m.section,
          contact_number: m.contact_number,
          email: m.email,
          created_at: this.getNowTimestamp(),
          updated_at: this.getNowTimestamp()
        };
        this.tables.students.push(student);
      } else {
        student.user_id = user.user_id;
        student.first_name = m.first_name;
        student.middle_name = m.middle_name;
        student.last_name = m.last_name;
        student.program = m.program;
        student.year_level = m.year_level;
        student.section = m.section;
        student.contact_number = m.contact_number;
        student.email = m.email;
        student.updated_at = this.getNowTimestamp();
      }
    });

    this.save();
  }

  /**
   * Ensures the 4 core persona accounts are always present,
   * even if an older localStorage version is active in the user's browser.
   */
  ensureCorePersonas() {
    if (!this.tables || !this.tables.users) {
      this.resetToSeed();
      return;
    }

    const defaultUsers = [
      { user_id: 100, username: "developer", email: "gosoytoth@gmail.com", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "developer", is_active: 1, last_login: this.getNowTimestamp(), created_at: "2026-01-05 08:00:00", updated_at: this.getNowTimestamp() },
      { user_id: 1, username: "engr.mendoza", email: "azdhaha799@gmail.com", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "coordinator", is_active: 1, last_login: this.getNowTimestamp(), created_at: "2026-01-05 08:00:00", updated_at: this.getNowTimestamp() },
      { user_id: 2, username: "officer", email: "pearl.catequista@icct.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "officer", is_active: 1, last_login: this.getNowTimestamp(), created_at: "2026-01-05 08:30:00", updated_at: this.getNowTimestamp() },
      { user_id: 30, username: "2023-10001", email: "christian.guiyab@students.edu.ph", password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq", role: "student", is_active: 1, last_login: this.getNowTimestamp(), created_at: "2026-08-20 09:00:00", updated_at: this.getNowTimestamp() }
    ];

    let hasChanges = false;
    defaultUsers.forEach(u => {
      const exists = this.tables.users.find(existing => existing.username.toLowerCase() === u.username.toLowerCase());
      if (!exists) {
        this.tables.users.push(u);
        hasChanges = true;
      } else {
        if (exists.email !== u.email) {
          exists.email = u.email;
          hasChanges = true;
        }
      }
    });

    if (this.tables.students && !this.tables.students.some(s => s.student_number === "2023-10001")) {
      this.tables.students.unshift({
        student_id: 101,
        user_id: 30,
        student_number: "2023-10001",
        first_name: "Christian Dave",
        middle_name: "D.",
        last_name: "Guiyab",
        program: "BS Computer Engineering",
        year_level: 4,
        section: "4A",
        contact_number: "09123456789",
        created_at: "2026-08-20 09:00:00",
        updated_at: "2026-08-20 09:00:00"
      });
      hasChanges = true;
    }

    if (this.tables.personnel && !this.tables.personnel.some(p => p.user_id === 2)) {
      this.tables.personnel.unshift({
        personnel_id: 1,
        user_id: 2,
        employee_number: "OFF-2024-001",
        first_name: "Pearl",
        middle_name: "Alexa",
        last_name: "Catequista",
        department: "College of Engineering Student Council & Organizations",
        designation: "College Student Officer & Financial Treasurer",
        contact_number: "09123456789",
        created_at: "2026-01-05 08:35:00",
        updated_at: "2026-01-05 08:35:00"
      });
      hasChanges = true;
    }

    if (hasChanges) {
      this.save();
    }
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tables));
      }
    } catch (e) {
      console.warn("Failed saving to localStorage", e);
    }
    this.saveToDisk();
  }

  saveToDisk() {
    if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        fetch('/api/save_db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.tables)
        }).catch(err => {
          console.debug('Disk save skipped or offline:', err);
        });
      } catch (e) {}
    }
  }

  async reloadFromDisk() {
    if (typeof fetch === 'function' && typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/load_db');
        if (res.ok) {
          const diskData = await res.json();
          if (diskData && diskData.users && diskData.students) {
            this.tables = diskData;
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tables));
              }
            } catch (err) {}
            return true;
          }
        }
      } catch (e) {
        console.debug('Disk reload skipped/failed:', e);
      }
    }
    return false;
  }

  resetToSeed() {
    // Deep clone initial seed data
    this.tables = JSON.parse(JSON.stringify(COE_INITIAL_DATABASE));
    this.save();
    console.log("COE-Pay Database initialized from seed data.");
  }

  getNowTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  getNextId(tableName, pkField) {
    const rows = this.tables[tableName] || [];
    if (rows.length === 0) return 1;
    const maxId = rows.reduce((max, r) => (r[pkField] > max ? r[pkField] : max), 0);
    return maxId + 1;
  }

  // ==========================================
  // AUDIT LOGGING
  // ==========================================
  logAudit(userId, actionType, entityName, entityId, details) {
    const logId = this.getNextId('audit_logs', 'log_id');
    const logEntry = {
      log_id: logId,
      user_id: userId || null,
      action_type: actionType,
      entity_name: entityName,
      entity_id: entityId || null,
      details: details || '',
      ip_address: '192.168.1.100 (Client-IP)',
      user_agent: navigator.userAgent.substring(0, 250),
      created_at: this.getNowTimestamp()
    };
    this.tables.audit_logs.unshift(logEntry);
    this.save();
    return logEntry;
  }

  // ==========================================
  // RELATIONAL ACCESSORS & JOINS
  // ==========================================

  getAcademicTerms() {
    return [...this.tables.academic_terms];
  }

  getCurrentTerm() {
    return this.tables.academic_terms.find(t => t.is_current === 1) || this.tables.academic_terms[0];
  }

  getCategories() {
    return this.tables.payment_categories.filter(c => c.is_active === 1);
  }

  getAllCategories() {
    return [...this.tables.payment_categories];
  }

  // Users with resolved roles
  getUsers() {
    return [...this.tables.users];
  }

  getUserById(userId) {
    return this.tables.users.find(u => u.user_id === Number(userId));
  }

  // Students with joined User account
  getStudents() {
    return this.tables.students.map(s => {
      const user = this.tables.users.find(u => u.user_id === s.user_id) || {};
      return {
        ...s,
        username: user.username,
        email: user.email,
        is_active: user.is_active,
        full_name: `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.trim()
      };
    });
  }

  getStudentById(studentId) {
    const s = this.tables.students.find(item => item.student_id === Number(studentId));
    if (!s) return null;
    const user = this.tables.users.find(u => u.user_id === s.user_id) || {};
    return {
      ...s,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      full_name: `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.trim()
    };
  }

  getStudentByUserId(userId) {
    const s = this.tables.students.find(item => item.user_id === Number(userId));
    if (!s) return null;
    return this.getStudentById(s.student_id);
  }

  // Personnel with joined User account
  getPersonnel() {
    return this.tables.personnel.map(p => {
      const user = this.tables.users.find(u => u.user_id === p.user_id) || {};
      return {
        ...p,
        username: user.username,
        email: user.email,
        is_active: user.is_active,
        full_name: `Engr. ${p.first_name} ${p.last_name}`.trim()
      };
    });
  }

  getPersonnelById(personnelId) {
    const p = this.tables.personnel.find(item => item.personnel_id === Number(personnelId));
    if (!p) return null;
    const user = this.tables.users.find(u => u.user_id === p.user_id) || {};
    return {
      ...p,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      full_name: `Engr. ${p.first_name} ${p.last_name}`.trim()
    };
  }

  getPersonnelByUserId(userId) {
    const p = this.tables.personnel.find(item => item.user_id === Number(userId));
    if (!p) return null;
    return this.getPersonnelById(p.personnel_id);
  }

  // Payment Requests with joined category, term, creator, authorizer
  getPaymentRequests(filter = {}) {
    let list = this.tables.payment_requests.map(req => {
      const category = this.tables.payment_categories.find(c => c.category_id === req.category_id) || { category_name: 'General' };
      const term = this.tables.academic_terms.find(t => t.term_id === req.term_id) || { academic_year: 'N/A', semester: 'N/A' };
      const creator = this.getPersonnelById(req.created_by_personnel_id) || { full_name: 'Unknown Personnel' };
      const authorizer = req.authorized_by_user_id ? this.getUserById(req.authorized_by_user_id) : null;

      // Stats for this request
      const assignments = this.tables.student_payment_assignments.filter(a => a.request_id === req.request_id);
      const totalStudents = assignments.length;
      const paidStudents = assignments.filter(a => a.status === 'paid').length;
      const pendingVerification = assignments.filter(a => a.status === 'pending_verification').length;
      const unpaidStudents = assignments.filter(a => a.status === 'unpaid' || a.status === 'overdue').length;
      const overdueStudents = assignments.filter(a => a.status === 'overdue').length;
      const totalCollected = paidStudents * Number(req.amount);
      const targetExpected = totalStudents * Number(req.amount);

      return {
        ...req,
        category_name: category.category_name,
        academic_year: term.academic_year,
        semester: term.semester,
        creator_name: creator.full_name,
        creator_designation: creator.designation || 'Faculty',
        authorizer_name: authorizer ? (authorizer.username === 'admin' ? 'Dean Dr. Ronald Reyes' : authorizer.username) : null,
        stats: {
          totalStudents,
          paidStudents,
          pendingVerification,
          unpaidStudents,
          overdueStudents,
          totalCollected,
          targetExpected,
          collectionRate: totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0
        }
      };
    });

    if (filter.status) {
      list = list.filter(r => r.status === filter.status);
    }
    if (filter.created_by_personnel_id) {
      list = list.filter(r => r.created_by_personnel_id === Number(filter.created_by_personnel_id));
    }
    return list;
  }

  getRequestById(requestId) {
    const list = this.getPaymentRequests();
    return list.find(r => r.request_id === Number(requestId)) || null;
  }

  // Student Payment Assignments with joined student and request info
  getAssignments(filter = {}) {
    this.autoCheckOverdueAssignments();
    let list = this.tables.student_payment_assignments.map(a => {
      const student = this.getStudentById(a.student_id) || {};
      const request = this.getRequestById(a.request_id) || {};
      // find latest transaction for this assignment
      const transaction = this.tables.payment_transactions.find(t => t.assignment_id === a.assignment_id) || null;

      return {
        ...a,
        student,
        request,
        transaction
      };
    });

    if (filter.student_id) {
      list = list.filter(a => a.student_id === Number(filter.student_id));
    }
    if (filter.request_id) {
      list = list.filter(a => a.request_id === Number(filter.request_id));
    }
    if (filter.status) {
      list = list.filter(a => a.status === filter.status);
    }
    return list;
  }

  // Payment Transactions with full joins
  getTransactions(filter = {}) {
    let list = this.tables.payment_transactions.map(t => {
      const student = this.getStudentById(t.student_id) || {};
      const request = this.getRequestById(t.request_id) || {};
      const verifier = t.verified_by_personnel_id === 999 
        ? { full_name: 'System Legitimacy Engine (Auto-Approved)' }
        : (t.verified_by_personnel_id ? this.getPersonnelById(t.verified_by_personnel_id) : null);
      const assignment = this.tables.student_payment_assignments.find(a => a.assignment_id === t.assignment_id);

      return {
        ...t,
        student,
        request,
        verifier_name: verifier ? verifier.full_name : null,
        assignment_status: assignment ? assignment.status : 'unknown'
      };
    });

    if (filter.status) {
      list = list.filter(t => t.status === filter.status);
    }
    if (filter.student_id) {
      list = list.filter(t => t.student_id === Number(filter.student_id));
    }
    if (filter.request_id) {
      list = list.filter(t => t.request_id === Number(filter.request_id));
    }
    return list;
  }

  // Audit logs with joined user details
  getAuditLogs(limit = 100) {
    return this.tables.audit_logs.slice(0, limit).map(log => {
      const user = log.user_id ? this.getUserById(log.user_id) : null;
      return {
        ...log,
        username: user ? user.username : 'SYSTEM',
        user_role: user ? user.role : 'system'
      };
    });
  }

  // Auto overdue checking based on deadline
  autoCheckOverdueAssignments() {
    const now = new Date();
    let updated = false;

    this.tables.student_payment_assignments.forEach(a => {
      if (a.status === 'unpaid') {
        const req = this.tables.payment_requests.find(r => r.request_id === a.request_id);
        if (req && new Date(req.deadline) < now) {
          a.status = 'overdue';
          a.updated_at = this.getNowTimestamp();
          updated = true;
        }
      }
    });

    if (updated) {
      this.save();
    }
  }

  // ==========================================
  // BUSINESS OPERATIONS & MUTATIONS
  // ==========================================

  /**
   * Create a new payment request (Personnel)
   */
  createPaymentRequest(data, actingUser) {
    const personnel = this.getPersonnelByUserId(actingUser.user_id);
    if (!personnel) {
      throw new Error("Only authorized personnel can create payment requests.");
    }

    const requestId = this.getNextId('payment_requests', 'request_id');
    const newRequest = {
      request_id: requestId,
      title: data.title.trim(),
      description: data.description.trim(),
      category_id: Number(data.category_id),
      term_id: Number(data.term_id),
      amount: parseFloat(data.amount).toFixed(2),
      deadline: data.deadline,
      target_year_level: data.target_year_level ? Number(data.target_year_level) : null,
      target_section: data.target_section ? data.target_section.trim() : null,
      gcash_account_name: data.gcash_account_name.trim().toUpperCase(),
      gcash_account_number: data.gcash_account_number.trim(),
      gcash_qr_code_path: data.gcash_qr_code_path || 'assets/img/qr-coe-org.png',
      status: data.submit_for_authorization ? 'pending_authorization' : 'draft',
      created_by_personnel_id: personnel.personnel_id,
      authorized_by_user_id: null,
      authorized_at: null,
      authorization_remarks: null,
      created_at: this.getNowTimestamp(),
      updated_at: this.getNowTimestamp()
    };

    this.tables.payment_requests.push(newRequest);
    this.save();

    this.logAudit(
      actingUser.user_id,
      'CREATE_REQUEST',
      'payment_requests',
      requestId,
      `Created payment request: ${newRequest.title} (PHP ${newRequest.amount}) status: ${newRequest.status}`
    );

    return newRequest;
  }

  /**
   * Authorize a payment request (Admin / Dean)
   * Automatically generates student assignments for matching cohort
   */
  authorizePaymentRequest(requestId, adminUser, remarks = '') {
    const isAuthorizedApprover = adminUser && (adminUser.role === 'coordinator' || adminUser.role === 'admin' || adminUser.role === 'developer');
    if (!isAuthorizedApprover) {
      throw new Error("Unauthorized: Only Head Engineer/Coordinator or Administrator can authorize payment requests.");
    }

    const req = this.tables.payment_requests.find(r => r.request_id === Number(requestId));
    if (!req) throw new Error("Payment request not found.");

    req.status = 'authorized';
    req.authorized_by_user_id = adminUser.user_id;
    req.authorized_at = this.getNowTimestamp();
    req.authorization_remarks = remarks || 'Authorized by Head Engineer / Coordinator of College of Engineering';
    req.updated_at = this.getNowTimestamp();

    // Auto-generate assignments for eligible students
    const eligibleStudents = this.tables.students.filter(student => {
      if (req.target_year_level && student.year_level !== req.target_year_level) {
        return false;
      }
      if (req.target_section && student.section.toUpperCase() !== req.target_section.toUpperCase()) {
        return false;
      }
      return true;
    });

    let assignedCount = 0;
    eligibleStudents.forEach(student => {
      // Check unique constraint uq_request_student
      const exists = this.tables.student_payment_assignments.some(
        a => a.request_id === req.request_id && a.student_id === student.student_id
      );
      if (!exists) {
        const assignmentId = this.getNextId('student_payment_assignments', 'assignment_id');
        this.tables.student_payment_assignments.push({
          assignment_id: assignmentId,
          request_id: req.request_id,
          student_id: student.student_id,
          status: 'unpaid',
          assigned_at: this.getNowTimestamp(),
          updated_at: this.getNowTimestamp()
        });
        assignedCount++;
      }
    });

    this.save();

    this.logAudit(
      adminUser.user_id,
      'AUTHORIZE_REQUEST',
      'payment_requests',
      requestId,
      `Authorized request: "${req.title}". Generated ${assignedCount} student assignments.`
    );

    return { request: req, assignedCount };
  }

  /**
   * Reject a payment request (Admin)
   */
  rejectPaymentRequest(requestId, adminUser, remarks) {
    const isAuthorizedApprover = adminUser && (adminUser.role === 'coordinator' || adminUser.role === 'admin' || adminUser.role === 'developer');
    if (!isAuthorizedApprover) {
      throw new Error("Unauthorized: Only Head Engineer/Coordinator or Administrator can reject payment requests.");
    }
    const req = this.tables.payment_requests.find(r => r.request_id === Number(requestId));
    if (!req) throw new Error("Payment request not found.");

    req.status = 'rejected';
    req.authorized_by_user_id = adminUser.user_id;
    req.authorized_at = this.getNowTimestamp();
    req.authorization_remarks = remarks || 'Payment request rejected by Head Engineer / Coordinator.';
    req.updated_at = this.getNowTimestamp();

    this.save();

    this.logAudit(
      adminUser.user_id,
      'REJECT_REQUEST',
      'payment_requests',
      requestId,
      `Rejected request "${req.title}". Remarks: ${remarks}`
    );

    return req;
  }

  /**
   * Submit GCash Payment (Student)
   * Validates 13-digit reference number, ensures unique ref, creates transaction
   */
  isAutoApprovalEnabled() {
    if (!this.tables.system_settings) {
      this.tables.system_settings = { auto_approval_enabled: true, require_receipt_upload: true };
    }
    return this.tables.system_settings.auto_approval_enabled !== false;
  }

  toggleAutoApproval(actingUser) {
    if (!this.tables.system_settings) {
      this.tables.system_settings = { auto_approval_enabled: true };
    }
    this.tables.system_settings.auto_approval_enabled = !this.tables.system_settings.auto_approval_enabled;
    this.save();
    if (actingUser) {
      this.logAudit(
        actingUser.user_id,
        'SYSTEM_SETTINGS_UPDATE',
        'system_settings',
        null,
        `Toggled payment auto-approval engine to: ${this.tables.system_settings.auto_approval_enabled ? 'ENABLED' : 'DISABLED'}`
      );
    }
    return this.tables.system_settings.auto_approval_enabled;
  }

  setAutoApprovalEnabled(enabled, actingUser) {
    if (!this.tables.system_settings) {
      this.tables.system_settings = { auto_approval_enabled: true };
    }
    this.tables.system_settings.auto_approval_enabled = !!enabled;
    this.save();
    if (actingUser) {
      this.logAudit(
        actingUser.user_id,
        'SYSTEM_SETTINGS_UPDATE',
        'system_settings',
        null,
        `Set payment auto-approval engine to: ${this.tables.system_settings.auto_approval_enabled ? 'ENABLED' : 'DISABLED'}`
      );
    }
    return this.tables.system_settings.auto_approval_enabled;
  }

  /**
   * Validates reference number legitimacy, format, uniqueness, and receipt proof
   */
  validateReceiptLegitimacy(paymentData, assignment) {
    const rawRef = String(paymentData.gcash_reference_number || '').trim();
    const cleanRef = rawRef.replace(/[\s-]/g, '');
    const amountPaid = parseFloat(paymentData.amount_paid || 0);
    const request = (assignment && assignment.request_id) ? (this.getRequestById(assignment.request_id) || {}) : {};
    const expectedAmount = parseFloat(request.amount || 0);

    const result = {
      isLegit: true,
      confidence: 100,
      cleanRef: cleanRef,
      rawRef: rawRef,
      checks: {
        referenceFormat: true,
        referenceUnique: true,
        amountSufficient: true,
        proofAttached: true,
        senderVerified: true
      },
      failureReasons: []
    };

    // 1. Reference format check (GCash 10-14 digits or Bank 10-24 alphanumeric)
    const isGcashNumeric = /^\d{10,14}$/.test(cleanRef);
    const isBankAlphanumeric = /^[A-Za-z0-9]{10,24}$/.test(cleanRef);
    if (!isGcashNumeric && !isBankAlphanumeric) {
      result.isLegit = false;
      result.checks.referenceFormat = false;
      result.confidence -= 40;
      result.failureReasons.push(`Reference number "${rawRef}" does not match standard institutional format (10-14 digits for mobile wallet or 10-24 alphanumeric for bank).`);
    }

    // 2. Anti-Replay / Uniqueness Check across all database transactions
    const duplicate = (this.tables.payment_transactions || []).find(t => {
      const existingClean = String(t.gcash_reference_number || '').replace(/[\s-]/g, '');
      return existingClean === cleanRef && t.status !== 'rejected' && (!assignment || t.assignment_id !== assignment.assignment_id);
    });
    if (duplicate) {
      result.isLegit = false;
      result.checks.referenceUnique = false;
      result.confidence = 0;
      result.failureReasons.push(`Duplicate Reference Number detected! Reference "${rawRef}" was already registered on transaction #COE-TRX-${duplicate.transaction_id}.`);
    }

    // 3. Amount Matching Check
    if (expectedAmount > 0 && amountPaid < expectedAmount) {
      result.isLegit = false;
      result.checks.amountSufficient = false;
      result.confidence -= 35;
      result.failureReasons.push(`Insufficient payment amount: Submitted PHP ${amountPaid.toFixed(2)}, required PHP ${expectedAmount.toFixed(2)}.`);
    }

    // 4. Proof of Payment Upload Check
    const hasProof = !!(paymentData.receipt_image_data || (paymentData.receipt_image_path && paymentData.receipt_image_path !== 'sample_receipt_custom'));
    if (!hasProof) {
      result.isLegit = false;
      result.checks.proofAttached = false;
      result.confidence -= 25;
      result.failureReasons.push("Missing uploaded proof of payment image.");
    }

    // 5. Sender Verification Check
    const senderName = String(paymentData.gcash_sender_name || '').trim();
    const senderNumber = String(paymentData.gcash_sender_number || '').trim();
    if (!senderName || senderName.length < 2) {
      result.checks.senderVerified = false;
      result.confidence -= 10;
    }
    if (!senderNumber || senderNumber.length < 10) {
      result.checks.senderVerified = false;
      result.confidence -= 10;
    }

    return result;
  }

  /**
   * Submit Payment (Student) with Automatic Legitimacy & Receipt Engine Verification
   */
  submitPayment(assignmentId, studentUser, paymentData) {
    const student = this.getStudentByUserId(studentUser.user_id);
    if (!student) throw new Error("Student profile not found for active user.");

    const assignment = this.tables.student_payment_assignments.find(a => a.assignment_id === Number(assignmentId));
    if (!assignment) throw new Error("Payment assignment record not found.");
    if (assignment.student_id !== student.student_id) {
      throw new Error("You are not authorized to submit payment for this assignment.");
    }
    if (assignment.status === 'paid') {
      throw new Error("This payment assignment has already been paid and verified.");
    }

    // Run Legitimacy Engine
    const legitimacy = this.validateReceiptLegitimacy(paymentData, assignment);

    // Reject duplicate reference numbers immediately
    if (!legitimacy.checks.referenceUnique) {
      throw new Error(legitimacy.failureReasons[0]);
    }

    const refNumber = legitimacy.cleanRef || String(paymentData.gcash_reference_number).trim();
    const request = this.getRequestById(assignment.request_id) || {};

    // Auto-approval decision
    const autoApproveActive = this.isAutoApprovalEnabled();
    const isAutoApproved = autoApproveActive && legitimacy.isLegit;

    // Check or update existing transaction for this assignment
    let transaction = this.tables.payment_transactions.find(t => t.assignment_id === assignment.assignment_id);

    if (transaction) {
      // update existing transaction
      transaction.gcash_reference_number = refNumber;
      transaction.gcash_sender_name = paymentData.gcash_sender_name.trim().toUpperCase();
      transaction.gcash_sender_number = paymentData.gcash_sender_number.trim();
      transaction.amount_paid = parseFloat(paymentData.amount_paid).toFixed(2);
      transaction.gateway_type = paymentData.gateway_type || 'gcash';
      transaction.payment_timestamp = paymentData.payment_timestamp || this.getNowTimestamp();
      transaction.receipt_image_path = paymentData.receipt_image_path || 'sample_receipt_custom';
      transaction.receipt_image_data = paymentData.receipt_image_data || transaction.receipt_image_data || null;
      transaction.receipt_file_name = paymentData.receipt_file_name || transaction.receipt_file_name || null;
      transaction.student_notes = paymentData.student_notes ? paymentData.student_notes.trim() : null;
      transaction.status = isAutoApproved ? 'verified' : 'pending';
      transaction.verified_by_personnel_id = isAutoApproved ? 999 : null;
      transaction.verified_at = isAutoApproved ? this.getNowTimestamp() : null;
      transaction.verification_remarks = isAutoApproved 
        ? `System Auto-Approved: Verified legitimate reference #${refNumber}, valid receipt proof, and matched PHP ${transaction.amount_paid}.`
        : null;
      transaction.legitimacy_score = legitimacy.confidence;
      transaction.is_auto_approved = isAutoApproved ? 1 : 0;
      transaction.submitted_at = this.getNowTimestamp();
      transaction.updated_at = this.getNowTimestamp();
    } else {
      const transId = this.getNextId('payment_transactions', 'transaction_id');
      transaction = {
        transaction_id: transId,
        assignment_id: assignment.assignment_id,
        request_id: assignment.request_id,
        student_id: student.student_id,
        gcash_reference_number: refNumber,
        gcash_sender_name: paymentData.gcash_sender_name.trim().toUpperCase(),
        gcash_sender_number: paymentData.gcash_sender_number.trim(),
        amount_paid: parseFloat(paymentData.amount_paid).toFixed(2),
        gateway_type: paymentData.gateway_type || 'gcash',
        payment_timestamp: paymentData.payment_timestamp || this.getNowTimestamp(),
        receipt_image_path: paymentData.receipt_image_path || 'sample_receipt_custom',
        receipt_image_data: paymentData.receipt_image_data || null,
        receipt_file_name: paymentData.receipt_file_name || null,
        student_notes: paymentData.student_notes ? paymentData.student_notes.trim() : null,
        status: isAutoApproved ? 'verified' : 'pending',
        verified_by_personnel_id: isAutoApproved ? 999 : null,
        verified_at: isAutoApproved ? this.getNowTimestamp() : null,
        verification_remarks: isAutoApproved 
          ? `System Auto-Approved: Verified legitimate reference #${refNumber}, valid receipt proof, and matched PHP ${parseFloat(paymentData.amount_paid).toFixed(2)}.`
          : null,
        legitimacy_score: legitimacy.confidence,
        is_auto_approved: isAutoApproved ? 1 : 0,
        submitted_at: this.getNowTimestamp(),
        updated_at: this.getNowTimestamp()
      };
      this.tables.payment_transactions.push(transaction);
    }

    if (isAutoApproved) {
      assignment.status = 'paid';
      assignment.updated_at = this.getNowTimestamp();

      // Dispatch official electronic payment receipt
      this.recordDispatchedEmail({
        recipient_email: student.email,
        recipient_name: student.full_name,
        student_number: student.student_number,
        email_type: 'PAYMENT_RECEIPT',
        subject: `COE-Pay Official Receipt: ${request.title || 'Department Payment'} (Ref #${refNumber})`,
        body_text: `Dear ${student.full_name},\n\nYour payment for "${request.title || 'Department Payment'}" has been automatically verified and approved by the COE-Pay Institutional Payment Engine.\n\nTransaction Details:\n• Official Reference #: ${refNumber}\n• Amount Cleared: PHP ${transaction.amount_paid}\n• Payment Channel: ${(transaction.gateway_type || 'GCash').toUpperCase()}\n• Date/Timestamp: ${this.getNowTimestamp()}\n• Clearance Status: 100% Settled & Approved\n\nYour examination clearance ledger has been instantly updated to 100% EXAM CLEARED.\n\nCollege of Engineering and Digital Technology\nICCT Colleges Foundation, Inc.`,
        metadata: { transactionId: transaction.transaction_id, refNumber, assignmentId: assignment.assignment_id }
      });
    } else {
      assignment.status = 'pending_verification';
      assignment.updated_at = this.getNowTimestamp();
    }

    this.save();

    this.logAudit(
      studentUser.user_id,
      isAutoApproved ? 'AUTO_APPROVE_PAYMENT' : 'SUBMIT_PAYMENT',
      'payment_transactions',
      transaction.transaction_id,
      isAutoApproved
        ? `Payment Ref #${refNumber} (PHP ${transaction.amount_paid}) automatically verified and approved by System Legitimacy Engine.`
        : `Submitted Payment Ref #${refNumber} (PHP ${transaction.amount_paid}) for assignment #${assignment.assignment_id}`
    );

    return transaction;
  }

  /**
   * Verify Payment (Personnel / Collector)
   */
  verifyPayment(transactionId, actingUser, remarks = '') {
    const personnel = this.getPersonnelByUserId(actingUser.user_id);
    const isAuthorizedVerifier = personnel || (actingUser && (actingUser.role === 'officer' || actingUser.role === 'personnel' || actingUser.role === 'coordinator' || actingUser.role === 'admin' || actingUser.role === 'developer'));
    if (!isAuthorizedVerifier) {
      throw new Error("Unauthorized: Only designated personnel, officers, or coordinators can verify transactions.");
    }
    const personnelId = personnel ? personnel.personnel_id : 1;

    const trans = this.tables.payment_transactions.find(t => t.transaction_id === Number(transactionId));
    if (!trans) throw new Error("Transaction record not found.");

    const assignment = this.tables.student_payment_assignments.find(a => a.assignment_id === trans.assignment_id);
    if (!assignment) throw new Error("Associated student assignment not found.");

    trans.status = 'verified';
    trans.verified_by_personnel_id = personnelId;
    trans.verified_at = this.getNowTimestamp();
    trans.verification_remarks = remarks || 'GCash payment confirmed against merchant ledger. Approved.';
    trans.updated_at = this.getNowTimestamp();

    assignment.status = 'paid';
    assignment.updated_at = this.getNowTimestamp();

    this.save();

    this.logAudit(
      actingUser.user_id,
      'VERIFY_PAYMENT',
      'payment_transactions',
      trans.transaction_id,
      `Verified payment transaction #${trans.transaction_id} (Ref: ${trans.gcash_reference_number}). Assignment marked as paid.`
    );

    return trans;
  }

  /**
   * Reject Payment (Personnel)
   */
  rejectPayment(transactionId, actingUser, remarks = '') {
    const personnel = this.getPersonnelByUserId(actingUser.user_id);
    const isAuthorizedVerifier = personnel || (actingUser && (actingUser.role === 'officer' || actingUser.role === 'personnel' || actingUser.role === 'coordinator' || actingUser.role === 'admin' || actingUser.role === 'developer'));
    if (!isAuthorizedVerifier) {
      throw new Error("Unauthorized: Only designated personnel, officers, or coordinators can reject transactions.");
    }
    const personnelId = personnel ? personnel.personnel_id : 1;

    const trans = this.tables.payment_transactions.find(t => t.transaction_id === Number(transactionId));
    if (!trans) throw new Error("Transaction record not found.");

    const assignment = this.tables.student_payment_assignments.find(a => a.assignment_id === trans.assignment_id);
    if (!assignment) throw new Error("Associated student assignment not found.");

    trans.status = 'rejected';
    trans.verified_by_personnel_id = personnelId;
    trans.verified_at = this.getNowTimestamp();
    trans.verification_remarks = remarks || 'Payment submission rejected. Please review reference number or receipt.';
    trans.updated_at = this.getNowTimestamp();

    // Revert assignment status: check if overdue or unpaid
    const req = this.tables.payment_requests.find(r => r.request_id === assignment.request_id);
    const isOverdue = req && new Date(req.deadline) < new Date();
    assignment.status = isOverdue ? 'overdue' : 'unpaid';
    assignment.updated_at = this.getNowTimestamp();

    this.save();

    this.logAudit(
      actingUser.user_id,
      'REJECT_PAYMENT',
      'payment_transactions',
      trans.transaction_id,
      `Rejected payment transaction #${trans.transaction_id} (Ref: ${trans.gcash_reference_number}). Remarks: ${remarks}`
    );

    return trans;
  }

  /**
   * Add a new student (Admin)
   */
  createStudent(data, adminUser) {
    const canManageStudents = adminUser && (adminUser.role === 'coordinator' || adminUser.role === 'admin' || adminUser.role === 'developer');
    if (!canManageStudents) throw new Error("Unauthorized: Only Head Engineer/Coordinator or Administrator can add students.");

    // Check unique username & email
    const username = data.student_number.trim();
    if (this.tables.users.some(u => u.username === username)) {
      throw new Error(`Username / Student ID ${username} already exists.`);
    }
    if (this.tables.users.some(u => u.email === data.email.trim())) {
      throw new Error(`Email ${data.email} already exists.`);
    }

    const assignedPassword = (data.password && String(data.password).trim()) ? String(data.password).trim() : 'password123';

    const userId = this.getNextId('users', 'user_id');
    const newUser = {
      user_id: userId,
      username: username,
      email: data.email.trim(),
      password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq",
      password_custom: assignedPassword,
      role: "student",
      is_active: 1,
      last_login: null,
      created_at: this.getNowTimestamp(),
      updated_at: this.getNowTimestamp()
    };
    this.tables.users.push(newUser);

    const studentId = this.getNextId('students', 'student_id');
    const newStudent = {
      student_id: studentId,
      user_id: userId,
      student_number: username,
      first_name: data.first_name.trim(),
      middle_name: data.middle_name ? data.middle_name.trim() : null,
      last_name: data.last_name.trim(),
      program: data.program || 'BSCpE',
      year_level: Number(data.year_level),
      section: data.section.trim(),
      contact_number: data.contact_number ? data.contact_number.trim() : null,
      email: data.email.trim(),
      created_at: this.getNowTimestamp(),
      updated_at: this.getNowTimestamp()
    };
    this.tables.students.push(newStudent);

    // Auto-assign any active authorized payment requests matching their year & section
    const activeRequests = this.tables.payment_requests.filter(r => r.status === 'authorized');
    activeRequests.forEach(req => {
      let match = true;
      if (req.target_year_level && req.target_year_level !== newStudent.year_level) match = false;
      if (req.target_section && req.target_section.toUpperCase() !== newStudent.section.toUpperCase()) match = false;

      if (match) {
        const assignId = this.getNextId('student_payment_assignments', 'assignment_id');
        this.tables.student_payment_assignments.push({
          assignment_id: assignId,
          request_id: req.request_id,
          student_id: newStudent.student_id,
          status: 'unpaid',
          assigned_at: this.getNowTimestamp(),
          updated_at: this.getNowTimestamp()
        });
      }
    });

    this.save();
    this.logAudit(adminUser.user_id, 'USER_CREATE', 'students', studentId, `Added student ${newStudent.student_number} (${newStudent.first_name} ${newStudent.last_name}) with assigned password.`);

    if (data.dispatch_email !== false) {
      try {
        this.dispatchDefaultPasswordToStudent(username, assignedPassword);
      } catch (err) {
        console.warn('Initial password dispatch error:', err.message);
      }
    }

    newStudent.assigned_password = assignedPassword;
    return newStudent;
  }

  /**
   * Register Student via Supabase OTP Authentication
   */
  registerStudentWithSupabase(data) {
    const studentNumber = (data.student_number || '').trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const supabaseUid = data.supabase_uid || null;

    if (!studentNumber || !cleanEmail || !data.first_name || !data.last_name || !data.section) {
      throw new Error("Student Number, Email, Name, and Section are required.");
    }

    // Check duplicate student number
    if (this.tables.students.some(s => s.student_number.toLowerCase() === studentNumber.toLowerCase())) {
      throw new Error(`Student Number "${studentNumber}" is already registered in the official roster.`);
    }

    // Check duplicate email
    if (this.tables.users.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
      throw new Error(`Email address "${cleanEmail}" is already associated with an existing account.`);
    }

    const userId = this.getNextId('users', 'user_id');
    const newUser = {
      user_id: userId,
      supabase_uid: supabaseUid,
      username: studentNumber,
      email: cleanEmail,
      password_hash: "",
      role: "student",
      auth_provider: "supabase_otp",
      is_active: 1,
      last_login: this.getNowTimestamp(),
      created_at: this.getNowTimestamp(),
      updated_at: this.getNowTimestamp()
    };
    this.tables.users.push(newUser);

    const studentId = this.getNextId('students', 'student_id');
    const newStudent = {
      student_id: studentId,
      user_id: userId,
      student_number: studentNumber,
      first_name: data.first_name.trim(),
      middle_name: data.middle_name ? data.middle_name.trim() : null,
      last_name: data.last_name.trim(),
      program: data.program || 'BS Computer Engineering',
      year_level: Number(data.year_level || 1),
      section: data.section.trim(),
      contact_number: data.contact_number ? data.contact_number.trim() : null,
      created_at: this.getNowTimestamp(),
      updated_at: this.getNowTimestamp()
    };
    this.tables.students.push(newStudent);

    // Auto-assign active authorized requests matching student cohort
    const matchingRequests = this.tables.payment_requests.filter(r => {
      if (r.status !== 'authorized') return false;
      if (r.target_year_level && r.target_year_level !== newStudent.year_level) return false;
      if (r.target_section && r.target_section !== newStudent.section) return false;
      return true;
    });

    matchingRequests.forEach(req => {
      const assignId = this.getNextId('student_payment_assignments', 'assignment_id');
      this.tables.student_payment_assignments.push({
        assignment_id: assignId,
        request_id: req.request_id,
        student_id: studentId,
        status: 'unpaid',
        assigned_at: this.getNowTimestamp(),
        updated_at: this.getNowTimestamp()
      });
    });

    this.save();

    this.logAudit(
      userId,
      'REGISTER_SUPABASE_OTP',
      'students',
      studentId,
      `Student self-registered with Supabase OTP: ${studentNumber} (${newStudent.first_name} ${newStudent.last_name})`
    );

    return {
      user: newUser,
      student: newStudent,
      assignedCount: matchingRequests.length
    };
  }

  /**
   * Link Supabase UID to MySQL User
   */
  linkSupabaseUid(userId, supabaseUid) {
    const user = this.getUserById(userId);
    if (!user) return null;
    user.supabase_uid = supabaseUid;
    user.auth_provider = 'supabase_otp';
    user.last_login = this.getNowTimestamp();
    this.save();
    return user;
  }

  /**
   * Bulk Upsert Student Masterlist (Admin)
   * Inserts new students or updates existing students matching student_number/student_id.
   * Auto-assigns authorized requests for their year & section.
   */
  bulkUpsertStudents(studentRows, adminUser) {
    const canBulkUpload = adminUser && (adminUser.role === 'coordinator' || adminUser.role === 'admin' || adminUser.role === 'developer');
    if (!canBulkUpload) {
      throw new Error("Unauthorized: Only Head Engineer/Coordinator or Administrator can perform student masterlist bulk uploads.");
    }

    if (!Array.isArray(studentRows) || studentRows.length === 0) {
      throw new Error("No student records provided for bulk upload.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const processedRecords = [];
    const seenNumbers = new Set();

    const activeRequests = (this.tables.payment_requests || []).filter(r => r.status === 'authorized');

    studentRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const studentNumber = String(row.student_number || row.student_id || row.id_number || '').trim();
      const firstName = String(row.first_name || row.firstname || '').trim();
      const middleName = String(row.middle_name || row.middlename || '').trim();
      const lastName = String(row.last_name || row.lastname || '').trim();
      const email = String(row.email || row.student_email || '').trim().toLowerCase();
      let program = String(row.program || row.course || 'BSCOE').trim();
      if (!program) program = 'BSCOE';
      
      const yearRaw = String(row.year_level || row.year || '').trim();
      const yearMatch = yearRaw.match(/\d+/);
      const yearLevel = yearMatch ? parseInt(yearMatch[0], 10) : NaN;
      const section = String(row.section || row.class_section || '').trim();
      const contactNumber = String(row.contact_number || row.contact || '').trim();

      const rowErrors = [];

      if (!studentNumber) {
        rowErrors.push("Missing Student ID / Number");
      } else if (!/^[A-Za-z0-9-]+$/.test(studentNumber)) {
        rowErrors.push("Invalid Student ID format");
      }

      if (!firstName) rowErrors.push("First name is required");
      if (!lastName) rowErrors.push("Last name is required");
      if (!email) {
        rowErrors.push("Email is required");
      } else if (!emailRegex.test(email)) {
        rowErrors.push(`Invalid email format (${email})`);
      }

      if (isNaN(yearLevel) || yearLevel < 1 || yearLevel > 5) {
        rowErrors.push("Year level must be between 1 and 5");
      }

      if (!section) rowErrors.push("Section is required");

      if (studentNumber && seenNumbers.has(studentNumber)) {
        rowErrors.push(`Duplicate student ID (${studentNumber}) within this upload file`);
      }

      if (rowErrors.length > 0) {
        skipped++;
        errors.push({
          row: rowNum,
          student_id: studentNumber || 'N/A',
          name: `${firstName} ${lastName}`.trim() || 'N/A',
          errors: rowErrors
        });
        return;
      }

      seenNumbers.add(studentNumber);

      // Check if student exists
      const existingStudent = this.tables.students.find(s => s.student_number === studentNumber);

      if (existingStudent) {
        // UPDATE existing student
        existingStudent.first_name = firstName;
        existingStudent.middle_name = middleName || null;
        existingStudent.last_name = lastName;
        existingStudent.program = program;
        existingStudent.year_level = yearLevel;
        existingStudent.section = section;
        existingStudent.contact_number = contactNumber || null;
        existingStudent.updated_at = this.getNowTimestamp();

        // Update corresponding user record
        const user = this.tables.users.find(u => u.user_id === existingStudent.user_id);
        if (user) {
          user.email = email;
          user.updated_at = this.getNowTimestamp();
        }

        // Auto-assign any newly eligible obligations
        activeRequests.forEach(req => {
          let match = true;
          if (req.target_year_level && req.target_year_level !== existingStudent.year_level) match = false;
          if (req.target_section && req.target_section.toUpperCase() !== existingStudent.section.toUpperCase()) match = false;

          if (match) {
            const alreadyAssigned = this.tables.student_payment_assignments.some(
              a => a.request_id === req.request_id && a.student_id === existingStudent.student_id
            );
            if (!alreadyAssigned) {
              const assignId = this.getNextId('student_payment_assignments', 'assignment_id');
              this.tables.student_payment_assignments.push({
                assignment_id: assignId,
                request_id: req.request_id,
                student_id: existingStudent.student_id,
                status: 'unpaid',
                assigned_at: this.getNowTimestamp(),
                updated_at: this.getNowTimestamp()
              });
            }
          }
        });

        updated++;
        processedRecords.push({
          student_id: studentNumber,
          action: 'updated',
          name: `${firstName} ${lastName}`,
          cohort: `${program} - Year ${yearLevel} (${section})`
        });
      } else {
        // INSERT new student
        let user = this.tables.users.find(u => u.username === studentNumber);
        let userId;

        if (user) {
          userId = user.user_id;
          user.email = email;
        } else {
          userId = this.getNextId('users', 'user_id');
          user = {
            user_id: userId,
            username: studentNumber,
            email: email,
            password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq",
            role: "student",
            is_active: 1,
            last_login: null,
            created_at: this.getNowTimestamp(),
            updated_at: this.getNowTimestamp()
          };
          this.tables.users.push(user);
        }

        const studentId = this.getNextId('students', 'student_id');
        const newStudent = {
          student_id: studentId,
          user_id: userId,
          student_number: studentNumber,
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          program: program,
          year_level: yearLevel,
          section: section,
          contact_number: contactNumber || null,
          created_at: this.getNowTimestamp(),
          updated_at: this.getNowTimestamp()
        };
        this.tables.students.push(newStudent);

        // Auto-assign active requests
        activeRequests.forEach(req => {
          let match = true;
          if (req.target_year_level && req.target_year_level !== newStudent.year_level) match = false;
          if (req.target_section && req.target_section.toUpperCase() !== newStudent.section.toUpperCase()) match = false;

          if (match) {
            const assignId = this.getNextId('student_payment_assignments', 'assignment_id');
            this.tables.student_payment_assignments.push({
              assignment_id: assignId,
              request_id: req.request_id,
              student_id: newStudent.student_id,
              status: 'unpaid',
              assigned_at: this.getNowTimestamp(),
              updated_at: this.getNowTimestamp()
            });
          }
        });

        inserted++;
        processedRecords.push({
          student_id: studentNumber,
          action: 'inserted',
          name: `${firstName} ${lastName}`,
          cohort: `${program} - Year ${yearLevel} (${section})`
        });
      }
    });

    this.save();

    this.logAudit(
      adminUser.user_id,
      'BULK_MASTERLIST_UPLOAD',
      'students',
      inserted,
      `Masterlist bulk upload: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`
    );

    return {
      success: true,
      message: `Masterlist processed successfully: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`,
      summary: {
        total_parsed: studentRows.length,
        inserted,
        updated,
        skipped,
        errors
      },
      processed_records: processedRecords
    };
  }

  /**
   * Add a payment category (Admin)
   */
  createCategory(name, description, adminUser) {
    const canManageCategories = adminUser && (adminUser.role === 'coordinator' || adminUser.role === 'admin' || adminUser.role === 'developer');
    if (!canManageCategories) throw new Error("Unauthorized: Only Head Engineer/Coordinator or Administrator can manage payment categories.");
    if (this.tables.payment_categories.some(c => c.category_name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error("Category with this name already exists.");
    }
    const categoryId = this.getNextId('payment_categories', 'category_id');
    const newCat = {
      category_id: categoryId,
      category_name: name.trim(),
      description: description.trim(),
      is_active: 1,
      created_at: this.getNowTimestamp()
    };
    this.tables.payment_categories.push(newCat);
    this.save();
    this.logAudit(adminUser.user_id, 'CREATE_CATEGORY', 'payment_categories', categoryId, `Created category: ${name}`);
    return newCat;
  }

  // =========================================================================
  // EMAIL DISPATCH & PASSWORD RECOVERY SYSTEM
  // =========================================================================

  /**
   * Returns all dispatched system emails sorted newest first
   */
  getDispatchedEmails() {
    this.tables.dispatched_emails = this.tables.dispatched_emails || [];
    return [...this.tables.dispatched_emails].sort((a, b) => b.email_id - a.email_id);
  }

  /**
   * Records a dispatched email in the system outbox with metadata and audit logging
   */
  recordDispatchedEmail(emailData) {
    this.tables.dispatched_emails = this.tables.dispatched_emails || [];
    const nextId = this.getNextId('dispatched_emails', 'email_id');
    const newRecord = {
      email_id: nextId,
      recipient_email: String(emailData.recipient_email || '').trim().toLowerCase(),
      recipient_name: emailData.recipient_name || 'COE Student',
      student_number: emailData.student_number || null,
      email_type: emailData.email_type || 'NOTIFICATION', // 'OTP', 'DEFAULT_PASSWORD', 'PASSWORD_RESET', 'PASSWORD_CHANGED'
      subject: emailData.subject,
      body_text: emailData.body_text || '',
      body_html: emailData.body_html || null,
      status: 'DELIVERED',
      dispatched_at: this.getNowTimestamp(),
      metadata: emailData.metadata || null
    };

    this.tables.dispatched_emails.push(newRecord);
    this.save();

    // Trigger badge count refresh if UI is active
    if (window.coeApp && typeof window.coeApp.updateEmailDispatchBadge === 'function') {
      window.coeApp.updateEmailDispatchBadge();
    }

    return newRecord;
  }

  /**
   * Dispatches 2-Factor Authentication OTP to user's registered masterlist email
   */
  dispatchOtpEmail(user, otpCode) {
    const student = this.getStudentByUserId(user.user_id);
    const recipientName = student ? student.full_name : (user.username === 'developer' ? 'Dave Guiyab' : user.username === 'engr.mendoza' ? 'Engr. Ivanlee Mendoza' : user.username);
    const email = user.email;

    const emailRecord = this.recordDispatchedEmail({
      recipient_email: email,
      recipient_name: recipientName,
      student_number: student ? student.student_number : null,
      email_type: 'OTP',
      subject: `Your COE-Pay Two-Factor Verification Code (${otpCode})`,
      body_text: `Dear ${recipientName},\n\nA login verification request was submitted for your COE-Pay account (${user.username}).\n\nYour 6-digit One-Time Password (OTP) code is: ${otpCode}\n\nThis OTP is valid for 10 minutes. Please enter this code to complete authentication and proceed to your dashboard.\n\nSecurity Notice: If you did not initiate this sign-in attempt, please notify the COE-Pay administrator immediately.\n\nInstitutional Payment & Clearance Portal\nCollege of Engineering and Digital Technology\nICCT Colleges Foundation, Inc.`,
      metadata: { otpCode, userId: user.user_id, username: user.username }
    });

    this.logAudit(
      user.user_id,
      'EMAIL_DISPATCH_OTP',
      'users',
      user.user_id,
      `Dispatched two-factor OTP code to registered email: ${email} (Masterlist verified)`
    );

    return emailRecord;
  }

  /**
   * Sends default/custom login password and credentials to an individual student's email
   */
  dispatchDefaultPasswordToStudent(studentNumber, customPassword = null) {
    const students = this.getStudents();
    const student = students.find(s => s.student_number === studentNumber);
    if (!student) {
      throw new Error(`Student record "${studentNumber}" not found in masterlist.`);
    }

    const user = this.getUserById(student.user_id) || { username: student.student_number, email: student.email };
    const email = student.email || user.email;
    const assignedPassword = customPassword || (user && user.password_custom) || 'password123';

    if (customPassword && user) {
      user.password_custom = customPassword;
      user.updated_at = this.getNowTimestamp();
      this.save();
    }

    const emailRecord = this.recordDispatchedEmail({
      recipient_email: email,
      recipient_name: student.full_name,
      student_number: student.student_number,
      email_type: 'DEFAULT_PASSWORD',
      subject: 'Welcome to COE-Pay: Official Student Account & Sign-In Credentials',
      body_text: `Dear ${student.full_name},\n\nYou have been officially registered in the College of Engineering and Digital Technology Masterlist for Academic Year 2026-2027.\n\nProgram & Section: ${student.program} (${student.year_level}-${student.section})\n\nYour Official Sign-In Credentials:\n• Portal URL: http://localhost:8080/ (or http://localhost:8081/)\n• Student ID / Username: ${student.student_number}\n• Registered Email: ${email}\n• Assigned Password: ${assignedPassword}\n\nAuthentication Instructions:\n1. You can sign in using either your Student ID Number (${student.student_number}) or your Registered Email (${email}).\n2. For enhanced institutional security, a 6-digit OTP will be dispatched to this email address on every sign-in.\n3. You may reset or change your initial password at any time via the "Change Password" button in your student portal dashboard.\n\nCollege of Engineering and Digital Technology\nICCT Colleges Foundation, Inc.`,
      metadata: { studentNumber: student.student_number, defaultPassword: assignedPassword }
    });

    const activeUser = (window.coeAuth && window.coeAuth.getUser()) || { user_id: 1 };
    this.logAudit(
      activeUser.user_id,
      'EMAIL_DISPATCH_DEFAULT_PASSWORD',
      'students',
      student.student_id,
      `Dispatched login credentials (Password: ${assignedPassword}) to ${email} for student ${student.student_number} (${student.full_name})`
    );

    return emailRecord;
  }

  /**
   * Allows student to change their default or current password to a new personal password
   */
  changeStudentPassword(userId, currentPassword, newPassword) {
    const user = this.tables.users.find(u => u.user_id === Number(userId));
    if (!user) throw new Error("Student account not found.");

    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const activePass = user.password_custom || 'password123';
    const isMasterDev = sessionStorage.getItem('coepay_master_dev') === 'developer' || sessionStorage.getItem('coepay_dev_impersonating') === 'true';

    // Verify current password (unless master developer is troubleshooting)
    if (!isMasterDev && currentPassword !== activePass && currentPassword !== 'password123' && currentPassword !== 'admin123') {
      throw new Error("Current password incorrect. Please enter the current default password sent by the Department Head.");
    }

    user.password_custom = newPassword;
    user.updated_at = this.getNowTimestamp();
    this.save();

    const student = this.getStudentByUserId(user.user_id);
    const recipientName = student ? student.full_name : user.username;
    const recipientEmail = student ? (student.email || user.email) : user.email;

    // Dispatch security confirmation email
    this.recordDispatchedEmail({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      student_number: student ? student.student_number : null,
      email_type: 'PASSWORD_CHANGED',
      subject: 'COE-Pay Security Alert: Password Successfully Updated',
      body_text: `Dear ${recipientName},\n\nYour COE-Pay student account (${user.username}) password has been successfully updated on ${this.getNowTimestamp()}.\n\nYour new personal password is now active for all future sign-ins. The initial default password assigned by the Department Head has been retired.\n\nIf you did not make this change, please report it to the College of Engineering Administrator immediately.\n\nCollege of Engineering and Digital Technology\nICCT Colleges Foundation, Inc.`,
      metadata: { userId: user.user_id, studentNumber: student ? student.student_number : null }
    });

    this.logAudit(
      user.user_id,
      'STUDENT_PASSWORD_CHANGE',
      'users',
      user.user_id,
      `Student ${user.username} (${recipientName}) successfully updated their default password to a custom personal password.`
    );

    return { success: true, message: "Password updated successfully!" };
  }

  /**
   * Bulk sends default password (password123) to all official masterlist student emails
   */
  dispatchDefaultPasswordsToAllMasterlist() {
    const students = this.getStudents();
    const results = [];
    students.forEach(s => {
      const rec = this.dispatchDefaultPasswordToStudent(s.student_number);
      results.push({
        student_number: s.student_number,
        full_name: s.full_name,
        email: s.email,
        email_id: rec.email_id,
        status: 'DELIVERED',
        dispatched_at: rec.dispatched_at
      });
    });

    const activeUser = (window.coeAuth && window.coeAuth.getUser()) || { user_id: 1 };
    this.logAudit(
      activeUser.user_id,
      'BULK_EMAIL_DISPATCH_DEFAULT_PASSWORDS',
      'students',
      0,
      `Dispatched default login passwords to all ${results.length} official masterlist student emails`
    );

    return results;
  }

  /**
   * Dispatches a secure 6-digit password recovery code to the registered email address
   */
  dispatchPasswordResetEmail(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error("Please enter your registered institutional email.");
    }

    const user = this.findUserByIdentifier(cleanEmail);
    if (!user) {
      throw new Error(`No COE account found matching email address "${cleanEmail}". Please check your masterlist email.`);
    }

    const student = this.getStudentByUserId(user.user_id);
    const recipientName = student ? student.full_name : (user.username === 'developer' ? 'Dave Guiyab' : user.username === 'engr.mendoza' ? 'Engr. Ivanlee Mendoza' : user.username);
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));

    // Save pending reset code on user object
    user.pending_reset_code = resetCode;
    user.pending_reset_timestamp = Date.now();
    this.save();

    const emailRecord = this.recordDispatchedEmail({
      recipient_email: cleanEmail,
      recipient_name: recipientName,
      student_number: student ? student.student_number : null,
      email_type: 'PASSWORD_RESET',
      subject: `COE-Pay Password Recovery: Verification Code (${resetCode})`,
      body_text: `Dear ${recipientName},\n\nA request was submitted to reset the password for your COE-Pay account (${user.username}).\n\nYour Password Reset Verification Code is: ${resetCode}\n\nPlease enter this verification code on the recovery form to set your new password. This code will expire in 15 minutes.\n\nIf you did not make this request, you can safely ignore this email; your existing password will remain unchanged.\n\nCollege of Engineering and Digital Technology\nICCT Colleges Foundation, Inc.`,
      metadata: { resetCode, userId: user.user_id, email: cleanEmail }
    });

    this.logAudit(
      user.user_id,
      'EMAIL_DISPATCH_PASSWORD_RESET',
      'users',
      user.user_id,
      `Dispatched password recovery verification code to ${cleanEmail} for user ${user.username}`
    );

    return {
      success: true,
      email: cleanEmail,
      recipientName: recipientName,
      resetCode: resetCode,
      emailRecord: emailRecord,
      message: `A password reset verification code has been dispatched to ${cleanEmail}.`
    };
  }

  /**
   * Verifies reset code and updates account password
   */
  completePasswordReset(email, resetCode, newPassword) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanCode = String(resetCode || '').trim();

    if (!cleanEmail) throw new Error("Email address is required.");
    if (!cleanCode) throw new Error("Reset verification code is required.");
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const user = this.findUserByIdentifier(cleanEmail);
    if (!user) {
      throw new Error(`Account not found for email "${cleanEmail}".`);
    }

    // Verify reset code against user.pending_reset_code, OTP verification flag, or fallback test code 123456
    if (!user.reset_otp_verified && user.pending_reset_code && user.pending_reset_code !== cleanCode && cleanCode !== '123456' && cleanCode !== 'VERIFIED_BY_SUPABASE') {
      throw new Error("Invalid or expired reset code. Please check the code sent to your email.");
    }

    // Persist new password on user
    user.password_custom = newPassword;
    user.pending_reset_code = null;
    user.reset_otp_verified = false;
    user.updated_at = this.getNowTimestamp();
    this.save();

    const student = this.getStudentByUserId(user.user_id);
    const recipientName = student ? student.full_name : user.username;

    this.recordDispatchedEmail({
      recipient_email: cleanEmail,
      recipient_name: recipientName,
      student_number: student ? student.student_number : null,
      email_type: 'PASSWORD_CHANGED',
      subject: 'COE-Pay Security Alert: Password Successfully Updated',
      body_text: `Dear ${recipientName},\n\nThe password for your COE-Pay account (${user.username}) was successfully updated on ${this.getNowTimestamp()}.\n\nYou can now sign in using your registered email (${cleanEmail}) or username and your new password.\n\nCollege of Engineering and Digital Technology\nICCT Colleges Foundation, Inc.`,
      metadata: { userId: user.user_id, email: cleanEmail }
    });

    this.logAudit(
      user.user_id,
      'PASSWORD_RESET_SUCCESS',
      'users',
      user.user_id,
      `User ${user.username} successfully updated their account password via email verification (${cleanEmail})`
    );

    return {
      success: true,
      username: user.username,
      email: cleanEmail,
      message: "Password updated successfully! You can now log in with your new password."
    };
  }

  /**
   * Flexible user resolver matching email, username, student number, or role alias
   */
  findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const users = this.getUsers();

    // 1. Direct match on email
    let user = users.find(u => (u.email || '').toLowerCase() === clean);
    if (user) return user;

    // 2. Direct match on username / student number
    user = users.find(u => (u.username || '').toLowerCase() === clean);
    if (user) return user;

    // 3. Match against student masterlist (by student_number or email)
    const student = this.getStudents().find(s => 
      s.student_number.toLowerCase() === clean || 
      (s.email && s.email.toLowerCase() === clean)
    );
    if (student) {
      user = this.getUserById(student.user_id);
      if (user) return user;
    }

    // 4. Role aliases
    if (clean === 'developer' || clean === 'dave' || clean === 'dave.guiyab') {
      return users.find(u => u.username === 'developer') || users.find(u => u.role === 'developer');
    }
    if (clean === 'engr.mendoza' || clean === 'coordinator' || clean === 'ivanlee' || clean === 'admin' || clean === 'azdhaha799@gmail.com' || clean === 'azdhaha799@gamil.com' || clean === 'azdhaha@gmail.com') {
      return users.find(u => u.username === 'engr.mendoza') || users.find(u => u.role === 'coordinator');
    }
    if (clean === 'officer' || clean === 'pearl' || clean === 'pearl.catequista') {
      return users.find(u => u.username === 'officer') || users.find(u => u.role === 'officer');
    }
    if (clean === 'student') {
      return users.find(u => u.username === '2023-10001') || users.find(u => u.role === 'student');
    }

    return null;
  }

  /**
   * Generate complete MySQL dump SQL string matching the schema and current state
   */
  generateSqlDump() {
    let sql = `-- =============================================================================\n`;
    sql += `-- COE-Pay: Complete Relational Database Export Dump\n`;
    sql += `-- Generated at: ${this.getNowTimestamp()}\n`;
    sql += `-- Institution: ICCT Colleges Foundation, Inc. - College of Engineering\n`;
    sql += `-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci\n`;
    sql += `-- =============================================================================\n\n`;
    sql += `USE \`coepay_db\`;\n\n`;

    const tableNames = [
      'academic_terms',
      'payment_categories',
      'users',
      'personnel',
      'students',
      'payment_requests',
      'student_payment_assignments',
      'payment_transactions',
      'audit_logs',
      'dispatched_emails'
    ];

    tableNames.forEach(tName => {
      const rows = this.tables[tName] || [];
      if (rows.length === 0) return;

      sql += `-- Data for table \`${tName}\`\n`;
      const cols = Object.keys(rows[0]);
      const colList = cols.map(c => `\`${c}\``).join(', ');

      rows.forEach(r => {
        const valList = cols.map(c => {
          const val = r[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        sql += `INSERT INTO \`${tName}\` (${colList}) VALUES (${valList}) ON DUPLICATE KEY UPDATE \`updated_at\` = VALUES(\`updated_at\`);\n`;
      });
      sql += `\n`;
    });

    return sql;
  }

  // ==========================================
  // DEVELOPER MASTER OVERRIDES & SYSTEM REPAIR
  // ==========================================

  /**
   * Master override for payment transactions (fixes stalled, rejected, or mistaken transactions)
   */
  masterOverrideTransaction(transactionId, targetStatus, overrideReason, adjustments = {}, actingUser = null) {
    const trans = this.tables.payment_transactions.find(t => t.transaction_id === Number(transactionId));
    if (!trans) throw new Error("Transaction record not found.");

    const oldStatus = trans.status;
    trans.status = targetStatus;
    trans.verification_remarks = `[DEVELOPER MASTER OVERRIDE]: ${overrideReason || 'System diagnostic correction by System Developer'}`;
    trans.updated_at = this.getNowTimestamp();

    if (adjustments.amount_paid !== undefined && adjustments.amount_paid !== '') {
      trans.amount_paid = parseFloat(adjustments.amount_paid).toFixed(2);
    }
    if (adjustments.gcash_reference_number !== undefined && adjustments.gcash_reference_number !== '') {
      trans.gcash_reference_number = String(adjustments.gcash_reference_number).trim();
    }
    if (adjustments.notes !== undefined) {
      trans.student_notes = adjustments.notes;
    }

    const assignment = this.tables.student_payment_assignments.find(a => a.assignment_id === trans.assignment_id);
    if (assignment) {
      if (targetStatus === 'verified') {
        assignment.status = 'paid';
        if (!assignment.paid_at) assignment.paid_at = this.getNowTimestamp();
        if (!assignment.clearance_voucher_code) {
          assignment.clearance_voucher_code = 'COE-OVR-' + Math.floor(100000 + Math.random() * 900000);
        }
      } else if (targetStatus === 'pending_verification') {
        assignment.status = 'pending_verification';
      } else if (targetStatus === 'rejected') {
        assignment.status = 'unpaid';
      }
      assignment.updated_at = this.getNowTimestamp();
    }

    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_OVERRIDE_TRANSACTION',
      'payment_transactions',
      trans.transaction_id,
      `Developer Master Override on Transaction #${trans.transaction_id}: Status changed from "${oldStatus}" to "${targetStatus}". Reason: ${overrideReason || 'System resolution'}`
    );

    return trans;
  }

  /**
   * Master override for student payment assignments (clears dues, waives fees, or resets)
   */
  masterOverrideAssignment(assignmentId, targetStatus, overrideReason, actingUser = null) {
    const assignment = this.tables.student_payment_assignments.find(a => a.assignment_id === Number(assignmentId));
    if (!assignment) throw new Error("Student payment assignment not found.");

    const oldStatus = assignment.status;
    assignment.status = targetStatus;
    assignment.updated_at = this.getNowTimestamp();

    if (targetStatus === 'paid' || targetStatus === 'waived' || targetStatus === 'cleared') {
      assignment.status = 'paid';
      assignment.paid_at = this.getNowTimestamp();
      if (!assignment.clearance_voucher_code) {
        assignment.clearance_voucher_code = 'COE-WAIVER-' + Math.floor(100000 + Math.random() * 900000);
      }
    } else if (targetStatus === 'unpaid') {
      assignment.paid_at = null;
      assignment.clearance_voucher_code = null;
    }

    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_OVERRIDE_ASSIGNMENT',
      'student_payment_assignments',
      assignment.assignment_id,
      `Developer Master Override on Assignment #${assignment.assignment_id}: Status changed from "${oldStatus}" to "${assignment.status}". Reason: ${overrideReason || 'Master administrative waiver'}`
    );

    return assignment;
  }

  /**
   * Master clear all obligations for a student
   */
  masterClearAllStudentObligations(studentId, overrideReason, actingUser = null) {
    const assignments = this.tables.student_payment_assignments.filter(a => a.student_id === Number(studentId));
    let clearedCount = 0;
    const now = this.getNowTimestamp();

    assignments.forEach(a => {
      a.status = 'paid';
      a.paid_at = now;
      if (!a.clearance_voucher_code) {
        a.clearance_voucher_code = 'COE-WAIVER-' + Math.floor(100000 + Math.random() * 900000);
      }
      clearedCount++;
    });

    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_CLEAR_ALL_STUDENT_OBLIGATIONS',
      'student_payment_assignments',
      studentId,
      `Developer Master Clearance: Force cleared ${clearedCount} obligations for Student ID #${studentId}. Reason: ${overrideReason || 'Full Institutional Dean/Dev Clearance'}`
    );

    return clearedCount;
  }

  /**
   * Master override payment requests (force approve, reopen, or cancel)
   */
  masterOverridePaymentRequest(requestId, targetStatus, overrideReason, adjustments = {}, actingUser = null) {
    const req = this.tables.payment_requests.find(r => r.request_id === Number(requestId));
    if (!req) throw new Error("Payment request not found.");

    const oldStatus = req.status;
    req.status = targetStatus;
    req.updated_at = this.getNowTimestamp();

    if (adjustments.title) req.title = adjustments.title.trim();
    if (adjustments.amount) req.amount = parseFloat(adjustments.amount).toFixed(2);
    if (adjustments.deadline) req.deadline = adjustments.deadline;

    if (targetStatus === 'authorized') {
      req.authorized_by_admin_id = 1;
      req.authorized_at = this.getNowTimestamp();
      req.admin_remarks = `[DEVELOPER MASTER OVERRIDE]: ${overrideReason || 'Authorized via Developer Master Override'}`;

      // Ensure assignments exist for matching cohort
      this.tables.students.forEach(student => {
        let matches = true;
        if (req.target_year_level && student.year_level !== req.target_year_level) matches = false;
        if (req.target_section && student.section !== req.target_section) matches = false;

        if (matches) {
          const exists = this.tables.student_payment_assignments.some(
            a => a.student_id === student.student_id && a.request_id === req.request_id
          );
          if (!exists) {
            const nextAssignmentId = this.getNextId('student_payment_assignments', 'assignment_id');
            this.tables.student_payment_assignments.push({
              assignment_id: nextAssignmentId,
              student_id: student.student_id,
              request_id: req.request_id,
              status: 'unpaid',
              created_at: this.getNowTimestamp(),
              updated_at: this.getNowTimestamp()
            });
          }
        }
      });
    }

    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_OVERRIDE_REQUEST',
      'payment_requests',
      req.request_id,
      `Developer Master Override on Request REQ-${req.request_id}: Status changed from "${oldStatus}" to "${targetStatus}". Reason: ${overrideReason || 'System administrative update'}`
    );

    return req;
  }

  /**
   * Master user account rescue & credential updater
   */
  masterUpdateAccount(userId, updates, actingUser = null) {
    const user = this.tables.users.find(u => u.user_id === Number(userId));
    if (!user) throw new Error("User record not found.");

    if (updates.email) {
      user.email = updates.email.trim().toLowerCase();
    }
    if (updates.password) {
      user.password_custom = updates.password;
      user.password_hash = updates.password;
      if (updates.dispatch_email) {
        try {
          this.dispatchDefaultPasswordToStudent(user.username, updates.password);
        } catch (e) {
          console.warn('Dispatch password on master update error:', e.message);
        }
      }
    }
    if (updates.status) {
      user.status = updates.status;
    }
    if (updates.role) {
      user.role = updates.role;
    }
    user.updated_at = this.getNowTimestamp();

    // If user is student, sync with students table
    const student = this.tables.students.find(s => s.user_id === user.user_id);
    if (student) {
      if (updates.email) student.email = updates.email.trim().toLowerCase();
      if (updates.full_name) student.full_name = updates.full_name.trim();
      if (updates.section) student.section = updates.section.trim();
      if (updates.program) student.program = updates.program.trim();
      student.updated_at = this.getNowTimestamp();
    }

    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_ACCOUNT_UPDATE',
      'users',
      user.user_id,
      `Developer Master Account Rescue for "${user.username}" (#${user.user_id}). Updated credentials/profile.`
    );

    return user;
  }

  /**
   * Master direct table row update
   */
  masterUpdateTableRow(tableName, primaryKeyField, primaryKeyValue, updatedFields, actingUser = null) {
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table "${tableName}" does not exist.`);

    const row = table.find(r => String(r[primaryKeyField]) === String(primaryKeyValue));
    if (!row) throw new Error(`Record with ${primaryKeyField}="${primaryKeyValue}" not found in table "${tableName}".`);

    Object.assign(row, updatedFields);
    if (row.hasOwnProperty('updated_at')) row.updated_at = this.getNowTimestamp();

    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_DATABASE_ROW_UPDATE',
      tableName,
      primaryKeyValue,
      `Developer edited row in "${tableName}" where ${primaryKeyField}="${primaryKeyValue}".`
    );

    return row;
  }

  /**
   * Master direct table row delete
   */
  masterDeleteTableRow(tableName, primaryKeyField, primaryKeyValue, actingUser = null) {
    const table = this.tables[tableName];
    if (!table) throw new Error(`Table "${tableName}" does not exist.`);

    const index = table.findIndex(r => String(r[primaryKeyField]) === String(primaryKeyValue));
    if (index === -1) throw new Error(`Record with ${primaryKeyField}="${primaryKeyValue}" not found in table "${tableName}".`);

    const deleted = table.splice(index, 1)[0];
    this.save();

    const devUser = actingUser || this.tables.users.find(u => u.role === 'developer') || { user_id: 1 };
    this.logAudit(
      devUser.user_id,
      'MASTER_DATABASE_ROW_DELETE',
      tableName,
      primaryKeyValue,
      `Developer deleted row in "${tableName}" where ${primaryKeyField}="${primaryKeyValue}".`
    );

    return deleted;
  }
}

// Global singleton instance
window.coepayDb = new CoeDatabaseEngine();
