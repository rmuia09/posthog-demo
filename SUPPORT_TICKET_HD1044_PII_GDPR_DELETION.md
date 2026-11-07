# Support Ticket HD-1044 — Accidental PII Leak & GDPR Deletion

**Status:** Resolved  
**Priority:** Critical  
**Type:** Privacy / Data Governance  
**Customer:** Global Retailer  
**Assigned to:** R. Muia  
**Created:** 2026-11-07

---

## Customer message

Hi,

We accidentally captured Personally Identifiable Information (PII) as a person property in a user profile. We need to erase this sensitive data immediately for GDPR compliance, without corrupting or deleting our historical aggregate usage metrics.

Please advise on the remediation process.

Thanks

---

## Investigation

### 1. Confirmed the leak
In HogDesk Lite, a ticket submitted with an email in the description was captured as a person property:

```bash
POST /api/v1/tickets/route
{
  "user_id": "pii_user_123",
  "category": "privacy",
  "description": "jane.doe@example.com called about billing issue",
  "priority": "urgent"
}
```

The email `jane.doe@example.com` was stored as part of the person profile.

### 2. Evaluated deletion constraints
PostHog’s event store is immutable — historical events cannot be edited in place. However, person properties can be updated or deleted, and formal deletion requests can purge historical events matching specific conditions. Aggregate metrics remain valid because event counts are not altered, only the associated person properties are removed.

---

## Solution

### Step 1: Invalidate the property via Dashboard

Navigate to **Persons** in PostHog, search for the affected profile ID, and delete or overwrite the sensitive property with an empty string.

### Step 2: Programmatic purge via API

Issue a targeted payload update to remove the property value across tracking entities.

### Step 3: Historical event purge

Navigate to **Settings → Data Management → Deletion Requests** and submit a localized deletion condition targeting historical events that contained the leaked string values. This guarantees permanent structural removal of the PII from the event store.

---

## What we told the customer

> We recommend a three-step isolation strategy:
> 1. Delete or overwrite the PII property in the Persons dashboard.
> 2. Use the API to purge the value programmatically.
> 3. Submit a deletion request under Data Management → Deletion Requests targeting historical events containing the leaked value.
>
> This removes the PII completely while preserving your aggregate event counts and metrics.

---

## Internal notes

- Confirm the exact leaked string values before submitting a deletion request.
- Deletion requests are irreversible — double-check conditions before submitting.
- Person property deletion does not delete the underlying events; it removes the associated person attributes. For full event-level deletion, use Data Management.

---

## Related

Repo: https://github.com/rmuia09/posthog-demo  
Backend capture example: `backend/main.py`  
PII audit SQL: `sql/insights.sql` (PII property audit query)
