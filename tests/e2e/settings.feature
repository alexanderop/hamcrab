Feature: Make the pocket friend my own
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

  Scenario: Two open homes share their preferences
    Given I visit my new companion
    When I choose different preferences in two open homes
    Then both homes keep the combined preferences
