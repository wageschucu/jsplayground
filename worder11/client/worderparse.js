
// array of titles
function getTextTitles() {

	//return ["title1", "title2", "title3"];
	return serverCall("getTextTitles", {});
}

// array of sentences
function getTextSentences(title) {
	//return ["sentence1", "sentence2", "sentence3"];
 	return serverCall("getTextSentences", {title:title}).concat(['*']);
}

// array of numbers
function getLengths(title, sentenceNum) {
	return ['*','random'].concat(serverCall("getLengths", {title:title, sentenceNum: sentenceNum}));
	//return ['*','random'].concat([1,2,3,4,5]);
}

// array sentences
function processText(title, text) {
	var sentences = [];
	var match;
	if (text && (match=text.match(/[^.;?!]+[.;?!]/g))) {
		match.forEach(function(sentence) {
			sentence = sentence.trim();
			sentences=serverCall("processText", {title:title, text:sentence});
	
		});
	}
	return sentences;
}

// array of stnf text
function getTree(title, sentenceNum, length) {
 	return serverCall("getTree", {title:title, sentenceNum:sentenceNum, length:length});

}

function serverCall(method, map, callback) {

	console.log(method+":call callback:"+callback);
	var result;
	$.ajax( {
		async : false,
		type:'GET',
		url: '/'+method,
		data: map,
		success: function(data) { 

			console.log(method+":success:"+data);
			result = JSON.parse(data);
			if (callback)
				(callback)(result);

		 },
		error: function(request, status, error, data) 
		{ 
			console.log(method+":error:"+status+error+data);
			result = method+":error:"+status+error+data;
			if (callback)
				(callback)(result);
		}
	}
	);
	console.log(method+":return:"+result);
	return result;
}



var dimTest = "opacity:0.20;";
var clearDim = "opacity:;";
var hide = "display:none;";

function removeBubbles(node, action, status) {

	$('canvas.bubble').remove();
	status.complete = true;
}

function showDot(node, action, status) {

	$('#display').append($('<span>').attr('id', 'dot').text("*"));
	status.complete = true;
}

function removeDot(node, action, status) {

	$('#display #dot').remove();
	status.complete = true;
}

// hide, dim, remove color, delay

ResetDimRecatRules = [
	 { 
	 	 name: "display hide", phases: {arrival:true}, matchExp: 'ROOT', actor :  createCssActor("visibility:hidden;")
	 }	
	,{ 
	 	 name: "remove background", matchExp: 'ROOT', actor :  removeBubbles
	 }	
	,{ 
	 	 name: "remove color css", matchExp: LeafTextTag, actor :  createCssActorForLeafTextNode('color:black;')
	 }	
	,{ 
	 	 name: "dim css", matchExp: LeafTextTag, actor :  createCssActorForLeafTextNode(dimTest)
	 }	
] ;

AnnimateRecats = [
	 { 
		name: "show dot", phases: {arrival:true}, matchExp: 'ROOT', actor : showDot 
	 }	
	,{ 
		name: "begin delay", phases: {arrival:true}, matchExp: 'ROOT', transform: "", delayMs: 1000 
	 }	
	,{ 
		name: "show dot", phases: {arrival:true}, matchExp: 'ROOT', actor : removeDot 
	 }	
	,{ 
	 	 name: "show: display reset to default", phases: {arrival:true}, matchExp: 'ROOT', actor :  createCssActor("visibility:;")
	 }	
	,{ 
	 	 name: "dim css", matchExp: LeafTextTag, actor :  createCssActorForLeafTextNode(clearDim)
	 }	
	,{ 
	 	 name: "color css",  phases: {arrival:true}, matchExp: LeafTextTag, actor :  mergeAndPushNodeCssFactory(filterFactory(/\bcolor|\btext-shadow/))
	 }	
	,{ 
	 	 name: "color css abstract",  phases: {departure:true}, actor :  mergeAndPushNodeCssFactory(filterFactory(/^color|\btext-shadow/))
	 	 	, actorTrap: {head:/^ing$/} 
	 }	
	,{ 
		name: "delay morph", phases: {departure:true}, matchExp: LeafTextTag, transform: "", delayMs: proportionalDelay 
	 }	
	,{ 
	 	 name: "color css remove bubble",  phases: {departure:true}, matchExp: /background-color/, actor :  removeMyBubble
	 }	
	,{ 
	 	 name: "dim css", phases: {departure:true}, matchExp: 'word', actor :  createCssActor(dimTest)
	 }	
	,{ 
		name: "end delay", phases: {departure:true}, matchExp: 'ROOT', transform: "", delayMs: 500 
	 }	
	,{ 
	 	 name: "hide css", phases: {departure:true}, matchExp: 'ROOT', actor :  createCssActor("visibility:hidden;")
	 }	
] ;


