


/* 
	create leaf spans
	? phrase/abstract spans??
	
	features:
		word separation
			basic should always be there, no??
		coloring
			css pushed onto leaf: 
				focus, target html node

		annimation
			background colors progression
			blurring, unblurring -progression


*/

function getBubbleEdge(bubbleNode, leafNode) {

	var currentNode = leafNode;

	var edge = "both";
	var lastEdge = edge;

	while (currentNode) {

//		if ( match=currentNode.head.match("word") ) 
//			wordOffset = currentNode.$html.offset() ;

		if (currentNode.parent)
		{
			if ((edge=="both") && currentNode.parent.children.length==1)
				edge = "both";
			else if ((edge=="both" || edge=="left") && currentNode.parent.children[0] == currentNode)
				edge = "left";
			else if ((edge=="both" || edge == "right") && currentNode.parent.children[currentNode.parent.children.length-1] == currentNode)
				edge = "right";
			else
				edge = "";

		}
		else
			edge = "";
			
		lastEdge = edge;

		currentNode = currentNode.parent;
		
		if (bubbleNode==currentNode)
			break;
	}
	return lastEdge;
}

function mergeAndPushNodeCssFactory(filter) {

	return function mergeAndPushNodeCss(node, action, status) {

		console.log("mergeAndPushNodeCss bubbles for : "+node.head+ " - "+(node.parent?node.parent.head:"no parent" ) );

		// gather node css in stack map
		var currentNode = node;

		var stackMap = {};

		while (currentNode) {

			var matches=currentNode.head.match( new RegExp(catMatchExpressionCssIdRegex.source, "g")) ;
			_.each(matches||[], function(match, index){
				(stackMap[match] = stackMap[match] || []).push(currentNode);
			});
			currentNode = currentNode.parent;
		}

		var reverseMap = {};
		_.each(_.sortBy(_.keys(stackMap), function(key){ if (key.indexOf('background-color')!=-1) return "z"; return key; }), function(key, index) {
			reverseMap[key] = stackMap[key];
		});

		stackMap = reverseMap;

		// find leaves
		_.each( findAll(node, LeafTextTag), function(leafTextNode, index) {
			// for each type
			_.each(stackMap, function(nodeStack, nodeCssType ) { var b=1;
				if (! filter(nodeCssType) )
				{
					return ;
				}

				if (nodeCssType.match(/background-color/)) {

					drawBackgroundBubbles(leafTextNode, nodeStack);

				} 
				else {// independent and lowest
					_.each(nodeStack[0].head.match(new RegExp(nodeCssType+catMatchExpressionCssValueRegex.source) ), function(css, index){
						console.log("****apply css :"+css+" leafTextNode:"+leafTextNode.head+" stackSize:"+nodeStack.length+" stackTop:"+nodeStack[0].head);
						applyLowestCss(leafTextNode, css, nodeStack[0]);
					});
				}

			}) ;
		}) ;

		status.complete = true;

	};
}	

function removeMyBubble(node, action, status) {

	// find nodes bubbles 
	$('canvas.bubble'+node.id)
		.fadeOut(function() {
			$(this).remove();
		});
	status.complete = true;

};

var leftEdgeCmd ="left-edge-";
function applyLowestCss(node, css, sourceNode) {
	var css = getCat(css);

	if (css.id.indexOf(leftEdgeCmd)==0)  {
		var edge = getBubbleEdge(sourceNode, node);
		if (edge == "left" || edge == "both") 
			setLeftEdgeCss(node, css.id, css.value);
	}
	else { // plain old css 
		var props = {} ;
		props[ css.id ] = css.value ;
		if ( css.id=="display" ) {
			if ( css.value == "none" )
				node.$html.fadeOut() ;
			else 
				node.$html.css( props ) ;
		}
		else if ( css.id=="opacity" ) {
			if (css.value == "")
				props[ css.id ] = 1 ;
			node.$html.animate( props ) ;
		}
		else {
			node.$html.css( props ) ;
		}
	}
}

function setLeftEdgeCss(node, cssId, cssValue) {

	console.log("processing setLeftEdgeCss : is left edge." );
	cssId = cssId.substring(leftEdgeCmd.length);
	
	// apply
	node.$html.css( cssId, cssValue );	

}

function codePairsToRGBPairs(rCodePair, bCodePair, gCodePair) {
	return { 
		 rgbBegin : "rgb(" + rCodePair.begin + "," + bCodePair.begin + "," + gCodePair.begin + ")"
		,rgbEnd : "rgb(" + rCodePair.end + "," + bCodePair.end + "," + gCodePair.end + ")"
	};
}

