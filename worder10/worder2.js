/*
	add rules
	run old
	static display modus
	
	display :
		walk tree: set focus and pause
		transform: matchExpression, transform, range(node, range: 1, direction:distance) use cases: node:undefined:undefined - just node
																node:down:undefined - scan tree below node, including node 
		transform: with time: pauseFunction(node) - pause, scan method: width first, depth first, lr,rl, bottom up?
		pause spec:  direction:arrive, depart,between children
					direction expression, node expression, millisecs
		transform:"depth-first lr", "down", node, pausespecs["<directions>", "<node-match-expression>", millisecs], "<node-match-expression-for-transform>", "<transform-expression>"
			scan config, timer config, transforms
		transform examples:
			root, [{"arrival-depart", "{leaf}", charBaseTimerFunction(node)},{"depart-arrival", "{abstract}", charBase(node)}],
				[
				{"arrival-arrival", "{leaf}", "focus"}, {"depart-depart", "{leaf}", "-focus"}
				{"arrival-arrival", "word", "focus"}, {"depart-depart", "word", "-focus"}
				
				].concat(AnnimationTransforms)

		AnnimationTransforms = [ // direction:default, match, transform
			 {"word> (focus {leaf})*" "bright"}
			,{"word*" "semi-bright"} 
			,{"" setBrightness(node)}  // depends on categories
			,{"", ""} // set color: morphology
			,{} // set background color
			,{} // set background shape and shading
		]
	
	coloring of morphs: 
		categories: adj, adv, noun, verb
					closed, open
					head: e.g. determiner, prep, verb, interrogatives??
					phrases: adj, adv, noun, verb
					
					adjColor/adjDisplay
					adjPhraseDisplayColoring?

	transforming colors:
		morphs:
			abstract characteristics propagate : adj> ** , "adjColor" // ** is inclusive of chain
		phrases: background	
			abstract characteristics propagate : adj> ** , "adjBackgroundColor" // ** is inclusive of chain

	category inventory:
		pos
			categories above
 
		display
			adjDisplay, adjPhraseDisplay, nounDisplay, nounPhraseDisplay, verbDisplay, advDisplay, closedDisplay, etc
			
		scan
			focusDisplay, postFocus
			
		css: 
			1-to-1 with display categories

		postFocus implementation??
			syntax:
				(word)> ({leaf} focus)

		transforms	

	now change this to walk tree down AND up

	todo:
		process hand made tree 
			into xml node: <node posses="">
			convert to spans
			display
			annimate
			annimate with bubbles in canvas, raphael? start by setting background.

			S [ NP [ ADJP [ DT [the] ADJ [irresistible] ] N [cat] ] VP [ V [ran] ADVP [ PP [into] NP [ ADJP [ DT [the] ADJ [burning] N [house] ] ] ] ] ] 

			3 levels of blur/highlight: focus, word focus, no focus
			word color set by focus, prior to focus, there is no color, after focus it takes the color of the focus
			set color style on the word container based on the current node
			set blur for whole word container to a word blur:2nd degree
			set tranparency of whole word container to word highlight: 2nd degree
			set blur for current node text to 1st degree highlight and blur, and remove it after leaving node
				blur and "brightness"/transparency can be set on word: focus, no focus, and leaf no leaf focus, no leaf focus 
					assuming blur behaves like transpar: negative-additive/subtractive, 
						word focus is 100%, no word focus is minimum eg 20%
						leaf focus is 100%, non leaf focus (in word focus) is medium eg 50%
			? use a 4th degree for post comp focus within focus word???
				actually in more advanced training one should not have the periphery more blurred than it naturally is
				rather eye should be attracted to tracking with other means: brightness? color change, ??			
			!! we need subleaf nodes for each text


the irresistible cat ran into the burning house

NOTE: to change bracket character, edit getNodes() , current bracketing is []
http://nlp.stanford.edu:8080/parser/index.jsp

(ROOT
  (S
    (NP (DT the) (JJ irresistible) (NN cat))
    (VP (VBD ran)
      (PP (IN into)
        (NP (DT the) (VBG burning) (NN house))))))


http://www.link.cs.cmu.edu/cgi-bin/link/construct-page-4.cgi#submit
(S (NP the irresistible cat)
   (VP ran
       (PP into
           (NP the burning house))))

http://nlp.stanford.edu:8080/parser/index.jsp

Most men, even in this comparatively free country, through mere ignorance and mistake, are so occupied with the factitious cares and superfluously coarse labors of life that its finer fruits cannot be plucked by them. 

(ROOT
  (S
    (NP (JJS Most) (NNS men))
    (, ,)
    (ADVP (RB even)
      (PP (IN in)
        (NP (DT this)
          (ADJP (RB comparatively) (JJ free))
          (NN country))))
    (, ,)
    (PP (IN through)
      (NP (JJ mere) (NN ignorance)
        (CC and)
        (NN mistake)))
    (, ,)
    (VP (VBP are)
      (ADJP (RB so) (VBN occupied)
        (PP (IN with)
          (NP
            (NP (DT the) (JJ factitious) (NN cares))
            (CC and)
            (NP
              (NP (JJ superfluously) (JJ coarse) (NNS labors))
              (PP (IN of)
                (NP (NN life))))))
        (SBAR (IN that)
          (S
            (NP (PRP$ its) (NN finer) (NNS fruits))
            (VP (MD can) (RB not)
              (VP (VB be)
                (VP (VBN plucked)
                  (PP (IN by)
                    (NP (PRP them))))))))))
    (. .)))

*/

