Feature: A friendship with things to look forward to
  Scenario: A real first reward stays with us offline
    Given I arrive on a snack-wish day
    When I feed Pinchy
    Then my ribbon and fulfilled wish are visible
    And I have 10 friendship points
    When I switch the language to German
    Then my friendship summary speaks German
    When I switch the language to English
    Then my ribbon and fulfilled wish are visible
    Given my home is available offline
    When I disconnect and reload my home
    Then my ribbon and fulfilled wish are visible
    And I have 10 friendship points

  Scenario: A new snack is unlocked and can really be shared
    Given I am one point away from the strawberry
    Then the strawberry is still locked
    When I cuddle my companion
    And I browse "Strawberry" in the food menu
    Then I can see and rotate its three-dimensional preview
    When I serve my selected friendship snack
    Then Pinchy enjoys the strawberry

  Scenario: Higher rewards change the habitat and playing uses the ball
    Given I am one point away from the play ball
    When I cuddle my companion
    Then the new ball participates in play
    Given I am one point away from the home flower
    When I cuddle my companion
    Then all friendship rewards decorate my home

  Scenario: Two homes share one daily wish
    Given I arrive with full happiness on a play-wish day
    When I play from two homes at once
    Then I have 6 friendship points
    And the fulfilled wish appears in both homes

  Scenario: Friendship details fit a small screen and preserve keyboard focus
    Given I arrive on a snack-wish day
    When I read friendship details on a small screen
    Then the friendship summary regains keyboard focus
