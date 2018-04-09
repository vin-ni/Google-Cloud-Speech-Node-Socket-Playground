# Google Cloud Speech Node with Socket Playground
An easy-to-set-up playground for cross device real-time Google Speech Recognition with a Node server and socket.io.

![Yo this is a test](example.gif "example gif")

## run local
1. get a free test key from [Google](https://cloud.google.com/speech/docs/quickstart ) 
2. place it into the src folder and update the path in the `.env` file
3. open the terminal and go to the `src` folder
4. run `npm install`
5. run `node app.js` or with nodemon: `nodemon app`
6. go to `http://127.0.0.1:1337/`

## run on server
Same as **run local** `1-4`.

5. config the `.env` Port for a port that you've opened on the server. I'm using 1337 here, too.
6. go to `your server adress` 

I recommend using [pm2](http://pm2.keymetrics.io/) or something similar, to keep the process running even when closing the terminal connection. 

Made by [Vinzenz Aubry](https://twitter.com/vinberto) 