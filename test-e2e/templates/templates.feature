Feature: Templates

  Scenario: simple template
    When I set memory value 'answer' as '42'

  Scenario: parametrized template '<param1>' '<param2>'
    When I set memory value '<param1>' as '<param2>'
