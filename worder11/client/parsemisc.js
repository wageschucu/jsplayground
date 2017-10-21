
function parseMatchExpressionElementString(matchExpressionElementString,  pattern) {

	var matchExpression = {};

	var expressionMatchRegexNoneGlobal = new RegExp(_.isRegExp(pattern.expressionMatchPattern)?pattern.expressionMatchPattern.source : pattern.expressionMatchPattern );

	var matches = matchExpressionElementString.match(expressionMatchRegexNoneGlobal);	
	if ( ! matches && ! _.isUndefined(pattern.passThroughIndex) ) {
		matches = [];
		matches[pattern.passThroughIndex] = matchExpressionElementString;
	}

	// process relational operators
	matchExpression.matchGroups = matches;

	_.each(pattern.groupPatterns, function(groupPattern) {

		matchExpression.parsedMatcheGroups =  matchExpression.parsedMatcheGroups || [];

		matchExpression.parsedMatcheGroups[groupPattern.groupIndex] = parseMatchExpressionString(
			matchExpression.matchGroups[groupPattern.groupIndex], groupPattern.pattern
			);
	});

	// if mappings defined do here:
	if (pattern.mappings)
	{
		_.each(pattern.mappings, function(mapping) {
			// groupIndex, property
			matchExpression[mapping.property] = matchExpression.parsedMatcheGroups && matchExpression.parsedMatcheGroups[mapping.groupIndex] || matches[mapping.groupIndex];
		});

		delete matchExpression.matchGroups ;
		delete matchExpression.parsedMatcheGroups ;
	}

	return matchExpression;
} 

function parseMatchExpressionString(matchExpressionString, pattern ) {

	var matchExpressions = [];

	var expressionMatchRegexGlobal = new RegExp(_.isRegExp(pattern.expressionMatchPattern)?pattern.expressionMatchPattern.source : pattern.expressionMatchPattern, "g");

	var matches = matchExpressionString.match(expressionMatchRegexGlobal);	
	if ( ! matches && ! _.isUndefined(pattern.passThroughIndex) ) {
		matches = [];
		matches.push( matchExpressionString );
	}

	if ( matches ) {
		_.each( matches, function( matchExpressionElementString ) {

			matchExpressions.push( parseMatchExpressionElementString( matchExpressionElementString,  pattern ) );

		}) ;
	}

	matchExpressions.input = matchExpressionString;
	matchExpressions.pattern = expressionMatchRegexGlobal;
	return matchExpressions;
}

(function($){
	$.fn.pop = function() {
		return $(this.splice(this.length-1,1));
	};
	
	$.fn.shift = function() {
		return $(this.splice(0,1));
	};
	
})($);


function tabs(level) {
	var tab="";
	for (var i=0; i<level; i++)
		tab += "    ";
	return tab ; 
}

function printTree(node, level, detail) {
	if (!level) {
		console.log("-");
		level = 1; 
	}
	var str;
	if (detail) {
		str = JSON.stringify(node, function(key, value){ 
				if (key=='parent' && value) 
					return "id:"+value.id; 
				if (key=='children' && value ) 
					return 'length:'+value.length; 
				if (key == '$html' && value)
					return 'length:'+value.length; 
				if (key == 'rules' && value)
					return 'length:'+value.length; 
				if (key == 'leaves' && value)
					return 'length:'+value.length; 
				return value;
			} );
	}
	else {
		str = node.head ;
	}
	console.log(tabs(level++)+str);
	
	_.each(node.children, function foo(subnode) {
		printTree(subnode, level, detail);
	});  
};

function textTree(node, level) {
	var text = "";
	if (!level) {
		text = "-\n";
		level = 1; 
	}

	text += tabs(level++)+node.head + "\n";
	if (node.children) 
		_.each(node.children, function foo(subnode) {
		text+= textTree(subnode, level);
	});  
	return text;
};

