Feature: Client rate limiting
  As an engineer investigating video-player rate limiting
  I want to verify the API enforces per-user rate limits
  So that I can demonstrate client-side throttling is required

  Scenario: API rejects requests exceeding per-user per-minute limit
    Given I have sent 60 checkout requests for user "rate_user_1"
    When I send one more checkout request for user "rate_user_1"
    Then the response status should be 429
