$('#texts').empty()
	.append($('<select>'))
	;

$('#texts select')
	.append('<option value="">select an item</option>')
	;

$.each( getLastTexts(), function(key) {
	$('#texts select')
		.append('<option value="'+key+'">'+key.substring(0,40)+'</option>')
		;
});	

$('#texts select')
	.on('change', function(){
		var text=this.selectedOptions.length && this.selectedOptions.item(0).value;
		$('#text textarea').val(text);
		
	});
	
$('#text').empty()
	.append($('<textarea>')
		.attr('rows', 4).attr('cols', 50)
		)
	.append(
		$('<input type="button" value="parse" style="float:left;">')
		);

$('#text input')
	.on('click', function() {
		var text=$('#text textarea').val();
		
		if (text)
			$('#texts select')
				.append('<option value="'+text+'">'+text.substring(0,40)+'</option>')
				;
	
		var parseTree= getSyntaxTree(text);
		$('#parseTree textarea').val(parseTree);

		localStorage["lastSentence"]=text;
		localStorage["lastParseTree"]=parseTree;
	});

$('#text textarea').val(localStorage["lastSentence"]);

$('#parseTree').empty()
	.append($('<textarea>')
		.attr('rows', 10).attr('cols', 50)
		)
	.append(
		$('<input type="button" value="process" style="float:left;">')
		);


var nodeTree;

$('#parseTree input')
	.on('click', function() {
		var parseTreeString=$('#parseTree textarea').val();
		nodeTree= processSyntaxTreeString(parseTreeString);
		var text = textTree(nodeTree);
		$('#processedTree textarea').val(text);

		var $anchor = $('#annimation');
		var html= getHtmlFromNodeTree(nodeTree, $anchor);

	});

$('#parseTree textarea').val(localStorage["lastParseTree"]);

$('#processedTree').empty()
	.append($('<textarea>')
		.attr('rows', 10).attr('cols', 150)
		)
	.append(
		$('<input type="button" value="annimate" style="float:left;">')
		);


$('#processedTree input')
	.on('click', function() {
		annimateNodeTree(nodeTree);
	});


