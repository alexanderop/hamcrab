Feature: Install and update my pocket friend
  Scenario: Installation help remains available and offline readiness survives a reload
    Given I visit my new companion
    And my home is available offline
    When I reload my home
    Then settings explain installation and offline readiness

  Scenario: A waiting release preserves care until I choose to update
    Given I visit my new companion
    And my home is available offline
    When I feed Pinchy
    And a new release arrives and I postpone then apply it
    Then I have shared 1 caring gestures
    When I disconnect and reload my home
    Then I have shared 1 caring gestures
