(function(exports) {

	var querystring = 
		require('querystring')
	,_ = require("underscore")
	;

	// interface: datain, okback, errorback, progressback
	// dataout <-properties, if object returned , datain <-arguments
	//  
	//	data, results[], context {}
	// server: (callback, options, querydata)
	// db: read(key, callback), store(key, data, callback), find(data, callback)
	// 

	// chain(go), map, quitOnResult, addArgs, callServer, 
	// 	okBack, errorBack, progressBack, results, ..., _context=true

	// api: return promise: ==> chain: pipes promises: how to pass a promise to a function as input ? 

	exports.addArgs = function() {
		if (arguments.length==1) {
			if (typeof arguments === "Object") {
				for (var prop in arguments[0])
					arguments.callee.arguments[0][prop]=arguments[0][prop] ;
			}
		}
	}

	function quitOnResult(){}
	exports.quitOnResult = quitOnResult;

	exports.chain = function chain() {

		var funcs = _.toArray(arguments);

		var context ;

		function okback(result) {
		  processResult(context, result);
		  return exec(context, result) || context;
		}
		function exec(context, result) {
			var func = funcs.shift();
			if (func===undefined || func === quitOnResult)
			  return okback&&(okback)(context);

			return func.apply(func, matchArgs(setCallbacks(context, okback), func)) || result;
		}

		return { go:function() {
			context = normalizeArgs(arguments);			
			return exec(context, context);
		} }

	}

	function matchArg(arg, context) {
		if (arg == 'callback')
			return context.okBack;
		return context[arg];
	}

	function matchArgs(context, func) {
		// get callee.caller and parse signature
		var signature = func.toString();
		var matches = signature.match(/\(([^\)]*)\)/);
		var args=[];
		var matched=false;
		if (matches && matches[1])
		{	
			matches[1].split(/\s*,\s*/).forEach(function (arg) {
				arg = matchArg(arg, context);
				if (arg)
					matched=true;
				args.push(arg);
			});
			args.push(context);
		}
		if (!matched)
			args = [context];
		return args;
	}
	// clone
	function normalizeArgs() {
		var context={};
		// if just one option/context
		// extend
		// else pass through?? 
		// ??
		return arguments.callee.caller.arguments;
	}

	// clone
	function setCallbacks(context, okBack, errorBack, progressBack) {
		var newContext = _.clone(context);
		if (okBack) newContext.okBack = okBack;
		if (errorBack ) newContext.errorBack = errorBack;
		if (progressBack ) newContext.progressBack = progressBack;
		return newContext;
	}

	// clone
	function mergeResults(context, result) {
		if (_.isObject(result) && !_.isArray(result))
		for (var i in result) {
			context[i] = result[i];
		}
	}
	// no clone
	function processResult(context, result, i) {
		context.results = context.results || [];
		result=mergeResults(context, result);
		if (typeof i==='undefined') {
			context.results.push(result);
			return result;
		}
		else 
		{
			var results = results || [];
			results.push(result);
			return results;
		}
	}
	
	function processError(context, error, i) {
		return processResult(context,error,i);
	}
	
	// what if func returns undefined??
	function allResultsBack(results, length) {
		return results && results.length=length && _.reduce(results, function(res, result) { if (!res) return res; return res = results===undefined; }, true);
	}

	exports.map = function mapData() {

		var funcs = arguments;

		var context ;

		var error;

		function exec(context) {
			for (var i in funcs)
			{
				function okback(result) {
				  processResult(context, result, i);
				  if ( allResultsBack(context.results, funcs.length) ) {
				  	if (error)
						context.errorback && context.errorback(context); 
					else
						context.okback && context.okback(context); 
				  }
				}

				function errorback(err) {
				  processError(context, err, i);
				  error = err || true;
				  if ( allResultsBack(context.results, funcs.length) ) {
				  	context.errorback && context.errorback(context); 
				  }
				}

				(funcs[i])( matchArgs( setCallbacks(context, okback, errorback), func[i]  ) );
			}

			return context;
		}

		return function() {
			context = normalizeArgs(argments);			
			return exec(context);
		}
	}

	exports.serverCallbackFactory = function serverCallbackFactory(endcallback, encoding) { // scrape html text into parseString
		return function(response) {
	      var str = ''
	      if (encoding)
	        response.setEncoding(encoding );
	      response.on('data', function (chunk) {
	        str += chunk;
	      });
	      response.on('end', callback);
	    }
	}

	exports.callServer = function callServer(callback, options, query) {
		
	    if (query) 
	    	options.path+= "?"+querystring.stringify(query );
	    	
	    return my_http.request(options, stnfcallback).end();
	    
	}
  return exports;
} )( 
  typeof exports === 'undefined'?
  this['async']={}:
  exports
  );
