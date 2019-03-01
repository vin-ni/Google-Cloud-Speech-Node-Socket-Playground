# Google Cloud Speech Node with Socket Playground

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An easy-to-set-up playground for cross device real-time Google Speech Recognition with a Node server and socket.io. *Phew.*

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

## Examples
- Speech Recognition controlled Face Filter: [Christmas Card](https://xmas.humanfoundry.com/)
- Face Filter / Analyzer with Speech Recognition: [I Love You Trainer](http://iloveyoutrainer.com)

## Config

It's possible to set a recognition context / add misunderstood words for better recognition results in the app.js `request` params. For more details on the configuration, go [here](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig#SpeechContext).

For other languages than english, look up your [language code](https://cloud.google.com/speech-to-text/docs/languages).

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

## Troubleshooting
- If you have delays in calls, check if `IPV6` is disabled on your server

# Super Reduced Version for Devs

There is now a super reduced log only verison. It show's only two buttons, logs the results to the console and has no nlp. Use this if you want to implement it somewhere else.

Made by [Vinzenz Aubry](https://twitter.com/vinberto)
