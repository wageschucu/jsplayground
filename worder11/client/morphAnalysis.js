
// review regexps here: 
//   need generic cat parsing expression that gives back groups: whole, id, [value]
//	 where did i remove | match ??, some days ago??
// case css, case cat
// match id
function modCat(node, id, value) {
	var map = {};
	map[id]=value;
	var originalMap = {};
	var matchExpL = getCatMatchRegExp(); // group whole, id, [value]
	var matchExpG = new RegExp(matchExpL.source,"g") ;
	 _.each( node.head.match(matchExpG), 
	 	function(cat) { 
	 		cat = cat.trim();
	 		matches = cat.match(matchExpL);
			cat = getCatFromMatch(matches);
	 		originalMap[cat.id]=matches[0]; 
	 	});

	map = $.extend(originalMap, map);
	
	node.head = _.reduce(map, function(head, edit, key){ if (edit) { if (head) head += " "; head += edit; } return head; }, "");

	return node;
}

function getCatMatchRegExp(matchRegExp) {
	//var cssIdMatchRegExp = matchRegExp; // catMatchExpressionCssValueRegex.source;
	var cssIdMatchString = matchRegExp ? matchRegExp.source : catMatchExpressionCssIdRegex.source ;
	if (cssIdMatchString[cssIdMatchString.length-1]!=':')
		cssIdMatchString+=':';
	var nonCssMatchString = matchRegExp ? matchRegExp.source : catMatchExpressionNonCssRegex.source ;
	cssIdMatchString = '('+cssIdMatchString+')';
	var cssValueMatchString = '('+catMatchExpressionCssValueRegex.source+')';
	nonCssMatchString = '('+nonCssMatchString+')';
	return new RegExp(cssIdMatchString+cssValueMatchString+'|'+nonCssMatchString);
}

function getCatFromMatch(match) {
	var cssId ;
	var cssValue;
	if (match) {
		cssId = match[1]||match[3];
		cssValue = match[2]; 
		if (match[1])
			cssId = cssId.substring(0, cssId.length-1).trim();// remove :
		if (match[2])
			cssValue = cssValue.substring(0, cssValue.length-1).trim();// remove :
	}
	
	return { id:cssId, value:cssValue };
}

function getCat(head, idExpress) {
	return head?getCatFromMatch(head.match(getCatMatchRegExp(idExpress))):head;
}

var nodeMatchExpressionRegex = /([\>]?)\s*([\*]?)\s*\((.+?)\)(?!;)/; // we use negative lookahead hack because of nested ()s in some css: eg. shadow: rbg()
var catMatchExpressionPatternGroupIndex = 3;
var catMatchExpressionCssIdRegex = /[^\s:;]+:/;
var catMatchExpressionCssValueRegex = /[^;]*;/;
var catMatchExpressionCssRegex = new RegExp(catMatchExpressionCssIdRegex.source+catMatchExpressionCssValueRegex.source);
var catMatchExpressionNonCssRegex = /[^\|\&\+\s]+/;
var catMatchExpressionRegexBefore = /([\|\&]\s*)?([\-\+]\s*)?/;
var catMatchExpressionRegexComposeString = catMatchExpressionRegexBefore.source+"("+catMatchExpressionCssRegex+"|"+catMatchExpressionNonCssRegex.source + ")";
var catMatchExpressionRegex = new RegExp(catMatchExpressionRegexComposeString);
//var catMatchExpressionRegex = /([\|\&]\s*)?([\-\+]\s*)?([^\|\&\+\s:;]+:[^;]+;|[^\|\&\+\s]+)/;

var catMatchPattern = {
		 		expressionMatchPattern : catMatchExpressionRegex 
			 	,mappings: [ { groupIndex:1, property: "logic"}, { groupIndex:2, property: "valence"}, { groupIndex:3, property: "cat"} ]
		 	};

