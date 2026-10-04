Feature: Make the pocket friend my own
  Scenario: English is the default even in a German browser
    Given I open a fresh home in a German browser
    Then my home speaks English

  Scenario: Colours and language change without interrupting care
    Given I visit my new companion
    When I feed Pinchy
    And I choose an ocean case and a lilac costume
    Then the case and the rendered costume have changed colour
    When I switch the language to German
    Then the current care message and controls speak German
    When I switch the language to English
    Then my home speaks English

  Scenario: My colours and language stay with my pet offline
    Given I visit my new companion
    And my home is available offline
    When I feed Pinchy
    And I personalise my home in German
    And I reopen my home offline
    Then my German language and colour choices are remembered
    And my existing care progress is preserved in German

  Scenario Outline: Settings work with the keyboard on every screen
    Given I visit Pinchy on a <width> by <height> screen
    When I open settings with the keyboard
    Then all settings are reachable within the screen
    When I close settings with Escape
    Then focus returns to the settings button

    Examples:
      | width | height |
      | 320   | 568    |
      | 390   | 844    |
      | 844   | 390    |
      | 1440  | 900    |

  Scenario: Unreadable preferences do not damage my pet
    Given I visit my new companion
    When I feed Pinchy
    And my preferences become unreadable
    And I reload my home
    Then my home speaks English
    And Pinchy has 85 fullness, 78 happiness and 72 energy

  Scenario: Unavailable preference storage is explained
    Given I visit my new companion
    When saving preferences is unavailable
    And I switch the language to German
    Then I see that my settings are temporary

  Scenario: Two open homes share their preferences
    Given I visit my new companion
    When I choose different preferences in two open homes
    Then both homes keep the combined preferences
