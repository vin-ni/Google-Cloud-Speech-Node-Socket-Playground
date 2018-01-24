'use strict'

//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//	Contact: vinzenz@sansho.studio

//connection to socket
const socket = io.connect();

//================= CONFIG =================
// Stream Audio
let bufferSize = 2048,
	AudioContext,
	context,
	processor,
	input;

//vars
let audioElement = document.querySelector('audio'),
	finalWord = false,
	resultText = document.getElementById('ResultText'),
	removeLastWord = true;

//audioStream constraints
const constraints = {
	audio: true,
	video: false
};

//================= RECORDING =================



function initRecording() {

	//need to call this directly through the Button on iOS. Otherwise could call this only in getUserMedia
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();
	context.resume();

	navigator.mediaDevices.getUserMedia(constraints)
		.then(function (mediaStream) {
			socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection

			// Could call it here if it weren't for iOs
			// AudioContext = window.AudioContext || window.webkitAudioContext;
			// context = new AudioContext();
			// context.resume();

			processor = context.createScriptProcessor(bufferSize, 1, 1);
			processor.connect(context.destination);

			console.log(AudioContext);
			console.log('context Resumed');

			var handleGetUserMediaSuccess = function (stream) {
				input = context.createMediaStreamSource(stream);
				input.connect(processor);

				processor.onaudioprocess = function (e) {
					microphoneProcess(e);
					// Do something with the data, i.e Convert this to WAV
				};
			};
			navigator.mediaDevices.getUserMedia({ audio: true, video: false })
				.then(handleGetUserMediaSuccess);

		})
}

function microphoneProcess(e) {
	var left = e.inputBuffer.getChannelData(0);
	var left16 = convertFloat32ToInt16(left);
	socket.emit('binaryData', left16);
}




//================= INTERFACE =================
var startButton = document.getElementById("startRecButton");
startButton.addEventListener("click", startRecording);

var endButton = document.getElementById("stopRecButton");
endButton.addEventListener("click", stopRecording);
endButton.disabled = true;



function startRecording() {
	startButton.disabled = true;
	endButton.disabled = true;
	initRecording();
}

function stopRecording() {
	// waited for FinalWord
	startButton.disabled = true;
	endButton.disabled = true;

	socket.emit('endGoogleCloudStream', '');

	input.disconnect(processor);
	processor.disconnect(context.destination);
	input = null;
	processor = null;
	context = null;
	AudioContext = null;

	// audiovideostream.stop();

	startButton.disabled = false;
}

//================= SOCKET IO =================
socket.on('connect', function (data) {
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
		if (removeLastWord) { resultText.lastElementChild.remove(); }
		removeLastWord = true;

		//add empty span
		let empty = document.createElement('span');
		resultText.appendChild(empty);

		//add children to empty span
		let edit = addTimeSettingsInterim(data);

		for (var i = 0; i < edit.length; i++) {
			resultText.lastElementChild.appendChild(edit[i]);
			resultText.lastElementChild.appendChild(document.createTextNode('\u00A0'));
		}

	} else if (dataFinal === true) {
		resultText.lastElementChild.remove();

		//add empty span
		let empty = document.createElement('span');
		resultText.appendChild(empty);

		//add children to empty span
		let edit = addTimeSettingsFinal(data);
		for (var i = 0; i < edit.length; i++) {
			resultText.lastElementChild.appendChild(edit[i]);
			resultText.lastElementChild.appendChild(document.createTextNode('\u00A0'));
		}

		console.log("Google Speech sent 'final' Sentence.");
		finalWord = true;
		endButton.disabled = false;

		removeLastWord = false;
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
	socket.emit('endGoogleCloudStream', '');
	alert("Window Unload");
};

//================= SANTAS HELPERS =================

// sampleRateHertz 16000 //saved sound is awefull
function convertFloat32ToInt16(buffer) {
	let l = buffer.length;
	let buf = new Int16Array(l / 3);

	while (l--) {
		if (l % 3 == 0) {
			buf[l / 3] = buffer[l] * 0xFFFF;
		}
	}
	return buf.buffer
}