function scaleRGBCode(target, begin, bubbleNode, leafNode, currentPosition) {
	
	var totalWidth = bubbleNode.width ;
	var complete = currentPosition / totalWidth ; 
	var beginWidth=0;
	var endWidth=0;
	for (var index=0; index<bubbleNode.leaves.length; index++) {
		
		endWidth += bubbleNode.leaves[index].width;
		
		if (bubbleNode.leaves[index]==leafNode)
			break;
			
		beginWidth = endWidth;
			
	}
	var codeBegin = begin - (begin-target)*Math.sqrt( Math.sqrt((beginWidth/totalWidth) * (totalWidth-currentPosition)/totalWidth )) ;
	var codeEnd = begin - (begin-target)*Math.sqrt(Math.sqrt( (endWidth/totalWidth) * (totalWidth-currentPosition)/totalWidth ));
	codeBegin=Math.round(codeBegin);
	codeEnd=Math.round(codeEnd);
	
	return {
		 begin: codeBegin
		,end:codeEnd
	};

}

var rgbRegexp=/rgb\(([\d]*),([\d]*),([\d]*)\)/; 
function parseColor(colorIn) {
	var color = colorIn;
	var r,g,b;
	// rbg()
		
	var matches = color.match(rgbRegexp);
	if (!matches) {
		var hex = nameToHex(color);
		
		color= hex2rgb(hex);
		matches = color.match(rgbRegexp);
		
	}
	if (matches) {
		r=parseInt(matches[1]);
		b=parseInt(matches[2]);
		g=parseInt(matches[3]);
	}
	else {
		throw "dont know rgb for :"+colorIn;
	}	
	
	return {
		 r:r 
		,g:g
		,b:b
	}
} 

// draw bubble item 
// lazy create all canvases
// fill 
// draw image

function drawBackgroundBubbles(node, bubbleNodes) {

	console.log("processing bubbles for text leaf: "+node.head+ " - "+node.parent.head );

	var $element = node.$html;
	// remove my bubbles
	if ( ! bubbleNodes || ! bubbleNodes.length ) {
		$('canvas.leafNode'+node.leafId).remove();
		return ;
	}

	console.log("depth:"+bubbleNodes.length);
	var maxLevel = bubbleNodes[0].maxLevel;

	// canvas create paper, calc box: verticle-center, margin, text-height, max level, span width, span offset
	//var leftMarginDelta = $element.offset().left - wordOffset.left ;
	
	// arcs : draw font size
	// center: on center
	// scale : fontsize * x = ;  height / fontsize == > scale
	var fontSize = $element.css('font-size') ;
	fontSize = parseInt(fontSize.substring(0, fontSize.indexOf('px'))); 
	var margin = 5; 
	var yCenter = node.height / 2;
	var halfHeight = fontSize/2 + margin + maxLevel*margin;
	var top = node.offset.top + yCenter - halfHeight ;
	yCenter = halfHeight;

	// for each canvas node, draw canvas according to color, edge, level parameters
	_.each(bubbleNodes, function(bubbleNode, index) {

		var currentWidth=0;
		for (var index=0; index<bubbleNode.leaves.length; index++) {
			
			if (bubbleNode.leaves[index] == node)
				break;
				
			currentWidth += bubbleNode.leaves[index].width;
		};
	
		function adjustGradient(bubbleNode, leafNode, currentPosition) { 
			var $canvas = getCanvasWidthImageAndGradient(bubbleNode, leafNode);
			var ctx = $canvas.get(0).getContext('2d');
			var grd=ctx.createLinearGradient(0 ,halfHeight , leafNode.width, halfHeight);
			
			var css = getCat(bubbleNode.head, /background-color/ );
			
			// my percentage: transition from 256 to target rgb (211)
			// take total width and my begin and end percentage: 
			var rgbs = parseColor(css.value);
			//currentPosition = bubbleNode.width; 
			var rCodePair = scaleRGBCode(256, rgbs.r, bubbleNode, leafNode, currentPosition);
			var gCodePair = scaleRGBCode(256, rgbs.g, bubbleNode, leafNode, currentPosition);
			var bCodePair = scaleRGBCode(256, rgbs.b, bubbleNode, leafNode, currentPosition);
			
			var rgbPair = codePairsToRGBPairs(rCodePair, bCodePair, gCodePair);
	 		grd.addColorStop(0, rgbPair.rgbBegin ) ;
			grd.addColorStop(1, rgbPair.rgbEnd ) ; 
			ctx.fillStyle=grd;
			ctx.fill();
		}

		function getCanvasWidthImageAndGradient(bubbleNode, leafNode) {
			var canvasId = "bubble"+bubbleNode.id +"-" +leafNode.leafId ;
			var $canvas = $('#'+canvasId);
			if (!$canvas.length)
			{
				$canvas=$('<canvas>')
					.attr('id', canvasId)
					.addClass('leafNode'+leafNode.leafId)
					.addClass('bubble')
					.addClass('bubble'+bubbleNode.id)
					.css({
						 position:'fixed'
						,left:leafNode.offset.left
						,top:top
						,zIndex: leafNode.zIndex - (bubbleNode.level ) 
					})
					.attr('width', leafNode.width)
					.attr('height', halfHeight *  2)
					.hide()
					;
				$canvas.appendTo('body');	
		
				var ctx = $canvas.get(0).getContext('2d');
				ctx.save();

				// draw and create gardient
				var imageHalfHeight = fontSize/2 + (bubbleNode.level)*margin;
				var edge = getBubbleEdge(bubbleNode, leafNode);
				if (!edge) {
					ctx.rect(0, yCenter-imageHalfHeight, leafNode.width, imageHalfHeight * 2 );
				}
				else if (edge == "left") {
					
					ctx.translate(leafNode.width,yCenter);
					ctx.scale(leafNode.width/fontSize, imageHalfHeight/fontSize);
					
					ctx.beginPath();
					ctx.arc(0,0,fontSize,0.5*Math.PI,1.5*Math.PI);
				}
				else if (edge == "right") {
					ctx.translate(0,yCenter);
					ctx.scale(leafNode.width/fontSize, imageHalfHeight/fontSize);
					
					ctx.beginPath();
					ctx.arc(0,0,fontSize,1.5*Math.PI,0.5*Math.PI);

				}
				else if (edge == "both") {
					ctx.translate(leafNode.width/2,yCenter);
					ctx.scale(leafNode.width/fontSize, imageHalfHeight/fontSize);
					
					ctx.beginPath();
					ctx.arc(0, 0, fontSize/2 ,0,2*Math.PI);
				}
				else 
					throw "illegal edge value: "+item.edge;

				ctx.restore();

				$canvas.fadeIn(700);
			}
			
			return $canvas;
		}

		// calc gradients 
		_.each(bubbleNode.leaves, function(leafNode, index) {
			if (leafNode.line != node.line)
				return;
			adjustGradient(bubbleNode, leafNode, currentWidth);
		});

	});

}

