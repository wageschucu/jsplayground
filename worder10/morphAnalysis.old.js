
RegExpMatchTag = "?";

///////////////// tree manipulation /////////////////////

function defaulCatsTransform(transform, origanalNodeHead, matches) {
	var newNodeHead="";
	var map = {};
	 _.each( origanalNodeHead.split(/\s+/g), function(cat) { map[cat]=true; });
	_.each(transform.split(/\s/g), function(edit) {
		var add = edit[0]!='-';
		if (edit[0]=='+' || !add )
			edit = edit.substring(1);
		if (edit==RegExpMatchTag)
		{
			_.each(matches, function(matched){ 
				map[matched] = add ; 				
			});
		}
		else
			map[edit] = add ; 
	});
	newNodeHead = _.reduce(map, function(head, edit, key){ if (edit) { if (head) head += " "; head += key; } return head; }, "");
	return newNodeHead;
}

// match 
var categoryRegex = /\s*[\{]?[a-zA-Z0-9]+[\}]?\s*/i;
function parseCategory(catCategory) {
	return catCategory.trim();
} 

//categoryExpression => [-+]?category
var categoryExpressionRegex = /\s*[-+]?[\{]?[a-zA-Z0-9]+[\}]?\s*/i;
function parseCategoryExpression(catCategoryExpression) {
	
	var add=true;
	if (catCategoryExpression[0]=="-")
		add=false;
	if (catCategoryExpression[0]=="-" || catCategoryExpression[0]=="+")
		catCategoryExpression = catCategoryExpression.substring(1);
	
	var category = parseCategory(catCategoryExpression);
	var map = {};
	map[category]=add;
	return map;
} 

// test: cat1> cat2
//catMatchExpression => (categoryExpression[ categoryExpression]*)|categoryExpression 
var catMatchExpressionRegex = /\s*\((\s*[-+]?[\{]?[a-zA-Z0-9]+[\}]?\s*)+\)[\*]?\s*|\s*[-+]?[\{]?[a-zA-Z0-9]+[\}]?[\*]?\s*/i;
function parseMatchExpression(catMatchExpression) {

	catMatchExpression = catMatchExpression.trim();
	var map = {};
	if (catMatchExpression && catMatchExpression[catMatchExpression.length-1]=="*")
	{
		map.__target=1;

	}
	catMatchExpression = catMatchExpression[0]=="("? substringBetween(catMatchExpression, "(", ")"): catMatchExpression;
	var token;
	var input = catMatchExpression.trim();
	while ((token=parseViaRegExp(input, categoryExpressionRegex, parseCategoryExpression)) && token.object) {
		map = $.extend(map, token.object);
		input=token.input;
	}
	return map;
} 

var catMatchExpressionRelationRegex = /> |>/i;
function parseRelationExpression(catMatchRelationExpression) {
	return catMatchRelationExpression;
} 

//catMatchExpressionChain => catMatchExpression[*] [relationExpression catMatchExpression[*]]*
function catExpressionToChain(catMatchExpressionChain) {
	var chain = [];
	var targetIndex;
	var token;
	var input = catMatchExpressionChain;
	
	token = parseViaRegExp( input, catMatchExpressionRegex, parseMatchExpression ) ;
	
	if (token.object) {
		
		chain.push( token.object );
		if (token.object.__target)
			targetIndex = chain.length-1;

		token = parseViaRegExp(token.input, catMatchExpressionRelationRegex, parseRelationExpression ) ;
		
		while (token.object) {
			
			chain.push( token.object );
			
			token = parseViaRegExp(token.input, catMatchExpressionRegex, parseMatchExpression ) ;
			
			chain.push( token.object );		
			if (token.object.__target)
				targetIndex = chain.length-1;

			token = parseViaRegExp(token.input, catMatchExpressionRelationRegex, parseRelationExpression ) ;
		}
	}
	
	chain.targetIndex=targetIndex;
	if (!chain.targetIndex)
		chain.targetIndex=chain.length-1;
	return chain;
}

//test: cat1> cat2
//ADAD
//chain = catExpressionToChain(" ( +cat1 -cat2)> (-cat2 -cat3 cat4 )> {cat3} >({cat3}) ");

// recat: matchExp +-, absTrans: +-
// .isPrefix, .affixes, .name, .prio, matchExp, absTrans, affTrans, stemTrans
var AbstractTag = "{abstract}";
var LeafTag = "{leaf}";
var StemTag = "stem";

