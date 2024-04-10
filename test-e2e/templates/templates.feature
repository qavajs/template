Feature: Templates

  Scenario: template with step with multiline string
    When step with multiline string:
    """
    I am
    multiline
    """

  Scenario: simple template
    When I set memory value 'answer' as '42'

  Scenario: parametrized template '<param1>' '<param2>'
    When I set memory value '<param1>' as '<param2>'

  Scenario: complex template
    When simple template

  Scenario: complex parametrized template '<p1>' '<p2>'
    When parametrized template '<p1>' '<p2>'

  Scenario: recursive template
    When I set memory value 'answer' as '42'
    When recursive template

  Scenario: recursive template 1
    When recursive template 2

  Scenario: recursive template 2
    When recursive template 3

  Scenario: recursive template 3
#   When simple template
    When recursive template 1

  Scenario: template throw error
    When I throw 'Pomylka' error

  Scenario: template throw error 2
    When template throw error

  Scenario: template that twice call other template
    When parametrized template 'param1' 'value1'
    When parametrized template 'param2' 'value2'

  Scenario: template with multiline string:
    When step with multiline string:
    """
    <qavajsMultiline>
    """

  Scenario: template with data table:
    When I set memory value 'someKey' as '<someKey>'
    And I set memory value 'anotherSomeKey' as '<anotherSomeKey>'

  Scenario: template with data table step
    When step with data table:
      | dt1 | 1   |
      | dt2 | str |

  Scenario: parametrized template with step with data table '<param>'
    When step with data table:
      | dataTableParam | <param> |

  Scenario: simple \(template\)
    When I set memory value 'answer' as '42'

  Scenario: simple [template]
    When I set memory value 'answer' as '42'

  Scenario: simple ., +, *, ?, ^, $, (, ), [, ], {, }, |
    When I set memory value 'answer' as '42'

  Scenario: template with '<one>' parameter
    When I set memory value 'answer' as '42'

  Scenario: template with '<one>' and '<two>' parameter
    When I set memory value 'answer' as '42'
