
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

	var $timeInterval = $('#intervalField').val(60);
	var deltaAngle = 90;
	var currentDuration;
	var breakFlag=false;
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
		function rotateTimeout() {
						
			if (breakFlag) {
				me.hide();
				return ;
			}
				
			rotate();
			setTimeout( rotateTimeout, parseInt( $timeInterval.val() ) );
		};
		
		currentDuration = maxDurationMs ;
		currentDuration = Math.max(Math.ceil(Math.random() * maxDurationMs), minDuration)  ;
		console.log("currentDuration : "+currentDuration);
		breakFlag = false;
		setTimeout(function() { breakFlag=true; }, currentDuration ) ;
		
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
	//var currentPosX=0;
	rotate = function() {
		//currentPosX+=50;
		pointer.rotate(""+deltaAngle, 50,50);
		//pointer.translate(50,0);
		//pointer.transform("T"+currentPosX+",0");
		//pointer.transform("t"+currentPosX+",0r"+currentAngle);
		// pointer.transform("r"+currentAngle);
		currentAngle= (currentAngle+deltaAngle) % 360;
		console.log("rotate: "+currentAngle );
		
	};
	
	clear = function() {
		pointer.hide();
		isShown=false;
	}
	
	draw = function() {
		if (pointer) pointer.remove();
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
		var timeInterval = parseInt($timeInterval.val());
		if (windowCount>=windowSize) {
			
			if (windowScore>(0.667*windowSize))
				timeInterval -= stepMs;
			else  	
			if (windowScore<(0.333*windowSize))
				timeInterval += stepMs;
			
			$timeInterval.val(timeInterval);
			
			windowCount=0;
			windowScore=0;
		}
		$("#scoreField").text("("+windowCount+":"+windowScore+":"+timeInterval+":"+stepMs+")");
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


/*

	fixation.js
		draw()
		rotate()
		display()
		hide()

	Objects:
		canvas
		ctx
		timeInterval
		angleDelta=90
*/

/*
var angle = 0,  
    endRotateFlag=false,
    interval = 75,
    ctxSave,
    canvas,
    tempCanvas = document.createElement("canvas"),
    tempCtx = tempCanvas.getContext("2d");


function getDefaultInterval() {
  return interval ;
}

function onLoadInit() {

    canvas = document.getElementById("canvas");  

    if (ctx == undefined )
       ctx = canvas.getContext("2d");  
    
    drawImage(ctx);

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas,0,0,canvas.width,canvas.height);
    
   // set interval
   tag = document.getElementById("interval");
   tag.value = interval; 
   
      document.myForm.interval.focus();
   document.myForm.myRotateButton.focus();

}

function getInterval() {
  return document.getElementById("interval").value;
}

function drawImage(ctx) {
    
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,200,200);
    
        ctx.save();    
        ctx.translate(20,20);
        //ctx.rotate(angle*Math.PI/180);
        ctx.beginPath();
        ctx.moveTo(-5,0);
        ctx.lineTo(5,0);
        ctx.moveTo(0,0);
        ctx.lineTo(0,10);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    
}

function draw() {  
    //clear
    
    // move from temp and rotate etc
    ctx.save();
    
    ctx.translate(20, 20);
    ctx.rotate(angle*Math.PI/180);
    
    // Finally draw the image data from the temp canvas.
    ctx.drawImage(tempCanvas,0,0,20,20,-5,-5,20,20);
    ctx.restore();

        
    return endRotateFlag; 
    
// ctx.fillStyle = "rgb(200,0,0)";  
 //ctx.fillRect (10, 10, 55, 50);  
  
// ctx.fillStyle = "rgba(0, 0, 200, 0.5)";  
// ctx.fillRect (30, 30, 55, 50);  
}  

function rotate() {
  setTimeout(endRotate,1500);
  rotateSub();
}

function rotateSub() {
  
  if ( ! draw() ) {
  
    angle+=90;
    setTimeout(rotateSub,getInterval());
    
  }
  else {
  
    endRotateFlag = false;
    angle-=90;

  }
}

function endRotate() {
    endRotateFlag=true;
}

function show() {
  draw();
}

*/
