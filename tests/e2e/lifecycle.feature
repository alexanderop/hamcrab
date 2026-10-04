Feature: Growing together
  Scenario: A new friend hatches and stays a baby offline
    Given a new egg is waiting for me
    Then ordinary care waits for hatching
    When I help my friend hatch
    Then my friend is a baby with no care days
    When I reload my home
    Then my friend is a baby with no care days
    When I reload my baby's home offline
    Then my friend is a baby with no care days

  Scenario: Our tenth care day makes my friend an adult
    Given my baby has nine earlier care days
    When I cuddle my growing friend
    Then my friend is grown up
    And my adult form is still "Cuddle friend"
    When I reload my baby's home offline
    Then my friend is grown up
    And my adult form is still "Cuddle friend"

  Scenario: Two homes share the same hatch
    Given a new egg is waiting for me
    When I hatch from two homes
    Then my friend is a baby with no care days

  Scenario: Hatching remains accessible when the 3D view is lost
    Given a new egg is waiting for me
    When the 3D view becomes unavailable
    And I help my friend hatch
    Then my friend is a baby with no care days
    And the fallback explains the unavailable view

  Scenario: Growth guidance remains reachable on a short screen
    Given I visit Pinchy on a 844 by 390 screen
    When I read the compact growth guidance
    Then the casing fills the viewport with all care controls in reach
    When I switch the language to German
    Then growth stays readable in German on short and tall screens