var msAbstract = 30 ;
var msPerCharacter = 100 ;
function getMsAbstract() {
	return getIntInput('#msAbstract') || msAbstract;
}
function getMsPerCharacter() {
	return getIntInput('#msPerCharacter') || msAbstract;
}
function getIntInput(selector) {
	var val = $(selector).val();
	if (val)
		val = parseInt(val);
	return val;
}
var leafClass = "leaf";
var abstractClass = "abstract";
var postFocusClass = "postFocus";
var morphClass = "morph";

// http://nlp.stanford.edu:8080/parser/index.jsp

var testStandfordTreeMorph = 
"(ROOT \n" +
"	(S \n" +
"		(NP \n" +
"			(DT:word \n" +
"				(morph:stem:close:dt The) \n" +
"			) \n" +
"			(JJ:word \n" +
"				(morph:suf:verbToAdj:adj \n" +
"					(morph:pref:verb  \n" +
"						(morph:pref:latin:close ir) \n" +
"						(morph:pref:verb  \n" +
"							(morph:pref:latin:close re) \n" +
"							(morph:stem:verb:open sist)\n" +
"						)\n" +
"					) \n" +
"					(morph:suf:adj:verbToAdj:latin:close ible) \n" +
"					) \n" +
"				) \n" +
"				(NN:word (morph:stem:noun:open cat)\n" +
"			)\n" +
"		) \n" +
"		(VP \n" +
"			(VBD:word \n" +
"				(morph:stem:verb:open ran)\n" +
"			) \n" +
"			(PP \n" +
"				(IN:word \n" +
"					(morph:comp \n" +
"						(morph:prep:close in) \n" +
"						(morph:prep:close to)\n" +
"					)\n" +
"				) \n" +
"				(NP \n" +
"					(DT:word \n" +
"						(morph:stem:close:dt the)\n" +
"					) \n" +
"					(VBG:word \n" +
"						(morph:suf:adj:verbToAdj \n" +
"							(morph:stem:verb:open burn) \n" +
"							(morph:suf:close:adj:verbToAdj ing)\n" +
"						)\n" +
"					) \n" +
"					(NN:word \n" +
"						(morph:stem:noun:open house)\n" +
"					)\n" +
"				)\n" +
"			)\n" +
"		)\n" +
"		(. .)\n" +
"	)\n" +
")" ;


var testBracketTree = " S [ NP [ ADJP [ DT [The] ADJ [irresistible] ] N [cat] ] morph: [ V [ran] [ PP [into] NP [ ADJP [ DT [the] ADJ [burning] ] N [house.] ] ] ] ] ";
var testStandfordTree = "(ROOT (S (NP (DT the) (JJ irresistible) (NN cat)) (VP (VBD ran) (PP (IN into) (NP (DT the) (VBG burning) (NN house))))))" ;

