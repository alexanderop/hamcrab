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

  Scenario: An unfinished name is not saved
    Given I visit my new companion
    When I draft the name "Crabby" and dismiss settings
    Then my companion is called "Pinchy" throughout the home
    When I reload my home
    Then my companion is called "Pinchy" throughout the home

  Scenario: Names cannot be empty and surrounding spaces are removed
    Given I visit my new companion
    When I enter a blank companion name
    Then the name is explained as invalid and cannot be saved
    When I save the name "  Krümel  " instead
    Then my companion is called "Krümel" throughout the home
    And I have shared 0 caring gestures

  Scenario: Renaming a sleeping companion does not wake it
    Given I visit my new companion
    When I put Pinchy to sleep
    And I rename my companion to "Schlummer"
    Then active care is unavailable
    And I have shared 1 caring gestures
    When I reload my home
    Then my companion is called "Schlummer" throughout the home
    And active care is unavailable

  Scenario: Renaming and care in different tabs preserve both changes
    Given I visit my new companion
    When I rename and play in two homes at the same time
    And I reload my home
    Then my companion is called "Kalle" throughout the home
    And Pinchy has 65 fullness, 93 happiness and 62 energy
    And I have shared 1 caring gestures

  Scenario: A name is not changed when saving fails
    Given I visit my new companion
    When my saved data becomes unreadable
    And I attempt to save a different name
    Then the name error preserves my companion and damaged save

  Scenario Outline: A long name stays readable on a small screen
    Given I visit Pinchy on a <width> by <height> screen
    When I rename my companion to "Captain Knusperkrabbe XL"
    Then the long name and settings controls fit the screen

    Examples:
      | width | height |
      | 320   | 568    |
      | 844   | 390    |
