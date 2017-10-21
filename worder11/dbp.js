(function(exports) {

	var sys = require("sys"),  
		_ = require("underscore"),
		Q=require('q'),
		nStore = require('nstore'),
		nStore = nStore.extend(require('nstore/query')()),
		extend = require('node.extend'),
		log = require('./log')
		;

	exports.newDbP = function (dbName) {
	    var deferred = Q.defer();
	    var db=nStore.new(dbName, function(err) {

	        log.info("newDB initialized:"+dbName+", err:"+err);

	        //deferred.reject("error 1")            
	        if (err) deferred.reject(err)           
	        else deferred.resolve(db);
	    });
	    log.info("in newDB setup:"+dbName);
	    return deferred.promise;
	} 

	function toArray(obj) {
		if (!_.isArray(obj))
			obj = [obj];
		return obj;
	}
	exports.toArray = toArray;

	function readP(dbP, args) { // key,data

	    //log.info("setting up pRead: "+JSON.stringify(args));  

	    var deferred = Q.defer();   
	    dbP
	        .then(function(db) {
	            if (args.key) {

	                log.info("get("+JSON.stringify(args.key)+") - "+db.filename+".","  \n\targs:"+JSON.stringify(args));  

	                db.get(args.key, 
	                    function(err, data, key) { 

			                log.info("\tresult: "+JSON.stringify({err:err, key:key}));  

			                var resolve = { err:err, key:args.key, data: data||args.data, result:key?[[key, data]]:null};

			                log.info("\tresolved to: "+JSON.stringify(resolve));  

	                        deferred.resolve( resolve)
	                    }
	                )
	            }
	             else {

	                log.info("find("+JSON.stringify(args.data)+")("+db.filename+")"," \n\targs:"+JSON.stringify(args));  

	                db.find(args.data, 
	                    function(err, result) { 

			                log.info("\tresult: "+JSON.stringify({err:err, result:result}));

							var resolve = 	{ err:err, key:result.key, data: result.value||args.data, result:result?_.pairs(result):null};		                

			                log.info("\tresolved to: "+JSON.stringify(resolve));

	                        deferred.resolve( resolve )
	                    }
	                )
	            }
	             
	         });   
	    return deferred.promise;
	}

	exports.makeReadP = function(dbP) {
		return function (args) { return readP(dbP, args) };
	}

	exports.makeReadPs = function (dbP) {

	    //log.info("setting up makeGetPs ");  

		return function(allArgs) {

			var promises = [];
			
			toArray(allArgs).forEach(function(args) {	   
				promises.push(readP(dbP, args));
			});

			return Q.all(promises);
		}
	}

	exports.makeWriteP = function(dbP) {
		return function (args) { // key,data
		    //log.info("setting up pWrite: "+JSON.stringify(args));  
		    var deferred = Q.defer();   
		    dbP
		        .then(function(db) {

	                log.info("save("+JSON.stringify({key:args.key||null, data:args.data})+")("+db.filename+")","  \n\targs:"+JSON.stringify(args));  

		            db.save(args.key||null, args.data, function(err, key) {

		                log.info("\tcall result:"+JSON.stringify({err:err, key:key}));  

		                if (err) 
		                    deferred.reject(err)            
		                else {
		                	var resolve = {key:args.key, data:args.data, result:[[key, args.data]]};

			                log.info("\tcall resolved to:"+JSON.stringify(resolve));  

		                    deferred.resolve(resolve);
		                }
		            })
		        })
		        ;
		    return deferred.promise;
		}
	}

    function getP(res, read, write, init, init2) {
        var promise = Q.when(res);
        var skipWrite=true;
        return promise
            .then(read)
            .then(function(data) {
                if (data.err || !data.result|| !data.result.length)
                    skipWrite=false; 
                return data; 
            } )
            .then(function(data) {
                if (skipWrite || !init)
                    return data; 
                else 
                    return Q.when(init(data)).then(function(dataInit) { 

		                log.info("extending deep ("+JSON.stringify(data)+")  with "+JSON.stringify(dataInit));  

						return extend(true, data, dataInit); 
					});
            } )
            .then(function(data) {
                if (skipWrite || !init2)
                    return data; 
                else 
                    return Q.when(init2(data)).then(function(dataInit) { 

		                log.info("extending deep ("+JSON.stringify(data)+")  with "+JSON.stringify(dataInit));  

						return extend(true, data, dataInit); 
					});
            } )
            .then(function(data) {
                if (skipWrite || !write)
                    return data; 
                else 
                    return write(data);
            } )
            ;

    }

	exports.makeGetP = function (read, write, init, init2) {

	    //log.info("setting up makeGetPs ");  

		return function(allArgs) {

			var promises = [];
			
			toArray(allArgs).forEach(function(args) {	   
				promises.push(getP(args, read, write, init, init2));
			});

			return Q.all(promises);
		}
	}


  return exports;
} )( 
  typeof exports === 'undefined'?
  this['dbp']={}:
  exports
  );

	// exports.makeGetPold = function (read, write, init) {
	//     var args = arguments;
	//     log.info("setting up makeGetP ");  
	//     return function (res) {
	//         var promise = Q.when(res);
	//         var skipWrite=true;
	//         return promise
	//             .then(read)
	//             .then(function(data) {
	//                 if (data.err || !data.result|| !data.result.length)
	//                     skipWrite=false; 
	//                 return data; 
	//             } )
	//             .then(function(data) {
	//                 if (skipWrite || !init)
	//                     return data; 
	//                 else 
	//                     return Q.when(init(data)).then(function(dataInit) { 
	// 						return extend(true, data, dataInit); 
	// 					});
	//             } )
	//             .then(function(data) {
	//                 if (skipWrite || !write)
	//                     return data; 
	//                 else 
	//                     return write(data);
	//             } )
	//             ;

	//     }

	// }

