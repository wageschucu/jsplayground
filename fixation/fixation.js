
(function fixation() {

	var me = {};
	
	me.canvasHeight=500;
	var canvasHeight=me.canvasHeight;
	var canvasWidth = canvasHeight;
	var pointerCenterX=50;
	var pointerCenterY=50;
	var len=4;
	$('#len').val(len);

	var paper = new Raphael(document.getElementById('canvas_container'), canvasWidth, canvasHeight);  
	var pointer;

	var deltaAngle = 90;
	var smallDeltaAngle = 10;
	var $timeIntervalBetween90degrees = $('#intervalField').val(60);
	var timeIntervalBetween90degrees = parseInt( $timeIntervalBetween90degrees.val() );
	var timeIntervalBetweenSmallAngles = timeIntervalBetween90degrees * smallDeltaAngle * 1.0 / deltaAngle;
	var currentDuration;
	var breakFlag=false;
	var stopHere = false;
	var maxDurationMs = 1500;
	var minDuration=300;
	var isShown;
	
	var up = 38 ;
	var left = 37 ;
	var right = 39;
	var down = 40;
	var enter = 13;
	
	me.spin = function() {
		
		draw();
		function animate(timestampRequestQueued) {
			if (!stopHere && breakFlag && (currentAngle % deltaAngle==0 ) )  {
				stopHere = false;
				me.hide();
				return ;
			}
			if (!stopHere)
				rotate();
	
		}

		function rotateTimeout() {
			// calc next timeout absolute
			// on callback from requested draw, check for time past nextimeout absolute, 
			//   if pass rotate - stop error if window is double past
			//   if not past return no draw 
			// if random timeout reached, hide and end request draw 

			requestAnimationFrame(animate)	;
			if (breakFlag && (currentAngle % deltaAngle==0 )) {
				stopHere=true 
			}
			else if (stopHere)
				return ;

			setTimeout( rotateTimeout,  timeIntervalBetweenSmallAngles);
		};
		
		currentDuration = maxDurationMs ;
		currentDuration = Math.max(Math.ceil(Math.random() * maxDurationMs), minDuration)  ;
		console.log("currentDuration : "+currentDuration);
		breakFlag = false;
		setTimeout(function() { breakFlag=true; }, currentDuration ) ;

		// start request draw - rotateTimeout( -- add param- currenttime?? )
		rotateTimeout();
	};
	
	me.show = function() {
		pointer.show();
		isShown=true;
	};

	me.hide = function() {
		pointer.hide();
		isShown=false;
	};
	var currentAngle = 0 ;
	
	rotate = function() {
		//currentPosX+=50;
		pointer.rotate(""+smallDeltaAngle, 50,50);
		//pointer.translate(50,0);
		//pointer.transform("T"+currentPosX+",0");
		//pointer.transform("t"+currentPosX+",0r"+currentAngle);
		// pointer.transform("r"+currentAngle);
		currentAngle= (currentAngle+smallDeltaAngle) % 360;
		console.log("rotate: "+currentAngle );
		
	};
	
	clear = function() {
		pointer.hide();
		isShown=false;
	}
	
	draw = function() {
		if (pointer) 
			pointer.remove();
		len=parseInt($('#len').val())	;	 
		pointer = paper.path("M "+pointerCenterX+" "+pointerCenterY+" v "+len*2+" m "+(-len)+" "+(-len*2)+" h "+len*2);  
		pointer.attr({ stroke: '#000', 'stroke-width': 1})
		//pointer.animate({rotation: 270}, 5000);		
		currentAngle = 0 ;
		isShown=true;
		
	};
	
	// wire buttons
	$('#spinButton').on('click', function(e) {
		me.spin();
	});

	$('#showButton').on('click', function(e) {
		me.show();
	});

	$('#rotateButton').on('click', function(e) {
		rotate();
		me.show();
	});
	
	var windowSize=3;
	var windowCount=0;
	var windowScore=0;
	var stepMs = 4 ; 
	
	function showAndScore(key) {
		me.show();
		console.log("score: "+currentAngle );
		var arrow;
		if (currentAngle == 90 )
			arrow = left;
		else if (currentAngle == 180 )
			arrow = up;
		else if (currentAngle == 270 )
			arrow = right;
		else if (currentAngle == 0 )
			arrow = down;
		
		if (arrow==key) 
			windowScore++;
		windowCount++;
		timeIntervalBetween90degrees = parseInt($timeIntervalBetween90degrees.val());
		if (windowCount>=windowSize) {
			
			if (windowScore>(0.667*windowSize))
				timeIntervalBetween90degrees -= stepMs;
			else  	
			if (windowScore<(0.333*windowSize))
				timeIntervalBetween90degrees += stepMs;
			
			$timeIntervalBetween90degrees.val(timeIntervalBetween90degrees);
			timeIntervalBetweenSmallAngles = timeIntervalBetween90degrees * smallDeltaAngle * 1.0 / deltaAngle;
			
			windowCount=0;
			windowScore=0;
		}
		$("#scoreField").text("("+windowCount+":"+windowScore+":"+timeIntervalBetween90degrees+":"+stepMs+")");
	}
	$(window).keydown(function(e) {
		
		if (e.keyCode == left) {
			if (isShown)
				me.spin();
			else
				showAndScore(e.keyCode);			
		}
		else if (e.keyCode == right) {
			if (isShown)
				me.spin();
			else
				showAndScore(e.keyCode);			
		}
		else if (e.keyCode == up) {
			if (isShown)
				me.spin();
			else
				showAndScore(e.keyCode);			
		}
		else if (e.keyCode == down) {
			if (isShown)
				me.spin();
			else
				showAndScore(e.keyCode);			
		}
		else if (e.keyCode == enter) {
			me.spin();			
		}
	});

	$('#saveButton').on('click', function(e) {
		var str = JSON.stringify(fixation);
		str = JSON.stringify(me);
		console.log(str);
	});
	

	draw();
	return me;
})();
