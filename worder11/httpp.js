(function(exports) {

	var sys = require("sys"),  
	log = require('./log'),
	http = require("http"),  
	Q=require('q')
	;

	exports.httpP = function (httpData) {

	    log.info("httpP options:"+JSON.stringify(httpData));  

	    var deferred = Q.defer();   

	    var httpCallback = function(response) {
	      
	      var wholeResponseData = ''

	      response.setEncoding('utf8');
	      response.on('data', function (chunk) {
	        wholeResponseData += chunk;
	      });

	      response.on('end', function (data) { 
	            httpData.responseData=wholeResponseData; 
	            deferred.resolve( httpData); 
	        } );
	    }

	    http.get(httpData.options, httpCallback).end();

	    return deferred.promise;

	}



  return exports;
} )( 
  typeof exports === 'undefined'?
  this['httpp']={}:
  exports
  );
