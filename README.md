# File Share App

## Description

Its a simple file sharing app.  
Build with ReactJS ,Nodejs and Expressjs, multer and s3.

## LEARNINGS

You can see all my learnings in the [LEARNINGS](LEARNINGS) folder  
Now for specific you can see [DOCKER.md](LEARNINGS/DOCKER.md) and [VITE_REACT.md](LEARNINGS/VITE_REACT.md)  

## SETUP ⚒️

### Local Setup

If you want to run this app.  
I have given this `local-setup.sh` file

**STEP 0**

You should have cloned the repo.  
Have the docker and bash or git bash installed, node js is optional.

`git clone https://github.com/OAtulA/file-sharing.git`

**STEP 1**
Rename and put the values of the vars in the [.env.demo](./backend/.env.demo) to `.env`

**STEP 2**
Just copy paste this in the bash or git bash terminal

```sh
chmod +x local-setup.sh
./local-setup.sh
```

You can simply just run it and it will install all the dependencies and run the app.

### DEPLOYMENT SETUP

You need to do some efforts then dude.  
JK 😁, I am giving you some things to copy paste.

Currently my setup.sh works for the `Debian based Linux OS` and `Amazon Linux 2`

For the environment variables you have 2 options for the `server`

**Option 1**

all the variables you have to set just write them in one line space separated.  
Like this  
`EXPORT AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY AWS_REGION=YOUR_REGION AWS_BUCKET_NAME=YOUR_BUCKET_NAME`

Now add this to the `.bashrc` file.

**Option 2**

Since most of us already use the `.env` file for the environment variables  
So the simplest hack is this. Just simply upload it on the server and use it.

🚨⚠️ I have made a `~/app` and the repo and .env are present there.  
You too shall upload it there to maintain a clean setup.

Step 1
You need to upload your .env or simply just open the server terminal

```sh
mkdir ~/app
touch ~/app/.env
vim ~/app/.env
```

THe editor will open now **press** `i` key and paste the variables from your `.env` file there  
Next you need to **press** `esc` key and then `:wq` to save and quit.

Now for the .env of the `client side` Just do this  
Either upload the .env of the side in the `~/app/.env.client`  
Or you can follow the same steps as above.

```sh
touch ~/app/.env.client
vim ~/app/.env.client
```

Now paste the .env of the client side in the editor.  
**Press** `i` key and paste the variables from your `.env` file there  
Next you need to **press** `esc` key and then `:wq` to save and quit.

Step 2

You need to add this to the `.bashrc` file.

Just paste this in the terminal

```sh
cat <<'EOF' >> ~/.bashrc
set -a
source ~/app/.env
set +a
EOF
source ~/.bashrc
```

Step 3

Install git

Just paste this in the terminal  
`sudo yum install git | sudo apt-get install git`

Step 4

Clone the repo [https://github.com/OAtulA/file-sharing.git](https://github.com/OAtulA/file-sharing.git)

Just paste this in the terminal

```sh
cd ~/app
git clone https://github.com/OAtulA/file-sharing.git
```

Step 5

You need to run the setup.sh file.

Just paste this in the terminal

```sh
cd ~/app/file-sharing
chmod +x setup.sh
./setup.sh
```

Now you just need to **enter y** a few times and it will be done.

Enjoy your app is up and running.
