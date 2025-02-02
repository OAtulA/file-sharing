# File Share App

## Description   

Its a simple file sharing app.  
Build with ReactJS ,Nodejs and Expressjs, multer and s3.


## SETUP

If you want to run this app.  
I have given this `local-setup.sh` file  

__STEP 0__

You should have cloned the repo.  
Have the docker and bash or git bash installed,  node js is optional.

__STEP 1__
Rename and put the values of the vars in the [.env.demo](./backend/.env.demo) to  `.env`

__STEP 2__
Just copy paste this in the bash or git bash terminal 

```sh
chmod +x local-setup.sh
./local-setup.sh
```

You can simply just run it and it will install all the dependencies and run the app.  

## Issue

My app is not getting the env in the frontend build.

Look at the line 12 to 16 in the [frontend/src/App.tsx](./frontend/src/App.tsx)  
