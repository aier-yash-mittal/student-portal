# SecureCampus — Protected Student Portal

SecureCampus is a production-ready, security-first Student Portal built using **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + Auth + Storage)**. 

Designed under Zero-Trust architecture principles, SecureCampus implements robust role-based access controls (RBAC), strict database Row Level Security (RLS), and a fully automated DevSecOps CI/CD pipeline verifying code safety on every commit.

---

## 1. System Architecture Diagram

```mermaid
graph TD
    User([Browser Client]) -->|HTTPS Requests| Cloudflare[Vercel Edge CDN]
    Cloudflare -->|Security Headers / CSP| NextMiddleware[Next.js Middleware]
    
    subgraph Next.js Server (Vercel)
        NextMiddleware -->|Auth Route Checks| ServerActions[Next.js Server Actions]
        ServerActions -->|Zod Validation / IP Logging| ServerClient[Supabase Server Client]
    end
    
    subgraph Supabase Security Layer
        ServerClient -->|Session Cookies / JWT| SubAuth[Supabase Auth]
        ServerClient -->|SQL Queries| SubDB[PostgreSQL DB]
        ServerClient -->|File Storage| SubStorage[Supabase Storage]
        
        SubDB -->|Enforces RLS Policies| ProfilesTable[(profiles Table)]
        SubDB -->|Enforces RLS Policies| LogsTable[(audit_logs Table)]
        SubStorage -->|Restricts Folders| AvatarsBucket[avatars Bucket]
    end

    classDef security fill:#990000,stroke:#330000,stroke-width:1px,color:#fff;
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:1px,color:#fff;
    classDef server fill:#27272a,stroke:#3f3f46,stroke-width:1px,color:#fff;
    
    class NextMiddleware,SubAuth,ProfilesTable,LogsTable,AvatarsBucket security;
    class User client;
    class ServerActions,ServerClient,SubDB server;
```

---

## 2. Technical Stack

*   **Framework**: Next.js 15 (App Router, Server Actions, Async Cookies API)
*   **Language**: TypeScript (Strict mode enabled)
*   **Styling**: Tailwind CSS v4 (Modern native setup)
*   **Backend Database & Auth**: Supabase (Auth + PostgreSQL + Storage)
*   **Validation**: Zod (Input sanitization & type enforcement)
*   **Linter & SAST**: ESLint (Security Rules plugins) & Semgrep
*   **CI/CD Pipeline**: GitHub Actions

---

## 3. Database Schema Specification

Below is the PostgreSQL schema representation matching [supabase/migrations/schema.sql](file:///C:/Users/yashm/OneDrive/Desktop/student%20portal/supabase/migrations/schema.sql):

### 3.1. Enums
*   `user_role`: `'student'`, `'faculty'`, `'admin'`

### 3.2. Tables

#### `profiles` (extends `auth.users`)
| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Linked user uuid |
| `email` | `TEXT` | `NOT NULL` | User email address |
| `full_name` | `TEXT` | - | Display name |
| `role` | `user_role` | `DEFAULT 'student'`, `NOT NULL` | Role-based Authorization |
| `enrollment_no`| `TEXT` | `UNIQUE` | Student index ID (null for others) |
| `department` | `TEXT` | - | Academic branch |
| `phone` | `TEXT` | - | E.164 Contact number |
| `avatar_url` | `TEXT` | - | Public URL of profile photo |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT now()`, `NOT NULL` | Audit timestamp |
| `updated_at` | `TIMESTAMPTZ`| `DEFAULT now()`, `NOT NULL` | Triggered change log |

#### `audit_logs`
| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Event identifier |
| `user_id` | `UUID` | `REFERENCES auth.users(id) ON DELETE SET NULL` | Target actor identifier |
| `actor_email` | `TEXT` | - | Target actor email |
| `action` | `TEXT` | `NOT NULL` | Event key (e.g. `LOGIN_SUCCESS`, `STUDENT_SEARCH`) |
| `ip_address` | `TEXT` | - | Client IPv4/IPv6 address |
| `status` | `TEXT` | `NOT NULL` | Event status (`SUCCESS` / `FAILED`) |
| `details` | `JSONB` | - | Dynamic JSON metadata payload |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT now()`, `NOT NULL` | Event log time |

---

## 4. Security-First Architecture & Mitigation Controls

SecureCampus implements comprehensive defensive controls against the OWASP Top 10 vulnerabilities:

### 4.1. Row Level Security (RLS) & IDOR Protection
*   **Enforcement**: Row Level Security is enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) on all database tables.
*   **Profiles Read**: Authenticated users can read other student profiles (needed for search), but update rights are strictly limited to the profile owner:
    ```sql
    CREATE POLICY "Allow users to update own profile" 
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND (
        CASE WHEN get_current_user_role() = 'admin'::user_role THEN true
        ELSE role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        END
    ));
    ```
*   **Admin Override**: A recursion-free security definer function (`get_current_user_role()`) evaluates the requesting user's role and grants administrators complete access to all rows.
*   **Audit logs**: Users can only insert logs matching their own `auth.uid()`. Selecting audit log entries is locked down exclusively to the `'admin'` role.

