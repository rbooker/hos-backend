### Springboard Capstone Project 2 ###
# House of Sound Redesign #

My second capstone for the Springboard Software Engineering career track is a [redesign](https://motionless-boy.surge.sh/) of the website for House of Sound, a non-profit, streaming radio station from Portland, Oregon, currently on hiatus due to a pandemic-related loss in revenue.

The site does not stream music (an ASCAP license is required to do that), but it otherwise replicates the user experience common to most online radio stations. The landing page contains a schedule of the day's shows, as well as a link that would allow the user to listen live to what the station is currently streaming, were it actually on air. Every show has its own profile page, with a description, as well as links to archived episodes. The user can create a personal account, which allows them to "favorite" preferred shows; "favoriting" a show causes its most recent archived episode to show up on the user's home page when they log in.

Incorporated into the site is a feature whereby users are allowed to make a "donation" via Braintree. Doing so enables access to older archived episodes that cannot be streamed by users who have not "donated."

Also included are numerous routes for members of the site who are DJs and/or administrators. DJs can edit their show's profile, and create and edit playlists for episodes of their show. Admins can edit or delete shows, episodes, and member profiles.

No external API is used by the site (other than Braintree's, for donations). Instead, it features its own RESTful API, using data scraped from WFMU (another non-profit streaming radio station) and from the actual House of Sound's archives. The API was actually created before the front end, with routes designed to satisfy the desired functionality of the completed site.

The stack used to create the site is: React, CSS, and Bootstrap for the front end; Node/Express and PostgreSQL for the back end.

Tests exist for the most critical elements of the site, including logging in and receiving/submitting tokens.