var nodeChainMatchPattern = 
	 {
	 	 expressionMatchPattern : nodeMatchExpressionRegex
	 	, passThroughIndex : catMatchExpressionPatternGroupIndex
		, mappings: [ { groupIndex:1, property: "relation"}, { groupIndex:2, property: "marker"}, { groupIndex:3, property: "cats"} ] 
	 	, groupPatterns :[
		{
		 	 groupIndex :  catMatchExpressionPatternGroupIndex
		 	,pattern : catMatchPattern
		 }
	 	]
	 }
;

function findNodeChainMatchExpressionTargetIndex(nodeChainMatchExpression) {
	// should find appropriate marker
	return 0;
}

// var testString = "(a \ +b &-c)";
// var nodeMatchExpressionChain = parseMatchExpressionString(testString, nodeChainMatchPattern);
// var nodeMatchExpressionChain = parseMatchExpressionString('a b & -c', nodeChainMatchPattern);
// var nodeMatchExpressionChain = parseMatchExpressionString('(-a & -b) >*(d e ) >( f g)', nodeChainMatchPattern);
// var nodeMatchExpressionChain = parseMatchExpressionString('b -shadow: 1 1 2 rgb(1,0,3); a', nodeChainMatchPattern);


function mergeAllAbsIndex(node, action, status) { 

	var catMatchRegExp = getCatMatchRegExp(/absIndex/);
	
	function mergeAbsIndex(node) {

 		var total =0 ;
 		// children
 		if (node.children)
 			for (var index=0; index<node.children.length; index++) {
 				total += mergeAbsIndex(node.children[index]);
 			}

 		var match;
		if ( matchHead(node, LeafTag) && (match=node.head.match( catMatchRegExp ) ) )
		{ 
			var css = getCatFromMatch(match);
 			total+= parseInt(css.value);
 		}

 		// set total
 		if (!matchHead(node, LeafTextTag))
	 		modCat(node, 'absIndex', 'absIndex:'+total+';');

 		return total;

	}
	
	mergeAbsIndex(node);
	
	status.complete = true;
}

function absIndexToTextShadow(node, action, status) { 
	// get absIndex
	// add text shadow
	var css=getCat(node.head, /absIndex/);
	modCat(node, 'text-shadow:', 'text-shadow:0px 0px '+css.value+'px;');//  0 0 15px
	status.complete = true;
}


RegExpMatchTag = "?";

var AbstractTag = "{abstract}";
var LeafTag = "{leaf}";
var StemTag = "stem";
var LeafTextTag ="{LeafText}";
var StageArrival = "stageArrival" ;
var StageDepart = "stageDepart" ;
var StageChildArrival = "stageChildArrival" ;
var StageChildDepart = "stageChildDepart" ;
var StageAll = "StageAll" ;

function walkTreeTDLR( node, iterator, memo, stages ) {

	stages = stages || StageArrival ;

	if ( stages.indexOf(StageArrival) != -1 )
		memo = (iterator)(memo, node, StageArrival);

	_.each(node.children, function(childNode) { 
		if ( stages.indexOf(StageChildArrival) != -1 )
			memo = (iterator)(memo, node, StageChildArrival);
		memo = walkTreeTDLR(childNode, iterator, memo); 
		if ( stages.indexOf(StageChildDepart) != -1 )
			memo = (iterator)(memo, node, StageChildDepart);
		return memo;
	})
	if ( stages.indexOf(StageDepart) != -1 ) 
		memo = (iterator)(memo, node, StageDepart);
	return memo;
}

function isLeafText(node) {
	return !node.children && ! _.isUndefined ( node.head ) ;
}
function isLeaf(node) {
	return node.children && node.children.length==1 && !node.children[0].children;
}
function isAbstract(node) {
	return !isLeaf(node) && node.children && node.children.length>0;
}

function hasCat(node, map, category) {

	if (category == LeafTag && isLeaf(node)) // is parent to leaf
		return true ;
	else if (category == AbstractTag && isAbstract(node))
		return true ;
	else if (category == LeafTextTag && isLeafText(node) )
		return true ;
	else 
		return map[category];
}


function findNodes(node, matchExp) {

	return walkTreeTDLR(node, function(matchedNodes, node) {
		if ( matchHead(node, matchExp) )
			matchedNodes.push(node);
		return matchedNodes; 
	}, []);
}

