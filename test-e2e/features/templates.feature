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
