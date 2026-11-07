# Ticket HD-1044 — PII in Person Property

Practice ticket. Not a real customer.

Issue: PII captured as a person property. GDPR requires removal without losing aggregate metrics.

Checked:
- Submitted a ticket with an email in the description through HogDesk Lite. Confirmed email stored on person profile.
- Did not confirm whether the leaked value exists on historical events themselves, not just the person profile.
- Did not confirm single-property deletion in the UI. Deleting the whole person is the path to describe until tested.
- Did not confirm delete_events=true covers event-level PII.

Solution:
1. Delete the person from their profile page. Include events if needed — this removes them from counts.
2. Check if the PII value exists on historical events, not just the person profile.
3. Single-property deletion: not confirmed. Delete the whole person until tested.

Notes:
- Deleting a person is irreversible.
- I don't know if event-level PII requires a separate deletion step or if delete_events=true covers it.
- I don't know yet. Acceptable until tested against the actual leaked value.

Repo: https://github.com/rmuia09/posthog-demo
Backend: backend/main.py
PII audit SQL: sql/insights.sql