function annimateNodeTree(nodeTree)
{

	iterateStructure(walkTreeTDLRAsync, nodeTree, ResetDimRecatRules, recatRuleMatcherFactory);
	printTree(nodeTree);

	iterateStructure(walkTreeTDLRAsync, nodeTree, AnnimateRecats, recatRuleMatcherFactory, recatRuleActorFactory);
	printTree(nodeTree);


}

function getHtmlFromNodeTree(nodeTree, $anchor)
{
	return nodeTreeToHtml(nodeTree, "span", $anchor);
}


function processSyntaxTree(tree)
{
	iterateStructure(walkTreeTDLRAsync, tree, EnglishRecategorizations, recatRuleMatcherFactory, recatRuleActorFactory);
	printTree(tree);

	iterateStructure(walkTreeTDLRAsync, tree, EnglishAffixes, affixRuleMatcherFactory, affixRuleActorFactory);
	printTree(tree);

	iterateStructure(walkTreeTDLRAsync, tree, [EnglishCSSRecategorizations, SpacingCSSRecategorizations], recatRuleMatcherFactory, recatRuleActorFactory);
	printTree(tree);
	return tree;
}

var sentenceRegexp = /.+?[.;?!]/g;
function getSyntaxTree(treeString, title, callback)
{
	var syntaxTree;
	_.each(treeString.match(sentenceRegexp), function(sentence) { 	
		
		sentence = sentence.trim();

		console.log("getSyntaxTree:call:"+sentence+" callback:"+callback);
		var param = 'sentence='+ encodeURIComponent( sentence);
		$.ajax( {
			async : false,
			type:'GET',
			url: '/parseTree',
			data: { sentence:sentence, title:title },
			success: function(data) { 

				console.log("getSyntaxTree:success:"+data);
				if (!syntaxTree && ! callback)
					syntaxTree = data;
				else
					syntaxTree = data;

				if (callback)
					(callback)(syntaxTree);

			 },
			error: function(request, status, error, data) 
			{ 
				console.log("getSyntaxTree:error:"+status+error+data);
				syntaxTree = "getSyntaxTree:error:"+status+error+data;
				if (callback)
					(callback)(syntaxTree);
			}
		}
		);
		console.log("getSyntaxTree:return:"+syntaxTree);
	});
	return syntaxTree;
}


var recatRuleMatcherFactory = function(recatRules) {

	return function(node, recatRule, status) { 
//		if ( ! status.phase || ! status.phase.step ) // we dont care about phase, we execute once at beginning
		if ( 
				recatRule.phases && matchPhase( status.phase,  recatRule.phases) 
			||
				! recatRule.phases && ( ! status.phase || ! status.phase.step )
			)	
			status.matches = matchHead(node, recatRule.matchExp );
		status.complete = true;
		return status.matches; 
	};
}

var recatRuleActorFactory = function(recatRules) {

	return function (node, recatRule, status) {
		node.head = applyTransforms(recatRule.transform, node.head, status.matcher.matches);
		node.rules = (node.rules||[]);
		node.rules.push(recatRule);
		status.complete = true;
	};
}

function defaultRecatInheritenceFactory() {
	return function (opts) {
		
		return  { 
			 phase: ifNull(opts.phase, this.phase) 
			,matcherFactory: opts.matcherFactory || recatRuleMatcherFactory
			,actorFactory: opts.actorFactory || recatRuleActorFactory
			,delayFactory: opts.delayFactory || this.delayFactory
			,context: opts.context || this.context
			,inheritence:opts.inheritencePermOverride || this.inheritence
			};
		}
}

var affixRuleMatcherFactory = function(affixRules) {

	return function(stemNode, affixRule, status) { 

		if (  ! status.phase || ! status.phase.step  ) { // we dont care about phase, we execute once at beginning

			if ( stemNode.children && stemNode.children.length ) {

				if ( ! affixRule.regexp )
					affixRule.regexp = convertAffixListToRegex(affixRule); // .isPrefix, .affixes, .name, .prio, matchExp, absTrans, affTrans, stemTrans
			
				var token;
				var matches;
				var oldStemHead = stemNode.head;
				var oldStem = stemNode.children[0].head;

				if ( (matches=matchHead(stemNode, affixRule.matchExp)) && (token=affixRule.regexp.exec(oldStem)) && token.length 
					&& ! (stemNode && stemNode.rules.indexOf(  affixRule)!=-1 )  // not twice
				) {

					status.matches = { matches:matches, token:token, oldStem: oldStem, oldStemHead:oldStemHead };
				}
			}
		}

		status.complete = true;

		return status.matches; 
	}
}