function explodeCategories(categories) {
	return categories.match(new RegExp(catMatchExpressionRegex.source,"g"));	
}

function defaulCatsTransform(transform, origanalNodeHead, matches) {
	var newNodeHead="";
	var map = {};
	//    split(/\s+/g)
	 _.each( origanalNodeHead.match(new RegExp(catMatchExpressionRegex.source,"g")), 
	 	function(cat) { 
	 		cat = cat.trim();
	 		map[cat]=true; 
	 	});

	 // ?? have to apply parsing here??catMatchExpressionsToMaps
	 // 		var chainExpressions = parseMatchExpressionString(chainedCategoryExpression, nodeChainMatchPattern);
		// var targetNodeExpression = chainExpressions[findNodeChainMatchExpressionTargetIndex(chainExpressions)];
		// var catMaps = catMatchExpressionsToMaps(targetNodeExpression);

	 // where does matches come from, what does it look like??: its a map
	 var transformExpression = parseMatchExpressionString(transform, catMatchPattern);
	 var transformExpressionMaps = catMatchExpressionsToMaps(transformExpression);

	_.each(transformExpressionMaps[0], function(add, cat) {
		if (cat==RegExpMatchTag)
		{
			_.each(matches, function(matched){ 
				map[matched] = add ; 				
			});
		}
		else
			map[cat] = add ; 
	});
	newNodeHead = _.reduce(map, function(head, edit, key){ if (edit) { if (head) head += " "; head += key; } return head; }, "");
	return newNodeHead;
}

function calcDelayMs(delay, newHead, originalHead) { 
	
	var delayMs ;

	if ( _.isFunction( delay )  ) {

		delayMs = (delay)(newHead, originalHead);

	}
	else {
		
		delayMs = delay ; 
	
	}

	return delayMs ; 
}	

function applyTransforms( transform, originalHead, matches ) {

	if ( ! transform )
		return originalHead;
	else if ( _.isFunction( transform ) )
		return (transform)( originalHead, matches );
	else if ( _.isString(transform) )
		return defaulCatsTransform( transform, originalHead, matches ) ;
	else if ( transform.transform ) { // transform object with optional delay parameter
		return applyTransforms( transform.transform, originalHead, matches );
	}
	else {
		throw "unknown tranform structure!!"
	}

}

function catMatchExpressionsToMaps(catMatchExpressions) {		
	var catMaps = _.reduce(catMatchExpressions, function(catMaps, cat, index) {
			catMaps = catMaps || [{}];
			if (cat.logic == "|")
				catMaps.push({}); // start new map for every or
			var currentCatMap = catMaps[catMaps.length-1];
			currentCatMap[cat.cat] = cat.valence=="-"?false:true;
			return catMaps;
		}, false);
	return catMaps;
}

function matchHead(node, chainedCategoryExpression) {

	if (_.isRegExp(chainedCategoryExpression) )
		return node.head.match(chainedCategoryExpression);
	if (_.isFunction(chainedCategoryExpression) )
		return chainedCategoryExpression(node);
	else {

		var map = {};

		 _.each( node.head.match(new RegExp(catMatchExpressionRegex.source,"g")), function(cat) { 
			 	cat = cat.trim(); 
			 	map[cat]=true; 
			 });

		 if ( ! chainedCategoryExpression )
		 	return map;

		//var chainExpression = catExpressionToChain(chainedCategoryExpression);	
		var chainExpressions = parseMatchExpressionString(chainedCategoryExpression, nodeChainMatchPattern);
		var targetNodeExpression = chainExpressions[findNodeChainMatchExpressionTargetIndex(chainExpressions)];
		var catMaps = catMatchExpressionsToMaps(targetNodeExpression.cats);

		var matchedMap ;
		_.each(catMaps, function(catMap) {
				
				if (matchedMap)
					return ;

				// must match all true
				var matched = true;
				_.each(catMap, function(add, category, list) {			
						if (add && ! hasCat(node,map,category) )
							matched=false;
					});
					
				_.each(catMap, function(add, category, list) {			
						if (!add && hasCat(node,map,category) )
							matched=false;
					});
				if (matched)
					matchedMap = catMap ;
			});

		if (chainExpressions.length>1) {		
			throw "not implemented.";
			// if matched, them
			//	match up
			//		if left side, search next(use relationship to govern search distance)
			//		repeat until end of list, root, or failed
			// if matched, then
			//	match down		
			//		same as up, but with walking tree
		}

		return matchedMap;
	}
}


