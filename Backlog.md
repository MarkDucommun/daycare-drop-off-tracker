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

- State - DELIVERED
- Acceptance Criteria

      WHEN I am on the trip history screen 
      THEN I should a list of all trips
      AND I should see the following info for each trip
       - start time ('2024.01.01 13:00')
       - origin ('Home')
       - duration ('01:30')
      AND the trips are sorted by latest start time

***

### I can see an active trip's duration in real time

- State - DELIVERED
- Acceptance Criteria

      WHEN I am on the trip history screen 
      THEN I should a list of all trips
      AND I should see the time for an active trip updating in real time 

***

### I can navigate to the trip tracker

- State - DELIVERED
- Acceptance Criteria

      GIVEN I am on the home screen
      WHEN I click on the trip tracker button
      THEN I should no longer see the home screen
      AND I should see a screen title 'Trip Tracker'
      AND I should see a field to enter the origin of the trip
      AND I should see a button to submit the origin

***

### I can select a trip origin

- State - DELIVERED
- Acceptance Criteria

      GIVEN no origins have yet been entered
      AND I am on the trip tracker 
      WHEN I enter some text into the origin input field
      AND I click on the submit button
      THEN I should see a start trip button (start trip - trip tracker screen)
      AND when I navigate to trip history
      THEN I now see the origin I entered
      AND the trip has no start time or duration

Notes: Some architectural thoughts
- In the last implementation, I made everything that happens to a trip an event
- Some events had a linked location ID, some had a linked route ID, some had nothing
- It was quite a hassle to load and hydrate all of these things
- Maybe I will just start with events only serving to put the trip in a new state, like moving, stoplight, train etc
- And enter locations and routes separately
- Should make selecting routes easier as getting the last two locations is considerably easier than filter through all events
- Maybe it is also worth keeping a pointer on the location join with a trip so I can simply retrieve both of them in one fell swoop
- Seems like one of my learnings is that I was keeping too much outside of the database
- I should only keep the info needed to render the things I want to see on the screen
- Then query the database as needed to render additional info, or at least grow into the structure as needed
- I think that I want to write this akin to redux where I send an action from the component which will trigger some mutation to the repository and then send back a new representation of the state
- This way I can simply ask for the last state when reloading the app and it will hydrate the same way as any other state change
- Probably makes sense to even use the useReducer hook to manage the state of the trip tracker?
- The only problem with this is that it more widely opens the door to the possibility of landing in illegal states
- The previous representation was good as well, maybe some blended approach
- Going to start with the trip table having a single foreign key to the location table, the origin
- Then I will add a join table to routes
- Wont have any other direct pointers to locations, they will just be joined to the trip through the trips routes

***

### I resume the trip I left off on if the app closes

- State - DELIVERED
- Acceptance Criteria

      GIVEN I have selected an origin
      WHEN I close the app
      AND reopen the app
      THEN I should see the Trip Tracker screen and a start trip button

***

### I can see what my origin is in the Trip Tracker

- State - DELIVERED
- Acceptance Criteria

      GIVEN I have selected an origin
      WHEN I am on the Trip Tracker Start screen
      THEN I should see the origin I selected 'At xxxxx'

***

### I can cancel a trip that I haven't started, but have selected an origin for

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I have selected an origin
      AND I am on the Trip Tracker Start screen
      WHEN I click on the cancel trip button
      THEN I should see a modal asking whether I'd like to cancel the trip
      ---
      WHEN I select yes
      THEN I see the home screen
      WHEN I return to the trip tracker
      THEN I see the trip tracker start screen
      ---
      WHEN I select no
      THEN I see the trip tracker start screen
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

### I resume the trip I left off on if I navigate away from the trip tracker

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I have selected an origin
      WHEN I navigate back to the Home Screen 
      AND I navigate back to the Trip Tracker
      THEN I should see the Trip Tracker screen and a start trip button

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

### I can undo starting a trip that I have started

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I have started a trip
      AND I am on the Trip Tracker Moving Screen
      WHEN I click on the undo button
      THEN I should see a modal asking whether I'd like to undo starting the trip
      ---
      WHEN I select yes
      THEN I see the Trip Tracker Start screen
      ---
      WHEN I select no
      THEN I see the Trip Tracker Moving screen
***

### I can cancel a trip that I have started

- State - INCOMPLETE
- Acceptance Criteria

      GIVEN I have started a trip
      AND I am on the Trip Tracker Moving screen
      WHEN I click on the cancel trip button
      THEN I should see a modal asking whether I'd like to cancel the trip
      ---
      WHEN I select yes
      THEN I see the home screen
      WHEN I return to the trip tracker
      THEN I see the trip tracker origin screen
      ---
      WHEN I select no
      THEN I see the trip tracker moving screen
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
