// SecureCampus Mock Supabase Client Layer
// This simulates the Supabase Client API when NEXT_PUBLIC_USE_MOCK_PROVIDER=true

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  enrollment_no?: string;
  department?: string;
  phone?: string;
  avatar_url?: string;
}

// Initial mock database state
const INITIAL_PROFILES: MockUser[] = [
  {
    id: 'admin-uuid-1111-2222-333333333333',
    email: 'admin@securecampus.edu',
    full_name: 'Dr. Alan Turing',
    role: 'admin',
    department: 'Administration',
    phone: '+1 555-0100',
    avatar_url: ''
  },
  {
    id: 'faculty-uuid-1111-2222-333333333333',
    email: 'faculty@securecampus.edu',
    full_name: 'Dr. Grace Hopper',
    role: 'faculty',
    department: 'Computer Science',
    phone: '+1 555-0120',
    avatar_url: ''
  },
  {
    id: 'student-uuid-1111-2222-333333333333',
    email: 'student@securecampus.edu',
    full_name: 'Ada Lovelace',
    role: 'student',
    enrollment_no: 'SC20260001',
    department: 'Computer Science',
    phone: '+1 555-0199',
    avatar_url: ''
  },
  {
    id: 'student-uuid-2222-3333-444444444444',
    email: 'charles.babbage@securecampus.edu',
    full_name: 'Charles Babbage',
    role: 'student',
    enrollment_no: 'SC20260002',
    department: 'Mechanical Engineering',
    phone: '+1 555-0198',
    avatar_url: ''
  },
  {
    id: 'student-uuid-3333-4444-555555555555',
    email: 'margaret.hamilton@securecampus.edu',
    full_name: 'Margaret Hamilton',
    role: 'student',
    enrollment_no: 'SC20260003',
    department: 'Software Engineering',
    phone: '+1 555-0197',
    avatar_url: ''
  }
];

export interface MockAuditLog {
  id: string;
  user_id: string | null;
  actor_email: string;
  action: string;
  ip_address: string;
  status: string;
  details: string;
  created_at: string;
}

const INITIAL_LOGS: MockAuditLog[] = [
  {
    id: 'log-1',
    user_id: 'admin-uuid-1111-2222-333333333333',
    actor_email: 'admin@securecampus.edu',
    action: 'LOGIN_SUCCESS',
    ip_address: '127.0.0.1',
    status: 'SUCCESS',
    details: 'Admin logged in from local machine',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'log-2',
    user_id: 'student-uuid-1111-2222-333333333333',
    actor_email: 'student@securecampus.edu',
    action: 'PROFILE_UPDATE',
    ip_address: '127.0.0.1',
    status: 'SUCCESS',
    details: 'Updated phone number',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

// Helper to interact with storage/cookies in both Client and Server contexts safely
class MockDatabase {
  private getStorageData<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') {
      return defaultVal;
    }
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    try {
      return JSON.parse(val);
    } catch {
      return defaultVal;
    }
  }

  private setStorageData<T>(key: string, data: T): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  get profiles(): MockUser[] {
    return this.getStorageData('mock_profiles', INITIAL_PROFILES);
  }

  set profiles(val: MockUser[]) {
    this.setStorageData('mock_profiles', val);
  }

  get auditLogs(): MockAuditLog[] {
    return this.getStorageData('mock_audit_logs', INITIAL_LOGS);
  }

  set auditLogs(val: MockAuditLog[]) {
    this.setStorageData('mock_audit_logs', val);
  }
}

export const db = new MockDatabase();

// Cookie helpers for simulated server auth
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax; Secure';
}

function eraseCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// Global server sessions cache to bridge Server Components
// Using global object to store session state if in-memory
const globalForMock = global as unknown as {
  serverSession: string | null;
  serverUser: MockUser | null;
};
if (!globalForMock.serverSession) {
  globalForMock.serverSession = null;
  globalForMock.serverUser = null;
}

// Mock Client class simulating SupabaseClient
export class MockSupabaseClient {
  private currentCookieOptions: any;

  constructor(cookieOptions?: any) {
    this.currentCookieOptions = cookieOptions;
  }

