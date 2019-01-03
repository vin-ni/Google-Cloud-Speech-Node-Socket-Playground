# Google Cloud Speech Node with Socket Playground
An easy-to-set-up playground for cross device real-time Google Speech Recognition with a Node server and socket.io.

![Yo this is a test](example.gif "example gif")

## Run Local
1. get a free test key from [Google](https://cloud.google.com/speech/docs/quickstart )
2. place it into the src folder and update the path in the `.env` file
3. open the terminal and go to the `src` folder
4. run `npm install`
5. run `node app.js` or with nodemon: `nodemon app`
6. go to `http://127.0.0.1:1337/`

## Run on Server
Same as **run local** `1-4`.

5. config the `.env` Port for a port that you've opened on the server. I'm using 1337 here, too.
6. go to `your server adress`

I recommend using [pm2](http://pm2.keymetrics.io/) or something similar, to keep the process running even when closing the terminal connection.

Made by [Vinzenz Aubry](https://twitter.com/vinberto)

## How Does the Client Process the Stream?

Google Cloud sends intermittent responses to the uploaded audio stream. Each response
from Google Cloud contains the current estimation of the full sentence for the streamed audio.

When Google Cloud senses that the audio has reached an end of sentence, it will issue a response with an `isFinal` flag set to true. Once this flag is issued, the client will finalize the sentence and write it to the document.

This process is repeated until the user ends the recording.

## Interim Natural Language Processing

The client application highlights different parts of speech, such as nouns and verbs, by using
[this natural language processing library](https://github.com/spencermountain/compromise).

## Socket Connection

The client communicates with the server using [Socket.io](https://socket.io).

## Log Only Version vor Devs

There is now a super reduced log only verison. It show's only two buttons, logs the results to the console and has no nlp. Use this if you want to implement it somewhere else.

## Troubleshooting
- If you have delays in calls, check if `IPV6` is disabled on your server