function filterFactory(filter) {
	return function(typeString) {
		return typeString.match(filter);
	};
}

function findMaxDepth(node, action, status) {
	// assumes a root node
	function maxLevelRecursive(node) {
 		// calc max
 		var maxLevel =0 ;
 		// children
 		if (node.children)
 			for (var index=0; index<node.children.length; index++) {
 				var childMaxLevel = maxLevelRecursive(node.children[index]);
 				if (childMaxLevel>maxLevel)
 					maxLevel = childMaxLevel;
 			}

		if ( match=node.head.match( /background-color[\S]*/ ) ) 
 			maxLevel++;
 		// set max
 		return maxLevel;

	}

	function setLevelRecursive(node, level, maxLevel) {

		if ( match=node.head.match( /background-color[\S]*/ ) ) 
		{
			node.level=level;
			node.maxLevel=maxLevel;
			level--;
		}

 		// children
 		if (node.children)
 			for (var index=0; index<node.children.length; index++) {
 				setLevelRecursive(node.children[index], level, maxLevel);
 			}
	}

	var maxLevel=maxLevelRecursive(node);

	setLevelRecursive(node, maxLevel, maxLevel);

	if (status) status.complete = true;

}

function getLeavesAndOffset(node, id) {
	node.leaves = [];
	if (matchHead(node, LeafTextTag)) {
		node.offset = node.$html.offset();
		node.width = node.$html.outerWidth();
		node.height = node.$html.height();
		node.leaves.push(node);
	}
	
	node.id = id++;	

	if (node.children) {
		_.each(node.children, function(child) {
			node.leaves=node.leaves.concat(getLeavesAndOffset(child, id));
		});
	}
	
	node.offset = node.leaves[0].offset;
	node.width = _.reduce(node.leaves, function(width, leafNode) { width+=leafNode.width; return width;}, 0);
	node.height = node.leaves[0].height;

	return node.leaves;
}

var baseZIndex = -10000;
var stepZindex = 100;

