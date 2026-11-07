Feature: Checkout payment flow
  As a support engineer
  I want to verify checkout events are captured
  So that payment telemetry is reliable

  Scenario: Successful checkout submission
    Given a valid checkout payload for user "user_001"
    When I POST the payload to "/api/v1/checkout"
    Then the response status should be 200
    And the response should contain status "success"

  Scenario: Checkout with missing user_id returns error
    Given a checkout payload without a user_id
    When I POST the payload to "/api/v1/checkout"
    Then the response status should be 422