  // Auth module
  auth = {
    signUp: async ({ email, password, options }: any) => {
      // Input validation simulation
      if (!email || !password) {
        return { data: { user: null }, error: { message: 'Email and password required' } };
      }
      
      const existing = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return { data: { user: null }, error: { message: 'User already exists' } };
      }

      const id = 'user-' + Math.random().toString(36).substr(2, 9);
      const role = options?.data?.role || 'student';
      const metadata = options?.data || {};

      const newUser: MockUser = {
        id,
        email,
        full_name: metadata.full_name || email.split('@')[0],
        role,
        enrollment_no: metadata.enrollment_no,
        department: metadata.department,
        phone: metadata.phone,
        avatar_url: ''
      };

      const profiles = db.profiles;
      profiles.push(newUser);
      db.profiles = profiles;

      // Add audit log
      const logs = db.auditLogs;
      logs.push({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        user_id: id,
        actor_email: email,
        action: 'SIGNUP_SUCCESS',
        ip_address: '127.0.0.1',
        status: 'SUCCESS',
        details: `Created new account with role ${role}`,
        created_at: new Date().toISOString()
      });
      db.auditLogs = logs;

      const session = {
        access_token: 'mock-jwt-' + id,
        user: { id, email, user_metadata: metadata }
      };

      setCookie('securecampus-session', JSON.stringify(session));
      globalForMock.serverSession = JSON.stringify(session);
      globalForMock.serverUser = newUser;

      return { data: { user: session.user, session }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      // Simply match with initialized mock user accounts
      const user = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!user || password !== 'Password123') {
        // Log failure
        const logs = db.auditLogs;
        logs.push({
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          user_id: null,
          actor_email: email || 'anonymous',
          action: 'LOGIN_FAILURE',
          ip_address: '127.0.0.1',
          status: 'FAILED',
          details: 'Invalid password or user not found',
          created_at: new Date().toISOString()
        });
        db.auditLogs = logs;

        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
      }

      const session = {
        access_token: 'mock-jwt-' + user.id,
        user: { 
          id: user.id, 
          email: user.email, 
          user_metadata: { 
            full_name: user.full_name,
            role: user.role
          } 
        }
      };

      setCookie('securecampus-session', JSON.stringify(session));
      globalForMock.serverSession = JSON.stringify(session);
      globalForMock.serverUser = user;

      // Log success
      const logs = db.auditLogs;
      logs.push({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        user_id: user.id,
        actor_email: user.email,
        action: 'LOGIN_SUCCESS',
        ip_address: '127.0.0.1',
        status: 'SUCCESS',
        details: `Role ${user.role} logged in successfully`,
        created_at: new Date().toISOString()
      });
      db.auditLogs = logs;

      return { data: { user: session.user, session }, error: null };
    },

    signOut: async () => {
      const activeUser = this.getActiveUserSync();
      if (activeUser) {
        const logs = db.auditLogs;
        logs.push({
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          user_id: activeUser.id,
          actor_email: activeUser.email,
          action: 'LOGOUT',
          ip_address: '127.0.0.1',
          status: 'SUCCESS',
          details: 'User logged out',
          created_at: new Date().toISOString()
        });
        db.auditLogs = logs;
      }

      eraseCookie('securecampus-session');
      globalForMock.serverSession = null;
      globalForMock.serverUser = null;
      return { error: null };
    },

    getSession: async () => {
      const sessionStr = typeof window !== 'undefined' 
        ? getCookie('securecampus-session') 
        : (this.currentCookieOptions?.cookies?.get?.('securecampus-session')?.value || globalForMock.serverSession);
      
      if (!sessionStr) return { data: { session: null }, error: null };
      try {
        const session = JSON.parse(sessionStr);
        return { data: { session }, error: null };
      } catch {
        return { data: { session: null }, error: null };
      }
    },

