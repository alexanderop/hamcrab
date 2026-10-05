Feature: A full life with my Hamcrab
  Scenario: A toilet cue and recoverable illness lead to useful care
    Given my companion needs the toilet
    When I help my companion use the toilet
    Then my home has no mess
    Given my companion has a messy home and feels unwell
    When I clean the home and give medicine
    Then my companion is well in a clean habitat after reload

  Scenario: A real shell game and my belongings survive offline visits
    Given I visit my new companion
    When I finish a perfect shell game
    And I choose my cap, shell and pebble
    Then my selected belongings are visible
    When my home is available offline
    And I disconnect and reload my home
    Then my selected belongings are visible
    And my last game score is remembered

  Scenario Outline: Growing changes my companion's appearance
    Given my companion has earned the <stage> stage
    Then the <stage> stage is visible in the habitat
    Examples:
      | stage |
      | child |
      | teen  |

  Scenario: An adult can start a family without losing its story
    Given my adult companion is ready for a third visit
    When I visit Coral and choose a new generation
    Then a new egg and my adult's album entry survive reload

  Scenario: A saved routine controls bedtime and allows an early wake
    Given I visit my new companion
    When I set bedtime to the next hour
    And the scheduled bedtime arrives
    Then the bedtime scene is visible
    When I wake Pinchy
    And I reload my home
    Then active care is available

  Scenario: Life controls remain usable on a small screen
    Given I visit Pinchy on a 320 by 568 screen
    When I explore my companion's life with the keyboard
    Then the casing fills the viewport with all care controls in reach
