Feature: Templates

  Scenario: simple template
    When simple template
    Then I expect '$answer' memory value to be equal '42'

  Scenario: parametrized template
    When parametrized template 'otherAnswer' '43'
    Then I expect '$otherAnswer' memory value to be equal '43'

  Scenario Outline: parametrized template in outline
    When parametrized template '<key>' '<value>'
    Then I expect '$<key>' memory value to be equal '<value>'

    Examples:
      | key    | value |
      | answer | 50    |
      | foo    | bar   |

  Scenario: complex template
    When complex template
    Then I expect '$answer' memory value to be equal '42'

  Scenario: complex parametrized template
    When complex parametrized template 'anotherAnswer' '7'
    Then I expect '$anotherAnswer' memory value to be equal '7'
