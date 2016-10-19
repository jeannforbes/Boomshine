// sound.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// define the .sound module and immediately invoke it in an IIFE
app.sound = (function(){
	console.log("sound.js module loaded");
	var bgAudio = undefined;
	var effectAudio = undefined;
	var currentEffect = 0;
	var currentDirection = 1;
	var effectSounds = ["1.mp3","2.mp3","3.mp3","4.mp3","5.mp3","6.mp3","7.mp3","8.mp3"];
	

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.25;
		effectAudio = document.querySelector("#effectAudio");
		effectAudio.volume = 0.3;
	}

	function playBGAudio(){
		bgAudio.play();
	}
		
	function stopBGAudio(){
		bgAudio.pause();
		bgAudio.currentTime = 0;
	}
	
	function playEffect(){
		effectAudio.src = "media/" + effectSounds[currentEffect];
		effectAudio.play();
		currentEffect += currentDirection;
		if (currentEffect == effectSounds.length || currentEffect == -1){
			currentDirection *= -1;
			currentEffect += currentDirection;
		}
	}
		
	// export a public interface to this module
	return{
		init: init,
		playBGAudio: playBGAudio,
		stopBGAudio: stopBGAudio,
		playEffect: playEffect
	}
}());