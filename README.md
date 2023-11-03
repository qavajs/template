# @qavajs/template
Library that allow to define step definitions on Gherkin language.

## Installation
`npm install @qavajs/template`

## Templates
```gherkin
Feature: Templates

  Scenario: I login
    When I open 'https://your-app.com'
    And I type 'username' to 'Login Form > Username Input'
    And I type 'password' to 'Login Form > Password Input'
    And I click 'Login Form > Login Button'
```

Then following template can be called from scenario as simple step

```gherkin
Feature: Auth

  Scenario: Verify that user is able to login
    When I login
    Then I expect 'Header' to be visible
```

## Configuration
To use templates their location need to be passed to templates property of config file and library need to be listed
in require
```javascript
module.exports = {
    default: {
        requireModule: [
            '@qavajs/template'
        ],
        templates: ['templates/*.feature']
    }
}

```

## Parameters  
Templates also can accept parameters as `<param>` e.g

```gherkin
Feature: Templates

  Scenario: I login as '<username>' with '<password>' password
    When I open 'https://your-app.com'
    And I type '<username>' to 'Login Form > Username Input'
    And I type '<password>' to 'Login Form > Password Input'
    And I click 'Login Form > Login Button'
```

Then following template can be called with actual params

```gherkin
Feature: Auth

  Scenario: Verify that user is able to login
    When I login as 'admin' with 'admin' password
    Then I expect 'Header' to be visible
```

## Multiline parameter
It is also possible to pass multi line parameter to template
```gherkin
Feature: TextArea

  Scenario: Verify that user is able to login
    When I set text area:
    """
    this
    is
    multiline
    text
    """
```

Multiline data can be accessed by `<qavajsMultiline>` formal parameter in template
```gherkin
Feature: Templates

  Scenario: I set text area:
    When I type '<qavajsMultiline>' to 'Form > Text Area'
```

## Key Value Params
Multiple parameters can be passed in form of key-value data table
```gherkin
Feature: TextArea

  Scenario: Verify that user is able to login
    When I fill registration form:
      | name     | John Dou                 |
      | position | Test Automation Engineer |
```

And values can be accessed by corresponding keys
```gherkin
Feature: Templates

  Scenario: I fill registration form:
    When I type '<name>' to 'Form > Name'
    When I type '<position>' to 'Form > Position'
```