### 4.2. CSRF & XSS Protection
*   **XSS Mitigation**: Content-Security-Policy (CSP) headers are configured on Vercel routes via `next.config.ts`. Inline scripts are blocked (except `unsafe-inline` required for dev tool loaders), and data loading is restricted to verified domains (`'self'`, `https://*.supabase.co`, and `https://api.dicebear.com` for dynamic avatars). JSX natively sanitizes all rendering inputs.
*   **CSRF Mitigation**: Next.js 15 Server Actions run with built-in CSRF prevention. Session tokens are managed in secure HTTP-only cookies (`SameSite=Lax`, `Secure`, `HttpOnly`), ensuring tokens cannot be intercepted via browser scripts.

### 4.3. SQL Injection Prevention
*   All queries bypass dynamic SQL string assembly. The application client communicates with PostgreSQL utilizing Supabase's PostgREST interface, translating JavaScript calls into parameterized SQL queries natively.

### 4.4. Rate Limiting & Account Security
*   **Auth Limits**: Account password policies, registration rate limits, and verification requirements are managed directly by Supabase Auth (utilizing bcrypt-based hashing at the database storage layer).
*   **Audit Logging**: The application writes database entries tracking all login successes, failed login attempts (logging the target email, IP address, and response), searches run, and profile parameters modified.

---

## 5. DevSecOps Pipeline & Security Scanning (CI/CD)

The GitHub Actions workflow defined in [.github/workflows/security-checks.yml](file:///C:/Users/yashm/OneDrive/Desktop/student%20portal/.github/workflows/security-checks.yml) implements a comprehensive automated inspection on every commit and PR:

1.  **Secret Leak Verification (Gitleaks)**: Scans the Git history to detect high-entropy credentials, tokens, or private keys mistakenly checked into source files.
2.  **Dependency Security Audit (npm audit)**: Scans project dependencies against the npm vulnerability database, failing the build automatically if high or critical severity alerts are discovered.
3.  **Static Application Security Testing (Semgrep)**: Automatically checks source code patterns against security rules (rulesets for OWASP top 10, XSS potentials, and cryptographically weak methods).
4.  **Static Rule Linting (ESLint Security)**: Lint audits enforce coding practices using `eslint-plugin-security` and `eslint-plugin-no-unsanitized` configured directly in `eslint.config.mjs`.
5.  **OWASP Dependency-Check**: Scans external packages using NVD (National Vulnerability Database) feeds, outputting an interactive HTML security report and failing on any library with a CVSS rating above 7.0 (High).
6.  **Container Audit (Trivy)**: Triggers automatically if a `Dockerfile` is added, auditing base images and binaries for package vulnerabilities.

---

## 6. Local Development Setup (High Fidelity Mock Mode)

To allow immediate review, testing, and development without configuring a live Supabase account, SecureCampus comes pre-configured with a **High-Fidelity Client-Side Mock Database Layer** that simulates authentication sessions, database updates, storage uploads, RLS checks, and audit logging.

### 6.1. Steps to Run Locally

1.  **Clone the Repository** and navigate to the folder.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Ensure Environment Variables** are set. A `.env.local` file has been pre-configured with mock settings:
    ```env
    NEXT_PUBLIC_USE_MOCK_PROVIDER=true
    NEXT_PUBLIC_SUPABASE_URL=https://mock.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-12345
    ```
4.  **Start the Dev Server**:
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:3000` in your browser.

### 6.2. Mock Demo Accounts (Active in Mock Mode)
You can log in to the portal using these demo accounts (Password: `Password123`):

*   **Administrator**: `admin@securecampus.edu` (Permissions: View Dashboard telemetry, View/Update all Profiles, Search Students, View full Audit Log Ledger).
*   **Faculty**: `faculty@securecampus.edu` (Permissions: View Dashboard telemetry, Search Students, View/Update own Profile).
*   **Student**: `student@securecampus.edu` (Permissions: View own Student Dashboard, View/Update own Profile, search disabled).

---

## 7. Live Supabase Setup (PostgreSQL Database Migration)

When you are ready to connect to a live Supabase instance:

1.  Create a new project in the [Supabase Dashboard](https://supabase.com).
2.  Navigate to the **SQL Editor** in Supabase and paste the contents of `supabase/migrations/schema.sql`. Run the script to generate tables, enums, triggers, and RLS policies.
3.  Create a storage bucket named `avatars` under **Storage** in Supabase. Set it to public, and execute the storage RLS policies listed at the bottom of the SQL script.
4.  Update your project `.env.local` to point to your live credentials:
    ```env
    NEXT_PUBLIC_USE_MOCK_PROVIDER=false
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    ```
5.  Restart the Next.js server. The application will now read and write to your live cloud databases.

---

## 8. Deployment Guide (Vercel Integration)

SecureCampus is designed to deploy seamlessly to Vercel:

1.  Push your code to a private or public GitHub repository.
2.  Import the project in [Vercel](https://vercel.com/new).
3.  Under **Environment Variables**, configure:
    *   `NEXT_PUBLIC_USE_MOCK_PROVIDER` = `false`
    *   `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-public-key`
    *   `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
    *   `SESSION_COOKIE_NAME` = `securecampus-session`
    *   `JWT_SECRET` = `[generate-a-32-char-random-string]`
4.  Click **Deploy**. Vercel will automatically configure the SSL layers, host the App Router build, and set up CI/CD triggers that redeploy the application on every push to your main branch.