    getUser: async () => {
      const sessionStr = typeof window !== 'undefined' 
        ? getCookie('securecampus-session') 
        : (this.currentCookieOptions?.cookies?.get?.('securecampus-session')?.value || globalForMock.serverSession);

      if (!sessionStr) return { data: { user: null }, error: null };
      try {
        const session = JSON.parse(sessionStr);
        return { data: { user: session.user }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    }
  };

  private getActiveUserSync(): MockUser | null {
    const sessionStr = typeof window !== 'undefined' 
      ? getCookie('securecampus-session') 
      : (this.currentCookieOptions?.cookies?.get?.('securecampus-session')?.value || globalForMock.serverSession);

    if (!sessionStr) return null;
    try {
      const session = JSON.parse(sessionStr);
      return db.profiles.find(p => p.id === session.user.id) || null;
    } catch {
      return null;
    }
  }

  // Database module
  from(table: string) {
    const activeUser = this.getActiveUserSync();
    
    // Simple mock builder
    class QueryBuilder {
      private data: any[] = [];
      private table: string;
      private activeUser: MockUser | null;

      constructor(table: string, activeUser: MockUser | null) {
        this.table = table;
        this.activeUser = activeUser;
        
        if (table === 'profiles') {
          this.data = JSON.parse(JSON.stringify(db.profiles));
        } else if (table === 'audit_logs') {
          this.data = JSON.parse(JSON.stringify(db.auditLogs));
        }
      }

      select(fields?: string, options?: { count?: string }) {
        // Simulation of reading
        // Applying RLS simulated rules
        if (this.table === 'audit_logs') {
          // RLS: Only admins can view audit logs
          if (!this.activeUser || this.activeUser.role !== 'admin') {
            this.data = []; // empty result due to permission
          }
        }
        return this;
      }

      insert(row: any) {
        if (this.table === 'audit_logs') {
          // Allow inserts
          const logs = db.auditLogs;
          const newLog = {
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            user_id: row.user_id || null,
            actor_email: row.actor_email || 'anonymous',
            action: row.action || 'UNKNOWN',
            ip_address: row.ip_address || '127.0.0.1',
            status: row.status || 'SUCCESS',
            details: typeof row.details === 'object' ? JSON.stringify(row.details) : String(row.details || ''),
            created_at: new Date().toISOString()
          };
          logs.unshift(newLog); // newest first
          db.auditLogs = logs;
          this.data = [newLog];
        }
        return this;
      }

      update(updates: any) {
        if (this.table === 'profiles') {
          // Filter to update specific rows
          // RLS: User can only update their own profile, unless they are admin
          this.data = this.data.map(p => {
            const hasAccess = this.activeUser && (this.activeUser.role === 'admin' || this.activeUser.id === p.id);
            if (hasAccess) {
              const updated = { ...p, ...updates };
              // Prevent non-admins from updating their role
              if (this.activeUser && this.activeUser.role !== 'admin') {
                updated.role = p.role;
              }
              // Save back
              const allProfiles = db.profiles;
              const idx = allProfiles.findIndex(ap => ap.id === p.id);
              if (idx !== -1) {
                allProfiles[idx] = updated;
                db.profiles = allProfiles;
              }
              return updated;
            }
            return p;
          });
        }
        return this;
      }

      eq(field: string, value: any) {
        this.data = this.data.filter(item => item[field] === value);
        return this;
      }

      single() {
        return { data: this.data[0] || null, error: this.data[0] ? null : { message: 'Row not found' } };
      }

      // Chain return
      then(resolve: any) {
        setTimeout(() => {
          resolve({ data: this.data, error: null, count: this.data.length });
        }, 0);
        return this;
      }

      // Add methods for search
      or(filterString: string) {
        // e.g. "full_name.ilike.%ada%,enrollment_no.ilike.%ada%"
        // Parse simple OR query for mock search
        const parts = filterString.split(',');
        this.data = this.data.filter(item => {
          return parts.some(part => {
            const [field, op, val] = part.split('.');
            if (op === 'ilike') {
              const searchVal = val.replace(/%/g, '').toLowerCase();
              return String(item[field] || '').toLowerCase().includes(searchVal);
            }
            return false;
          });
        });
        return this;
      }

      ilike(field: string, value: string) {
        const searchVal = value.replace(/%/g, '').toLowerCase();
        this.data = this.data.filter(item => 
          String(item[field] || '').toLowerCase().includes(searchVal)
        );
        return this;
      }

      range(from: number, to: number) {
        this.data = this.data.slice(from, to + 1);
        return this;
      }
    }

    return new QueryBuilder(table, activeUser);
  }

  // Storage module
  storage = {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File, options?: any) => {
          // Mock uploading: Convert file to mock URL or read as base64 in client
          return { data: { path }, error: null };
        },
        getPublicUrl: (path: string) => {
          // Just return a simulated public URL or base64 placeholder
          // For simplicity we return a mock visual avatar from a public API or a simple geometric avatar
          return { data: { publicUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(path)}` } };
        }
      };
    }
  };
}