function matchPhase(phase, expressions) {
	var matchedMap ;
	if ( ! _.isArray(expressions))
		expressions = [expressions];

	_.each(expressions, function(catMap) {
			
			if (matchedMap)
				return ;

			// must match all true
			var matched = true;
			_.each(catMap, function(add, category, list) {			
					if (add && ! phase[category] )
						matched=false;
				});
				
			_.each(catMap, function(add, category, list) {			
					if (!add && phase[category] )
						matched=false;
				});
			if (matched)
				matchedMap = catMap ;
		});
	return matchedMap;
}

// match = matchHead({head:"cat4"}, " (cat2 & cat3 | cat4) ");
// match = matchHead({head:"cat4"}, " (cat2 & cat3 ) ");
// match = matchHead({head:"cat4"}, " ( cat3 | cat4) ");
// match = matchHead({head:"cat4"}, " (cat2 & cat4 | cat3) ");

function getCssCatStyles(head) {
	return _.filter(explodeCategories(head), function(cat) { return cat.indexOf(":")!=-1;} )
}

function apply(parm, func) { (func)(parm); }

function catStylesToCss( head ) {
	
	var styles = getCssCatStyles(head) ;

	var css = {};
	for (i in styles) {
		apply(styles[i].split(":"), function(parts) { 
			parts[1]=parts[1].trim(); 
			if (parts[1].lastIndexOf(";")==parts[1].length-1)
				parts[1] = parts[1].substring(0, parts[1].lastIndexOf(";"));
			css[parts[0].trim()] = parts[1].trim(); 
		});
		;
	}
	return css;
} 

function recatNode(node, recat1, recat2, recat3) {

	var allCats = recat1;
	if (recat3!==undefined)
		allCats = recat1.concat( recat2, recat3);
	else if (recat2!==undefined)
		allCats = recat1.concat( recat2);

	_.each( allCats, function( recategorization ) {
		var matches;
		if ( matches = matchHead(node, recategorization.matchExp ) ) {
			node.head = applyTransforms(recategorization.transform, node.head, matches);

			node.rules = (node.rules||[]);
			node.rules.push(recategorization);

		} 
	});

}

function addPostTransform(node, handler) {

	node.postTransformsHandlers = node.postTransformsHandlers || [] ;
	node.postTransformsHandlers.push(handler);
}

function addPreTransform(node, handler) {

	node.preTransformsHandlers = node.preTransformsHandlers || [] ;
	node.preTransformsHandlers.push(handler);
}

function applyPostTransform(node, action, status) {
	var result;
	_.each(node.postTransformsHandlers, function(handler) { if (result!==false ) result=handler(node, action, status); } );
	return result;
}
function applyPreTransform(node, action, status) {
	var result;
	_.each(node.preTransformsHandlers, function(handler) { if (result!==false ) result=handler(node, action, status); } );
	return result;
}

function recatTree(node, recat1, recat2, recat3) {

	walkTreeTDLR( node, function(memo, node) {

		// match:respect pseudo cats
		// 	transform$
		recatNode(node, recat1, recat2, recat3);
		applyPostTransform(node);

	});
}

function findAll(node, chainedCategoryExpression) {
	return 	findAllTDLR(node, chainedCategoryExpression);
}

function findAllTDLR(node, chainedCategoryExpression) {
	var found = [];
	if (matchHead(node, chainedCategoryExpression))
		found.push(node);
	_.each(node.children, function(child) {
		found=found.concat(findAllTDLR(child, chainedCategoryExpression));
	});

	return found;

}

