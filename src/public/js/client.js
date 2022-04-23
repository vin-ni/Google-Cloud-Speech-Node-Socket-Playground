'use strict';

//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//  Contact: v@vinzenzaubry.com

//connection to socket
const socket = io.connect();

//================= CONFIG =================
// Stream Audio
let bufferSize = 2048,
  AudioContext,
  context,
  processor,
  input,
  globalStream;

//vars
let audioElement = document.querySelector('audio'),
  finalWord = false,
  resultText = document.getElementById('ResultText'),
  removeLastSentence = true,
  streamStreaming = false;

//audioStream constraints
const constraints = {
  audio: true,
  video: false,
};

//================= RECORDING =================

async function initRecording() {
  socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
  streamStreaming = true;
  AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext({
    // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
    latencyHint: 'interactive',
  });

  await context.audioWorklet.addModule('./assets/js/recorderWorkletProcessor.js')
  context.resume();
  
  globalStream = await navigator.mediaDevices.getUserMedia(constraints)
  input = context.createMediaStreamSource(globalStream)
  processor = new window.AudioWorkletNode(
    context,
    'recorder.worklet'
  );
  processor.connect(context.destination);
  context.resume()
  input.connect(processor)
  processor.port.onmessage = (e) => {
    const audioData = e.data;
    microphoneProcess(audioData)
  }
}

function microphoneProcess(buffer) {
  socket.emit('binaryData', buffer);
}

//================= INTERFACE =================
var startButton = document.getElementById('startRecButton');
startButton.addEventListener('click', startRecording);

var endButton = document.getElementById('stopRecButton');
endButton.addEventListener('click', stopRecording);
endButton.disabled = true;

var recordingStatus = document.getElementById('recordingStatus');

function startRecording() {
  startButton.disabled = true;
  endButton.disabled = false;
  recordingStatus.style.visibility = 'visible';
  initRecording();
}

function stopRecording() {
  // waited for FinalWord
  startButton.disabled = false;
  endButton.disabled = true;
  recordingStatus.style.visibility = 'hidden';
  streamStreaming = false;
  socket.emit('endGoogleCloudStream', '');

  let track = globalStream.getTracks()[0];
  track.stop();

  input.disconnect(processor);
  processor.disconnect(context.destination);
  context.close().then(function () {
    input = null;
    processor = null;
    context = null;
    AudioContext = null;
    startButton.disabled = false;
  });

  // context.close();

  // audiovideostream.stop();

  // microphone_stream.disconnect(script_processor_node);
  // script_processor_node.disconnect(audioContext.destination);
  // microphone_stream = null;
  // script_processor_node = null;

  // audiovideostream.stop();
  // videoElement.srcObject = null;
}

//================= SOCKET IO =================
socket.on('connect', function (data) {
  console.log('connected to socket');
  socket.emit('join', 'Server Connected to Client');
});

socket.on('messages', function (data) {
  console.log(data);
});

socket.on('speechData', function (data) {
  // console.log(data.results[0].alternatives[0].transcript);
  var dataFinal = undefined || data.results[0].isFinal;

  if (dataFinal === false) {
    // console.log(resultText.lastElementChild);
    if (removeLastSentence) {
      resultText.lastElementChild.remove();
    }
    removeLastSentence = true;

    //add empty span
    let empty = document.createElement('span');
    resultText.appendChild(empty);

    //add children to empty span
    let edit = addTimeSettingsInterim(data);

    for (var i = 0; i < edit.length; i++) {
      resultText.lastElementChild.appendChild(edit[i]);
      resultText.lastElementChild.appendChild(
        document.createTextNode('\u00A0')
      );
    }
  } else if (dataFinal === true) {
    resultText.lastElementChild.remove();

    //add empty span
    let empty = document.createElement('span');
    resultText.appendChild(empty);

    //add children to empty span
    let edit = addTimeSettingsFinal(data);
    for (var i = 0; i < edit.length; i++) {
      if (i === 0) {
        edit[i].innerText = capitalize(edit[i].innerText);
      }
      resultText.lastElementChild.appendChild(edit[i]);

      if (i !== edit.length - 1) {
        resultText.lastElementChild.appendChild(
          document.createTextNode('\u00A0')
        );
      }
    }
    resultText.lastElementChild.appendChild(
      document.createTextNode('\u002E\u00A0')
    );

    console.log("Google Speech sent 'final' Sentence.");
    finalWord = true;
    endButton.disabled = false;

    removeLastSentence = false;
  }
});

//================= Juggling Spans for nlp Coloring =================
function addTimeSettingsInterim(speechData) {
  let wholeString = speechData.results[0].alternatives[0].transcript;
  console.log(wholeString);

  let nlpObject = nlp(wholeString).out('terms');

  let words_without_time = [];

  for (let i = 0; i < nlpObject.length; i++) {
    //data
    let word = nlpObject[i].text;
    let tags = [];

    //generate span
    let newSpan = document.createElement('span');
    newSpan.innerHTML = word;

    //push all tags
    for (let j = 0; j < nlpObject[i].tags.length; j++) {
      tags.push(nlpObject[i].tags[j]);
    }

    //add all classes
    for (let j = 0; j < nlpObject[i].tags.length; j++) {
      let cleanClassName = tags[j];
      // console.log(tags);
      let className = `nl-${cleanClassName}`;
      newSpan.classList.add(className);
    }

    words_without_time.push(newSpan);
  }

  finalWord = false;
  endButton.disabled = true;

  return words_without_time;
}

function addTimeSettingsFinal(speechData) {
  let wholeString = speechData.results[0].alternatives[0].transcript;

  let nlpObject = nlp(wholeString).out('terms');
  let words = speechData.results[0].alternatives[0].words;

  let words_n_time = [];

  for (let i = 0; i < words.length; i++) {
    //data
    let word = words[i].word;
    let startTime = `${words[i].startTime.seconds}.${words[i].startTime.nanos}`;
    let endTime = `${words[i].endTime.seconds}.${words[i].endTime.nanos}`;
    let tags = [];

    //generate span
    let newSpan = document.createElement('span');
    newSpan.innerHTML = word;
    newSpan.dataset.startTime = startTime;

    //push all tags
    for (let j = 0; j < nlpObject[i].tags.length; j++) {
      tags.push(nlpObject[i].tags[j]);
    }

    //add all classes
    for (let j = 0; j < nlpObject[i].tags.length; j++) {
      let cleanClassName = nlpObject[i].tags[j];
      // console.log(tags);
      let className = `nl-${cleanClassName}`;
      newSpan.classList.add(className);
    }

    words_n_time.push(newSpan);
  }

  return words_n_time;
}

window.onbeforeunload = function () {
  if (streamStreaming) {
    socket.emit('endGoogleCloudStream', '');
  }
};

//================= SANTAS HELPERS =================

// sampleRateHertz 16000 //saved sound is awefull
function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  let buf = new Int16Array(l / 3);

  while (l--) {
    if (l % 3 == 0) {
      buf[l / 3] = buffer[l] * 0xffff;
    }
  }
  return buf.buffer;
}

function capitalize(s) {
  if (s.length < 1) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}