var affixRuleActorFactory = function(affixRules) {

	return function (stemNode, affixRule, status) {

		var token = status.matcher.matches.token;
		var oldStem = status.matcher.matches.oldStem;
		var oldStemHead = status.matcher.matches.oldStemHead;
		var affix = token[0];
		var newStem = oldStem.substring(0, token.index );
		newStem += oldStem.substring(token.index+affix.length );
		
		var affixHead = applyTransforms(affixRule.affTrans, oldStemHead);
		var newStemHead = applyTransforms(affixRule.stemTrans, oldStemHead);

		var stemIndex = token.index? 0 : 1 ;
		var affixIndex = stemIndex? 0 : 1; 
		stemNode.children[affixIndex] = { head: affixHead, parent:stemNode, children : [{head:affix}]};
		stemNode.children[stemIndex] = { head: newStemHead, parent:stemNode, children : [{head:newStem}]};
		stemNode.head = applyTransforms(affixRule.absTrans, oldStemHead);
		_.each(stemNode.children, function(child) {
				if (affixRules.name) console.log("apply after recats:"+affixRules.name+" head:"+child.head);
				if (affixRules.after || status.after) 
					recatNode(child, (affixRules.after || status.after));
				child.rules = (child.rules||[]);
				child.rules.push(affixRule);
				child.children[0].parent=child;
			});

		stemNode.rules = (stemNode.rules||[]);
		stemNode.rules.push(affixRule);
		status.complete = true;
	};
}
// convert affix list to regexp
// ==> {isPrefix, affixes} <== RegExp
function convertAffixListToRegex(affixRule) {

	var regexStr = _.reduce(affixRule.affixes.split(/\s+/), function(regexStr, affix) {
		if (affixRule.isPrefix) {
			if (regexStr)
				regexStr+="|";
			regexStr += "\\b"+affix+"\\B";
		}
		else {
			if (regexStr)
				regexStr+="|";
			regexStr += "\\B"+affix + "\\b";
		}
		return regexStr;
	}, "" );
	return new RegExp(regexStr, "i");
}


// testStandfordTreeLong
// testStandfordTree 
var msAbstract = 0 ;
var msPerCharacter = 100 ;
var msPerCharacterOpen = 0 ;
function charCountDelayLeaf(newNode, oldNode) {
	return msPerCharacter * newNode;
}

function noOp() {}

function proportionalDelay(node, action, status) {

	var count = node.head.length;
	//status.complete = true;

	return count * msPerCharacter ;
}
function proportionalDelayOpen(node, action, status) {
	var action = {
		 actor: function(node, action, status) { 
		 	if ( isLeafText(node) ) 
				action.count+=node.head.length;
			status.complete = true;
			}
		,count:0	
		}

	iterateStructure(walkTreeTDLR, node, action);

	return action.count * msPerCharacterOpen ;
}

var shadow =  "text-shadow: 0 0 15px rgba(0,0,0,0.9);";
var dimSome = "opacity:0.10;"+shadow;
var dimHalf = "opacity:0.30;"+shadow;

var dimOtherHalf = "opacity:0.30;"+shadow;
var dimFull = "opacity:0.10;"+shadow;
var dimCombined = "opacity:0.09;"+shadow;

function createCssActor(css) {
	return function applyCss(node, action, status) {
		_.each(node.leaves, function(leafNode) {
			if (css.match(/background-color/)) {
				drawBackgroundBubbles(leafNode);
			}
			else {
				applyLowestCss(leafNode, css);
			}
		});
		status.complete = true;
	}
}

function createCssActorForLeafTextNode(css) {
	return function applyCss(node, action, status) {
		if (css.match(/background-color/)) {
			drawBackgroundBubbles(node);
		}
		else {
			applyLowestCss(node, css);
		}
		status.complete = true;
	};
}

function removeBackgroundCss(node, action, status) {
	var $ellipsis = $('[data-level='+node.level+']');
	$ellipsis.remove();
	status.complete = true;	
}






