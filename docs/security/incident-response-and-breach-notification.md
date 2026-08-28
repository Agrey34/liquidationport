# Incident Response and Breach Notification Plan

This document outlines the standard operating procedures for identifying, responding to, containing, and recovering from security incidents, as well as statutory breach notification compliance procedures for the Liquidation Port platform.

---

## 1. Incident Response Lifecycle (NIST SP 800-61 Aligned)

```
┌──────────────┐      ┌────────────────┐      ┌───────────────┐
│ 1. Prepare   │ ───> │ 2. Identify    │ ───> │ 3. Contain    │
└──────────────┘      └────────────────┘      └───────────────┘
                                                      │
┌──────────────┐      ┌────────────────┐              ▼
│ 6. Review    │ <─── │ 5. Recover     │ <─── │ 4. Eradicate  │
└──────────────┘      └────────────────┘      └───────────────┘
```

### Phase 1: Preparation
- **Security Group:** Define key incident contacts (DevOps lead, Security Lead, Legal Counsel).
- **Monitoring & Alerting:** Logging via NestJS `LoggingInterceptor` and Supabase Realtime DB Audit logs. Alerts configured in hosting provider (e.g. AWS/Vercel) for high CPU/memory spikes or 5xx error spikes.
- **Secrets Management:** Secrets stored in dotenv (`.env`) and cloud key management stores, never in code. Backup secrets are rotated regularly.

### Phase 2: Identification & Triage
- Identify indicators of compromise (IoC) such as:
  - Unauthorized calls using the `SUPABASE_SERVICE_ROLE_KEY`.
  - Invalidate Stripe webhook signatures or fraudulent Webhook replay attacks.
  - Spikes in failed logins on the Admin panel.
- **Triage Matrix:**
  - **Low:** Minimal impact (e.g. a single user account locked out).
  - **Medium:** Affected service degraded but functional (e.g. temporary API performance issues).
  - **High:** Data leak of Non-PII data, localized database service outage.
  - **Critical:** Unauthorized admin access, data leak of PII (emails, names, billing addresses), compromise of Stripe private keys.

### Phase 3: Containment
- **Short-Term containment:**
  - **Credential Leak:** If the `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` is leaked, immediately roll keys in the Supabase/Stripe dashboard and update NestJS environment variables (restart server).
  - **Admin Hijack:** Use Supabase Admin API to suspend/ban the compromised admin account.
  - **API Attack:** Block traffic via Cloudflare/WAF or temporarily scale down target service.

### Phase 4: Eradication
- Locate the root cause (e.g. unpatched dependency, insecure RLS policy, exposed API route).
- Apply secure code patches.
- Re-run automated dependency scans (`npm audit`).
- Force-logout all sessions globally using Supabase Auth admin console.

### Phase 5: Recovery
- Restore verified database state using the secure database backups (`BackupService`).
- Test endpoints in a sandbox/staging environment.
- Slowly transition back to production and monitor logs closely for residual IoCs.

### Phase 6: Lessons Learned (Post-Incident)
- Within 7 days, hold a post-mortem meeting.
- Document: Root cause, timeline of events, containment efficacy, and systemic improvements.
- Archive the Incident report securely.

---

## 2. Specific Tech Stack Incident Playbooks

### Playbook A: Leaked Supabase Service Role Key
1. **Detect:** Unusual read/write volume in DB, SQL queries executed directly without RLS bypass logs.
2. **Contain:** Go to Supabase Dashboard -> Settings -> API. Roll the Service Role Key.
3. **Deploy:** Immediately replace `SUPABASE_SERVICE_ROLE_KEY` in the hosting environment variables (e.g. Vercel, AWS EC2) and reload the NestJS backend.
4. **Audit:** Query the `audit_logs` table (`public.audit_logs`) to see actions taken during the key compromise window.

### Playbook B: Stripe Webhook Signature Verification Failures
1. **Detect:** Stripe Webhook endpoint `/api/v1/payments/webhook` returns 400 Bad Request, or errors appear in logs: `Webhook signature verification failed`.
2. **Investigate:** Verify if `STRIPE_WEBHOOK_SECRET` in `.env` has expired or changed in the Stripe Dashboard.
3. **Eradicate:** If signature verification has been bypassed or key was leaked, roll the signing secret immediately in Stripe. Ensure `rawBody: true` is configured in NestJS `main.ts` so signature calculations match Stripe payloads.

---

## 3. Breach Notification Procedures (Compliance)

If personal data (PII) is confirmed to be leaked or compromised, the statutory notification guidelines must be followed.

### GDPR Compliance (within 72 Hours)
If EU citizen data is compromised, we must notify the Supervisory Authority (DPA) within **72 hours** of becoming aware of the breach unless it is unlikely to result in a risk to rights and freedoms.

### CCPA / State-specific Breach Laws (US)
Notify the state Attorney General and affected individuals in accordance with local state statutes (usually within 30 to 45 days).

### Notification Template Drafts

#### Authority Notification Email:
```text
Subject: DATA BREACH NOTIFICATION - Liquidation Port

Dear Data Protection Authority,

We are writing to notify you of a security incident concerning Liquidation Port, in accordance with Article 33 of GDPR.

- Date of Detection: [Date]
- Nature of Incident: Unauthorized access to Database Server.
- Categories of Data: Names, Email Addresses, Shipping/Billing Addresses. No credit card details were exposed (all processed via Stripe).
- Approximate Number of Data Subjects: [Count]
- Immediate Actions Taken: Rolled all API keys, locked compromised credentials, and patched RLS policies to prevent further access.
- Contact Person: [Name/Email]
```

#### User Notification Email:
```text
Subject: Important Security Update Regarding Your Liquidation Port Account

Dear [User Name],

We are writing to inform you about a recent security incident at Liquidation Port. 

On [Date], we detected unauthorized access to our database. Our security team immediately contained the incident, rolled all encryption keys, and patched the vulnerability.

What Information Was Affected:
The affected files contained names, email addresses, and shipping addresses. Please note that no credit card details were exposed, as Liquidation Port does not store payment card information (all transactions are securely handled directly by Stripe).

What We Recommend:
As a precautionary measure, we recommend resetting your password on the site, as well as on any other platform where you use a similar password.

We take your data security very seriously. If you have any questions, please contact us at security@liquidationport.com.
```
