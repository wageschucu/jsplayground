// selection expressions,dsl
// cat 
// (cat)>cat*  note:*implies target, default is last cat
// cat> cat   note: "> " is non-immediate; ">" is immediate descendent 
// cat*> cat
// cat relations:immediate,non-immediate
// chain[cat-expressions], target-index
// matchSelectionExpression(chain, targetIndex) => target
// [(catMatchExpression) relation (catMatchExpression)...], transform
// 
// catMatchExpressionChain => catMatchExpression[*] [relationExpression catMatchExpression[*]]*
// catMatchExpression => (categoryExpression[ categoryExpression]*)|categoryExpression 
// categoryExpression => [-+]?category

////////////////// parsing and misc ///////////////////

// ==> string match regex, parseFunction, <== {shortened string, parseResultObject }
function parseViaRegExp(input, matchRegExp, parseFunction) {
	var object;
	var token = matchRegExp.exec(input);
	if (token && token.length) {
		object = (parseFunction)(token[0]);
		input = input.substring(token.index+token[0].length);
	}
	return { object:object, input:input };
}

(function($){
	$.fn.pop = function() {
		return $(this.splice(this.length-1,1));
	};
	
	$.fn.shift = function() {
		return $(this.splice(0,1));
	};
	
})($);

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function substringBetween(text, start, end) {
	var subString;
	var nestingCount=0;
	var regex = new RegExp(escapeRegExp(start)+"|"+escapeRegExp(end),"g");
	var token;
	while (token=regex.exec(text)) {

		if (nestingCount==0) { 
			if (token[0]==end)
				throw "?? stubStringBetween starts with end:"+end;
			startIndex=token.index + token.length;
		}

		if (token[0]==start)
			nestingCount++;
		else if (token[0]==end)
			nestingCount--;
		

		if (nestingCount==0) {
			subString = text.substring(startIndex, token.index);
			break;
		}
	}
	return subString||"";
}

function convertToRegex(affixList) {

	var regexStr = _.reduce(affixList.affixes.split(/\s+/), function(regexStr, affix) {
		if (affixList.isPrefix) {
			if (regexStr)
				regexStr+="|";
			regexStr += "^"+affix;
		}
		else {
			if (regexStr)
				regexStr+="|";
			regexStr += affix + "$";
		}
		return regexStr;
	}, "" );
	return new RegExp(regexStr, "i");
}

function tabs(level) {
	var tab="";
	for (var i=0; i<level; i++)
		tab += "    ";
	return tab ; 
}

function printTree(node, level) {
	if (!level) {
		console.log("-");
		level = 1; 
	}
	console.log(tabs(level++)+node.head);
	if (node.children) 
		_.each(node.children, function foo(subnode) {
		printTree(subnode, level);
	});  
};
function stringTree(node, level) {
	let	text="";

	if (!level) {
		text="\n-";
		level = 1; 
	}
	text+="\n"+tabs(level++)+node.head;
	//text+="\n"+node.head;
	if (node.children) 
		_.each(node.children, function foo(subnode) {
		text += stringTree(subnode, level);
	});  
	return text 
};
