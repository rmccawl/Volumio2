var socket = io();
var playerState = {};
var timeLastStateUpdate = 0;
var timerPlayback = null;
var libraryHistory = new Array();
var nLibraryHistoryPosition = 0;

// Define button actions --------------------------------------------
if (document.getElementById('button-volumioplay')) document.getElementById('button-volumioplay').onclick = function() {emitClientEvent('volumioPlay', '');}
if (document.getElementById('button-volumiopause'))document.getElementById('button-volumiopause').onclick = function() {emitClientEvent('volumioPause', '');}
if (document.getElementById('button-volumiostop'))document.getElementById('button-volumiostop').onclick = function() {emitClientEvent('volumioStop', '');}
if (document.getElementById('button-volumioprev'))document.getElementById('button-volumioprev').onclick = function() {emitClientEvent('volumioPrevious', '');}
if (document.getElementById('button-volumionext'))document.getElementById('button-volumionext').onclick = function() {emitClientEvent('volumioNext', '');}
document.getElementById('button-spopupdatetracklist').onclick = function() {emitClientEvent('spopUpdateTracklist', '');}
document.getElementById('button-volumiorebuildlibrary').onclick = function() {emitClientEvent('volumioRebuildLibrary', '');}
document.getElementById('button-clearconsole').onclick = clearConsole;
document.getElementById('button-libraryback').onclick = libraryBack;
document.getElementById('button-libraryforward').onclick = libraryForward;

// Create listeners for websocket events--------------------------------

socket.on('connect', function () {
	printConsoleMessage('Websocket connected.');
	enableControls();
	updateLibraryHistoryButtons();

	// Get the state upon load
	emitClientEvent('volumioGetState', '');

	// Get the play queue
	emitClientEvent('volumioGetQueue', '');

	// Request the music library root
	emitClientEvent('volumioBrowseLibrary', '');

});

socket.on('disconnect', function () {
	printConsoleMessage('Websocket disconnected.');
	libraryHistory = new Array();
	nLibraryHistoryPosition = 0;
	updateLibraryHistoryButtons();

	disableControls();
	clearPlayQueue();
	clearBrowseView();
	clearPlayerStateDisplay();
	stopPlaybackTimer();

});

socket.on('volumioPushState', function (state) {
	playerState = state;
	timeLastStateUpdate = Date.now();
	updatePlayerStateDisplay();

	if (state.status === 'play') {
		startPlaybackTimer(state.seek);

	} else {
		stopPlaybackTimer();

	}

//	printConsoleMessage('volumioPushState: ' + JSON.stringify(state));

});

socket.on('volumioPushQueue', function (arrayQueue) {
	updatePlayerQueue(arrayQueue);
//	printConsoleMessage('volumioPushQueue: ' + JSON.stringify(arrayQueue));

});

socket.on('volumioPushBrowseData', function (objBrowseData) {
	libraryHistory.splice(nLibraryHistoryPosition + 1, libraryHistory.length - nLibraryHistoryPosition - 1, objBrowseData);
	libraryForward();
//	printConsoleMessage('volumioPushBrowseData: ' + JSON.stringify(objBrowseData));

});

socket.on('printConsoleMessage', function (sMessage) {
	printConsoleMessage(sMessage);

});

// Define internal functions ----------------------------------------------
function clearConsole () {
	var nodeConsole = document.getElementById('console');

	while (nodeConsole.firstChild) {
		nodeConsole.removeChild(nodeConsole.firstChild);
	}

}

function enableControls () {
	arrayWebsocketControls = document.getElementsByClassName("control-websocket");

	for (i = 0; i < arrayWebsocketControls.length; i++) {
		arrayWebsocketControls[i].disabled = false;

	}

}

function disableControls() {
	arrayWebsocketControls = document.getElementsByClassName("control-websocket");

	for (i = 0; i < arrayWebsocketControls.length; i++) {
		arrayWebsocketControls[i].disabled = true;

	}

}

function printConsoleMessage (message) {
	var nodeListItem = document.createElement('LI');
	var nodeText = document.createTextNode(message);

	nodeListItem.appendChild(nodeText);
	document.getElementById('console').appendChild(nodeListItem);

	var divConsole = document.getElementById('div-console');
	divConsole.scrollTop = divConsole.scrollHeight;

}

function updatePlayerStateDisplay () {
	clearPlayerStateDisplay();

	var nodeText = document.createTextNode(JSON.stringify(playerState));
	document.getElementById('playerstate').appendChild(nodeText);

}

function startPlaybackTimer (nStartTime) {
	window.clearInterval(timerPlayback);

	timerPlayback = window.setInterval(function () {
		playerState.seek = nStartTime + Date.now() - timeLastStateUpdate;
		updatePlayerStateDisplay();

	}, 500);

}

function stopPlaybackTimer () {
	window.clearInterval(timerPlayback);

}

function clearPlayerStateDisplay() {
	var nodePlayerState = document.getElementById('playerstate');

	if (nodePlayerState.firstChild) {
		while (nodePlayerState.firstChild) {
			nodePlayerState.removeChild(nodePlayerState.firstChild);

		}

	}

}

