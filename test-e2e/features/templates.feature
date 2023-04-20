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

  Scenario: twice call same template with different params
    When template that twice call other template
    Then I expect '$param1' memory value to be equal 'value1'
    Then I expect '$param2' memory value to be equal 'value2'

  Scenario: template multiline
    When template with multiline string:
    """
    Some
    multiline
    data
    """
    Then I expect '$multiline' memory value to be equal:
    """
    Some
    multiline
    data
    """

  Scenario: template data table
    When template with data table:
      | someKey        | 42 |
      | anotherSomeKey | 43 |
    Then I expect '$someKey' memory value to be equal '42'
    Then I expect '$anotherSomeKey' memory value to be equal '43'

  Scenario: template with data table step
    When template with data table step
    Then I expect '$dt1' memory value to be equal '1'
    Then I expect '$dt2' memory value to be equal 'str'

  Scenario: template with data table step
    When parametrized template with step with data table 'dataTableParamValue'
    Then I expect '$dataTableParam' memory value to be equal 'dataTableParamValue'
