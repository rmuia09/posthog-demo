# Practice Ticket HD-1044 — Accidental PII Leak & GDPR Deletion

*Practice ticket written from a sample question, not a real customer.*

**Status:** Practice  
**Priority:** Critical  
**Type:** Privacy / Data Governance  
**Assigned to:** R. Muia  
**Created:** 2026-11-07

---

## Customer message

Hi,

We accidentally captured Personally Identifiable Information (PII) as a person property. We need to erase this sensitive data immediately for GDPR compliance, without corrupting or deleting our historical aggregate usage metrics.

Please advise on the remediation process.

Thanks

---

## What I checked

**Captured test data:** I submitted a ticket through HogDesk Lite with an email address in the description:

```bash
POST /api/v1/tickets/route
{
  "user_id": "pii_user_123",
  "category": "privacy",
  "description": "jane.doe@example.com called about billing issue",
  "priority": "urgent"
}
```

**Person vs event:** I confirmed the email was stored on the person profile. I did **not** confirm whether the leaked value is copied onto historical events themselves, not just the person. I don't know yet whether deleting the person also scrubs the value from event properties — that would need testing against the actual leaked string.

**Deletion flow:** In PostHog, you can delete a person from the Persons page. There is an option to delete their events too (`delete_events=true`), and deletion is processed asynchronously. I did **not** confirm the exact Deletion Requests workflow with conditions, so I won't present it as a verified step. I also haven't confirmed whether the UI lets you delete a single property on a person profile — deleting the whole person is the path I'd describe until I test it.

---

## Solution

1. **Delete the person** from their profile page in PostHog. When deleting, you can include their events — note this removes them from your counts too.
2. **Confirm scope:** Check whether the PII value exists on historical events, not just the person profile. If it does, you'll need to address those events separately.
3. **Single-property deletion:** I haven't confirmed whether the UI lets you delete a single property on a person profile — deleting the whole person is the path I'd describe until tested.

---

## Reply to customer

Hey,

To remove the PII:

1. Delete the person from their profile page in PostHog. When deleting, you can include their events in the same request — it's processed asynchronously.
2. One thing to check: is the PII only on the person profile, or is it also in historical events? I haven't confirmed that yet, so it's worth verifying before we assume the person deletion scrubs everything.
3. I haven't confirmed whether the UI lets you delete a single property on a person profile, so I'd describe deleting the whole person as the safer path until we test it.

Deleting the person removes the person attributes; your aggregate event counts stay intact unless you also choose to delete the events. Deleting a person's events also removes them from your counts, so you'll need to decide which matters more.

If the leaked value exists on historical events and you can't remove it without losing counts you need to keep, say so — I'd escalate to find out what's possible rather than delete something you can't get back.

Let me know what you find on step 2 and I can help with the rest.

---

## Notes

- Deleting a person is irreversible for that profile.
- I did not verify whether event-level PII requires a separate deletion request or if `delete_events=true` covers it.
- "I don't know yet" is an acceptable answer here until I test against the actual leaked value.

---

## Related

Repo: https://github.com/rmuia09/posthog-demo  
Backend capture: `backend/main.py`  
PII audit SQL: `sql/insights.sql`
