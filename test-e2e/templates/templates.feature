Feature: Templates

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
