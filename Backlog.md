# Backlog

***

### I can navigate to the trip history from the home screen

- State - DELIVERED
- Acceptance Criteria

      GIVEN I am on the home screen 
      WHEN I click on the trip history button
      THEN I should no longer see the home screen
      AND I should see a screen title 'Trip History'

***

### I can navigate to the back from the trip history screen

- State - DELIVERED
- Acceptance Criteria

      GIVEN I am on the trip history screen 
      WHEN I click on the trip history button
      THEN I should no longer see the home screen
      AND I should see a screen title 'Trip History'

***

### When I close the app on the trip history screen, the next time I open the app, I should see the trip list screen

- State - DELIVERED
- Acceptance Criteria

      GIVEN I am on the trip history screen 
      WHEN close the app and reopen the app
      THEN I should see the trip history screen
- Notes
  - https://reactnavigation.org/docs/state-persistence/

***

### I can see a list of all trips

- State - INCOMPLETE
- Acceptance Criteria

      WHEN I am on the trip history screen 
      THEN I should a list of all trips
      AND I should see the following info for each trip
       - origin ('Home')
       - start time ('2024.01.01 13:00')
       - duration ('01:30')
      AND the trips are sorted by latest start time

***

### I can navigate to the trip tracker

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I am on the home screen
      WHEN I click on the trip tracker button
      THEN I should no longer see the home screen
      AND I should see a screen title 'Trip Tracker'
      AND I should see a field to enter the origin of the trip
      AND I should see a button to submit the origin

***

### I can select a trip origin

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN no origins have yet been entered
      AND I am on the trip tracker 
      WHEN I enter some text into the origin input field
      AND I click on the submit button
      THEN I should see a start trip button (start trip - trip tracker screen)
      AND when I navigate to trip history
      THEN I now see the origin with no start time or duration yet 

***

### I can see trip details

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I am on the Trip History
      WHEN I click on a Trip
      THEN I should see the Trip Details screen for that Trip
      AND the following info
       - origin ('Home')
       - start time ('2024.01.01 13:00') 
       - duration ('01:30')

***

### I can start a trip

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I am on the trip tracker
      AND I have selected an origin, meaning I am on the start trip screen
      WHEN I click on the start trip button
      THEN I should see a stop trip button
      AND when I navigate to trip history
      THEN I should see both a start time and a duration

***

### I can indicate that I have arrived at a location

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I am on the trip tracker
      AND I have started a trip (I am on the moving trip screen)
      WHEN I click on the stop trip button
      THEN I should see a selector field to enter the location of the stop
      AND when I navigate to trip history
      THEN I should see both a start time and a duration
***
