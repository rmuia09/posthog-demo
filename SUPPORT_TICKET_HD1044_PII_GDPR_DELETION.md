# Ticket HD-1044 — PII in Person Property

Practice ticket. Not a real customer.

Issue: PII captured as a person property. GDPR requires removal without losing aggregate metrics.

Checked:
- Submitted a ticket with an email in the description through HogDesk Lite. Confirmed email stored on person profile.

Solution:
1. Delete the person from their profile page. Include events if needed — this removes them from counts.
2. Check if the PII value exists on historical events, not just the person profile.

Repo: https://github.com/rmuia09/posthog-demo
Backend: backend/main.py
PII audit SQL: sql/insights.sql
