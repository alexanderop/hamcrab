Feature: A little friendship with Pinchy
  Scenario: Care makes a visible difference and survives a new visit
    Given I visit my new companion
    Then Pinchy has 65 fullness, 78 happiness and 72 energy
    When I feed Pinchy
    Then Pinchy has 85 fullness, 78 happiness and 72 energy
    When I play with Pinchy
    Then Pinchy has 85 fullness, 93 happiness and 62 energy
    When I reload my home
    Then Pinchy has 85 fullness, 93 happiness and 62 energy
    And I have shared 2 caring gestures

  Scenario: Sleeping restores energy and pauses active care
    Given I visit my new companion
    When I put Pinchy to sleep
    And I reload my home
    Then active care is unavailable
    When two hours pass
    And I wake Pinchy
    Then Pinchy has 57 fullness, 72 happiness and 100 energy
    And active care is available

  Scenario: A return visit accounts for time away
    Given I visit my new companion
    When two hours pass
    And I reload my home
    Then Pinchy has 57 fullness, 72 happiness and 62 energy

  Scenario: Pinchy stays with me offline
    Given I visit my new companion
    And my home is available offline
    When I disconnect and reload my home
    And I feed Pinchy
    Then Pinchy has 85 fullness, 78 happiness and 72 energy
    When I reload my home
    Then Pinchy has 85 fullness, 78 happiness and 72 energy

  Scenario: Two open homes preserve both care actions
    Given I visit my new companion
    When I care for Pinchy from two tabs
    And I reload my home
    Then Pinchy has 85 fullness, 93 happiness and 62 energy
    And I have shared 2 caring gestures

  Scenario: A small screen keeps care within reach
    Given I visit Pinchy on a phone
    When I feed Pinchy using the keyboard
    Then Pinchy has 85 fullness, 78 happiness and 72 energy
    And my home fits the screen

  Scenario: An unreadable save is preserved and explained
    Given I visit my new companion
    When my saved data becomes unreadable
    And I reopen a damaged home
    Then I see a recovery message without losing the saved data

  Scenario: Care meters stay within their limits
    Given I visit my new companion
    When I feed Pinchy three times
    Then Pinchy has 100 fullness, 78 happiness and 72 energy

  Scenario: The creature is a rendered interactive 3D companion
    Given I visit my new companion
    Then I can see and rotate the 3D companion

  Scenario: A failed care action disables controls until storage recovers
    Given I visit my new companion
    When my saved data becomes unreadable
    And I attempt to feed Pinchy
    Then I see a recovery message without losing the saved data

  Scenario: The installable app stays within its published home
    Given I visit my new companion
    And my home is available offline
    Then the app manifest and icons are ready for installation
