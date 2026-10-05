Feature: A personal name for my companion
  Scenario: A new name follows my friend through care and an offline visit
    Given I visit my new companion
    And my home is available offline
    When I feed Pinchy
    And I rename my companion to "Milo & Möhre"
    Then my companion is called "Milo & Möhre" throughout the home
    And I have shared 1 caring gestures
    When I disconnect and reload my home
    Then my companion is called "Milo & Möhre" throughout the home
    And Pinchy has 85 fullness, 78 happiness and 72 energy
    When I switch the language to German
    Then the German food menu and feedback call my companion "Milo & Möhre"

  Scenario: Renaming and care in different tabs preserve both changes
    Given I visit my new companion
    When I rename and play in two homes at the same time
    And I reload my home
    Then my companion is called "Kalle" throughout the home
    And Pinchy has 65 fullness, 98 happiness and 62 energy
    And I have shared 1 caring gestures

  Scenario Outline: A long name stays readable on a small screen
    Given I visit Pinchy on a <width> by <height> screen
    When I rename my companion to "Captain Knusperkrabbe XL"
    Then the long name and settings controls fit the screen

    Examples:
      | width | height |
      | 320   | 568    |
      | 844   | 390    |
