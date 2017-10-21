(function(exports) {

	var sys = require("sys"),  
		Q=require('q')
		;

  exports.makeProcessP = function () {
      var args = arguments;
      //sys.puts("setting up makeDeferedProcess ");  
      return function (res) {
          var promise = Q.when(res);
          for(var i=0; i<args.length; i++)
              promise = promise.then(args[i]);

          return promise;
      }
  }


  exports.processP = function (dataIn) {
      
      var promise = Q.resolve(dataIn);

      for(var i=1; i<arguments.length; i++)
          promise = promise.then(arguments[i]);

      return promise;
  }

  var pcount=0;

  exports.makeTestPromise = function (res) {
      var deferred = Q.defer();
      setTimeout(function() { sys.puts(JSON.stringify(res)+" : timeout:"+pcount++); deferred.resolve(res); }, 1000);
      return deferred.promise;
  }

  return exports;
} )( 
  typeof exports === 'undefined'?
  this['makep']={}:
  exports
  );