var testStandfordTreeLong = "(ROOT\n\
  (S\n\
    (NP (JJS Most) (NNS men))\n\
    (, ,)\n\
    (ADVP (RB even)\n\
      (PP (IN in)\n\
        (NP (DT this)\n\
          (ADJP (RB comparatively) (JJ free))\n\
          (NN country))))\n\
    (, ,)\n\
    (PP (IN through)\n\
      (NP (JJ mere) (NN ignorance)\n\
        (CC and)\n\
        (NN mistake)))\n\
    (, ,)\n\
    (VP (VBP are)\n\
      (ADJP (RB so) (VBN occupied)\n\
        (PP (IN with)\n\
          (NP\n\
            (NP (DT the) (JJ factitious) (NN cares))\n\
            (CC and)\n\
            (NP\n\
              (NP (JJ superfluously) (JJ coarse) (NNS labors))\n\
              (PP (IN of)\n\
                (NP (NN life))))))\n\
        (SBAR (IN that)\n\
          (S\n\
            (NP (PRP$ its) (NN finer) (NNS fruits))\n\
            (VP (MD can) (RB not)\n\
              (VP (VB be)\n\
                (VP (VBN plucked)\n\
                  (PP (IN by)\n\
                    (NP (PRP them))))))))))\n\
    (. .)))";

instructions = "One can generate new parse trees via 'http://nlp.stanford.edu:8080/parser/index.jsp'";
instructions2 = "Here is a shorter example: "+testStandfordTree;

// node:head,children => node:category,text,children ==> terminals fold into parent as text

function explodeCategories(categories) {
	return categories.split(/\s+/);	
}

function removeCategory($node, category) {
	// split, without, join
	var newCats;
	var oldCats;

	newCats = _.chain((explodeCategories(oldCats=$node.attr("categories"))))
		.without(category)
		.join(" ")
		.value();

	$node.attr("categories", newCats);

	return newCats;
}

function addCategory($node, category) {

	var newCats;
	var oldCats;

	newCats = _.chain((explodeCategories(oldCats=$node.attr("categories"))))
		.union([category])
		.join(" ")
		.value();

	$node.attr("categories", newCats);

	return newCats;	
}


function getStnfNodes(serialBracketTree) {
	// grammar
	// node=head (bracketedNode+|terminal)
	// bracketedNode=\(node\)
	
	// implementation
	// node = getTextBetween(text, "(", ")");
	// head:[^\s\(\)] 
	//   greedy
	// head\s+\(.+\)|head\s+[^\s\(\)]

	var node = {} ;
	// matchs head (node)+ or not 
	var matches = serialBracketTree.match(/\s*[^\s\(\)]+\s+\(.+\)\s*/); // greedy match of brackets
	if ( matches && matches.length==1 && matches[0].length == serialBracketTree.length ) {
		// case: head backetedNode+
		var headRegExp = /\s*[^\s\(\)]+\s+/;
		var headToken ;
		var startOfBracketedNode = serialBracketTree ;
		headToken = headRegExp.exec(startOfBracketedNode); 
		node.head = headToken[0].trim() ;
		startOfBracketedNode = startOfBracketedNode.substring(headToken.index + headToken[0].length ) ;

		var nodeText ;
		while ( (nodeText = substringBetween(startOfBracketedNode, "(", ")")).trim() ) {

			var child = getStnfNodes( nodeText.trim() ) ;
			node.children = node.children || [];
			node.children.push( child ) ;

			startOfBracketedNode = startOfBracketedNode.substring(nodeText.length + "(".length + ")".length) ;
			if ( startOfBracketedNode )
				startOfBracketedNode = startOfBracketedNode.trim();
		}

	}
	else {
		// case: head terminal
		var headRegExp = /\s*[^\s\(\)]+\s+/;
		var headToken ;
		var startOfBracketedNode = serialBracketTree ;
		headToken = headRegExp.exec(startOfBracketedNode); 
		node.head = headToken[0].trim();
		startOfBracketedNode = startOfBracketedNode.substring(headToken.index + headToken[0].length ) ;
		var nodeText = startOfBracketedNode.trim();
		node.children = [{head:nodeText}];
	}

	return node;
}


