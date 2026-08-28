# Workforce Security, Training, and Documented Policies

This document details the policies governing workforce access, secure engineering standards (SDLC), and security training expectations for employees and contractors working on Liquidation Port.

---

## 1. Access Control Policy

We operate on the principle of **Least Privilege (PoLP)**. Employees are granted only the minimum systems access necessary to perform their roles.

### Administrative Access Management
- **Supabase Console:** Restricted to core operations team. MFA (Multi-Factor Authentication) is mandatory.
- **Stripe Dashboard:** Developer access restricted to "Developer" or "Read-Only" roles. Financial details are strictly limited to finance and executive teams.
- **Hosting Environment (AWS/Vercel):** SSH access disabled; all deployments are run through automated CI/CD pipelines with strictly defined secrets scope.

### Employee Offboarding Checklist
Upon termination or offboarding, IT and DevOps must revoke all credentials within **4 hours**:
1. Remove from GitHub organization.
2. Terminate Supabase dashboard invitation.
3. Terminate Stripe team access.
4. Block Slack/Workspace credentials.
5. Force close all active database/OAuth sessions.

---

## 2. Secure Development Lifecycle (SDLC) Policy

Our software development process incorporates security checks at every phase.

```
┌──────────────┐      ┌────────────────┐      ┌───────────────┐
│ Code Review  │ ───> │ Static Scan    │ ───> │ Secrets check │
└──────────────┘      └────────────────┘      └───────────────┘
```

### A. Code Review Guidelines
- Every pull request (PR) requires at least **one approved review** from a senior engineer before merge.
- Reviews must explicitly scan for:
  - **SQL Injections:** Ensure all database calls utilize Prisma's parameterized queries (parameterized input, no dynamic string interpolation in `queryRawUnsafe`).
  - **Mass Assignment:** Verify that DTO input validation is strictly typed and has `whitelist: true` enabled (prevents hackers from sending unrequested fields like `{ role: 'admin' }`).
  - **Auth Validation:** Check that endpoints require appropriateguards like `@UseGuards(SupabaseAuthGuard, RolesGuard)` and decorators like `@Roles('admin')`.

### B. Secrets Management Rules
- **No Hardcoded Keys:** Under no circumstances should API keys, database connection strings, passwords, or salts be committed to Git.
- **dotenv Policy:** All environment configurations are stored in `.env` (gitignored). Example values are kept in `.env.example`.
- **Environment Isolation:** Never use production database credentials in local dev environments.

---

## 3. Workforce Security Training Program

All workforce members with system access must participate in periodic training.

### Onboarding Security Checklist
New engineers must complete this checklist within 14 days of hiring:
- Set up MFA on GitHub, Google Workspace, and Supabase dashboards.
- Read and acknowledge the [Security Risk Assessment Plan](file:///c:/Users/DennisW/Documents/Ecom/liquidationport/docs/security/security-risk-assessment.md).
- Complete OWASP Top 10 web vulnerabilities training.

### Annual Training Curriculum
- **Phishing Awareness:** Safe email practices, identifying spoofed domains, and social engineering containment.
- **Secure Code Training (OWASP):** Focusing on SQL injections, Cross-Site Scripting (XSS), insecure deserialization, and authentication bypasses in NestJS/Prisma environments.
- **Compliance Basics:** Basic training on PCI-DSS compliance standards (focusing on Stripe integration security boundaries) and GDPR/CCPA data privacy regulations.
