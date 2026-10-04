Feature: Pick something delicious for Pinchy
  Scenario Outline: Each treat has its own effect and is saved
    Given I visit my new companion
    When I give Pinchy "<food>"
    Then Pinchy has <fullness> fullness, <happiness> happiness and <energy> energy
    And I have shared 1 caring gestures
    When I reload my home
    Then Pinchy has <fullness> fullness, <happiness> happiness and <energy> energy

    Examples:
      | food            | fullness | happiness | energy |
      | Franzbrötchen   | 85       | 78        | 72     |
      | Döner kebab     | 95       | 83        | 72     |
      | Augustiner beer | 70       | 88        | 67     |

  Scenario Outline: The treats are real three-dimensional models
    Given I visit my new companion
    When I browse "<food>" in the food menu
    Then I can see and rotate its three-dimensional preview

    Examples:
      | food            |
      | Franzbrötchen   |
      | Döner kebab     |
      | Augustiner beer |

  Scenario: Closing the menu does not feed Pinchy
    Given I visit my new companion
    When I browse "Döner kebab" in the food menu
    And I dismiss the food menu
    Then Pinchy has 65 fullness, 78 happiness and 72 energy
    And I have shared 0 caring gestures
    And focus returns to the feed button

  Scenario: Choosing a treat also works offline
    Given I visit my new companion
    And my home is available offline
    When I disconnect and reload my home
    And I give Pinchy "Augustiner beer"
    And I reload my home
    Then Pinchy has 70 fullness, 88 happiness and 67 energy

  Scenario: German food choices and feedback
    Given I visit my new companion
    When I switch the language to German
    And I give Pinchy "Döner"
    Then the Döner feedback and care values are shown in German

  Scenario: A meal cannot wake a pet put to sleep in another tab
    Given I visit my new companion
    When I browse "Döner kebab" in the food menu
    And Pinchy falls asleep in another home
    And I try to give the selected food
    Then the food menu explains that Pinchy is asleep

  Scenario: Pinchy holds the selected treat before it disappears
    Given I visit my new companion
    Then giving Augustiner shows the bottle in the habitat before it disappears

  Scenario Outline: The food menu fits the handheld
    Given I visit Pinchy on a <width> by <height> screen
    When I browse "Augustiner beer" in the food menu
    Then every food choice and the give button are reachable

    Examples:
      | width | height |
      | 320   | 568    |
      | 844   | 390    |
