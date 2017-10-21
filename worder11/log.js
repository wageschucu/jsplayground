(function(exports) {

	var sys = require("sys") 
	;

	exports.info = function (msg, details) {
		sys.puts(msg);
	}



  return exports;
} )( 
  typeof exports === 'undefined'?
  this['log']={}:
  exports
  );
