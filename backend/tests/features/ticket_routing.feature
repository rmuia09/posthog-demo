Feature: Ticket routing
  As a support engineer
  I want tickets routed to the correct team by category
  So that customers reach the right queue

  Scenario: Billing ticket routes to billing team
    Given a ticket payload with category "billing"
    When I POST the ticket to "/api/v1/tickets/route"
    Then the response status should be 200
    And the route_email should contain "billing"

  Scenario: Technical ticket routes to engineering support
    Given a ticket payload with category "technical"
    When I POST the ticket to "/api/v1/tickets/route"
    Then the response status should be 200
    And the route_email should contain "eng_support"

  Scenario: Unknown category routes to general support
    Given a ticket payload with category "unknown_category"
    When I POST the ticket to "/api/v1/tickets/route"
    Then the response status should be 200
    And the route_email should contain "support"
