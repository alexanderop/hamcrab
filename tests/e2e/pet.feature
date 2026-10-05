Feature: A little friendship with Pinchy
  Scenario: Care makes a visible difference and survives a new visit
    Given I visit my new companion
    Then Pinchy has 65 fullness, 78 happiness and 72 energy
    When I feed Pinchy
    Then Pinchy has 85 fullness, 78 happiness and 72 energy
    When I play with Pinchy
    Then Pinchy has 85 fullness, 98 happiness and 62 energy
    When I reload my home
    Then Pinchy has 85 fullness, 98 happiness and 62 energy
    And I have shared 2 caring gestures

  Scenario: Sleeping restores energy and pauses active care
    Given I visit my new companion
    When I put Pinchy to sleep
    Then the bedtime scene is visible
    When I reload my home
    Then the bedtime scene is visible
    And active care is unavailable
    When two hours pass
    And I wake Pinchy
    Then Pinchy has 57 fullness, 72 happiness and 100 energy
    And active care is available
    And the daytime scene is restored

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

  Scenario: The creature is a rendered interactive 3D companion
    Given I visit my new companion
    Then I can see and rotate the 3D companion

  Scenario: The installable app stays within its published home
    Given I visit my new companion
    And my home is available offline
    Then the app manifest and icons are ready for installation

  Scenario Outline: The handheld fills the app without an outside border
    Given I visit Pinchy on a <width> by <height> screen
    Then the casing fills the viewport with all care controls in reach

    Examples:
      | width | height |
      | 390   | 844    |
      | 1440  | 900    |
      | 844   | 390    |
      | 320   | 568    |

  Scenario: Sleep decorations respect motion preferences
    Given I visit my new companion
    When I put Pinchy to sleep
    Then bedtime decorations stay still
    When I allow motion
    Then bedtime decorations drift gently
