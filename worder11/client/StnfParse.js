
(function(exports) {

	exports.escapeRegExp = function(str) {
	  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	exports.substringBetween = function(text, startRegExpAsString, endRegExpAsString) {
		var subString;
		var nestingCount=0;
		var regex = new RegExp(exports.escapeRegExp(startRegExpAsString)+"|"+exports.escapeRegExp(endRegExpAsString),"g");
		var token;
		while (token=regex.exec(text)) {

			if (nestingCount==0) { 
				if (token[0]==endRegExpAsString)
					throw "?? stubStringBetween starts with end:"+endRegExpAsString;
				startIndex=token.index + token.length;
			}

			if (token[0]==startRegExpAsString)
				nestingCount++;
			else if (token[0]==endRegExpAsString)
				nestingCount--;
			

			if (nestingCount==0) {
				subString = text.substring(startIndex, token.index);
				break;
			}
		}
		return subString||"";
	}


	exports.getNodesFromStnfStringTrim = function(treeStringStnf)
	{
		if (!treeStringStnf)
			return {head:"", children :[] };
			
		var tree = exports.getNodesFromStnfString(exports.substringBetween( treeStringStnf.replace(/\s+/g, " ").trim(), "(", ")" ));
		//printTree(tree);
		return tree;
	}

	exports.getNodesFromStnfString = function (serialBracketTree) {
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
			while ( (nodeText = exports.substringBetween(startOfBracketedNode, "(", ")")).trim() ) {

				var child = exports.getNodesFromStnfString( nodeText.trim() ) ;
				child.parent = node;
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
			node.children = [{head:nodeText, parent:node}];
		}

		return node;
	}
	return exports;
} )( 
	typeof exports === 'undefined'?
	this['StnfParse']={}:
	exports
	);


