# @qavajs/template
Library that allow to define step definitions on Gherkin language.

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

Templates also can accept parameters as < param> e.g

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
