Feature: Three equally lovely adult forms
  Scenario Outline: A longtime adult chooses a form and keeps it offline
    Given my longtime adult has no chosen form
    When I choose the "<form>" adult form
    Then the "<form>" signature is visible while we "<activity>"
    And my adult form fits short and tall screens
    When I reload my baby's home offline
    Then my adult form is still "<form>"
    And my adult welcomes me in its own style

    Examples:
      | form          | activity |
      | Gourmet       | eat      |
      | Whirlwind     | play     |
      | Cuddle friend | cuddle   |

  Scenario: A stale second home cannot replace a chosen form
    Given my longtime adult has no chosen form
    When two homes choose different adult forms
    Then both homes keep the first adult form