function walkTree( node, iterator, memo ) {

	memo = (iterator)(memo, node);
	_.each(node.children, function(childNode) { 
		memo = walkTree(childNode, iterator, memo); 
		return memo;
	})
	return memo;
}

function recatTree(node, recategorizations) {

	walkTree( node, function(memo, node) {

		// match:respect pseudo cats
		// 	transform$
		_.each(recategorizations, function(recategorization) {
			var matches;
			if ( matches=matchHead(node, recategorization.matchExp ) ) {
				node.head = applyTransform(recategorization.transform, node.head, matches);
			} 
		});
	});
}

function searchAndBreak(stems, affixes) {
	
	if (!stems.length)
		return [];	

	searchAndBreak( _.reduce(stems, function(newStems, stem) {

			_.each( affixes, function(affix) {

				newStems = newStems.concat( processAffix(stem, affix) );

			} );

			return newStems;
		}, []) , affixes);
}

function isLeaf(node) {
	return node.children && node.children.length==1 && !node.children[0].children;
}
function isAbstract(node) {
	return !isLeaf(node) && node.children && node.children>0;
}

function hasCat(node, map, category) {

	if (category == LeafTag && isLeaf(node)) // is parent to leaf
		return true ;
	else if (category == AbstractTag && isAbstract(node))
		return true ;
	else 
		return map[category];
}

function matchHead(node, chainedCategoryExpression) {

	if (_.isRegExp(chainedCategoryExpression) )
		return node.head.match(chainedCategoryExpression);
	else {
		var map = {};
		 _.each( node.head.split(/\s+/g), function(cat) { map[cat]=true; });

		var chainExpression = catExpressionToChain(chainedCategoryExpression);		
		var catMap = chainExpression[chainExpression.targetIndex];
		
		// ?? same old expression: how to implement it?? 
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
		
		if (chainExpression.length>1) {		
			throw "not implemented.";
			// if matched, them
			//	match up
			//		if left side, search next(use relationship to govern search distance)
			//		repeat until end of list, root, or failed
			// if matched, then
			//	match down		
			//		same as up, but with walking tree
		}

		return matched;
	}
}
function processAffix(stemNode, affixList) {

	var regexp = convertToRegex(affixList); // .isPrefix, .affixes, .name, .prio, matchExp, absTrans, affTrans, stemTrans
	var token;
	var oldStemHead = stemNode.head;
	var matchExp = affixList.matchExp || /.*/g;
	var oldStem = stemNode.children[0].head;
	var newStems = [];
	if ( matchHead(stemNode, matchExp) && (token=regexp.exec(oldStem)) && token.length ) {
		// split out
		var affix = token[0];
		var newStem = oldStem.substring(0, token.index );
		newStem += oldStem.substring(token.index+affix.length );
		var affixHead = applyTransform(affixList.affTrans, oldStemHead);
		var newStemHead = applyTransform(affixList.stemTrans, oldStemHead);
		var stemIndex = token.index? 0 : 1 ;
		var affixIndex = stemIndex? 0 : 1; 
		stemNode.children[affixIndex] = { head: affixHead, children : [{head:affix}]};
		stemNode.children[stemIndex] = { head: newStemHead, children : [{head:newStem}]};
		stemNode.head = applyTransform(affixList.absTrans, oldStemHead);
		newStems=findStems(stemNode);
	}
	return newStems;
}

function applyTransform( transform, originalHead, matches ) {
	if ( _.isFunction( transform ) )
		return (transform)( originalHead, matches );
	else
		return defaulCatsTransform( transform, originalHead, matches ) ;
}

function findStems(node) {

	return walkTree(node, function(stems, node) {
		if (node.head.indexOf(StemTag)>=0)
			stems.push(node);
		return stems; 
	}, []);
}

function morphProcessTree (node, recategorizations, affixes) {
	recatTree(node, recategorizations);
	printTree(node);
	searchAndBreak(findStems(node), affixes);
}


//
//_.each(catsExp.split(/\s/g), function(edit) {
//	var add = edit[0]!='-';
//	if (edit[0]=='+' || !add )
//		edit = edit.substring(1);
//
//	if (add && ! hasCat(node,map,edit) )
//		matched=false;
//
//});
//// must not have all false
//_.each(catsExp.split(/\s/g), function(edit) {
//	var add = edit[0]!='-';
//	if (edit[0]=='+' || !add )
//		edit = edit.substring(1);
//
//	if (!add && hasCat(node,map,edit) )
//		matched=false;
//
//});
