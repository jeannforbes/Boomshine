"use strict";

//find if given coords are inside a circle
function pointInsideCircle(x, y, I){
	var dx = x - I.x;
	var dy = y - I.y;
	return dx * dx + dy * dy <= I.radius * I.radius;
}

function circlesIntersect(c1, c2){
	var dx = c2.x - c1.x;
	var dy = c2.y - c1.y;
	var distance = Math.sqrt(dx*dx + dy*dy);
	return distance < (c1.radius + c2.radius);
}

// returns mouse position in local coordinate system of element
function getMouse(e){
	var mouse = {}
	mouse.x = e.pageX - e.target.offsetLeft;
	mouse.y = e.pageY - e.target.offsetTop;
	return mouse;
}

function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}


function makeColor(red, green, blue, alpha){
	var color='rgba('+red+','+green+','+blue+', '+alpha+')';
	return color;
}

function getRandomColor(){
	var red = Math.round(Math.random()*200+55);
	var green = Math.round(Math.random()*200+55);
	var blue=Math.round(Math.random()*200+55);
	var color='rgb('+red+','+green+','+blue+')';
	return color;
}

function getRandomUnitVector(){
	var x = getRandom(-1,1);
	var y = getRandom(-1,1);
	var length = Math.sqrt(x*x + y*y);
	if(length == 0){ // very unlikely
		x=1; // point right
		y=0;
		length = 1;
	} else{
		x /= length;
		y /= length;
	}
	
	return {x:x, y:y};
}

function simplePreload(imageArray){
	// loads images all at once
	for (var i = 0; i < imageArray.length; i++) {
		var img = new Image();
		img.src = imageArray[i];
	}
}


function loadImagesWithCallback(sources, callback) {
	var imageObjects = [];
	var numImages = sources.length;
	var numLoadedImages = 0;
	
	for (var i = 0; i < numImages; i++) {
	  imageObjects[i] = new Image();
	  imageObjects[i].onload = function() {
	  	numLoadedImages++;
	  	console.log("loaded image at '" + this.src + "'")
		if(numLoadedImages >= numImages) {
		  callback(imageObjects); // send the images back
		}
	  };
	  
	  imageObjects[i].src = sources[i];
	}
  }

function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}


 // FULL SCREEN MODE
function requestFullscreen(element) {
	if (element.requestFullscreen) {
	  element.requestFullscreen();
	} else if (element.mozRequestFullscreen) {
	  element.mozRequestFullscreen();
	} else if (element.mozRequestFullScreen) {
	  element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
	  element.webkitRequestFullscreen();
	}
	// .. and do nothing if the method is not supported
};

// This gives Array a randomElement() method
Array.prototype.randomElement = function(){
	return this[Math.floor(Math.random() * this.length)];
}


