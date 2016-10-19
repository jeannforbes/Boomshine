// main.js
// Dependencies: utilities.js, keys.js, sound.js
// Reponsible for the main game logic, updates, and drawing to the screen

"use strict";

var app = app || {};

app.main = {
	//  properties
    WIDTH : 640, 
    HEIGHT: 480,
    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: false,
    totalScore: 0,
    bestScore : 0,
    CIRCLE: {
    	NUM_CIRCLES_START: 6,
    	NUM_CIRCLES_END: 20,
    	START_RADIUS: 20,
    	MAX_RADIUS: 45,
    	MIN_RADIUS: 2,
    	MAX_LIFETIME: 2,
    	MAX_SPEED: 120,
    	EXPLOSION_SPEED: 60,
    	IMPLOSION_SPEED: 84,
        NUM_CIRCLES_END: 33,
        NUM_LEVEL_INCREASE: 6,
        NUM_PERCENT_CIRCLES_TO_ADVANCE: 0.45,
    },
    CIRCLE_STATE: {
    	NORMAL: 0,
    	EXPLODING: 1,
    	MAX_SIZE: 2,
    	IMPLOADING: 3,
    	DONE: 4
    },
    GAME_STATE:{
        MAIN_SCREEN: -1,
    	BEGIN: 0,
    	DEFAULT: 1,
    	EXPLODING: 2,
    	ROUND_OVER: 3,
    	REPEAT_LEVEL: 4,
    	END: 5
    },
    currentLevel:{
        scoreGoal: 2,
        color : { level: "black", font: "white"},
        levelColors:     [],
        levelFontColors: ["white", "black", "black", "black"],
    },
    circles: [],
    numCircles: 0,
    paused: false,
    animationID: 0,
    gameState: 0,
    colors: ["#00308f", "#e30074", "#b8d000","#FFFF66","#66FF66","#50BFE6","#FF6EFF", "#EE34D2"],
    sound: undefined,
    
    
    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

		this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
	 	this.circles = this.makeCircles(this.numCircles);

        //Resize window
        this.resizeGameWindow();
        window.onresize = this.resizeGameWindow.bind(this);

        //Store highscore
        this.bestScore = window.localStorage.getItem('highScore');
        window.onunload = this.saveHighScore.bind(this);

        //Audio
        this.bgAudio = document.querySelector("#bgAudio");
        this.bgAudio.volume = 0.25;
        this.effectAudio = document.querySelector("#effectAudio");
        this.effectAudio.volume = 0.3;

        //Images
        for(var i=0; i<document.getElementsByTagName("img").length; i++){
            this.currentLevel.levelColors[i] = (document.querySelector("#bgImg"+i));
        }

        this.canvas.onmousedown = this.doMousedown.bind(this);

        this.reset();
		
		// start the game loop
		this.update();
	},

    resizeGameWindow : function(){
        this.canvas.width = this.WIDTH = window.innerWidth;
        this.canvas.height = this.HEIGHT = window.innerHeight;

        this.CIRCLE.START_RADIUS = (this.WIDTH+this.HEIGHT) * 0.02;
        this.CIRCLE.MAX_RADIUS = this.CIRCLE.START_RADIUS * 2;
        this.CIRCLE.EXPLOSION_SPEED = this.CIRCLE.IMPLOSION_SPEED = (this.WIDTH+this.HEIGHT)*0.05;

        for(var i=0; i<this.circles.length; i++){
            this.circles[i].radius = this.CIRCLE.START_RADIUS;
            if(this.circles[i].x > this.canvas.width)
                this.circles[i].x = this.canvas.width - this.CIRCLE.START_RADIUS*1.5;
            if(this.circles[i].y > this.canvas.height)
                this.circles[i].y = this.canvas.height - this.CIRCLE.START_RADIUS*1.5;
        }
    },

    saveHighScore : function(){
        window.localStorage.setItem('highScore',this.bestScore);
    },
	
	update: function(){
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));

	 	// get change in time
	 	var dt = this.calculateDeltaTime();

		// draw background
		this.ctx.drawImage(this.currentLevel.color.level, 0,0,this.canvas.width, this.canvas.height);
	
		// draw circles
        this.ctx.globalAlpha = 0.8;
		this.drawCircles(this.ctx);
		
		// draw debug
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "black");
		}

        //Check if we need to pause
        if(this.paused){
            this.drawPauseScreen(this.ctx);
            return;
        }

        // iii) draw HUD
        this.drawHUD(this.ctx);

        // move circles
        this.moveCircles(dt);

        // check for collisions between circles
        this.checkForCollisions();

        //Cheat code! -- testing purposes only
        if(this.gameState == this.GAME_STATE.BEGIN || this.gameState == this.GAME_STATE.ROUND_OVER){
            if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && myKeys.keydown[myKeys.KEYBOARD.KEY_SHIFT]){
                this.totalScore++;
                this.sound.playEffect();
            }
        }
	},

    // draws text with the given parameters
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
    // returns change in time
	calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	
    // check if the circle hit the left or right of the screen
    circleHitLeftRight: function(c){
    	if(c.x < c.radius || c.x > this.WIDTH - c.radius){
    		return true;
    	}
    },

    // check if the circle hit the top or bottom of the screen
    circleHitTopBottom: function(c){
    	if(c.y < c.radius || c.y > this.HEIGHT - c.radius){
    		return true;
    	}
    },

    // draw all of the circles
    drawCircles: function(ctx){
    	for(var i=0; i<this.circles.length; i++){
    		var c = this.circles[i];
    		if(c.state === this.CIRCLE_STATE.DONE) continue;
            c.draw(ctx);
    	}
    },

    // move all of the circles
    moveCircles: function(dt){
    	for(var i=0; i<this.circles.length; i++){
    		var c = this.circles[i];
    		
            switch(c.state){
                case this.CIRCLE_STATE.NORMAL:
                    c.move(dt);
                    break;
                case this.CIRCLE_STATE.EXPLODING:
                    c.radius += this.CIRCLE.EXPLOSION_SPEED * dt;
                    if(c.radius >= this.CIRCLE.MAX_RADIUS) c.state = this.CIRCLE_STATE.MAX_SIZE;
                    break;
                case this.CIRCLE_STATE.MAX_SIZE:
                    c.lifetime += dt;
                    if(c.lifetime >= this.CIRCLE.MAX_LIFETIME) c.state = this.CIRCLE_STATE.IMPLODING;
                    break;
                case this.CIRCLE_STATE.IMPLODING:
                    c.radius -= this.CIRCLE.IMPLOSION_SPEED * dt;
                    if(c.radius <= this.CIRCLE.MIN_RADIUS) c.state = this.CIRCLE_STATE.DONE;
                    break;
                default:
                    break;
            }

            if(this.circleHitLeftRight(c)){
                c.xSpeed *= -1;
                c.move(dt);
            }
            if(this.circleHitTopBottom(c)){
                c.ySpeed *= -1;
                c.move(dt);
            }
    	}
    },

    // create every circle (call this at the beginning of the level)
    makeCircles: function(num){
    	var array = [];

    	var circleDraw = function(ctx){
    		ctx.save();

            ctx.beginPath();
            ctx.arc(this.shadowX, this.shadowY, this.radius, 0, Math.PI*2);
            ctx.closePath();
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fill();

    		ctx.beginPath();
    		ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    		ctx.closePath();
    		ctx.fillStyle = this.fillStyle;
    		ctx.fill();

    		ctx.restore();
    	};

    	var circleMove = function(dt){
    		this.x += this.xSpeed * this.speed * dt;
    		this.y += this.ySpeed * this.speed * dt;
            this.shadowX = this.x + 3;
            this.shadowY = this.y + 3;
    	};

    	for(var i=0; i<num; i++){
    		var c = {};

    		c.x = getRandom(this.CIRCLE.START_RADIUS *2, this.WIDTH - this.CIRCLE.START_RADIUS *2);
    		c.y = getRandom(this.CIRCLE.START_RADIUS *2, this.HEIGHT - this.CIRCLE.START_RADIUS*2);
            c.shadowX = c.x - 5;
            c.shadowY = c.y + 5;

    		c.radius = this.CIRCLE.START_RADIUS;

    		var randomVector = getRandomUnitVector();
    		c.xSpeed = randomVector.x;
    		c.ySpeed = randomVector.y;

    		c.speed = this.CIRCLE.MAX_SPEED;
    		c.fillStyle = this.colors[i%this.colors.length];
    		c.state = this.CIRCLE_STATE.NORMAL;
    		c.lifetime = 0;

    		c.draw = circleDraw;
    		c.move = circleMove;
    		Object.seal(c);
    		array.push(c);
    	}
    	return array;
    },

    pauseGame : function(){
        this.stopBGAudio();
        this.paused = true;
        cancelAnimationFrame(this.animationID);
        this.drawHUD(this.ctx);
    },

    resumeGame : function(){
        this.sound.playBGAudio();
        cancelAnimationFrame(this.animationID);
        this.paused = false;
        this.drawHUD(this.ctx);
    },

    drawPauseScreen: function(ctx){
    	ctx.save();
    	ctx.fillStyle = "rgba(0,0,0,0.2)";
    	ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
    	ctx.textAlign = "center";
    	ctx.textBaseline = "middle";
    	this.fillText(this.ctx, "... PAUSED ...", this.WIDTH/2, this.HEIGHT/2, "40pt courier", "white");
    	ctx.restore();
    },

    //Draws text to the screen based on game state
    drawHUD: function(ctx){
        ctx.save();

        var fontColor = this.currentLevel.color.font;
        var bigFontSize = (this.WIDTH+this.HEIGHT)/60+"pt";
        var medFontSize = (this.WIDTH+this.HEIGHT)/80+"pt";
        var smallFontSize = (this.WIDTH+this.HEIGHT)/110+"pt";
        if(this.totalScore > this.bestScore && this.gameState != this.GAME_STATE.REPEAT_LEVEL){
            this.bestScore = this.totalScore;
            this.saveHighScore();
        }

        this.fillText(ctx, "Level Goal: "+this.roundScore+" out of "+this.currentLevel.scoreGoal, 20, 20, smallFontSize+" courier", "black");
        this.fillText(ctx, "Total Score: "+ this.totalScore, this.WIDTH - 260, 20, smallFontSize+" courier", "black");
        this.fillText(ctx, "High Score: "+ this.bestScore, this.WIDTH - 260, 60, smallFontSize+" courier", "black");
 
        if(this.gameState == this.GAME_STATE.MAIN_SCREEN){
            ctx.fillStyle = "purple";
        }
        else if(this.gameState == this.GAME_STATE.BEGIN){
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "To begin, click a circle", this.WIDTH/2, this.HEIGHT/2, bigFontSize+" courier", fontColor);
        }
        else if(this.gameState == this.GAME_STATE.ROUND_OVER){
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "Nicely done!", this.WIDTH/2, this.HEIGHT/2 - 40, bigFontSize+" courier", "green");
            this.fillText(ctx, "Click to continue", this.WIDTH/2, this.HEIGHT/2, medFontSize+" courier", fontColor);
            this.fillText(ctx, "Next round there are "+ (this.numCircles+5)+" circles", this.WIDTH/2, this.HEIGHT/2 +40, medFontSize+" courier", fontColor);
        }
        else if(this.gameState == this.GAME_STATE.REPEAT_LEVEL){
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            this.fillText(ctx, "You missed "+(this.currentLevel.scoreGoal - this.roundScore)+" out of "+this.currentLevel.scoreGoal,this.WIDTH/2, this.HEIGHT/2 - 40, bigFontSize+" courier", "#FF0");
            this.fillText(ctx, "Click to retry this level", this.WIDTH/2, this.HEIGHT/2 +40, medFontSize+" courier", fontColor);
        }
        else if(this.gameState == this.GAME_STATE.END){
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if(this.numCircles > 60) this.fillText(ctx, "You Win!", this.WIDTH/2, this.HEIGHT/2 - 40, bigFontSize+" courier", "#0A3");
            else this.fillText(ctx, "You Win!", this.WIDTH/2, this.HEIGHT/2 - 40, bigFontSize+" courier", "purple");
            this.fillText(ctx, "This game's score was "+this.totalScore, this.WIDTH/2, this.HEIGHT/2, medFontSize+" courier", fontColor);
            this.fillText(ctx, "Your BEST score is "+this.bestScore, this.WIDTH/2, this.HEIGHT/2 + 40, medFontSize+" courier", fontColor);
            this.fillText(ctx, "Click to start a new game", this.WIDTH/2, this.HEIGHT/2 +80, smallFontSize+" courier", fontColor);
        }

        ctx.restore();
    },

    doMousedown: function(e){
        this.sound.playBGAudio();

        //click to unpause
        if(this.paused){
            this.paused = false;
            this.update();
            return;
        }

        //only 1 circle clicked per level
        if(this.gameState == this.GAME_STATE.EXPLODING) return;
        //if round is over, reset
        if(this.gameState == this.GAME_STATE.ROUND_OVER || this.gameState == this.GAME_STATE.END || this.gameState == this.GAME_STATE.REPEAT_LEVEL){
            this.reset();
            return;
        }

    	var mouse = getMouse(e);
    	this.checkCircleClicked(mouse);
    },

    checkCircleClicked: function(mouse){
    	for(var i=this.circles.length-1; i>=0; i--){
    		var c = this.circles[i];
    		if(pointInsideCircle(mouse.x, mouse.y, c)){
                this.sound.playEffect();

    			c.xSpeed = c.ySpeed = 0;
                c.state = this.CIRCLE_STATE.EXPLODING;
                this.gameState = this.GAME_STATE.EXPLODING;
                this.roundScore++;
    			break;
    		}
    	}
    },

    checkForCollisions: function(){
        if(this.gameState == this.GAME_STATE.EXPLODING){
            for(var i=0; i<this.circles.length; i++){
                var c1 = this.circles[i];
                if(c1.state === this.CIRCLE_STATE.NORMAL) continue;
                if(c1.state === this.CIRCLE_STATE.DONE) continue;
                for(var j=0; j<this.circles.length; j++){
                    var c2 = this.circles[j];
                    if(c1 === c2) continue;
                    if(c2.state != this.CIRCLE_STATE.NORMAL) continue;
                    if(c2.state === this.CIRCLE_STATE.DONE) continue;
                    if(circlesIntersect(c1, c2)){
                        this.sound.playEffect();

                        c2.state = this.CIRCLE_STATE.EXPLODING;
                        c2.xSpeed = c2.ySpeed = 0;
                        this.roundScore++;
                    }
                }
            }

            var isOver = true;
            for(var i=0; i<this.circles.length; i++){
                var c = this.circles[i];
                if(c.state != this.CIRCLE_STATE.NORMAL && c.state != this.CIRCLE_STATE.DONE){
                    isOver = false;
                    break;
                }
            }

            if(isOver){

                this.stopBGAudio();

                if(this.roundScore < this.currentLevel.scoreGoal) this.gameState = this.GAME_STATE.REPEAT_LEVEL;
                else if(this.numCircles > this.CIRCLE.NUM_CIRCLES_END) this.gameState = this.GAME_STATE.END;
                else if(this.roundScore >= this.currentLevel.scoreGoal) this.gameState = this.GAME_STATE.ROUND_OVER;
            
                if(this.gameState != this.GAME_STATE.REPEAT_LEVEL) this.totalScore += this.roundScore;
            }
        }
    },

    reset: function(){
        if(this.gameState == this.GAME_STATE.END){
            this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
            this.totalScore = 0;
        } else if(this.gameState != this.GAME_STATE.REPEAT_LEVEL){
            this.numCircles += this.CIRCLE.NUM_LEVEL_INCREASE;
            var i = parseInt(Math.random()*this.currentLevel.levelColors.length);
            this.currentLevel.color.level = this.currentLevel.levelColors[i];
            this.currentLevel.color.font = this.currentLevel.levelFontColors[i];
        }
        this.roundScore = 0;
        this.currentLevel.scoreGoal = parseInt(this.numCircles*this.CIRCLE.NUM_PERCENT_CIRCLES_TO_ADVANCE);
        this.circles = this.makeCircles(this.numCircles);
        this.gameState = this.GAME_STATE.DEFAULT;
    },

    //AUDIO
    stopBGAudio : function(){
        this.sound.stopBGAudio();
    },

    //DEBUG MODE
    debugMode(){
        this.debug = !this.debug;
    }
    
};