function convertNodeTreeToHtml(tree, tagName, headAttrName, headClass, leafClass) {

	var $head;

	if ( tree.children ) { // abstract node with attibs
		$head = $("<"+tagName+">")
			.attr(headAttrName, headClass+" "+tree.head)
			.addClass(headClass)
			.addClass(explodeCategories(tree.head).join(' '))
			;
		//console.log("creating node:"+tree.head);
		_.each(tree.children, function(child) {
				var $node = convertNodeTreeToHtml(child, tagName, headAttrName, headClass, leafClass);
				//console.log("appending node:"+$node[0].innerHTML+" to : "+$head.attr(headAttrName));
				$head.append( $node );
			});
	}
	else { // leaf, text

		$head =  $("<"+tagName+">")
			.attr(headAttrName, leafClass)
			.addClass(leafClass)
			;
		$head.text(tree.head);
		//console.log("creating node:"+tree.head);

	}
	return $head;
}   

function mergeLeafNodesWithParents($node, leafClass, abstractClass) {
	
	var $leafs = $("."+leafClass, $node);
	$leafs.each(function(index, leaf) {
		var $leaf = $(leaf);
		$leaf
			.parent()
			.text($leaf.text())
			.addClass(leafClass)
			;
			
	});

	$leafs.remove();

	$("."+leafClass, $node).each(function(index, leaf) {
		var $leaf = $(leaf)			
			.removeClass(abstractClass)
			.addClass(leafClass)
			;
		removeCategory($leaf, abstractClass);
		addCategory($leaf, leafClass);
	});
	return $node;
}

function setFocus($leaf) {
	$leaf.addClass("focus");
	$leaf.parents().addClass("focus");
}

function unfocusLeaf($leaf) {
	$leaf.removeClass("focus");
	//$leaf.parents().removeClass("focus");

}
function unfocusDecendantsAndOptionallyLeaves( $node, isEdge ) {

	// always remove focus, if leaf add post focus
	if ( $node.hasClass(leafClass) ) {
		$node.addClass(postFocusClass);
	}
	$node.removeClass("focus");

	// remove focus of all children : but not post focus of leaf
	$(".focus", $node).removeClass("focus");

	// undo postFocusClass, if I have a sibling right, or I am "S" and i am not morph
	if ( ( $node.next().length || $node.hasClass("S") ) && !$node.hasClass(morphClass) ) {
		$("."+postFocusClass, $node).removeClass(postFocusClass);

	}

	if (isEdge ) // no more siblings to right of this node
	{
		// and it is a word => end of word, 
		//  then remove postFocusClass 
	}
}

function calcDelay($leaf) {
	var isLeaf = $leaf.hasClass(leafClass); // hack....
	var text = $leaf.text();
	var ms = isLeaf&&text&&text.length*getMsPerCharacter() || getMsAbstract() ; 
	return ms;
}

function $walkTree($node) {

	// mark all unvisited
	$("*", $node).each(function(i){ this.count=0; });
	$node[0].count=0;
	walkTreeRecursive($node);
}

// ... well sort of recursive....any way it works in single threaded async world...
function walkTreeRecursive($node) {
	// try visit me 1st
	if ($node[0].count==0 ) {
		$node[0].count++;
		if ( !$node.hasClass(abstractClass)) { // $node.hasClass(abstractClass) is an interesting part, bottom up parsing, we see a handle not a top node.
			setFocus($node);
			_.delay(walkTreeRecursive, calcDelay($node), $node);
			return ;
		}
	}
	// try visit any unvisited children - 1st time
	if ( $node[0].children && $node[0].children.length )
		for (var i=0; i<$node[0].children.length; i++) 
		{
			if ( $node[0].children[i].count==0 ) {
				walkTreeRecursive( $( $node[0].children[i] ) ) ;
				return ;
			}
			else  { // so remove focus when we move to sibling, but keep focus if i am last sibling
				var isEdge = i == $node[0].children.length-1; 
				unfocusDecendantsAndOptionallyLeaves( $($node[0].children[i] ),  isEdge );
			}
		}

	// try visit myself 2nd time
	if ($node[0].count==1 ) {
		$node[0].count++;
		//unfocusLeaf($node);
		var delay = $node.hasClass(abstractClass) ? calcDelay($node) : 0 ;
		_.delay(walkTreeRecursive, calcDelay($node), $node.parent());
		return ;
	}

}

function processStnfTree(standfordTree) {
	
	var node = processStnfTreeToNode(standfordTree)

	printTree( node );
	
	$htmlTree = convertNodeTreeToHtml(node, "span", "categories", abstractClass, leafClass);

	//$('body').append($htmlTree);

	// this because html is different from nodes; html has multiple attributes
	mergeLeafNodesWithParents($htmlTree, leafClass, abstractClass);

	$htmlTree.addClass("root");
	// hacking css by putting divs with text....
	$('#display').remove();
	$('body').append($('<div id="display">.</div>').append($('<div>.</div>')).append($htmlTree));
	
	return $htmlTree;
	
}

