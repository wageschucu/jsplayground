
var $textselection = $('<select>').appendTo("#textselection");
$('<span>').text('text title: ').appendTo("#title");
var $title = $('<input type="text">').appendTo("#title");
var $textbox = $('<textarea>').appendTo("#textbox").attr("rows", 5).attr("cols", 80);
$("#textbox").append($('<input type="button" value="process text">')
	;
var $sentenceselection = $('<select>').appendTo("#sentenceselection");
var $lengthselection = $('<select>').appendTo("#lengthselection");
var $syntax = $('<textarea>').appendTo("#syntax").attr("rows", 5).attr("cols", 80);
$("#syntax").append($('<input type="button" value="show/hide">')
	.on('click', function() { $syntax.toggle(); localStorage["worder.showSyntax"]=$syntax.is(":visible")} )) 
	;
(function() { if (localStorage["worder.showSyntax"]=="true") $syntax.show(); else $syntax.hide(); })();	
var $tree = $('<textarea>').appendTo("#tree").attr("rows", 5).attr("cols", 80);
$("#tree").append($('<input type="button" value="show/hide">')
	.on('click', function() { $tree.toggle(); localStorage["worder.showTree"]=$tree.is(":visible")} )) 
	;
(function() { if (localStorage["worder.showTree"]=="true") $tree.show(); else $tree.hide(); })();	
var $display = $("#display");
var $go = $('<input type="button" value="go">').on('click', annimate).appendTo("#go");
var $show = $('<input type="button" value="show">').on('click',show).appendTo("#show");
var $next = $('<input type="button" value="next">').on('click',next).appendTo("#next");
var $prev = $('<input type="button" value="prev">').on('click',prev).appendTo("#prev");
var $reset = $('<input type="button" value="reset">').on('click',reset).appendTo("#reset");
var $position = $("#position");

// $.valHooks.textarea = {
//   get: function( elem ) {
//       return elem.value.replace( /\r?\n/g, "\r\n" );
//   } };

var localTrees = [];
var current=parseInt(localStorage["worder.current"]||"-1");
function getCurrentTreeTree() {
	var tree = 	getCurrentTree();
	if (tree!==null)
		return tree.tree;
	return null;	
}

function getCurrentTree() {
	if (current>=localTrees.length || current<0)
		return null;

	return localTrees[current];
}

function advanceCurrent() {
	current++;
	if (current>=localTrees.length)
		current=localTrees.length;
	else if (current<0)
		current = 0;

	localStorage["worder.current"] = current;
	displayPosition();
	return current;	
}

function backupCurrent() {
	current--;
	if (current>=localTrees.length)
		current=localTrees.length-1;
	else if (current<0)
		current = -1;

	localStorage["worder.current"] = current;
	displayPosition();
	return current;	
}

function resetCurrent() {
	current =0;
	localStorage["worder.current"] = current;
	displayPosition();
}

function displayPosition() {
	$position.text(current +":"+localTrees.length);
}

function processSyntax() {

	$('.bubble').remove();
	var trees = getTreesLocal();
	if ( getCurrentTree()!==null  )
		if ( !getCurrentTree().tree )
		{			
			var tree = StnfParse.getNodesFromStnfStringTrim( getCurrentTree().parseString );
			processSyntaxTree(tree);
			var treeString = textTree(tree);
			$tree.val(treeString);

			getCurrentTree().tree = tree; 

			getCurrentTree().$html = getHtmlFromNodeTree(getCurrentTreeTree(), $display);

		}
		else {
			$display.empty().append(getCurrentTree().$html);

		}
	else {
		$display.empty();

	}	

}

function annimate() {
	localStorage["worder.showMode"]=false;
	display();
}

function show() {
	// show tree
	localStorage["worder.showMode"]=true;
	display();
}

function display() {

	processSyntax() ;

	if (localStorage["worder.showMode"]=="true") {
		showHtmlStatic(getCurrentTreeTree());
	}
	else {
		annimateNodeTree(getCurrentTreeTree());
	}
	displayPosition();
}

function reset() {
	resetCurrent();
	display();

}

function next() {
	advanceCurrent();
	display();

}

function prev() {
	backupCurrent();
	display();

}
// create inputs
// fill text list

function getTreesLocal() {
	var lastSyntax=$syntax.data("last");
	var currentSyntax = $syntax.val();
	// use local syntax
	if (lastSyntax!=currentSyntax &&  currentSyntax ) {
		localTrees = JSON.parse(currentSyntax);
	}
	else if (!localTrees || !localTrees.length ) {  // use server
		localTrees = [];
		var lengths = localStorage["worder.length"];

		if ( ! _.isArray(lengths) ) {
			lengths = [lengths];
		} 

		lengths.forEach(function(length) {
			localTrees=localTrees.concat( 
				getTree(
				$title.val()
				,$sentenceselection.find(":selected").val()
				,length
				));

		});
		setSyntax(JSON.stringify(localTrees ));
	}
	// if random, mix
	return localTrees;	
}

function setSyntax(syntax) {
	$syntax.val(syntax);
	$syntax.data("last", syntax);

}

// on textselection change
$textselection.on('change', function() {
	// get sentences: text title
	var	title=$textselection.get(0).selectedOptions && $textselection.get(0).selectedOptions.length && $textselection.get(0).selectedOptions.item(0).value;
	
	localStorage["worder.title"]=title
	setTitle();
});

// on sentence change
$sentenceselection.on('change', function() {

	var	sentenceNum=$sentenceselection.get(0).selectedOptions && $sentenceselection.get(0).selectedOptions.length && $sentenceselection.get(0).selectedOptions.item(0).value;
	localStorage["worder.sentenceNum"] = sentenceNum;

	setSentence(); 
});

$lengthselection.on('change', function() {
	var	length=$lengthselection.get(0).selectedOptions && $lengthselection.get(0).selectedOptions.length && $lengthselection.get(0).selectedOptions.item(0).value;	
	localStorage["worder.length"] = length;
	clearSyntax();
	setLength();
});

// on text change
$('input', $textbox).on('click', function() {
	var last = $textbox.data("last");
	var current = $textbox.val(); 

	// processText: text,title
	setTextBox(current);

	//if (last!=current) {
		var sentences=processText($title.val(), $textbox.val() );
		setSentenceArray(sentences);
	//}
});

function setTextBox(current) {

	if (current=="*")
		current = "";

	$textbox.data("last", current);
	$textbox.val(current);
	
	clearSyntax();
}
function clearSyntax() {
	$syntax.val("");

	clearTree();

}
function clearTree() {
	$tree.val("");
	localTrees = [] ;

}
function setSentenceArray(sentences) {

	$sentenceselection.empty();
	sentences.forEach(function(sentence, index) {
		$sentenceselection.append('<option value="'+(sentence=="*"?sentence:index)+'" data-sentence="'+sentence+'">'+sentence.substring(0,20)+'</option>');
	});	
	$sentenceselection.val(localStorage["worder.sentenceNum"]);
	
	setLengths();
}


function setLengths() {

	var lengths=getLengths($title.val(), $sentenceselection.find(":selected").val());

	$lengthselection.empty();
	lengths.forEach(function(length) {
		$lengthselection.append('<option value="'+length+'">'+length+'</option>');

	});
	$lengthselection.val(localStorage["worder.length"]);

	clearSyntax();
}

function setLength() {


}

function setSentence() {

	var sentence = $('option[value="'+localStorage["worder.sentenceNum"]+'"]', $sentenceselection).data('sentence');	

	setTextBox(sentence);
}

function setSentences() {

	setSentenceArray(getTextSentences($title.val()));

	setSentence();

	setLengths();

}

function setTitle() {

	$title.val(localStorage["worder.title"]);

	setSentences();

}

(function(){

	serverCall("initDependents", {});

	getTextTitles().forEach(function(title) {
		$textselection.append('<option value="'+title+'">'+title+'</option>');
	});	
	$textselection.val(localStorage["worder.title"]);

	setTitle();

	display() ;

})();







