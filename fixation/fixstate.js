// canvas
// animiation painting
// state machine

(function fixation() {

	var me = {};
	
	var canvasHeight=100;
	var canvasWidth = canvasHeight;
	var pointerCenterX=50;
	var pointerCenterY=50;
	var len=4;
	var width=1;
	var green = '#00ff00' ;
	var red = '#Ff0000' ;
	var blue = '#0000Ff' ;
	var yellow = '#ffff00' ;
	var black = '#000000' ;
	var color = black ;
	var currentColor = color; 
	function getRandomInt(max) {
	  return Math.floor(Math.random() * Math.floor(max));
	}

	function randomColor() {
		let c = getRandomInt(3);
		if (c==0) return red; 
		if (c==1) return blue; 
		if (c==2) return green; 
		if (c==3) return yellow; 
		return black;
	}

	$('#len').val(len);
	var $div = $('#canvas_container');
	var windowWidth = $(window).width()-50;
	var top = $div.offset().top;

	var paper = new Raphael(document.getElementById('canvas_container'), canvasWidth, canvasHeight);  
	var pointer;

	var maxDurationMs = 1500;
	var minDuration=300;
	var isShown;
	
	var up = 38 ;
	var left = 37 ;
	var right = 39;
	var down = 40;
	var enter = 13;

	var angleSize = 90;
	var smallDeltaAngle = 10;
	var $timeIntervalBetween90degrees = $('#intervalField').val(60);
	var timeIntervalBetween90degrees = parseInt( $timeIntervalBetween90degrees.val() );
	var timeIntervalBetweenSmallAngles = timeIntervalBetween90degrees * smallDeltaAngle * 1.0 / angleSize;

	var MOVING=1;
	var HOLD=2;
	var GUESS=3;
	var SCORE=4;
	var state =SCORE; 
	var currentAngle=0;
	var lastDrawnAngle=0; 

	var currentDuration=0; 
	var shiftNow=false;

	var requestCount=0;
	var requestCompleted=0;
	var requestCompletedNotIgnored=0;

	function gotoMoving() {
		state = MOVING;
		color = black; 

		currentDuration = maxDurationMs ;
		currentDuration = Math.max(Math.ceil(Math.random() * maxDurationMs), minDuration)  ;
		console.log("currentDuration : "+currentDuration);
		breakFlag = false;
		setTimeout(function() { breakFlag=true; }, currentDuration ) ;

		moving();
	}

	var shiftWaiting=false;

	function moving() {

		if (!shiftWaiting) {
			shiftWaiting=true;
			setTimeout( function(){shiftNow=true; shiftWaiting=false; console.log("timeout..")},  500);
		}

		currentAngle += smallDeltaAngle; 

		// is 90 and break
		if (((currentAngle % angleSize ) ==0) && breakFlag ) {
			hold();
		}
		else {
			requestCount++;
			requestAnimationFrame(draw);
			setTimeout( moving,  timeIntervalBetweenSmallAngles);
		}
		console.log("moving: currentAngle:"+currentAngle%360)
	}

	function hold() {
		state = HOLD;
		requestCount++;
		requestAnimationFrame(draw);
	}

	function guess() {
		state = GUESS;
		requestAnimationFrame(draw);
	}

	var windowSize=3;
	var windowCount=0;
	var windowScore=0;
	var stepMs = 4 ; 
	var guessedAngle=0;

	function score(key) {
		state = SCORE;

		// recalc and update display 
		var arrow;
		if (currentAngle % 360 == 90 ){
			guessedAngle = 90;
			arrow = left;
		}
		else if (currentAngle % 360  == 180 ){
			guessedAngle = 180;
			arrow = up;
		}
		else if (currentAngle % 360  == 270 ){
			guessedAngle = 270;
			arrow = right;
		}
		else if (currentAngle  % 360 == 0 ){
			guessedAngle = 0;
			arrow = down;
		}
		
		if (arrow==key) {
			windowScore++;
			color = green;
		}
		else {
			color = red;
		}
		windowCount++;
		timeIntervalBetween90degrees = parseInt($timeIntervalBetween90degrees.val());
		if (windowCount>=windowSize) {
			
			let textColor = black;
			if (windowScore>(0.667*windowSize)) {
				timeIntervalBetween90degrees -= stepMs;
				textColor=green;
			}
			else  	
			if (windowScore<(0.333*windowSize)) {
				timeIntervalBetween90degrees += stepMs;
				textColor=red;
			}
			
			$timeIntervalBetween90degrees.css({'color':textColor}).val(timeIntervalBetween90degrees);
			timeIntervalBetweenSmallAngles = timeIntervalBetween90degrees * smallDeltaAngle * 1.0 / angleSize;
			
			windowCount=0;
			windowScore=0;
		}
		$("#scoreField").text("("+windowCount+":"+windowScore+":"+timeIntervalBetween90degrees+":"+Math.round( timeIntervalBetweenSmallAngles)+":"+stepMs+")");		

		requestAnimationFrame(draw);

	}

	function draw(timeElapsed) {
		if (state == GUESS ) {
			pointer.hide();
		}
		else if (state == SCORE ) {
			pointer.show();
			if (currentColor!=color) {
				currentColor = color ;
				$('svg path[stroke]').attr('stroke', color)

				//$('svg path[stroke]').attr('stroke', green)
				//let temppointer = paper.path("M "+pointerCenterX+" "+pointerCenterY+" v "+len*2+" m "+(-len)+" "+(-len*2)+" h "+len*2);  
				//temppointer.rotate(""+guessedAngle, 50,50);
				//temppointer.attr({ stroke: red, 'stroke-width': 1})

			}
		}
		else if (state == HOLD )
		{
			rotate();
			setTimeout( function () { guess();} ,  timeIntervalBetweenSmallAngles);
		}
		else if (state == MOVING )
		{
			rotate();
		}
		else {
			let error = "unknown state: "+state;
			console.log(error);
			throw error; 
		} 
	}

	function rotate() {
		let deltaAngle = currentAngle - lastDrawnAngle; 
		if (deltaAngle!=0) {
			requestCompletedNotIgnored++;
			if (currentColor!=color) {							
				currentColor = color ;
				$('svg path[stroke]').attr('stroke', currentColor)
			}
			pointer.rotate(""+deltaAngle, 50,50);
			if (shiftNow && (currentAngle % 90 == 0 )) {
				shiftNow=false;
				//shiftRight(getRandomInt(30)+10);			
			}
		}
		//pointer.show();

		lastDrawnAngle= currentAngle ;		

		//console.log("rotate: lastDrawnAngle:" +lastDrawnAngle + "  currentAngle:"+currentAngle)
		console.log("rotate: mode lastDrawnAngle:" +lastDrawnAngle%360 + "  currentAngle:"+currentAngle%360);
		requestCompleted++;
		console.log("requestCount:"+requestCount+" requestCompleted:" +requestCompleted +" requestCompletedNotIgnored: "+requestCompletedNotIgnored)
	}
	function shiftRight(offset) {
		let left = $div.offset().left;
		left+=offset;
		if (left>windowWidth)
			left=0; 
		console.log("left: "+(left - $(window).scrollLeft()));
		
		$div.css({position: "absolute",
		    top: top, left: left
			});		
	}

	$(window).keydown(function(e) {
		
		if (e.keyCode == left) {
			if (state == SCORE)
				gotoMoving();
			else if (state == GUESS)
				score(e.keyCode);			
		}
		else if (e.keyCode == right) {
			if (state == SCORE)
				gotoMoving();
			else if (state == GUESS)
				score(e.keyCode);			
		}
		else if (e.keyCode == up) {
			if (state == SCORE)
				gotoMoving();
			else if (state == GUESS)
				score(e.keyCode);			
		}
		else if (e.keyCode == down) {
			if (state == SCORE)
				gotoMoving();
			else if (state == GUESS)
				score(e.keyCode);			
		}
		else if (e.keyCode == enter) {
			gotoMoving();
		}
	});

	
	// wire buttons
	$('#spinButton').on('click', function(e) {
		gotoMoving();
	});

	$('#showButton').on('click', function(e) {
		gotoMoving();
	});

	$('#rotateButton').on('click', function(e) {
		gotoMoving();
	});
	
	$('#saveButton').on('click', function(e) {
		var str = JSON.stringify(fixation);
		str = JSON.stringify(me);
		console.log(str);
	});
	

	drawInit = function() {
		if (pointer) 
			pointer.remove();
		//len=parseInt($('#len').val())	;	 
		pointer = paper.path("M "+pointerCenterX+" "+pointerCenterY+" v "+len*2+" m "+(-len)+" "+(-len*2)+" h "+len*2);  
		pointer.attr({ stroke: color, 'stroke-width': width})
		pointer.rotate(""+lastDrawnAngle, 50,50);

		currentAngle = 0 ;
		
	};
	drawInit();
	return me;
})();
