# DOCKER

Hi Folks 

There's a common saying there's alway something more.  
Same happened here, to me with this project.  
Now I have a better understanding of Docker `ARGS`

earlier I saw them as simple variables but with this one.  
I could witness its real power.  

🚨💡Also the `ARG` is scoped to the build stage.

For instance current [dockerfile](Dockerfile) works but,  
initially I declared the `ARG` outside the `FROM` statement.

```dockerfile

# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build

ARG CLIENT_ENV
```

But this scope is not valid. We need it inside the `FROM` statement.  
Like this 

```dockerfile
# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build

ARG CLIENT_ENV
```

