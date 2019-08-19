This application serves as a test of how real options theory can be applied to software planning. It focuses specifically on how a set of requirements can be visualised in a way that developers can easily understand, and shows which requirements are the best candidates for implementation.

<br>

# Scenario

A small team of software developers, __Team A__, are currently working on a new photo sharing app. Development is planned to take 24 weeks in total.

__Team A work in two-week sprints.__ They are halfway through development, and have 12 weeks - or __six sprints__ - until their photo sharing app is scheduled to ship.

At the beginning of every sprint, Team A hold a planning meeting to decide which of their user stories should be worked on in this sprint. During these discussions, they take the following factors into account:
- How __*valuable*__ that user story is to the overall application;
- What the __*cost*__ of implementing that user story is, i.e. how much effort is required;
- How __*risky*__ it is to work on this user story in this sprint - does the team know everything that they need to begin work?
- How much __*time*__ that is left on the project, in number of iterations.

For the purposes of this test, it is assumed that value, cost, and risk have all been estimated using a metric similar to story points, i.e. the numbers follow a Fibonacci-like sequence, and the rankings are relative to each other and have meaning to Team A. It is also assumed that these scores will never exceed a __*maximum value of 8*__; any user story with a higher score is considered to be an epic, and should be broken down into several smaller stories.

__*Team A has a target of 15 story points per sprint.*__

The Table page shows the full list of user stories that Team A is considering implementing this sprint, along with the value, cost, and risk of each user story.

The Graph page shows these user stories plotted in an options space, with value-to-cost on the x-axis and volatility on the y-axis.
- Value-to-cost is defined as: __*value ÷ cost*__
- Volatility is defined as: __*risk in this sprint * √total number of remaining sprints*__
