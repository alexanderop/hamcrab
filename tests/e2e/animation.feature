Feature: A companion with personality
  Scenario: Greeting, a direct cuddle and quiet moments
    Given I open a lively home
    Then my companion visibly waves hello
    When I tap my companion directly
    Then one cuddle is saved with a visibly affectionate pose
    When I drag the companion away and back
    Then no extra cuddle is saved
    And my companion has a quiet moment followed by a little discovery

  Scenario: A snack celebration and a sleepy stretch
    Given I open a lively home
    When I feed Pinchy
    Then the snack animation finishes before a visible celebration dance
    When I put Pinchy to sleep
    And I wake Pinchy
    Then my companion visibly stretches awake

  Scenario: The unlocked ball returns after a shove
    Given I am one point away from the play ball
    When I cuddle my companion
    And I watch a lively game with the ball
    Then the ball visibly moves and returns to rest

  Scenario: Reduced motion keeps affection and snacks calm
    Given I open a calm home
    When I feed Pinchy
    Then my snack feedback stays still and disappears on time
    When I allow motion
    Then no old action or celebration is replayed

  Scenario: A return waits for bedtime saved in another home
    Given I open a lively home
    When I return after another home puts my companion to sleep
    Then I see the sleeping companion without a greeting
