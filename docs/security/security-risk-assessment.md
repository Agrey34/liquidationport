# Regular Security Risk Assessment Plan

This document establishes the security risk assessment policies, methodologies, threat models, and mitigation matrices for the Liquidation Port e-commerce platform.

---

## 1. Risk Assessment Methodology

Our risk assessment follows the **NIST SP 800-30** standard for conducting risk assessments:

$$\text{Risk Score} = \text{Likelihood (1-5)} \times \text{Impact (1-5)}$$

- **Likelihood Rating:**
  - 1 (Rare), 2 (Unlikely), 3 (Possible), 4 (Likely), 5 (Almost Certain)
- **Impact Rating:**
  - 1 (Insignificant), 2 (Minor), 3 (Moderate), 4 (Major), 5 (Catastrophic)
- **Risk Category Matrix:**
  - **1 - 5:** Low Risk (Acceptable with standard monitoring).
  - **6 - 12:** Medium Risk (Mitigation plan required within 60 days).
  - **15 - 25:** High Risk (Critical priority; immediate mitigation required).

---

## 2. Threat Modeling & Risk Mitigation Matrix

### A. Client-Side Price Manipulation
- **Description:** A malicious user modifies the product price payload in the DOM or POST request during checkout.
- **Likelihood:** 4 (Likely)
- **Impact:** 4 (Major financial loss)
- **Risk Score:** 16 (High Risk)
- **Mitigation:** Strict server-side validation. NestJS `OrdersService` must query the database for live price variants during order creation and ignore any price/total inputs sent from the frontend.

### B. Row Level Security (RLS) Bypass
- **Description:** Direct client access via Supabase JS client queries database tables without strict RLS validation policies enabled on exposed tables.
- **Likelihood:** 3 (Possible)
- **Impact:** 5 (Catastrophic - wholesale user data leak)
- **Risk Score:** 15 (High Risk)
- **Mitigation:**
  - Enforce RLS on **every** table in the `public` schema.
  - NestJS API bypasses RLS safely using the private `SUPABASE_SERVICE_ROLE_KEY` connection, but all client-side queries use the public `anon` or user-specific JWTs.
  - Conduct regular checks: `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`

### C. Stripe Webhook Replay Attacks
- **Description:** A hacker intercepts a Stripe payment success webhook and replays the payload to `/api/v1/payments/webhook` to mark unpaid orders as paid.
- **Likelihood:** 3 (Possible)
- **Impact:** 4 (Major)
- **Risk Score:** 12 (Medium Risk)
- **Mitigation:** 
  - **Signature Verification:** Enforce `stripe.webhooks.constructEvent()` verification on all webhook controllers using NestJS raw request bodies.
  - **Idempotency:** Track webhook event IDs in a `payment_events` database table. Reject duplicate processing of the same event ID.

### D. Session Hijacking / Weak Local Storage Secrets
- **Description:** XSS payload steals JWT access tokens stored insecurely in local storage.
- **Likelihood:** 3 (Possible)
- **Impact:** 4 (Major)
- **Risk Score:** 12 (Medium Risk)
- **Mitigation:**
  - Next.js stores authentication tokens inside **HttpOnly Cookies** (secure, same-site strict) rather than `localStorage`.
  - Enforce `helmet` globally to restrict inline script injection.

---

## 3. Scheduled Risk Assessments Program

To maintain high security, the dev team runs scheduled assessments:

```
┌───────────────────────┬───────────────────────────────┬──────────────────────────────┐
│ Assessment Type       │ Frequency                     │ Responsibility               │
├───────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ Dependency Audit      │ Weekly (CI/CD Pipeline)       │ Dev Team (automated)         │
│ Database Security     │ Monthly                       │ Database Administrator       │
│ Vulnerability Scan    │ Bi-annually                   │ External Security Auditor    │
│ Full Risk Assessment  │ Annually                      │ Security Lead / CTO          │
└───────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

### Weekly Dependency Audit
- Automated command runs inside GitHub Actions CI/CD:
  ```bash
  npm audit --audit-level=high
  ```
- Any high or critical vulnerabilities block code merging.

### Monthly Database Security Review
- Verify RLS is enabled on all tables in public schema.
- Audit active database connections and connection pooling performance.
- Inspect Supabase Storage bucket policy permissions (verify `backups` bucket is strictly private).

### Annual Penetration Testing
- Engage an external certified CREST pen-testing company to perform black-box and white-box penetration tests on the REST API and storefront web app.