function setLineNumbersAndOffset(node, action, status) {
	// assume root
	// get leaves
	node.leaves = getLeavesAndOffset(node, 0);
	node.line = 0;
	node.maxLine = 0;
	var leafId=0;
	_.reduce(node.leaves, 
		function(top, leafNode) { 
			if (top!=leafNode.offset.top) { 
				top=leafNode.offset.top; 
				node.maxLine++;

			} 
			leafNode.leafId = leafId++;
			leafNode.line = node.maxLine;
			leafNode.zIndex = baseZIndex + stepZindex * leafNode.leafId;
			return top;
		},  

		node.offset.top );
	if (status) status.complete = true;
}

function makePositionAbsolute(node, action, status) {

	_.each(node.leaves.reverse() , function(leafNode) {
		leafNode.$html.css({
			 left:leafNode.offset.left
			,top:leafNode.offset.top
			,position:'fixed'
			,zIndex:leafNode.zIndex
		});
	});
	//_.each(reversed, function(node, key) { $(node).css('left',$(node).offset().left).css( 'top', $(node).offset().top).css('position','absolute'); })
	if (status) status.complete = true;
}

function nodeTreeToHtml(node, tagName, $anchor) {

	var $head = $('<div>');
	
	if (node)
		_.each(nodeTreeToHtmlInternal(node, tagName), function($element, index) {
			$head.append($element);
		});
	
	$(tagName, $display).css({visibility:"hidden"});

	if ($anchor)
	{
		$anchor.empty().append($head);
		
	}
	
	if (node) {
		var BasicCssRules = [
			 {matchExp: LeafTextTag, actor: mergeAndPushNodeCssFactory(filterFactory(/\bfont-weight|\bfont-size|\bpadding|\bfont-style|shadow/)) } 
		];
		iterateStructure(walkTreeTDLRAsync, node, BasicCssRules, recatRuleMatcherFactory);
		printTree(node); 
		
		findMaxDepth(node);
		setLineNumbersAndOffset(node);
		makePositionAbsolute(node);
		
		printTree(node); 
		
	}
	
	return $head;
}

function showHtmlStatic(node) {

	
	if (node) {

		var BackgroundBubbleRules = [
			 { 
			 	 name: "show: display reset to default", matchExp: 'ROOT', actor :  createCssActor("visibility:;")
			 }	
			,{ 
			 	 name: "dim clear", matchExp: 'ROOT', actor :  createCssActor(clearDim)
			 }	
			 ,{
			 	matchExp: LeafTextTag, actor: mergeAndPushNodeCssFactory(filterFactory(/\bbackground-color|\bcolor|\btext-shadow/)) 
			 } 
		];
		
		iterateStructure(walkTreeTDLRAsync, node, BackgroundBubbleRules, recatRuleMatcherFactory);
		printTree(node); 
	}
	
	return node;
}

function nodeTreeToHtmlInternal(node, tagName) {

	var head = [];

	if (node) {
		if (node.children) {
	
			_.each(node.children, function(child) {
					head=head.concat(nodeTreeToHtmlInternal(child, tagName));
				} );
		}
		else
		{
			head=head.concat(node.$html=$("<"+tagName+">")
				.text(node.head) 
				);
				
		}
	}
	return head;
}   

function nodeTreeToHtmlInternalOld(node, tagName) {

	var $head;

	if (node.children) {
		$head = $("<"+tagName+">")
			.css({})
			.css( catStylesToCss( node.head ) ) 
			;

		_.each(node.children, function(child) {
				var $child = nodeTreeToHtmlInternal(child, tagName);
				$head.append( $child );
			} );
	}
	else
	{
		$head = $("<"+tagName+">")
			.text(node.head) 
			;
	}

	node.$html = $head;

	var $myElement=$head;
	var oldStyles;
	var newStyles;

	var postTransformHandler = function() {
			newStyles = getCssCatStyles(node.head).join(" ");
			if ($myElement && oldStyles!=newStyles  ) {
				oldStyles = newStyles;
				$myElement
					.attr("style","")
					.css( catStylesToCss( node.head ) ) 
				;			

			}
		};

	addPostTransform(node, postTransformHandler);

	return $head;
}   