function updatePlayerQueue (arrayQueue) {
	clearPlayQueue();

	var nodePlayQueue = document.getElementById('playqueue');
	var nodeListItem = null;
	var nodeText = null;
	for (i = 0; i < arrayQueue.length; i++) {
		nodeListItem = document.createElement('LI');
		nodeText = document.createTextNode(JSON.stringify(arrayQueue[i]));

		nodeListItem.appendChild(nodeText);
		nodePlayQueue.appendChild(nodeListItem);

	}

}

function clearPlayQueue () {
	var nodePlayQueue = document.getElementById('playqueue');

	if (nodePlayQueue.firstChild) {
		while (nodePlayQueue.firstChild) {
			nodePlayQueue.removeChild(nodePlayQueue.firstChild);

		}

	}

}

function updateBrowseView (objBrowseData) {
	clearBrowseView();

	var nodeBrowseView = document.getElementById('browseview');
	var arrayDataKeys = Object.keys(objBrowseData);

	for (i = 0; i < arrayDataKeys.length; i++) {
		var curEntry = objBrowseData[arrayDataKeys[i]];

		var sText = curEntry.datavalues.name;
		var sSubText = '';
		if ('service' in curEntry.datavalues) {
			sSubText = sSubText.concat(' service:(' + curEntry.datavalues.service + ')');
		}
		if ('uri' in curEntry.datavalues) {
			sSubText = sSubText.concat(' uri:(' + curEntry.datavalues.uri + ')');
		}
		if ('artists' in curEntry.datavalues) {
			sSubText = sSubText.concat(' ' + curEntry.datavalues.artists);
		}
		if ('album' in curEntry.datavalues) {
			sSubText = sSubText.concat(' [' + curEntry.datavalues.album + ']');
		}

		var nodeLink = document.createElement('a');
		nodeLink.setAttribute('href', '#');
		nodeLink.appendChild(document.createTextNode(sText));
		nodeLink.onclick = registerBrowseLibraryLink(curEntry['uid']);

		var nodeSpan = document.createElement('span');
		nodeSpan.appendChild(nodeLink);
		nodeSpan.appendChild(document.createElement('br'));
		nodeSpan.appendChild(document.createTextNode(sSubText));

		var nodeListItem = document.createElement('LI');
		nodeListItem.appendChild(nodeSpan);
		nodeListItem.style.whiteSpace="nowrap";
		nodeBrowseView.appendChild(nodeListItem);

	}

}

function registerBrowseLibraryLink (sId) {
	return function() {
		emitClientEvent('volumioBrowseLibrary', sId);

	}

}

function clearBrowseView () {
	var nodeBrowseView = document.getElementById('browseview');

	if (nodeBrowseView.firstChild) {
		while (nodeBrowseView.firstChild) {
			nodeBrowseView.removeChild(nodeBrowseView.firstChild);

		}

	}

}

function updateLibraryHistoryButtons () {
	var nHistoryItems = libraryHistory.length;

	if (nHistoryItems <= 1) {
		document.getElementById('button-libraryback').disabled = true;
		document.getElementById('button-libraryforward').disabled = true;

	} else if (nLibraryHistoryPosition <= 0) {
		document.getElementById('button-libraryback').disabled = true;
		document.getElementById('button-libraryforward').disabled = false;

	} else if (nLibraryHistoryPosition >= nHistoryItems - 1) {
		document.getElementById('button-libraryback').disabled = false;
		document.getElementById('button-libraryforward').disabled = true;

	} else {
		document.getElementById('button-libraryback').disabled = false;
		document.getElementById('button-libraryforward').disabled = false;

	}

}

function libraryForward () {
	var nHistoryItems = libraryHistory.length;

	if (nHistoryItems <= 1) {
		nLibraryHistoryPosition = 0;

	} else if (nLibraryHistoryPosition <= 0) {
		nLibraryHistoryPosition = 1;

	} else if (nLibraryHistoryPosition >= nHistoryItems - 1) {
		nLibraryHistoryPosition = nHistoryItems - 1;

	} else {
		nLibraryHistoryPosition++;

	}

	updateBrowseView(libraryHistory[nLibraryHistoryPosition]);
	updateLibraryHistoryButtons();

}

function libraryBack () {
	var nHistoryItems = libraryHistory.length;

	if (nHistoryItems <= 1) {
		nLibraryHistoryPosition = 0;

	} else if (nLibraryHistoryPosition <= 0) {
		nLibraryHistoryPosition = 0;

	} else if (nLibraryHistoryPosition >= nHistoryItems - 1) {
		nLibraryHistoryPosition = nHistoryItems - 2;

	} else {
		nLibraryHistoryPosition--;

	}

	updateBrowseView(libraryHistory[nLibraryHistoryPosition]);
	updateLibraryHistoryButtons();

}

function emitClientEvent (sEvent, sData) {
	socket.emit(sEvent, sData);
	printConsoleMessage(sEvent + ': ' + sData);

}