function processStnfTreeToNode(standfordTree) {
	
	var node = getStnfNodes( substringBetween( standfordTree.replace(/\s+/g, " ").trim(), "(", ")" ) ) ;

	//printTree( node );

	morphProcessTree(node, EnglishRecategorizations, EnglishAffixes);

	return node ;

	
}
// dev 
//processStnfTree(testStandfordTree);

$('body')
	.append($('<div>').text(instructions2))
	.append($('<div>.</div>'))
	.append($('<div>').text(instructions))
	.append($('<div>.</div>'))
	.append('<textarea cols=120 rows=15 id="parseTreeInput" placeholder="enter bracketed parse tree as per standford english parser.">')
	.append('<textarea cols=120 rows=15 id="parseTreeOutput" >')
	.append('<div>')
	.append('<input type="text" value="'+msAbstract+'" id="msAbstract" placeholder="msAbstract"  title="msAbstract"  name="msAbstract">' )
	.append('<input type="text" value="'+msPerCharacter+'" id="msPerCharacter" placeholder="msPerCharacter"  title="msPerCharacter"  name="msPerCharacter">' )
	.append('<input type="button" value="go" id="go">')
	.append('<input type="button" value="show" id="show">')
	;

$('#parseTreeInput')
	.text(testStandfordTreeLong)
	;

$('#go')
	.click(function(){
		var treeText;
		treeText=$('#parseTreeInput').val();
		treeText=treeText.replace(/\s+/g, " ").trim();
		$walkTree(processStnfTree(treeText) );
	})
	;

$('#go')
//.click()
;

$('#show')
	.click(function(){
		var treeText;
		treeText=$('#parseTreeInput').val();
		treeText=treeText.replace(/\s+/g, " ").trim();
		
		var node = processStnfTreeToNode(treeText)
		//printTree( node );

		var $root = processStnfTree(treeText);
		$('#parseTreeOutput').text(stringTree(node))
		$("*", $root).addClass("focus");
		
	})
	;

$('#show')
	.click()
;

/*////////////////////// old stuff - scrap heap //////////////////////////////////////////////////////

 * function bracketTreeToHtml(serialBracketTree) {
	
	console.log(serialBracketTree); 

	var nodes = getNodes(serialBracketTree);
  	var $node = $( '<span>' );
  	_.each(nodes, function(node) { $node.append(node);});
	return $node;
}

//********************
//edit bracket characters here in this function ....
//********************
function getNodes(serialBracketTree) {
var nodes = [] ;
// matchs head [node]* or not 
var matches = serialBracketTree.match(/(\s[^\s]+\s+\[.+\]\s*)+/g); // greedy match of head [node]*, make shift: will not notice imbalanced brackets...
if ( matches && matches.length==1 && matches[0].length == serialBracketTree.length ) {
//	parse out each: token, substringBetween, call bracketTreeToHtml, add head token as posses attr
var headRegExp = /\s+[^\s]+\s+/;
var headToken ;
var startOfBracketedNode = serialBracketTree ;
while ( (headToken = headRegExp.exec(startOfBracketedNode)) ) {
	var node = {} ;			
	node.head = headToken[0].trim();
	startOfBracketedNode = startOfBracketedNode.substring(headToken.index + headToken[0].length ) ;
	var nodeText = substringBetween(startOfBracketedNode, "[", "]");
	node.children = getNodes(nodeText);
	nodes.push(node);

	startOfBracketedNode = startOfBracketedNode.substring(nodeText.length + "[".length + "]".length) ;

}

}
else {
// else assume content
// 	use all text
var node = {} ;
node.head = serialBracketTree ;		
nodes.push(node);
}

return nodes;
}

function gotoNextLeaf($leaves) {

unfocusLeaf($($leaves.shift()));

focusLeaf($leaves);

}

function focusLeaf($leaves) {

if ($leaves.length==0)
return ;

setFocus( $($leaves[0]) );
_.delay(gotoNextLeaf, calcDelay( $($leaves[0])), $leaves );

} 

function walkLeaves($leaves) {

focusLeaf($leaves);

}


 */ 