function nodeTreeToHtmOldl(node, tagName) {

	var $head;
	var canvasCmds;

	// tree walk event
	function treeWalkEvent (e, walkerData) { 
		// scale
		var paper = $head.data("paper");
		if (!paper)
			return ;

		var phase = walkerData.status.phase;
		if (phase && !phase.arrival)
			return ; 

		var $nodeElement = walkerData.node.$html;
		if ($nodeElement) {
			var offset = $nodeElement.offset();
			var myOffset = $head.offset();
			var myCanvasOffset = $(paper.canvas).offset();
			var width = offset.left + $nodeElement.width() - myOffset.left;
			width += 	0;
			if (width<0) width=0;
			paper.setSize(width, paper.height);

		}

	}

	// attach event
	var treeAttachEvent = function(e) {
		drawCanvasCmds($head, canvasCmds, treeWalkEvent);
	}
	var redrawEvent = function() {
		removeCanvas($head);
		drawCanvasCmds($head, canvasCmds, treeWalkEvent);
	}

	if (node.children) {
		$head = $("<"+tagName+">")
			.css({})
			.css( catStylesToCss( node.head ) ) 
			;

			// fetch bubble commands
		canvasCmds = catsCanvasCmdsToArray( node.head );
		if (canvasCmds.length) {
			$head.on('treeAttachEvent', treeAttachEvent);
		}

		_.each(node.children, function(child) {
				var $child = nodeTreeToHtml(child, tagName);
				$head.append( $child );
			} );
	}
	else
	{
		$head = $("<"+tagName+">")
			.text(node.head)
			;
	}

	node.$html = $head;

	var $myElement=$head;
	var oldStyles;
	var newStyles;
	var oldCanvasCmds;
	var newCanvasCmds;

	var postTransformHandler = function() {
			newStyles = getCssCatStyles(node.head).join(" ");
			if ($myElement && oldStyles!=newStyles  ) {
				oldStyles = newStyles;
				$myElement
					.attr("style","")
					.css( catStylesToCss( node.head ) ) 
				;			
			}
			newCanvasCmds = catsCanvasCmdsToArray(node.head).join(" ");
			if ($myElement && newCanvasCmds!=oldCanvasCmds  ) {
				oldCanvasCmds = newCanvasCmds;
				canvasCmds = catsCanvasCmdsToArray( node.head );
				redrawEvent();
			}
		};

	addPostTransform(node, postTransformHandler);

	// function doWalkEvent(node, action ,status) { 
	// 		$.event.trigger('treeWalkEvent', { node:node, action:action, status:status });
	// 	};

	// addPreTransform(node, doWalkEvent);

	return $head;
}   

function removeCanvas($element) {

	$element.off('treeWalkEvent' );

	var paper = $element.data("paper");
	if ( paper )
		$( paper.canvas ).remove();

	$element.data("paper", null);
	$element.data("ellipse", null);

}

function drawCanvasCmds($element, cmds, treeWalkEvent ) {

	// create canvas element, draw, attach/replace
	// get box

	_.each(cmds, function (cmd) {

		if ( cmd.indexOf("canvas-background")==0) {

			$element.on('treeWalkEvent', treeWalkEvent );

			var depth = $element.parents().length;
			var zIndex = -10000 + depth * 10 ;

			var fontSize = $element.css('font-size') ;
			fontSize = parseInt(fontSize.substring(0, fontSize.indexOf('px'))); 
			fontSize *= 0.9; 
			var box = { height: fontSize * (8-depth) + fontSize*1.0
				, width:$element.width() };
			var offset = $element.offset();
			var yCenter = offset.top + fontSize/2;
			offset.top = yCenter - box.height/2  ;

			paper = Raphael(offset.left, offset.top, box.width, box.height);
			paper.canvas.style.zIndex = zIndex ;
			var xfactor = 1 ;
			
			ellipse = paper.ellipse(box.width/2, box.height/2, box.width/2, box.height/2);
			var color = cmd.substring("canvas-background-".length);
			ellipse.attr("fill", "180-"+color+"-#fff");
			ellipse.attr("stroke", "#fff");
			ellipse.attr('opacity', 0.9);
			
			$element.data("paper", paper);
			$element.data("ellipse", ellipse);

		}

	});
}

function catsCanvasCmdsToArray( nodeHead ) {

	var cmds = _.filter( explodeCategories(nodeHead), function(cat) { return cat.trim().indexOf("canvas-")==0;} )

	return cmds;
}

 var colours = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370d8",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#d87093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
    };

function nameToHex(colour) {
   	if (colour.indexOf('#')==0)
   		return colour;
    if (typeof colours[colour.toLowerCase()] != 'undefined') return colours[colour.toLowerCase()];

    return false;
}
////////////////////////////////////////////////////////////////////////////////////////////////////
function hex2rgb(col) {
    var r, g, b;
    if (col.charAt(0) == '#') {
        col = col.substr(1);
    }
    r = col.charAt(0) + col.charAt(1);
    g = col.charAt(2) + col.charAt(3);
    b = col.charAt(4) + col.charAt(5);
    r = parseInt(r, 16);
    g = parseInt(g, 16);
    b = parseInt(b, 16);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}







