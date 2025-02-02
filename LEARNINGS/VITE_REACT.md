# VITE_REACT

Hey folks it was an awesome journey building  this app.

I wanted to learn about deploying an REACT app on AWS.  
Now the main thing I learned was:  

## Importance of .env file for the frontend 

Now it might sound weird to you.  
But during the build stage you need to have the `.env` file in the root of the project.  
This caused me the delay and trouble.  
Now I have fixed this issue.

By adding an extra step in docker build using the  
`ARG CLIENT_ENV` in the [dockerfile](dockerfile) line 12 and 15.