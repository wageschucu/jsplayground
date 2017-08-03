/**
 * 
 */
function initfunct() {
	console.log("load event detected!");
	let name = "john";
	let nameText =getText(name); 
	console.log(nameText);
	
	document.getElementById("texthere").innerHTML = nameText;
}
function getText(name) {
	return "the ..  name is xxx-- : "+name;
}