Feature: PII capture for GDPR audit
  As a support engineer investigating a PII leak
  I want events containing PII to be capturable
  So they can later be identified and deleted via Data Management

  Scenario: Event containing email-like PII is captured
    Given a ticket payload containing PII "jane.doe@example.com" in the description
    When I POST the ticket to "/api/v1/tickets/route"
    Then the response status should be 200
    And the ticket_id should not be empty
